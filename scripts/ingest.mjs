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

// Optional local .env (same precedence as `node --env-file`: real env vars win).
// Missing file is fine — CI passes env vars directly via GitHub Actions secrets.
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  /* no .env — skip */
}

const TTL_DAYS = 30;
let MAX_PER_SOURCE = 1500; // overridden by companies.json `maxPerSource`
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

/* --------------------- shared helpers (direct sources) --------------------- */

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Parse a date-ish value to YYYY-MM-DD; falls back to `fallback` (default: today). */
function isoDate(v, fallback = todayISO()) {
  if (!v) return fallback;
  if (typeof v === 'string') {
    // dd-mm-yyyy (Navent)
    const m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const t = Date.parse(v);
    if (Number.isFinite(t)) return new Date(t).toISOString().slice(0, 10);
    // "Fri Sep 04 00:00:00 UTC 2026" (SuccessFactors CSB microdata)
    const m2 = v.match(/^(\w{3})\s+(\w{3})\s+(\d{1,2})\s+[\d:]+\s+\w+\s+(\d{4})$/);
    if (m2) {
      const t2 = Date.parse(`${m2[1]} ${m2[2]} ${m2[3]} ${m2[4]}`);
      if (Number.isFinite(t2)) return new Date(t2).toISOString().slice(0, 10);
    }
  }
  if (typeof v === 'number') {
    const t = new Date(v);
    if (!Number.isNaN(t.getTime())) return t.toISOString().slice(0, 10);
  }
  return fallback;
}

async function fetchText(url, { timeout = 25000, headers = {} } = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8,*;q=0.5',
      ...headers,
    },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function postJson(url, body, { timeout = 25000, headers = {} } = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': BROWSER_UA,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Extract all application/ld+json blocks (tolerating &quot; escapes). */
function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(decodeEntities(m[1]).trim()));
    } catch {
      try {
        out.push(JSON.parse(m[1].trim()));
      } catch {
        /* ignore malformed block */
      }
    }
  }
  return out;
}

/** Flatten every schema.org JobPosting node out of ld+json objects. */
function collectJobPostings(ld) {
  const list = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const t = n['@type'];
    if (t === 'JobPosting' || (Array.isArray(t) && t.includes('JobPosting'))) list.push(n);
    if (n['@graph']) walk(n['@graph']);
  };
  ld.forEach(walk);
  return list;
}

