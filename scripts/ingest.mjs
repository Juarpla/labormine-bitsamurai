#!/usr/bin/env node
/**
 * Labormine job ingestion.
 *
 * Fetches REAL job listings from public, keyless employer boards and APIs,
 * normalizes them, and writes src/data/jobs.json (the static feed the site
 * is built from). Never fabricates listings — every job links to its source.
 *
 * Usage: node scripts/ingest.mjs
 * Optional env: ADZUNA_APP_ID, ADZUNA_APP_KEY (free tier, enables Adzuna)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'data', 'jobs.json');
const CONFIG = path.join(ROOT, 'src', 'data', 'companies.json');

const TTL_DAYS = 30;
const UA = { 'User-Agent': 'LabormineBot/1.0 (+https://labormine.com/about)' };
const DESC_MAX = 6000;

/* ------------------------------ tiny helpers ------------------------------ */

async function fetchJson(url, { timeout = 20000 } = {}) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const normTitle = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

function decodeEntities(s) {
  return s
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&#x?[0-9a-f]+;/gi, ' ');
}

function stripHtml(html) {
  // Greenhouse returns double-escaped HTML — decode entities first, then strip tags.
  return stripTags(decodeEntities(html));
}

function stripTags(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function htmlify(text) {
  const esc = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

const excerpt = (text, n = 280) =>
  text.replace(/\s+/g, ' ').slice(0, n).trim() + (text.length > n ? '…' : '');

/* --------------------------- country detection ---------------------------- */

const COUNTRY_HINTS = {
  AU: ['australia', 'perth', 'kalgoorlie', 'brisbane', 'mount isa', 'newman', 'port hedland', 'adelaide', 'melbourne', 'sydney', 'western australia', 'queensland', 'pilbara', 'new south wales'],
  CA: ['canada', 'vancouver', 'toronto', 'sudbury', "val-d'or", 'elkford', 'sparwood', 'yellowknife', 'timmins', 'rouyn-noranda', 'british columbia', 'quebec', 'ontario', 'labrador', 'nunavut', 'elk valley'],
  CL: ['chile', 'santiago', 'antofagasta', 'atacama', 'calama', 'copiapo', 'iquique', 'maria elena'],
  PE: ['peru', 'lima', 'arequipa', 'cajamarca', 'cusco', 'piura', 'tacna'],
  ZA: ['south africa', 'johannesburg', 'pretoria', 'rustenburg', 'kathu', 'mpumalanga', 'limpopo', 'kuruman', 'welkom', 'north west province'],
  US: ['united states', 'usa', 'nevada', 'reno', 'elko', 'winnemucca', 'phoenix', 'tucson', 'denver', 'salt lake city', 'utah', 'alaska', 'arizona'],
  ID: ['indonesia', 'jakarta', 'sorowako', 'sumbawa', 'morowali', 'timika', 'grasberg', 'halmahera', 'kalimantan', 'maluku'],
  GH: ['ghana', 'accra', 'tarkwa', 'obuasi', 'ahafo', 'kumasi'],
  BR: ['brazil', 'belo horizonte', 'parauapebas', 'carajas', 'brumadinho', 'minas gerais', 'sao paulo', 'rio de janeiro'],
  MX: ['mexico', 'hermosillo', 'sonora', 'zacatecas', 'chihuahua', 'durango', 'guanajuato', 'cananea', 'sinaloa'],
  ZM: ['zambia', 'kitwe', 'ndola', 'lusaka', 'chingola', 'solwezi', 'copperbelt', 'kalulushi', 'chambishi'],
  CD: ['dr congo', 'democratic republic', 'congo (', 'congo,', 'drc', 'lubumbashi', 'kolwezi', 'kinshasa', 'manono', 'fungurume', 'lualaba', 'katanga'],
  MN: ['mongolia', 'ulaanbaatar', 'omnogovi', 'khanbogd', 'south gobi', 'erdenet'],
  KZ: ['kazakhstan', 'almaty', 'astana', 'karaganda', 'zhezkazgan', 'aktobe', 'balkhash'],
};

function detectCountry(text) {
  const t = (text || '').toLowerCase();
  for (const [code, hints] of Object.entries(COUNTRY_HINTS)) {
    if (hints.some((h) => t.includes(h))) return code;
  }
  return 'GLOBAL';
}

function splitLocation(raw) {
  const [city, ...rest] = (raw || '').split(',').map((s) => s.trim());
  return { city: city || null, rest: rest.join(', ') };
}

/* ------------------------- classification heuristics ---------------------- */

const MINING_RE = /\b(min(e|ing)|mineral|geolog|geoscien|geotech|drill|blast|metallurg|tailings|open.?pit|underground|exploration)\b/i;

function classifyCategory(title) {
  const t = title.toLowerCase();
  if (/exploration/.test(t)) return 'exploration';
  if (/drill|blast/.test(t)) return 'drill-blast';
  if (/geolog|geotech/.test(t)) return 'geology';
  if (/\b(hse|safety|ehs)\b|environment/.test(t)) return 'hse';
  if (/maintenance|mechanic|fitter|boilermaker|welder|diesel/.test(t)) return 'maintenance';
  if (/process|metallurg|\bmill\b/.test(t)) return 'processing';
  if (/engineer/.test(t)) return 'engineering';
  if (/operator|operations|\bminer\b|production/.test(t)) return 'operations';
  return 'other';
}

const VISA_RE = /visa sponsorship|sponsorship available|will sponsor|provide visa|work permit|relocation (support|package|assistance)|right to work|eligible to work|work authorization|work visa|\b482\b|\b462\b|working holiday|immigration support|relocate to/i;
function visaHeuristic(...texts) {
  return texts.some((t) => VISA_RE.test(t || ''));
}

function parseSalary(text, country) {
  if (!text) return null;
  const currencyByCountry = { US: 'USD', CA: 'CAD', AU: 'AUD', ZA: 'ZAR', BR: 'BRL', CL: 'CLP', PE: 'PEN', MX: 'MXN' };
  let currency = null;
  if (/\b(usd|us\$)\b|(?<![\w])\$/i.test(text) && !/cad|aud|nz/i.test(text)) currency = 'USD';
  if (/\bcad\b/i.test(text)) currency = 'CAD';
  if (/\baud\b/i.test(text)) currency = 'AUD';
  if (/\bzar\b|\br\s?\d{2,3}[,.]\d{3}\b/i.test(text)) currency = 'ZAR';
  if (/r\$\s?\d/i.test(text)) currency = 'BRL';
  if (/€/.test(text)) currency = 'EUR';
  if (/£/.test(text)) currency = 'GBP';
  if (!currency) currency = currencyByCountry[country] || null;
  if (!currency) return null;

  const matches = [...text.matchAll(/(?<![\w,.])(\d{1,3}(?:[.,]\d{3}){1,2}(?:\.\d+)?|\d{2,6})(?!\s?[%°])/g)]
    .map((m) => parseFloat(m[1].replace(/[.,](?=\d{3}\b)/g, '').replace(/,(?=\d{1,2}\b)/, '.')))
    .filter((n) => n >= 10000 && n <= 2000000);
  if (matches.length === 0) return null;
  const min = Math.min(...matches);
  const max = Math.max(...matches);
  let period = 'year';
  if (/\bmonth|mensual|m[eê]s\b/i.test(text)) period = 'month';
  else if (/\bday|d[ií]a\b/i.test(text)) period = 'day';
  else if (/\bhour|hora\b/i.test(text)) period = 'hour';
  return { min, max: max > min ? max : null, currency, period };
}

/* -------------------------------- sources -------------------------------- */

async function fetchGreenhouse({ name, slug }) {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  const rows = Array.isArray(data.jobs) ? data.jobs : [];
  return rows.map((j) => {
    const text = stripHtml(j.content || '');
    const loc = j.location?.name || '';
    const country = detectCountry(`${loc} ${text.slice(0, 800)}`);
    const { city } = splitLocation(loc);
    const remote = /\bremote\b/i.test(loc) || /\bwork remotely|fully remote\b/i.test(text);
    const company = name.replace(/ (DRC|Zambia|Zambian)$/i, '');
    return {
      id: `gh-${slug}-${j.id}`,
      slug: slugify(`${company}-${j.title}-${country}-${j.id}`),
      title: j.title.trim(),
      company,
      companySlug: slugify(company),
      source: 'greenhouse',
      country,
      city,
      locationRaw: loc,
      remote,
      visaReported: visaHeuristic(j.title, text),
      category: classifyCategory(j.title),
      salary: parseSalary(text, country),
      postedAt: (j.updated_at || new Date().toISOString()).slice(0, 10),
      url: j.absolute_url,
      description: htmlify(text.slice(0, DESC_MAX)),
      excerpt: excerpt(text),
    };
  });
}

async function fetchLever({ name, slug }) {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((j) => {
    const text = stripHtml(
      [j.description, ...(j.lists || []).map((l) => l.content)].filter(Boolean).join('\n\n') || ''
    );
    const loc = j.categories?.location || '';
    const country = detectCountry(`${loc} ${text.slice(0, 800)}`);
    const { city } = splitLocation(loc);
    const remote = /\bremote\b/i.test(loc) || /\bwork remotely|fully remote\b/i.test(text);
    return {
      id: `lv-${slug}-${j.id}`,
      slug: slugify(`${name}-${j.text}-${country}-${j.id.slice(0, 8)}`),
      title: j.text.trim(),
      company: name,
      companySlug: slugify(name),
      source: 'lever',
      country,
      city,
      locationRaw: loc,
      remote,
      visaReported: visaHeuristic(j.text, text),
      category: classifyCategory(j.text),
      salary: parseSalary(text, country),
      postedAt: new Date(j.createdAt || Date.now()).toISOString().slice(0, 10),
      url: j.hostedUrl,
      description: htmlify(text.slice(0, DESC_MAX)),
      excerpt: excerpt(text),
    };
  });
}

async function fetchArbeitnow() {
  const jobs = [];
  for (const page of [1, 2, 3]) {
    let data;
    try {
      data = await fetchJson(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
    } catch {
      break;
    }
    const rows = Array.isArray(data.data) ? data.data : [];
    for (const j of rows) {
      const text = stripHtml(j.description_html || '');
      const title = j.title || '';
      if (!MINING_RE.test(title) && !MINING_RE.test(text.slice(0, 500))) continue;
      const country = detectCountry(`${j.location || ''} ${text.slice(0, 800)}`);
      const { city } = splitLocation(j.location || '');
      const remote = j.remote || /\bremote\b/i.test(title) || /\bwork remotely|fully remote\b/i.test(text);
      const company = j.company_name || 'Unknown';
      jobs.push({
        id: `an-${j.slug}`,
        slug: slugify(`${company}-${title}-${country}-${j.slug.slice(0, 12)}`),
        title: title.trim(),
        company,
        companySlug: slugify(company),
        source: 'arbeitnow',
        country,
        city,
        locationRaw: j.location || '',
        remote,
        visaReported: visaHeuristic(title, text),
        category: classifyCategory(title),
        salary: parseSalary(text, country),
        postedAt: new Date((j.created_at || Date.now() / 1000) * 1000).toISOString().slice(0, 10),
        url: j.url,
        description: htmlify(text.slice(0, DESC_MAX)),
        excerpt: excerpt(text),
      });
    }
  }
  return jobs;
}

async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs?limit=200');
  const rows = Array.isArray(data.jobs) ? data.jobs : [];
  return rows
    .filter((j) => MINING_RE.test(j.title || '') || MINING_RE.test(stripHtml(j.description || '').slice(0, 500)))
    .map((j) => {
      const text = stripHtml(j.description || '');
      const loc = j.candidate_required_location || 'Worldwide';
      const country = detectCountry(loc) || 'GLOBAL';
      const { city } = splitLocation(loc);
      const company = j.company_name || 'Unknown';
      return {
        id: `rm-${j.id}`,
        slug: slugify(`${company}-${j.title}-${country}-${j.id}`),
        title: (j.title || '').trim(),
        company,
        companySlug: slugify(company),
        source: 'remotive',
        country,
        city,
        locationRaw: loc,
        remote: true,
        visaReported: visaHeuristic(j.title, text),
        category: classifyCategory(j.title),
        salary: parseSalary(j.salary || text, country),
        postedAt: (j.publication_date || new Date().toISOString()).slice(0, 10),
        url: j.url,
        description: htmlify(text.slice(0, DESC_MAX)),
        excerpt: excerpt(text),
      };
    });
}

async function fetchAdzuna({ code }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const data = await fetchJson(
    `https://api.adzuna.com/v1/api/jobs/${code.toLowerCase()}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=mining&content-type=application/json`
  );
  const rows = Array.isArray(data.results) ? data.results : [];
  return rows.map((j) => {
    const text = stripHtml(j.description || '');
    const { city } = splitLocation(j.location?.display_name || '');
    const company = j.company?.display_name || 'Unknown';
    const salary =
      j.salary_min && j.salary_min > 0
        ? { min: Math.round(j.salary_min), max: j.salary_max && j.salary_max > j.salary_min ? Math.round(j.salary_max) : null, currency: j.salary_currency_at_source ?? { AU: 'AUD', CA: 'CAD', US: 'USD', ZA: 'ZAR', BR: 'BRL', MX: 'MXN' }[code] ?? 'USD', period: 'year' }
        : parseSalary(text, code);
    return {
      id: `az-${code}-${j.id}`,
      slug: slugify(`${company}-${j.title}-${code}-${j.id}`),
      title: (j.title || '').replace(/<[^>]+>/g, '').trim(),
      company,
      companySlug: slugify(company),
      source: 'adzuna',
      country: code,
      city,
      locationRaw: j.location?.display_name || '',
      remote: /\bremote|work from home\b/i.test(text.slice(0, 500)),
      visaReported: visaHeuristic(j.title, text),
      category: classifyCategory(j.title),
      salary,
      postedAt: (j.created || new Date().toISOString()).slice(0, 10),
      url: j.redirect_url,
      description: htmlify(text.slice(0, DESC_MAX)),
      excerpt: excerpt(text),
    };
  });
}

/* --------------------------------- main ----------------------------------- */

async function main() {
  const config = JSON.parse(await readFile(CONFIG, 'utf8'));
  const all = [];
  const errors = [];

  for (const board of config.boards) {
    const fetcher = { greenhouse: fetchGreenhouse, lever: fetchLever }[board.platform];
    if (!fetcher) {
      errors.push(`unsupported platform ${board.platform} (${board.name})`);
      continue;
    }
    try {
      const jobs = await fetcher(board);
      all.push(...jobs);
      console.log(`✓ ${board.platform}:${board.slug} → ${jobs.length} jobs`);
    } catch (err) {
      errors.push(`${board.name}: ${err.message}`);
      console.error(`✗ ${board.platform}:${board.slug} → ${err.message}`);
    }
  }

  for (const g of config.generic) {
    const fetcher = { arbeitnow: fetchArbeitnow, remotive: fetchRemotive }[g.platform];
    if (!fetcher) {
      errors.push(`unsupported generic platform ${g.platform}`);
      continue;
    }
    try {
      const jobs = await fetcher();
      all.push(...jobs);
      console.log(`✓ ${g.platform} → ${jobs.length} jobs (after mining filter)`);
    } catch (err) {
      errors.push(`${g.name}: ${err.message}`);
      console.error(`✗ ${g.platform} → ${err.message}`);
    }
  }

  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    const codes = ['AU', 'CA', 'CL', 'PE', 'ZA', 'US', 'ID', 'GH', 'BR', 'MX', 'ZM', 'CD', 'MN', 'KZ'];
    for (const code of codes) {
      try {
        const jobs = await fetchAdzuna({ code });
        all.push(...jobs);
        console.log(`✓ adzuna:${code} → ${jobs.length} jobs`);
      } catch (err) {
        errors.push(`adzuna:${code}: ${err.message}`);
        console.error(`✗ adzuna:${code} → ${err.message}`);
      }
    }
  } else {
    console.log('ℹ Adzuna skipped (set ADZUNA_APP_ID / ADZUNA_APP_KEY to enable)');
  }

  // TTL: drop postings older than TTL_DAYS (and impossible future dates)
  const cutoff = Date.now() - TTL_DAYS * 86400000;
  const fresh = all.filter((j) => {
    const t = Date.parse(j.postedAt);
    return Number.isFinite(t) && t >= cutoff && t <= Date.now() + 86400000;
  });
  const dropped = all.length - fresh.length;

  // Dedupe by company+title+country
  const seen = new Map();
  for (const j of fresh) {
    const key = `${j.companySlug}::${normTitle(j.title)}::${j.country}`;
    if (!seen.has(key)) seen.set(key, j);
  }
  const jobs = [...seen.values()].sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  const byCountry = {};
  for (const j of jobs) byCountry[j.country] = (byCountry[j.country] || 0) + 1;

  await writeFile(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), jobs }, null, 2)
  );

  console.log('---');
  console.log(`Saved ${jobs.length} unique jobs → ${path.relative(ROOT, OUT)}`);
  console.log(`Dropped: ${dropped} stale, ${fresh.length - seen.size} duplicates`);
  console.log('By country:', JSON.stringify(byCountry));
  if (errors.length) console.log('Errors:', JSON.stringify(errors, null, 2));
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