/** itemprop=… extraction (meta[content] or inline tag innerHTML). */
function microdataProp(html, prop) {
  let m = html.match(new RegExp(`itemprop=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (m) return decodeEntities(m[1]).trim();
  m = html.match(new RegExp(`content=["']([^"']*)["'][^>]*itemprop=["']${prop}["']`, 'i'));
  if (m) return decodeEntities(m[1]).trim();
  m = html.match(new RegExp(`itemprop=["']${prop}["'][^>]*>([\\s\\S]{0,3000}?)</\\w+>`, 'i'));
  if (m) return stripTags(decodeEntities(m[1])).trim();
  return '';
}

/** SuccessFactors CSB description: everything after itemprop="description" until the next itemprop/marker. */
function csbDescription(html) {
  const idx = html.search(/itemprop=["']description["']/i);
  if (idx === -1) return '';
  const rest = html.slice(idx);
  const start = rest.indexOf('>') + 1;
  let end = rest.length;
  for (const marker of [/itemprop=["']/i, /<section/i, /<footer/i, /<!--/]) {
    const m = rest.slice(start).search(marker);
    if (m !== -1) end = Math.min(end, start + m);
  }
  return stripTags(decodeEntities(rest.slice(start, end)))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** <loc> + optional <lastmod> entries from a sitemap (urlset or sitemapindex locs). */
function parseSitemap(xml) {
  const isIndex = /<sitemapindex/i.test(xml);
  const entries = [];
  const re = isIndex ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const loc = (m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/i) || [])[1];
    if (!loc) continue;
    const lastmod = (m[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/i) || [])[1] || null;
    entries.push({ loc, lastmod });
  }
  if (entries.length === 0 && !isIndex) {
    const bare = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((x) => ({ loc: x[1], lastmod: null }));
    entries.push(...bare);
  }
  return { isIndex, entries };
}

/** Minimal RSS/Atom <item> parser (title, link, description, pubDate). */
function parseRss(xml) {
  const items = [];
  const re = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let m;
  const pick = (chunk, tag) => {
    const mm = chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (!mm) return '';
    let v = mm[1].trim();
    const c = v.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (c) v = c[1].trim();
    return v;
  };
  while ((m = re.exec(xml))) {
    const chunk = m[1];
    items.push({
      title: decodeEntities(pick(chunk, 'title')).trim(),
      link: decodeEntities(pick(chunk, 'link')).trim() || (chunk.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '',
      description: pick(chunk, 'description') || pick(chunk, 'content'),
      pubDate: pick(chunk, 'pubDate') || pick(chunk, 'updated'),
    });
  }
  return items;
}

/** Reuse previously-ingested fields for a job we already stored — avoids refetching details.
 *  Only trusts records with a real country: GLOBAL records (stubs or legacy-corrupted)
 *  return false so the detail fetch repairs them this run. */
function hydrateFromPrev(prevById, job) {
  const p = prevById.get(job.id);
  if (!p || !(p.description || '').trim()) return false;
  if (!p.country || p.country === 'GLOBAL') return false; // incomplete record — refetch to repair
  job.title = p.title || job.title;
  job.company = p.company || job.company;
  job.companySlug = slugify(job.company);
  job.slug = p.slug || slugify(`${job.company}-${job.title}-${job.country}-${job.id}`);
  job.country = p.country;
  job.city = p.city ?? job.city;
  job.locationRaw = p.locationRaw || job.locationRaw;
  job.remote = Boolean(p.remote);
  job.visaReported = Boolean(p.visaReported);
  job.category = p.category || job.category;
  job.salary = p.salary ?? job.salary ?? null;
  job.description = p.description;
  job.excerpt = p.excerpt || excerpt(stripTags(p.description));
  if (p.postedAt) job.postedAt = p.postedAt; // keep stable "posted" age across runs
  if (p.translations) job.translations = p.translations; // keep cached translations
  return true;
}

/** Sort by postedAt desc and cap the number of jobs from one source. */
function capJobs(jobs, cap) {
  if (!cap || jobs.length <= cap) return jobs;
  return [...jobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt)).slice(0, cap);
}

const effectiveCap = (src, maxPerSource) => {
  const fast = Number.parseInt(process.env.INGEST_FAST || '', 10);
  const base = src.cap ?? maxPerSource;
  return Number.isFinite(fast) ? Math.min(fast, base) : base;
};

/** Normalized job factory for all direct/custom sources. */
function mkJob({ source, id, company, title, country, city = null, locationRaw = '', remote = false, description = '', postedAt, url, salary = null }) {
  const text = stripTags(decodeEntities(description || ''));
  const iso = isoDate(postedAt);
  return {
    id,
    slug: slugify(`${company}-${title}-${country}-${String(id).slice(0, 24)}`),
    title: (title || '').trim(),
    company: (company || '').trim(),
    companySlug: slugify(company || ''),
    source,
    country,
    city,
    locationRaw,
    remote,
    visaReported: visaHeuristic(title, text),
    category: classifyCategory(title),
    salary,
    postedAt: iso,
    url,
    description: htmlify(text.slice(0, DESC_MAX)),
    excerpt: excerpt(text),
  };
}

/* --------------------------- country detection ---------------------------- */

const COUNTRY_HINTS = {
  AU: ['australia', 'perth', 'kalgoorlie', 'brisbane', 'mount isa', 'newman', 'port hedland', 'adelaide', 'melbourne', 'sydney', 'western australia', 'queensland', 'pilbara', 'new south wales', 'roxby downs', 'olympic dam', 'karratha', 'boddington', 'telfer', 'south australia', 'tasmania', 'rosebery'],
  CA: ['canada', 'vancouver', 'toronto', 'sudbury', "val-d'or", 'elkford', 'sparwood', 'yellowknife', 'timmins', 'rouyn-noranda', 'british columbia', 'quebec', 'ontario', 'labrador', 'nunavut', 'elk valley', 'detour lake', 'malartic', 'baker lake', 'hope bay', 'calgary', 'edmonton', 'saskatchewan', 'manitoba', 'snow lake', 'flin flon'],
  CL: ['chile', 'santiago', 'antofagasta', 'atacama', 'calama', 'copiapo', 'iquique', 'maria elena', 'pica', 'huasco', 'vallenar', 'mejillones', 'sierra gorda', 'los andes', 'el teniente', 'rancagua', 'machali', 'coquimbo', 'la serena', 'radomiro tomic', 'collahuasi', 'tierra amarilla'],
  PE: ['peru', 'lima', 'arequipa', 'cajamarca', 'cusco', 'piura', 'tacna', 'moquegua', 'ilo', 'toquepala', 'cuajone', 'morococha', 'yauli', 'apurimac', 'cotabambas', 'espinar', 'marcona', 'cerro de pasco', 'pasco', 'las bambas', 'san miguel de pallaques', 'hualgayoc', 'chala', 'anasayaco', 'nazca', 'ica', 'junin', 'jauja', 'la oroya', 'morococha district'],
  ZA: ['south africa', 'johannesburg', 'pretoria', 'rustenburg', 'kathu', 'mpumalanga', 'limpopo', 'kuruman', 'welkom', 'north west province', 'gamsberg', 'aggeneys', 'hotazel', 'klerksdorp', 'carletonville', 'gauteng', 'burgersfort', 'postmasburg', 'mokopane', 'steelpoort', 'free state', 'ekurhuleni', 'secunda', 'middelburg'],
  US: ['united states', 'usa', 'nevada', 'reno', 'elko', 'winnemucca', 'phoenix', 'tucson', 'denver', 'salt lake city', 'utah', 'alaska', 'arizona', 'morenci', 'sierrita', 'bagdad', 'safford', 'casa grande', 'rosemont', 'silver city', 'tyrone', 'henderson', 'cortez', 'carlin', 'twin creeks', 'turquoise ridge', 'south jordan', 'new mexico', 'missouri', 'kansas'],
  ID: ['indonesia', 'jakarta', 'sorowako', 'sumbawa', 'morowali', 'timika', 'grasberg', 'halmahera', 'kalimantan', 'maluku', 'batu hijau', 'martabe', 'dairi', 'wetar', 'tujuh bukit', 'papua', 'nusa tenggara'],
  GH: ['ghana', 'accra', 'tarkwa', 'obuasi', 'ahafo', 'kumasi', 'damang', 'akyem'],
  BR: ['brazil', 'belo horizonte', 'parauapebas', 'carajas', 'brumadinho', 'minas gerais', 'sao paulo', 'rio de janeiro', 'onca puma', 'canaa dos carajas', 'mariana', 'ouro preto', 'paracatu', 'goias', 'mato grosso', 'salobo'],
  MX: ['mexico', 'hermosillo', 'sonora', 'zacatecas', 'chihuahua', 'durango', 'guanajuato', 'cananea', 'sinaloa', 'la caridad', 'nacozari', 'fresnillo', 'sombrerete', 'taxco', 'morelos', 'coahuila', 'san luis potosi'],
  ZM: ['zambia', 'kitwe', 'ndola', 'lusaka', 'chingola', 'solwezi', 'copperbelt', 'kalulushi', 'chambishi', 'kansanshi', 'sentinel', 'lumwana', 'mufulira', 'kafue'],
  CD: ['dr congo', 'democratic republic', 'congo (', 'congo,', 'drc', 'lubumbashi', 'kolwezi', 'kinshasa', 'manono', 'fungurume', 'lualaba', 'katanga', 'kamoa', 'kakula', 'kinsevere', 'mutanda', 'kipushi', 'kisanfu', 'kakanda'],
  MN: ['mongolia', 'ulaanbaatar', 'omnogovi', 'khanbogd', 'south gobi', 'erdenet', 'tsagaan suvarga'],
  KZ: ['kazakhstan', 'almaty', 'astana', 'karaganda', 'zhezkazgan', 'aktobe', 'balkhash', 'bozshakol', 'aktogay', 'satpayev', 'satbayev'],
};

function detectCountry(text) {
  const t = (text || '').toLowerCase();
  for (const [code, hints] of Object.entries(COUNTRY_HINTS)) {
    if (hints.some((h) => t.includes(h))) return code;
  }
  return 'GLOBAL';
}

/** Structured location first (it is more reliable), then the rest of the text. */
function detectCountryFrom(explicit, text) {
  const r = detectCountry(explicit || '');
  if (r !== 'GLOBAL') return r;
  return detectCountry(text || '');
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

/* ---------------------- direct (custom platform) sources ------------------ */
/* All read-only. Browser UA + robots/crawl-delays respected per source.      */

// 1) Southern Copper — CAPPER ASP.NET page-method (keyless POST, browser UA required)
async function fetchSccCapper(src) {
  const data = await postJson(src.endpoint, { tipo: 19 }); // tipo 19 = ofertas de empleo (20 = becas, fuera de alcance)
  const rows = data?.d?.lstOfertas || [];
  const today = todayISO();
  return rows.map((o) =>
    mkJob({
      source: 'scc-capper',
      id: `scc-${o.IdOfertaLaboral}`,
      company: src.company,
      title: String(o.TituloOferta || '').trim(),
      country: src.country || 'PE',
      description: String(o.Resumen || ''),
      postedAt: today,
      url: src.url,
    })
  );
}

// 2) HiringRoom (Chinalco, Cerro Verde, Hochschild) — SSR cards + og:description detail
function hiringroomRelativeDate(txt) {
  const m = (txt || '').match(/Hace\s+(\d+)\s+(d[íi]as?|semanas?|mes(?:es)?|a[ñn]os?)/i);
  if (!m) return todayISO();
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const days = unit.startsWith('d') ? n : unit.startsWith('sem') ? n * 7 : unit.startsWith('mes') ? n * 30 : n * 365;
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

async function fetchHiringroom(src, prevById) {
  const html = await fetchText(`${src.url}/jobs`);
  const anchors = [...html.matchAll(/href="([^"]*\/jobs\/get_vacancy\/([0-9a-f]{24}))"/gi)];
  const out = [];
  for (let i = 0; i < anchors.length; i++) {
    const id = anchors[i][2];
    const chunk = html.slice(anchors[i].index, anchors[i + 1]?.index ?? html.length);
    const title = stripTags(decodeEntities((chunk.match(/name__vacancy[^>]*>([\s\S]*?)<\/h4>/) || [])[1] || '')).trim();
    if (!title || /subir cv|base general/i.test(title)) continue;
    const locRaw = stripTags(decodeEntities((chunk.match(/hr-Location-pin[\s\S]{0,200}?<\/i>\s*([\s\S]*?)<\/span>/) || [])[1] || '')).trim();
    const age = (chunk.match(/vacancy-time[\s\S]{0,600}?(Hace\s+\d+\s+\S+)/) || [])[1] || '';
    const postedAt = hiringroomRelativeDate(age);
    const { city } = splitLocation(locRaw);
    const country = detectCountry(`${locRaw} ${title}`) || src.country || 'GLOBAL';
    const job = mkJob({
      source: 'hiringroom',
      id: `hr-${id}`,
      company: src.company,
      title,
      country,
      city,
      locationRaw: locRaw,
      postedAt,
      url: `${src.url}/jobs/get_vacancy/${id}`,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(job.url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const og = (dhtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i) || [])[1] || '';
      const main = stripTags(decodeEntities(og || '')).trim();
      if (main) {
        job.description = htmlify(main.slice(0, DESC_MAX));
        job.excerpt = excerpt(main);
      }
      out.push(job);
    } catch {
      out.push(job); // keep the card even if the detail page fails
    }
    await sleep(300);
  }
  return out;
}

// 3) SuccessFactors Career Site Builder (Minsur, Codelco, Antamina, BHP, FCX, Fortescue, Woodside, Teck, Kinross)
//    sitemap.xml (+lastmod) → /job/<slug>/<reqId>/ pages with schema.org microdata. Kinross serves a Google-base RSS.
function parseCsbJobPage(html, url, src) {
  const title = stripTags(microdataProp(html, 'title')) || stripTags(decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''));
  const datePosted = microdataProp(html, 'datePosted');
  const validThrough = microdataProp(html, 'validThrough');
  const description = csbDescription(html);
  const locality = microdataProp(html, 'addressLocality');
  const region = microdataProp(html, 'addressRegion');
  const street = microdataProp(html, 'streetAddress');
  const raw = [street, locality, region].filter(Boolean).join(', ');
  const { city } = splitLocation(locality || raw);
  const country = src.country || detectCountry(`${raw} ${title} ${description.slice(0, 800)}`);
  return { title: title.trim(), datePosted, validThrough, description, raw, city, country };
}

async function fetchSapsfCsb(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const xml = await fetchText(src.sitemap, { timeout: 60000 });
  const jobs = [];
  if (/<rss/i.test(xml)) {
    // Google-base RSS with full descriptions (Kinross) — no per-page fetches needed.
    for (const item of parseRss(xml)) {
      if (!item.link || !/\/job\//.test(item.link)) continue;
      const id = (item.link.match(/\/job\/[^/]+\/(\d+)/) || [])[1] || (item.link.match(/\/job\/([^/?#]+)/) || [])[1];
      if (!id) continue;
      const title = item.title || id;
      const text = stripTags(decodeEntities(decodeEntities(item.description || '')));
      const { city } = splitLocation('');
      jobs.push(
        mkJob({
          source: 'sapsf-csb',
          id: `csb-${slugify(src.company).slice(0, 12)}-${id}`,
          company: src.company,
          title,
          country: src.country || detectCountry(`${title} ${text.slice(0, 800)}`),
          city: null,
          description: text,
          postedAt: isoDate(item.pubDate),
          url: item.link.split('?')[0],
        })
      );
      if (jobs.length >= cap) break;
    }
    return jobs;
  }
  const { isIndex, entries } = parseSitemap(xml);
  let all = entries;
  if (isIndex) {
    all = [];
    for (const e of entries) {
      try {
        all.push(...parseSitemap(await fetchText(e.loc, { timeout: 60000 })).entries);
      } catch {
        /* skip child sitemap */
      }
    }
  }
  const pathFilter = src.pathFilter || '/job/';
  const stubs = all
    .filter((e) => e.loc.includes(pathFilter) && /\/job\/[^/]+\/\d+\/?$/.test(e.loc.replace(/\?.*$/, '')))
    .map((e) => {
      const id = (e.loc.match(/\/job\/[^/]+\/(\d+)/) || [])[1];
      return id ? { id, loc: e.loc.replace(/\?.*$/, ''), lastmod: e.lastmod } : null;
    })
    .filter(Boolean)
    .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
  stubs.sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''));
  for (const stub of stubs.slice(0, cap)) {
    const jobId = `csb-${slugify(src.company).slice(0, 12)}-${stub.id}`;
    const base = mkJob({
      source: 'sapsf-csb',
      id: jobId,
      company: src.company,
      title: stub.loc.split('/job/')[1]?.split('/')[0]?.replace(/-/g, ' ') || stub.id,
      country: src.country || 'GLOBAL',
      city: null,
      postedAt: isoDate(stub.lastmod),
      url: stub.loc,
      description: '',
    });
    if (hydrateFromPrev(prevById, base)) {
      jobs.push(base);
      continue;
    }
    try {
      const page = await fetchText(stub.loc);
      const p = parseCsbJobPage(page, stub.loc, src);
      base.title = p.title || base.title;
      base.city = p.city;
      base.locationRaw = p.raw;
      base.country = src.country || p.country;
      base.salary = parseSalary(`${p.raw} ${p.description.slice(0, 2000)}`, base.country);
      if (p.description) {
        base.description = htmlify(p.description.slice(0, DESC_MAX));
        base.excerpt = excerpt(p.description);
      }
      base.postedAt = isoDate(p.datePosted || stub.lastmod);
      if (p.validThrough) base._validThrough = isoDate(p.validThrough); // internal hint; dropped by schema
      jobs.push(base);
    } catch (err) {
      jobs.push(base); // keep stub (empty description) — next run can retry
    }
    await sleep(250);
  }
  return jobs;
}

// 4) Oracle Recruiting Cloud (Redpath CX_1, Barrick CX_1001) — keyless REST + jobpostings sitemap for public URLs
async function fetchOracleHcm(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const urlMap = new Map();
  if (src.publicBase) {
    try {
      const idx = await fetchText(`${src.host}/hcmUI/CandidateExperience/sitemaps/sitemapIndex`, { timeout: 60000 });
      for (const e of parseSitemap(idx).entries.filter((x) => /jobpostings/.test(x.loc))) {
        const sm = await fetchText(e.loc, { timeout: 60000 });
        for (const { loc } of parseSitemap(sm).entries) {
          const id = (loc.match(/\/job\/(\d+)/) || [])[1];
          if (id) urlMap.set(id, loc.split('?')[0]);
        }
      }
    } catch (err) {
      console.error(`  ! ${src.name}: sitemap map failed (${err.message}) — falling back to constructed URLs`);
    }
  }
  const list = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && list.length < cap * 2) {
    const url = `${src.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber=${src.siteNumber},limit=250,offset=${offset}`;
    const res = await fetchJson(url);
    const block = res.items?.[0] || {};
    total = Number.isFinite(block.TotalJobsCount) ? block.TotalJobsCount : list.length + 1;
    const rows = Array.isArray(block.requisitionList) ? block.requisitionList : [];
    if (rows.length === 0) break;
    list.push(...rows);
    offset += rows.length;
  }
  const out = [];
  for (const r of list.slice(0, cap)) {
    const id = String(r.Id);
    const rawLoc = r.PrimaryLocation || '';
    const cc = (r.PrimaryLocationCountry || '').toUpperCase();
    const job = mkJob({
      source: 'oracle-hcm',
      id: `orc-${src.siteNumber.replace('CX_', '')}-${id}`,
      company: src.company,
      title: (r.Title || '').trim(),
      country: COUNTRY_HINTS[cc] ? cc : detectCountry(`${rawLoc} ${r.Title || ''}`),
      city: splitLocation(rawLoc).city,
      locationRaw: rawLoc,
      postedAt: isoDate(r.ExternalPostedStartDate || r.PostedDate),
      url: urlMap.get(id) || `${src.host}/hcmUI/CandidateExperience/en/sites/${src.siteSlug}/job/${id}`,
      description: String(r.ShortDescriptionStr || ''),
    });
    out.push(job);
  }
  // descriptions for new postings only
  for (const job of out) {
    if (job.description) continue;
    if (hydrateFromPrev(prevById, job)) continue;
    try {
      const durl = `${src.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?onlyData=true&finder=ById;siteNumber=${src.siteNumber},Id=%22${job.id.replace(/^orc-[^-]+-/, '')}%22&expand=all`;
      const res = await fetchJson(durl);
      const d = res.items?.[0] || {};
      const full = [d.ExternalDescriptionStr, d.ExternalQualificationsStr].filter(Boolean).join('\n\n');
      const text = stripTags(decodeEntities(full || ''));
      if (text) {
        job.description = htmlify(text.slice(0, DESC_MAX));
        job.excerpt = excerpt(text);
      }
    } catch {
      /* keep short description */
    }
    await sleep(200);
  }
  return out;
}

// 5) PageUp (MMG Las Bambas) — SSR results cards + JobPosting JSON-LD detail
async function fetchPageup(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const sep = src.url.includes('?') ? '&' : '?';
  const cards = new Map();
  for (let page = 1; page <= 20 && cards.size < cap; page++) {
    const html = await fetchText(page === 1 ? src.url : `${src.url}${sep}page=${page}`);
    const parts = html.split('job-search-results-card-col');
    if (parts.length <= 1) break;
    for (const part of parts.slice(1)) {
      const link = (part.match(/href="(https:\/\/careers\.mmg\.com\/jobs\/[a-z0-9-]+)"/) || [])[1];
      const title = stripTags(decodeEntities((part.match(/card-title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '')).trim();
      if (!link || !title) continue;
      const locRaw = stripTags(decodeEntities((part.match(/job-component-location[^>]*>\s*<i[\s\S]*?<\/i>\s*([\s\S]*?)<\/li>/) || [])[1] || '')).trim();
      cards.set(link, { title, locRaw });
    }
  }
  const out = [];
  for (const [link, { title, locRaw }] of cards) {
    const slugId = link.split('/jobs/')[1];
    const job = mkJob({
      source: 'pageup',
      id: `pu-${slugify(title).slice(0, 30)}`,
      company: src.company,
      title,
      country: src.country || detectCountryFrom(locRaw, `${title} ${locRaw}`),
      city: splitLocation(locRaw).city,
      locationRaw: locRaw,
      postedAt: todayISO(),
      url: link,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(link);
      const jp = collectJobPostings(extractJsonLd(dhtml))[0];
      if (jp) {
        job.title = (jp.title || job.title).trim();
        job.postedAt = isoDate(jp.datePosted);
        job.salary = parseSalary(`${JSON.stringify(jp.jobLocation || '')} ${jp.description || ''}`.slice(0, 3000), job.country);
        const text = stripTags(decodeEntities(jp.description || ''));
        if (text) {
          job.description = htmlify(text.slice(0, DESC_MAX));
          job.excerpt = excerpt(text);
        }
      }
    } catch {
      /* keep card */
    }
    out.push(job);
    await sleep(src.delayMs || 1000);
  }
  return out;
}

// 6) Jobiqo (Careermine) — bot-check cookie + sitemap + JobPosting JSON-LD detail. Crawl-delay: 10s.
async function careermineToken() {
  const res = await fetch('https://www.careermine.com/', {
    headers: { 'User-Agent': BROWSER_UA },
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
  });
  const loc = res.headers.get('location') || '';
  const m = loc.match(/token=([0-9a-f]+)/i);
  if (m) return m[1];
  // Already allowed (200) — no token needed for sitemap fetches in practice.
  return null;
}

async function fetchJobiqo(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const token = await careermineToken();
  const H = token ? { Cookie: `bot_verified=${token}` } : {};
  const first = await fetchText(src.sitemap, { headers: H, timeout: 60000 });
  const { isIndex, entries } = parseSitemap(first);
  let all = entries;
  if (isIndex) {
    all = [];
    for (const e of entries) {
      try {
        all.push(...parseSitemap(await fetchText(e.loc, { headers: H, timeout: 60000 })).entries);
      } catch {
        /* skip child */
      }
    }
  }
  const seen = new Set();
  const stubs = all
    .filter((e) => /\/job\/[a-z0-9-]+-\d+$/.test(e.loc))
    .filter((e) => (seen.has(e.loc) ? false : (seen.add(e.loc), true)))
    .map((e) => ({
      id: (e.loc.match(/-(\d+)$/) || [])[1],
      loc: e.loc,
      lastmod: e.lastmod,
    }))
    .filter((s) => s.id);
  stubs.sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''));
  const out = [];
  for (const stub of stubs.slice(0, cap)) {
    const job = mkJob({
      source: 'jobiqo',
      id: `cm-${stub.id}`,
      company: src.company,
      title: stub.loc.split('/job/')[1].replace(/-\d+$/, '').replace(/-/g, ' '),
      country: 'GLOBAL',
      postedAt: isoDate(stub.lastmod),
      url: stub.loc,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(stub.loc, { headers: H, timeout: 40000 });
      const jp = collectJobPostings(extractJsonLd(dhtml))[0];
      if (jp) {
        const org = jp.hiringOrganization || {};
        const addr = Array.isArray(jp.jobLocation) ? jp.jobLocation[0]?.address : jp.jobLocation?.address;
        const raw = addr ? [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ') : '';
        job.company = org.name || job.company;
        job.companySlug = slugify(job.company);
        job.title = (jp.title || job.title).trim();
        job.slug = slugify(`${job.company}-${job.title}-${job.country}-${stub.id}`);
        job.locationRaw = raw;
        job.city = splitLocation(addr?.addressLocality || '').city;
        const cc = String(addr?.addressCountry || '').toUpperCase();
        job.country = COUNTRY_HINTS[cc] ? cc : detectCountryFrom(`${raw} ${job.title}`, String(jp.description || ''));
        job.postedAt = isoDate(jp.datePosted || stub.lastmod);
        job.salary = parseSalary(JSON.stringify(jp.baseSalary || ''), job.country);
        const text = stripTags(decodeEntities(jp.description || ''));
        if (text) {
          job.description = htmlify(text.slice(0, DESC_MAX));
          job.excerpt = excerpt(text);
        }
      }
    } catch {
      /* keep stub */
    }
    out.push(job);
    await sleep(src.delayMs || 10000);
  }
  return out;
}

// 7) Brunel — full jobs sitemap (the /jobs/mining facet rotates unreliably) + JSON-LD detail
async function fetchBrunel(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const xml = await fetchText(src.sitemap, { timeout: 60000 });
  const paths = parseSitemap(xml)
    .entries.map((e) => e.loc)
    .filter((loc) => /\/en\/jobs\/[a-z0-9-]+-(?:cr|pr)-\d+$/.test(loc))
    .map((loc) => loc.replace(/^https:\/\/www\.brunel\.net/, ''))
    .slice(0, cap);
  const out = [];
  for (const path of paths) {
    const id = (path.match(/-((?:cr|pr)-\d+)$/) || [])[1];
    const url = `https://www.brunel.net${path}`;
    const job = mkJob({
      source: 'brunel',
      id: `br-${id}`,
      company: src.company,
      title: path.split('/en/jobs/')[1].replace(/-((?:cr|pr)-\d+)$/, '').replace(/-/g, ' '),
      country: 'GLOBAL',
      postedAt: todayISO(),
      url,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(url);
      const jp = collectJobPostings(extractJsonLd(dhtml))[0];
      if (jp) {
        const places = Array.isArray(jp.jobLocation) ? jp.jobLocation : [jp.jobLocation].filter(Boolean);
        const addr = places[0]?.address || {};
        const raw = [addr.addressLocality, addr.addressRegion, addr.country].filter(Boolean).join(', ');
        const text0 = stripTags(decodeEntities(jp.description || ''));
        const cc = String(addr.country || '').toUpperCase();
        job.title = (jp.title || job.title).trim();
        job.slug = slugify(`${job.company}-${job.title}-${job.country}-${id}`);
        job.locationRaw = raw;
        job.city = splitLocation(addr.addressLocality || '').city;
        job.country = COUNTRY_HINTS[cc] ? cc : detectCountry(`${raw} ${job.title}`);
        job.postedAt = isoDate(jp.datePosted);
        const sal = jp.baseSalary || jp.estimatedSalary;
        job.salary = parseSalary(JSON.stringify(sal || ''), job.country);
        if (text0) {
          // Brunel's mining facet leaks other markets — keep mining-relevant roles only.
          if (!MINING_RE.test(job.title) && !MINING_RE.test(text0.slice(0, 600))) continue;
          job.description = htmlify(text0.slice(0, DESC_MAX));
          job.excerpt = excerpt(text0);
        }
      }
    } catch {
      /* keep stub */
    }
    out.push(job);
    await sleep(250);
  }
  return out;
}

// 8) Globe 24-7 — WordPress WP Job Manager list + JobPosting JSON-LD detail
async function fetchGlobe247(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const html = await fetchText(src.url);
  const links = [...new Set([...html.matchAll(/href="(https:\/\/globe24-7\.com\/job\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))].slice(0, cap);
  const out = [];
  for (const url of links) {
    const id = (url.match(/-(\d+)\/?$/) || [])[1] || slugify(url);
    const job = mkJob({
      source: 'globe247',
      id: `g7-${id}`,
      company: src.company,
      title: url.split('/job/')[1].replace(/-\d+\/?$/, '').replace(/-/g, ' '),
      country: 'GLOBAL',
      postedAt: todayISO(),
      url,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(url);
      const jp = collectJobPostings(extractJsonLd(dhtml))[0];
      if (jp) {
        const addr = (Array.isArray(jp.jobLocation) ? jp.jobLocation[0] : jp.jobLocation)?.address || {};
        const raw = addr.address || [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ');
        job.title = (jp.title || job.title).trim();
        job.slug = slugify(`${job.company}-${job.title}-${job.country}-${id}`);
        job.locationRaw = raw;
        job.country = src.country || detectCountry(`${raw} ${job.title} ${String(jp.description || '').slice(0, 800)}`);
        job.postedAt = isoDate(jp.datePosted);
        job.salary = parseSalary(String(jp.baseSalary ?? '') + ' ' + String(jp.description || '').slice(0, 1500), job.country);
        const text = stripTags(decodeEntities(jp.description || ''));
        if (text) {
          job.description = htmlify(text.slice(0, DESC_MAX));
          job.excerpt = excerpt(text);
        }
      }
    } catch {
      /* keep stub */
    }
    out.push(job);
    await sleep(250);
  }
  return out;
}

// 9) CA Mining (camining.com — CA Global) — Simple Job Board sitemap + HTML details
async function fetchCamining(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const xml = await fetchText('https://camining.com/jobpost-sitemap.xml', { timeout: 60000 });
  const stubs = parseSitemap(xml)
    .entries.filter((e) => /\/jobs\/[a-z0-9-]+\/$/.test(e.loc))
    .map((e) => ({ loc: e.loc, lastmod: e.lastmod }));
  const out = [];
  for (const stub of stubs.slice(0, cap)) {
    const id = slugify(stub.loc).slice(-40);
    const job = mkJob({
      source: 'camining',
      id: `cam-${id}`,
      company: src.company,
      title: stub.loc.split('/jobs/')[1].replace(/\/$/, '').replace(/-/g, ' '),
      country: 'GLOBAL',
      postedAt: isoDate(stub.lastmod),
      url: stub.loc,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(stub.loc);
      const ogTitle = (dhtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
      let title = decodeEntities(ogTitle).replace(/\s*\|\s*CA Mining.*$/i, '').trim();
      const ogDesc = (dhtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
      const i = dhtml.search(/class=["']sjb-detail/i);
      let text = '';
      if (i !== -1) {
        const chunk = dhtml.slice(i, dhtml.indexOf('</article>', i) !== -1 ? dhtml.indexOf('</article>', i) : i + 40000);
        text = stripTags(decodeEntities(chunk)).trim();
      }
      if (!text) text = decodeEntities(ogDesc);
      const locTail = title.match(/[-–,]\s*([A-Za-z .,]+,[A-Za-z ]+)$/);
      job.title = title;
      job.slug = slugify(`${job.company}-${title}-${job.country}-${id}`);
      job.locationRaw = locTail ? locTail[1].trim() : '';
      job.country = detectCountryFrom(`${job.locationRaw} ${title}`, text);
      if (!MINING_RE.test(title) && !MINING_RE.test(text.slice(0, 500))) continue; // CA Global publishes non-mining content too
      if (text) {
        job.description = htmlify(text.slice(0, DESC_MAX));
        job.excerpt = excerpt(text);
      }
    } catch {
      /* keep stub */
    }
    out.push(job);
    await sleep(300);
  }
  return out;
}

// 10) Job Bank Canadá (jobbank.gc.ca — government) — SSR list + posting details. Crawl-delay: 5s.
async function fetchJobbank(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const out = [];
  const seen = new Set();
  const cards = [];
  for (let page = 1; page <= 4 && cards.length < cap; page++) {
    const url = page === 1 ? src.url : `${src.url}&page=${page}`;
    let html;
    try {
      html = await fetchText(url);
    } catch {
      break;
    }
    const parts = html.split('class="resultJobItem"');
    if (parts.length <= 1) break;
    for (const part of parts.slice(1)) {
      const num = (part.match(/<span class="fa fa-hashtag"[^>]*>\s*<\/span>\s*(\d{6,12})/) || [])[1];
      if (!num || seen.has(num)) continue;
      seen.add(num);
      const title = stripTags(decodeEntities((part.match(/class="noctitle">\s*([\s\S]*?)\n/) || [])[1] || '')).trim();
      const business = stripTags(decodeEntities((part.match(/class="business">([\s\S]*?)<\/li>/) || [])[1] || '')).trim();
      const locRaw = stripTags(decodeEntities((part.match(/<span class="wb-inv">Location<\/span>\s*([\s\S]*?)<\/li>/) || [])[1] || '')).trim();
      const salaryText = stripTags(decodeEntities((part.match(/class="salary">([\s\S]*?)<\/li>/) || [])[1] || '')).trim();
      const dateText = stripTags(decodeEntities((part.match(/class="date">([\s\S]*?)<\/li>/) || [])[1] || '')).trim();
      cards.push({ num, title, business, locRaw, salaryText, dateText });
    }
  }
  for (const c of cards.slice(0, cap)) {
    const job = mkJob({
      source: 'jobbank',
      id: `jb-${c.num}`,
      company: c.business || src.company,
      title: c.title,
      country: src.country || 'CA',
      city: splitLocation(c.locRaw).city,
      locationRaw: c.locRaw,
      salary: parseSalary(c.salaryText, 'CA'),
      postedAt: isoDate(c.dateText),
      url: `https://www.jobbank.gc.ca/jobsearch/jobposting/${c.num}`,
      description: '',
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(job.url);
      if (/Job posting expired|expired/i.test((dhtml.match(/<h1[^>]*>([\s\S]{0,120}?)<\/h1>/) || [])[1] || '')) continue;
      const main = dhtml.match(/<main[\s\S]*?<\/main>/i);
      const text = stripTags(decodeEntities(main ? main[0] : dhtml)).trim();
      if (text) {
        job.description = htmlify(text.slice(0, DESC_MAX));
        job.excerpt = excerpt(text);
      }
      const sal = dhtml.match(/itemprop="baseSalary"[\s\S]{0,600}?itemprop="value"[\s\S]{0,300}?content="([\d.,]+)"[\s\S]{0,200}?itemprop="unitText"\s+content="(\w+)"/i);
      if (sal) {
        const v = parseFloat(sal[1].replace(/,/g, ''));
        if (Number.isFinite(v)) job.salary = { min: v, max: null, currency: 'CAD', period: sal[2].toLowerCase() === 'hour' ? 'hour' : 'year' };
      }
    } catch {
      /* keep list data */
    }
    out.push(job);
    await sleep(src.delayMs || 5000);
  }
  return out;
}

// 11) PNet (StepStone ZA) — preloaded JSON state + detail pages
async function fetchPnet(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const items = [];
  const pages = Math.ceil(cap / 25);
  for (let page = 1; page <= pages; page++) {
    let html;
    try {
      html = await fetchText(page === 1 ? src.url : `${src.url}?page=${page}`);
    } catch (err) {
      console.error(`  ! pnet page ${page}: ${err.message} — stopping pagination`);
      break;
    }
    const idx = html.indexOf('"items":[{"id":');
    if (idx === -1) break;
    // balanced-brace extraction of the first object in items[]
    let depth = 0;
    let start = html.indexOf('{', idx + 8);
    let end = start;
    for (let i = start; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    try {
      const parsed = JSON.parse(html.slice(start, end + 1));
      if (parsed && parsed.id && items.some((x) => x.id === parsed.id)) break;
      items.push(parsed);
    } catch {
      break;
    }
    const chunk = html.slice(idx, idx + 40000);
    const more = [...chunk.matchAll(/\{"id":\d+,"title":"[\s\S]*?\}\},\{"id":\d+,"title"/g)];
    // walk remaining items on this page
    let cursor = html.indexOf('},{', start);
    while (cursor !== -1 && cursor < idx + 300000) {
      const s2 = html.indexOf('{', cursor + 1);
      if (s2 === -1) break;
      let d2 = 0;
      let e2 = s2;
      for (let i = s2; i < html.length; i++) {
        if (html[i] === '{') d2++;
        else if (html[i] === '}') {
          d2--;
          if (d2 === 0) {
            e2 = i;
            break;
          }
        }
      }
      try {
        const obj = JSON.parse(html.slice(s2, e2 + 1));
        if (obj && obj.id && obj.title && obj.datePosted) items.push(obj);
        else break;
      } catch {
        break;
      }
      cursor = html.indexOf('},{', e2);
    }
  }
  const unique = items.filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i).slice(0, cap);
  const out = [];
  for (const it of unique) {
    const url = `https://www.pnet.co.za${(it.url || '').split('?')[0]}`;
    const job = mkJob({
      source: 'pnet',
      id: `pn-${it.id}`,
      company: it.companyName || src.company,
      title: it.title || '',
      country: src.country || 'ZA',
      city: splitLocation(it.location || '').city,
      locationRaw: it.location || '',
      salary: parseSalary(String(it.salary || ''), 'ZA'),
      postedAt: isoDate(it.datePosted),
      url,
      description: stripTags(decodeEntities(it.textSnippet || '')),
    });
    if (hydrateFromPrev(prevById, job)) {
      out.push(job);
      continue;
    }
    try {
      const dhtml = await fetchText(url);
      const jp = collectJobPostings(extractJsonLd(dhtml))[0];
      const text = jp ? stripTags(decodeEntities(jp.description || '')) : '';
      if (text) {
        job.description = htmlify(text.slice(0, DESC_MAX));
        job.excerpt = excerpt(text);
        if (jp.datePosted) job.postedAt = isoDate(jp.datePosted);
        if (jp.validThrough) job._validThrough = isoDate(jp.validThrough);
      }
    } catch {
      /* keep snippet */
    }
    out.push(job);
    await sleep(250);
  }
  return out;
}

// 12) Computrabajo — SSR list (base, base-p2, …) + JobPosting JSON-LD detail
async function fetchComputrabajo(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const out = [];
  const seen = new Set();
  for (let page = 1; page <= Math.ceil(cap / 20); page++) {
    const url = page === 1 ? src.url : `${src.url}-p${page}`;
    let html;
    try {
      html = await fetchText(url);
    } catch {
      break;
    }
    const links = [...html.matchAll(/href="(\/ofertas-de-trabajo\/[a-z0-9-]+-[0-9A-F]{16,40})#/g)].map((m) => m[1]);
    if (links.length === 0) break;
    for (const path of links) {
      if (seen.has(path)) continue;
      seen.add(path);
      const detailUrl = new URL(path, src.url).href;
      let job = null;
      try {
        const dhtml = await fetchText(detailUrl);
        const jp = collectJobPostings(extractJsonLd(dhtml))[0];
        if (!jp) continue;
        const addr = jp.jobLocation?.address || {};
        const country = src.country || detectCountry(`${addr.addressLocality || ''} ${addr.addressRegion || ''} ${addr.addressCountry || ''}`);
        const sal = jp.baseSalary;
        let salary = null;
        if (sal?.value?.value) {
          const v = parseFloat(sal.value.value);
          if (Number.isFinite(v)) {
            const period = { MONTH: 'month', HOUR: 'hour', YEAR: 'year', DAY: 'day' }[sal.value.unitText?.toUpperCase()] || 'month';
            salary = { min: v, max: null, currency: sal.currency || 'USD', period };
          }
        }
        job = mkJob({
          source: 'computrabajo',
          id: `ct-${(detailUrl.match(/-([0-9A-F]{16,40})$/) || [])[1] || slugify(detailUrl).slice(-30)}`,
          company: (jp.hiringOrganization && jp.hiringOrganization.name) || src.company,
          title: (jp.title || '').trim(),
          country,
          city: splitLocation(addr.addressLocality || '').city,
          locationRaw: [addr.addressLocality, addr.addressRegion].filter(Boolean).join(', '),
          salary,
          postedAt: isoDate(jp.datePosted),
          url: detailUrl,
          description: String(jp.description || ''),
        });
      } catch {
        continue;
      }
      out.push(job);
      await sleep(250);
      if (out.length >= cap) break;
    }
    if (out.length >= cap) break;
  }
  return out;
}

// 13) Navent (Bumeran, Laborum) — keyless JSON searchV2 API + sitemap URL resolution
async function naventUrlMap(host) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const xml = await fetchText(`${host}/sitemap_avisos_bum.xml`, { timeout: 90000 });
      const map = new Map();
      for (const { loc } of parseSitemap(xml).entries) {
        const id = (loc.match(/-(\d{6,})\.html$/) || [])[1];
        if (id) map.set(id, loc);
      }
      return map;
    } catch (err) {
      if (attempt === 2) console.error(`  ! ${host}: avisos sitemap → ${err.message} (job URLs unresolvable this run)`);
      else await sleep(2000);
    }
  }
  return new Map();
}

async function fetchNavent(src) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const urlMap = await naventUrlMap(src.host);
  const queries = ['mineria', 'minero', 'mina'];
  const byId = new Map();
  for (const q of queries) {
    for (let page = 0; page < 10; page++) {
      let data = null;
      for (let attempt = 1; attempt <= 2 && !data; attempt++) {
        try {
          data = await postJson(
            `${src.host}/api/avisos/searchV2?pageSize=50&page=${page}`,
            { filtros: [], query: q, internacional: false },
            { headers: { 'x-site-id': src.siteId, Origin: src.host, Referer: `${src.host}/empleos-busquedaext-${q}` } }
          );
        } catch (err) {
          if (attempt === 2) console.error(`  ! ${src.name}: searchV2 "${q}" p${page} → ${err.message}`);
          else await sleep(1500);
        }
      }
      if (!data) break;
      const rows = Array.isArray(data?.content) ? data.content : [];
      if (rows.length === 0) break;
      for (const o of rows) {
        if (!byId.has(String(o.id))) byId.set(String(o.id), o);
      }
      const total = Number(data.total || 0);
      if ((page + 1) * 50 >= total) break;
      await sleep(400); // Navent WAF: pace the keyless POSTs
    }
  }
  const out = [];
  for (const [id, o] of byId) {
    const url = urlMap.get(id);
    if (!url) continue; // brand-new ads resolve next run via the sitemap
    const title = o.titulo || '';
    const detail = String(o.detalle || '');
    // The `mina`/`minero` full-text queries match unrelated words (e.g. "administración") — keep mining-relevant only.
    if (!MINING_RE.test(title) && !MINING_RE.test(detail.slice(0, 500))) continue;
    out.push(
      mkJob({
        source: 'navent',
        id: `nv-${src.siteId}-${id}`,
        company: o.empresa || src.company,
        title: o.titulo || '',
        country: src.country || 'GLOBAL',
        city: splitLocation(o.localizacion || '').city,
        locationRaw: o.localizacion || '',
        postedAt: o.fechaPublicacion,
        url,
        description: String(o.detalle || ''),
      })
    );
    if (out.length >= cap) break;
  }
  return out;
}

// 14) SmartRecruiters (Anglo American) — public JSON API
async function fetchSmartrecruiters(src, prevById) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const out = [];
  for (let offset = 0; offset < cap; offset += 100) {
    let data;
    try {
      data = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${src.companyId}/postings?limit=100&offset=${offset}`);
    } catch {
      break;
    }
    const rows = Array.isArray(data.content) ? data.content : [];
    if (rows.length === 0) break;
    for (const p of rows) {
      const cc = (p.location?.country || '').toUpperCase();
      const raw = p.location?.fullLocation || [p.location?.city, cc].filter(Boolean).join(', ');
      const job = mkJob({
        source: 'smartrecruiters',
        id: `sr-${p.id}`,
        company: p.company?.name || src.company,
        title: p.name || '',
        country: COUNTRY_HINTS[cc] ? cc : detectCountry(`${raw} ${p.name || ''}`),
        city: p.location?.city || null,
        locationRaw: raw,
        remote: Boolean(p.location?.remote),
        postedAt: p.releasedDate,
        url: `https://jobs.smartrecruiters.com/${src.companyId}/${p.id}-${slugify(p.name || '')}`,
        description: '',
      });
      out.push(job);
    }
    if ((data.totalFound ?? 0) <= offset + 100) break;
  }
  for (const job of out.slice(0, cap)) {
    if (hydrateFromPrev(prevById, job)) continue;
    try {
      const d = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${src.companyId}/postings/${job.id.replace(/^sr-/, '')}`);
      const secs = d.jobAd?.sections || {};
      const html = Object.values(secs)
        .map((s) => s.text || '')
        .filter(Boolean)
        .join('\n\n');
      const text = stripTags(decodeEntities(html));
      if (text) {
        job.description = htmlify(text.slice(0, DESC_MAX));
        job.excerpt = excerpt(text);
      }
    } catch {
      /* keep stub */
    }
    await sleep(200);
  }
  return capJobs(out, cap);
}

// 15) Eightfold AI (Vale) — keyless JSON API with full descriptions
async function fetchEightfold(src) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const out = [];
  for (let start = 0; start < cap; start += 100) {
    let data;
    try {
      data = await fetchJson(`${src.host}/api/apply/v2/jobs?domain=${src.domain}&start=${start}&num=100`);
    } catch {
      break;
    }
    const rows = Array.isArray(data.positions) ? data.positions : [];
    if (rows.length === 0) break;
    for (const p of rows) {
      const raw = Array.isArray(p.locations) ? p.locations.join(', ') : p.location || '';
      out.push(
        mkJob({
          source: 'eightfold',
          id: `ef-${p.id}`,
          company: src.company,
          title: p.name || '',
          country: detectCountryFrom(raw, String(p.job_description || '')),
          city: null,
          locationRaw: raw,
          postedAt: p.t_create ? new Date(p.t_create * 1000).toISOString().slice(0, 10) : todayISO(),
          url: p.canonicalPositionUrl || `${src.host}/careers/job/${p.id}`,
          description: String(p.job_description || ''),
        })
      );
    }
  }
  return capJobs(out, cap);
}

// 16) Oracle Taleo RSS (Agnico Eagle) — keyless custom job list feed (partial coverage)
async function fetchTaleoRss(src) {
  const xml = await fetchText(src.url, { timeout: 60000 });
  const out = [];
  for (const item of parseRss(xml)) {
    if (!item.link) continue;
    const code = (item.link.match(/job=([A-Z0-9-]+)/i) || [])[1] || slugify(item.title || item.link).slice(0, 20);
    const text = stripTags(decodeEntities(item.description || ''));
    out.push(
      mkJob({
        source: 'taleo-rss',
        id: `ag-${code}`,
        company: src.company,
        title: item.title || '',
        country: detectCountry(`${item.title || ''} ${text.slice(0, 800)}`),
        postedAt: isoDate(item.pubDate),
        url: item.link.replace(/^http:/, 'https:'),
        description: text,
      })
    );
  }
  return out;
}

// 17) EmpleosMineros.cl — keyless JSON API
async function fetchEmpleosmineros(src) {
  const cap = effectiveCap(src, MAX_PER_SOURCE);
  const data = await fetchJson(src.url);
  const rows = Array.isArray(data) ? data : Array.isArray(data.empleos) ? data.empleos : [];
  const out = [];
  for (const o of rows) {
    const cargo = String(o.cargo || '');
    const desc = stripTags(decodeEntities(String(o.descripcion || '')));
    if (!MINING_RE.test(cargo) && !MINING_RE.test(desc.slice(0, 500))) continue;
    out.push(
      mkJob({
        source: 'empleosmineros',
        id: `em-${o.id}`,
        company: src.company,
        title: cargo.trim(),
        country: src.country || 'CL',
        city: o.comuna || null,
        locationRaw: [o.comuna, o.region].filter(Boolean).join(', '),
        postedAt: isoDate(o.created_at),
        url: 'https://empleosmineros.cl',
        description: desc,
      })
    );
    if (out.length >= cap) break;
  }
  return out;
}

// 18) LinkedIn top-50 seed via Apify guest-mode actors (no LinkedIn account; optional APIFY_TOKEN)
function parseApifyItem(it) {
  const title = it.title || it.jobTitle || it.job_title || '';
  if (!title) return null;
  const url = it.url || it.jobUrl || it.job_url || it.link || '';
  if (!/^https?:\/\//.test(url)) return null;
  const company = it.company || it.companyName || it.company_name || it.employer?.name || '';
  const locRaw = typeof it.location === 'string' ? it.location : it.location?.formattedLocation || it.location?.location || '';
  const posted = it.postedAt || it.publishedAt || it.datePosted || it.posted_at || it.listedAt;
  const desc = it.descriptionText || it.description || it.descriptionHTML || it.description_html || '';
  return { title, url, company, locRaw, posted, desc };
}

async function runApifyActor(actorId, input, timeoutMs = 330000) {
  const token = process.env.APIFY_TOKEN;
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=300`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Apify ${actorId}: HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
}

async function fetchApifyLinkedin(cfg, prevById) {
  if (!process.env.APIFY_TOKEN) {
    console.log('ℹ LinkedIn skipped (set APIFY_TOKEN to enable)');
    return [];
  }
  const companies = cfg.companies || [];
  let items = [];
  // Primary: cheap_scraper resolves company names internally (verified).
  // maxItems hard-bounds the pay-per-result cost (actor requires >= 150).
  const maxItems = Math.max(150, effectiveCap({ cap: cfg.cap }, MAX_PER_SOURCE));
  try {
    items = await runApifyActor(cfg.fallbackActor, { companyInclude: companies, maxItems });
    console.log(`✓ apify-linkedin:${cfg.fallbackActor} → ${items.length} raw items (maxItems ${maxItems})`);
  } catch (err) {
    console.error(`✗ apify-linkedin primary (${cfg.fallbackActor}) → ${err.message}`);
  }
  // Upgrade path: kaix is cheaper per 1k but needs numeric company IDs — use them when the ids file exists.
  if (items.length === 0 && cfg.actor) {
    let ids = {};
    try {
      ids = JSON.parse(await readFile(new URL('../' + cfg.idsFile, import.meta.url), 'utf8'));
    } catch {
      /* no ids file yet */
    }
    const withIds = companies.map((c) => ids[c]).filter(Boolean);
    if (withIds.length) {
      try {
        items = await runApifyActor(cfg.actor, { companyId: withIds.map(String), fetchDetails: true });
        console.log(`✓ apify-linkedin:${cfg.actor} → ${items.length} raw items (by id)`);
      } catch (err) {
        console.error(`✗ apify-linkedin (${cfg.actor}) → ${err.message}`);
      }
    }
  }
  const cap = effectiveCap({ cap: cfg.cap }, MAX_PER_SOURCE);
  const out = [];
  const seen = new Set();
  for (const it of items) {
    const p = parseApifyItem(it);
    if (!p) continue;
    const key = `${slugify(p.company)}::${normTitle(p.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { city } = splitLocation(p.locRaw);
    out.push(
      mkJob({
        source: 'apify-linkedin',
        id: `li-${slugify(p.url).slice(-40)}`,
        company: p.company || 'LinkedIn',
        title: p.title,
        country: detectCountry(`${p.locRaw} ${String(p.desc).slice(0, 800)}`),
        city,
        locationRaw: p.locRaw,
        remote: /\bremote\b/i.test(p.locRaw || ''),
        postedAt: isoDate(p.posted),
        url: p.url,
        description: typeof p.desc === 'string' && /</.test(p.desc) ? stripTags(decodeEntities(p.desc)) : String(p.desc || ''),
      })
    );
    if (out.length >= cap) break;
  }
  return out;
}

/* ------------------------------ translations ------------------------------ */
/* Titles are auto-translated (es/en/pt) via an OpenAI-compatible gateway.     */
/* Descriptions are NEVER translated (repo rule). Fail-open: no key or API     */
/* error → jobs keep their original title. Results are cached and committed.   */

const TRANSLATE_API = 'https://api.orcarouter.ai/v1/chat/completions';
const TRANSLATE_MODEL = process.env.ORCAROUTER_MODEL || 'orcarouter/free';
const TRANSLATE_LANGS = ['es', 'en', 'pt'];
const LANG_NAMES = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
const CACHE_FILE = path.join(ROOT, 'src', 'data', 'translation-cache.json');

function detectLang(s) {
  if (/[ãõç]|ção|não\b/i.test(s)) return 'pt';
  if (/[ñ¿¡]/i.test(s)) return 'es';
  if (/[áéíóúü]/i.test(s)) return 'es';
  return 'en';
}

async function translateBatch(titles, target) {
  const res = await fetch(TRANSLATE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ORCAROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: TRANSLATE_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a translator for mining job titles. Input: a JSON object {"titles":[...]}. Output: ONLY a JSON object {"translations":[...]} with one translation per input item, in the same order, written in ${LANG_NAMES[target]}. Preserve job-title style (no sentences, no explanations, no quotes around items). If an item is already in ${LANG_NAMES[target]}, return it unchanged.`,
        },
        { role: 'user', content: JSON.stringify({ titles }) },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OrcaRouter HTTP ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const m = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(m ? m[0] : raw);
  const arr = Array.isArray(parsed) ? parsed : parsed.translations;
  if (!Array.isArray(arr) || arr.length !== titles.length) throw new Error('translation shape mismatch');
  return arr.map((s) => String(s || '').trim());
}

async function translateTitles(jobs) {
  if (!process.env.ORCAROUTER_API_KEY) {
    console.log('ℹ Translations skipped (set ORCAROUTER_API_KEY to enable)');
    return;
  }
  let cache = {};
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  } catch {
    /* fresh cache */
  }
  const apply = (job) => {
    const src = detectLang(job.title);
    const tr = {};
    for (const lang of TRANSLATE_LANGS) {
      if (lang === src) continue;
      const hit = cache[`${lang}::${job.title}`];
      if (hit) tr[lang] = hit;
    }
    if (Object.keys(tr).length) job.translations = tr;
    else delete job.translations;
  };
  jobs.forEach(apply);

  const wanted = new Map();
  for (const job of jobs) {
    const src = detectLang(job.title);
    for (const lang of TRANSLATE_LANGS) {
      if (lang === src) continue;
      const key = `${lang}::${job.title}`;
      if (!cache[key]) wanted.set(key, { title: job.title, lang });
    }
  }
  console.log(`ℹ Translations: ${wanted.size} title/language pairs to translate`);
  const byLang = {};
  for (const [key, v] of wanted) (byLang[v.lang] ||= []).push({ key, title: v.title });
  let dirty = false;
  for (const lang of Object.keys(byLang)) {
    const list = byLang[lang];
    for (let i = 0; i < list.length; i += 20) {
      const batch = list.slice(i, i + 20);
      try {
        const out = await translateBatch(
          batch.map((b) => b.title),
          lang
        );
        batch.forEach((b, k) => {
          if (out[k]) {
            cache[b.key] = out[k];
            dirty = true;
          }
        });
      } catch (err) {
        console.error(`✗ translation batch (${lang}, items ${i}–${i + batch.length}) → ${err.message}`);
      }
      await sleep(300);
    }
  }
  if (dirty) await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  jobs.forEach(apply);
  console.log(`✓ translations available for ${jobs.filter((j) => j.translations).length}/${jobs.length} jobs`);
}

/* --------------------------------- main ----------------------------------- */

async function main() {
  const config = JSON.parse(await readFile(CONFIG, 'utf8'));
  MAX_PER_SOURCE = config.maxPerSource || MAX_PER_SOURCE;
  const all = [];
  const errors = [];

  // Previous feed — lets heavy sources reuse stored descriptions instead of refetching.
  const prevById = new Map();
  try {
    const prev = JSON.parse(await readFile(OUT, 'utf8'));
    for (const j of prev.jobs || []) prevById.set(j.id, j);
  } catch {
    /* first run */
  }

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

  const DIRECT_FETCHERS = {
    'scc-capper': fetchSccCapper,
    hiringroom: fetchHiringroom,
    'sapsf-csb': fetchSapsfCsb,
    'oracle-hcm': fetchOracleHcm,
    pageup: fetchPageup,
    jobiqo: fetchJobiqo,
    brunel: fetchBrunel,
    globe247: fetchGlobe247,
    camining: fetchCamining,
    jobbank: fetchJobbank,
    pnet: fetchPnet,
    computrabajo: fetchComputrabajo,
    navent: fetchNavent,
    smartrecruiters: fetchSmartrecruiters,
    eightfold: fetchEightfold,
    'taleo-rss': fetchTaleoRss,
    empleosmineros: fetchEmpleosmineros,
  };

  for (const src of config.direct || []) {
    const fetcher = DIRECT_FETCHERS[src.platform];
    if (!fetcher) {
      errors.push(`unsupported direct platform ${src.platform} (${src.name})`);
      continue;
    }
    try {
      const jobs = await fetcher(src, prevById);
      all.push(...jobs);
      console.log(`✓ ${src.platform}:${src.name} → ${jobs.length} jobs`);
    } catch (err) {
      errors.push(`${src.name}: ${err.message}`);
      console.error(`✗ ${src.platform}:${src.name} → ${err.message}`);
    }
  }

  if (config.linkedin?.platform === 'apify-linkedin') {
    try {
      const jobs = await fetchApifyLinkedin(config.linkedin, prevById);
      all.push(...jobs);
      if (jobs.length) console.log(`✓ apify-linkedin → ${jobs.length} jobs`);
    } catch (err) {
      errors.push(`apify-linkedin: ${err.message}`);
      console.error(`✗ apify-linkedin → ${err.message}`);
    }
  }

  // Adzuna runs LAST so direct/official sources win the dedupe when keys are present.
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

  // Auto-translated titles (es/en/pt) — descriptions are never translated.
  await translateTitles(jobs);

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
