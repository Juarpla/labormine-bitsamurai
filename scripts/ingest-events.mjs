#!/usr/bin/env node
/**
 * Ingesta semanal de eventos de reclutamiento minero → src/data/events-scraped.json
 * (sección "Ferias y reclutamiento" de /eventos, con badge "Agregado automáticamente").
 *
 * Fuentes (verificadas 2026-09-11 — ver docs/MINING-DATA-SOURCES.md):
 *  1) Webs oficiales de las 4 ferias grandes (EXPOMINA, PERUMIN, CONAMIN,
 *     proEXPLO): fetch HTTPS directo keyless (0 costo). JSON-LD "Event" +
 *     regex de fechas en español sobre el texto de la página. Solo entra una
 *     fecha COMPLETA (YYYY-MM-DD); la frase hallada va a notes. Fallback por
 *     sitio si bloquea bots: actor apify/cheerio-scraper (centavos de compute).
 *  2) Facebook, PUBLICACIONES de páginas curadas (universidades + mineras con
 *     operaciones en Perú): actor apify~facebook-posts-scraper (~$5–8/1k,
 *     startUrls + resultsLimit + onlyPostsNewerThan; sin login). Solo entra
 *     un post que ANUNCIA UN EVENTO FECHADO (feria/charla): primera fecha
 *     completa futura del texto vía regex; la frase va verbatim a notes.
 *     FB bloqueó su búsqueda anónima el 2026-08-01, pero los posts de páginas
 *     públicas y la búsqueda de posts siguen funcionando vía actores.
 *  3) Facebook, BÚSQUEDA de publicaciones por keyword:
 *     actor easyapi~facebook-posts-search-scraper ($2.99/1k, searchQuery +
 *     maxPosts; 4.33★, 100% corridas OK). Mismo parser y filtros. Grupos
 *     públicos: fase 2 (requiere validar ruido aparte).
 *
 * Presupuesto (Apify Free plan $5/mes): los actores de jobs ya reservan
 * ≈$2.09/mo (linkedin/indeed/seek). CAP_FB=30 eventos/corrida semanal a
 * $13/1k ≈ $1.56/mo + centavos del fallback cheerio. Puerta de validación a
 * 2 semanas: si el volumen decepciona, ajustar cap/actores aquí (swap de 1
 * línea — los IDs de actor son constantes).
 *
 * Reglas duras:
 *  - Nada se inventa: título verbatim de la fuente (sin traducción), fecha
 *    solo si la fuente la declara completa. Sin fecha futura → no entra.
 *  - El seed curado (src/data/events.json) SIEMPRE gana el dedup: título
 *    normalizado + fecha iguales, o host de officialUrl igual.
 *  - Si TODAS las fuentes fallan se conserva el archivo anterior y exit 1
 *    (patrón ingest-stocks). Una fuente que falla sola solo quita sus aportes.
 *  - zod valida antes de escribir (mantener en sync con src/schemas.ts
 *    ScrapedEventSchema; el build re-parsea y es la última instancia).
 *
 * Env: APIFY_TOKEN (habilita las fuentes 2 y 3; la 1 es keyless y corre igual).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'src/data/events-scraped.json');
const CURATED = path.join(ROOT, 'src/data/events.json');
const TODAY = new Date().toISOString().slice(0, 10);

/** Techo TOTAL de eventos de Facebook por corrida (presupuesto free plan).
 *  Split: las páginas curadas tienen prioridad pero la búsqueda por keyword
 *  siempre reserva su parte (datos reales 2026-09-11: 6 páginas devolvieron
 *  35 posts en 6 meses — prioridad estricta mataría el canal keyword). */
const CAP_FB = 30;
const CAP_FB_PAGES = 20;
/** Días de gracia antes de podar un evento pasado del archivo. */
const TTL_GRACE_DAYS = 14;

/** _comment que cada corrida escribe de nuevo en el archivo (documentación
 *  de confianza siempre visible junto a los datos). */
const FILE_COMMENT =
  "Sección 'Ferias y reclutamiento': eventos detectados automáticamente por scripts/ingest-events.mjs (webs oficiales de las ferias grandes + publicaciones de Facebook que anuncian un evento fechado). NUNCA se inventa: solo entra lo que la fuente devolvió con fecha completa y futura; en los posts el título es la primera línea del texto verbatim y la frase de la fecha va a notes. Nivel de confianza menor que src/data/events.json (curado a mano): la UI siempre muestra el badge 'Agregado automáticamente' y el CTA 'verificar con el organizador'. El seed curado siempre gana el dedup (título normalizado + fecha, u host de officialUrl). TTL: el script poda lo pasado (endDate/date < hoy − 14 días).";

// ── Seeds curados (extender aquí; nunca se inventa contenido de eventos) ────

/** Webs oficiales de las ferias grandes (watcher semanal). city curado y
 *  verificado contra la web oficial el 2026-09-11. */
const SITES_SEED = [
  { id: 'expomina', name: 'EXPOMINA PERÚ', url: 'https://expominaperu.com/', city: 'Lima' },
  { id: 'perumin', name: 'PERUMIN', url: 'https://www.perumin.com/', city: 'Arequipa' },
  { id: 'conamin', name: 'CONAMIN', url: 'https://conamin.ciplima.org.pe/', city: 'Trujillo' },
  { id: 'proexplo', name: 'proEXPLO', url: 'https://proexplo.com.pe/es', city: 'Lima' },
];

/** IDs de actor swap-ables (formato username~actor-name, convención del repo;
 *  puerta de validación a 2 semanas). Precio verificado 2026-09-11:
 *  apify~facebook-posts-scraper ≈$5–8/1k posts (4.64★, 108k usuarios);
 *  powerai~facebook-post-search-scraper $4.99/1k (210k corridas; prueba en
 *  vivo con resultados reales de Perú — easyapi resultó muerto: 0 items hasta
 *  para 'empleo'). powerai exige maxResults ≥ 10. */
const FB_POSTS_ACTOR = 'apify~facebook-posts-scraper';
const FB_POST_SEARCH_ACTOR = 'powerai~facebook-post-search-scraper';
/** Ventana de escaneo de posts por página (el actor puede ir más atrás). */
const FB_POSTS_WINDOW = '6 months';

/** Páginas de Facebook del nicho (instituciones académicas + mineras con
 *  operaciones en Perú) — se rastrean sus PUBLICACIONES (no eventos). Slugs
 *  verificados por HTTP 200 el 2026-09-11. Extender aquí (patrón
 *  COMPANIES_SEED de ingest-stocks). */
const FB_PAGES_SEED = [
  { url: 'https://www.facebook.com/senati', label: 'SENATI' },
  { url: 'https://www.facebook.com/tecsup', label: 'TECSUP' },
  { url: 'https://www.facebook.com/antaminaperu', label: 'Antamina' },
  { url: 'https://www.facebook.com/cerroverdeperu', label: 'Cerro Verde' },
  { url: 'https://www.facebook.com/NexaResources', label: 'Nexa Resources' },
  { url: 'https://www.facebook.com/BuenaventuraPeru', label: 'Buenaventura' },
];

const FB_KEYWORDS = ['feria laboral minería', 'convocatoria minera', 'feria de empleo minera'];

/** Ciudades/departamentos/minas peruanas para filtrar eventos de keywords. */
const PERU_RE =
  /\b(per[uú]|lima|arequipa|trujillo|cajamarca|cusco|cuzco|tacna|moquegua|ica|chimbote|huaraz|pasco|huancayo|abancay|piura|chiclayo|puno|ayacucho|huancavelica|callao|iquitos|pucallpa|juliaca|tarapoto|la\s+libertad|áncash|ancash|apurímac|apurimac|antamina|cerro\s+verde|las\s+bambas|quellaveco|yanacocha|buenaventura|marcona|toromocho|constancia)\b/i;

// ── Schema (mantener en sync con src/schemas.ts — ScrapedEventSchema) ───────

const ScrapedEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  mode: z.enum(['presencial', 'virtual']),
  type: z.enum(['feria-laboral', 'expo', 'conferencia', 'webinar', 'otro']),
  country: z.string(),
  city: z.string().nullable(),
  date: z.string(),
  endDate: z.string().optional(),
  officialUrl: z.string().url(),
  organizer: z.string().nullable(),
  source: z.enum(['web-oficial', 'facebook-post']),
  scrapedAt: z.string(),
  lastSeenAt: z.string(),
  notes: z.string().optional(),
});
const ScrapedEventFileSchema = z.object({
  generatedAt: z.string(),
  events: z.array(ScrapedEventSchema),
});

// ── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** GET con reintentos y backoff ante 429/5xx (patrón ingest-stocks). */
async function fetchText(url, retries = 3) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      if ((res.status === 429 || res.status >= 500) && i < retries) {
        await sleep([4000, 9000, 15000][i] ?? 15000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i < retries && !(e instanceof Error && /HTTP 4/.test(e.message))) {
        await sleep([4000, 9000, 15000][i] ?? 15000);
        continue;
      }
      throw e;
    }
  }
}

/** Corrida síncrona de un actor → items del dataset (patrón ingest.mjs).
 *  Un reintento ante fallo de red (el endpoint bloquea hasta 300 s por corrida). */
async function runApifyActor(actorId, input, timeoutMs = 330000) {
  const token = process.env.APIFY_TOKEN;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=300`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(timeoutMs),
        }
      );
      if (!res.ok) throw new Error(`Apify ${actorId}: HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || [];
    } catch (e) {
      const networkErr = e instanceof TypeError || /fetch failed|aborted|timeout/i.test(String(e.message));
      if (attempt < 1 && networkErr) {
        console.log(`  · ${actorId} falla de red (${e.message}) — reintento en 10s`);
        await sleep(10000);
        continue;
      }
      throw e;
    }
  }
}

/** Normaliza título para dedup — idéntico a normEventTitle de src/lib/events-scraped.ts */
function normTitle(t) {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isoDay(v) {
  if (!v) return null;
  const s = String(v);
  let m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function inferType(text) {
  const t = String(text).toLowerCase();
  if (/\bwebinar\b|\ben línea\b|\ben linea\b|\bvirtual\b|online/.test(t)) return 'webinar';
  if (/feria\s+(laboral|de\s+empleo)|bolsa\s+de\s+trabajo|reclut|\bempleo\b|career\s*fair|jornada\s+de\s+empleo/.test(t))
    return 'feria-laboral';
  if (/expo|exposición|exposicion|\bferia\b/.test(t)) return 'expo';
  if (/congreso|convención|convencion|conferencia|seminario|foro/.test(t)) return 'conferencia';
  return 'otro';
}

function pageTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, setiembre: 9, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};
const MONTH_RE = Object.keys(MONTHS).join('|');
/** "del 15 al 19 de junio de 2026" · "4-6 de mayo 2026" · "may 4–6, 2026" */
const DATE_RE = new RegExp(
  `(\\d{1,2})(?:\\s*(?:al|a|y|-|–|—|to|hasta)\\s*(\\d{1,2}))?\\s+(?:de\\s+)?(${MONTH_RE})\\b\\s*,?\\s*(?:de\\s+|del\\s+)?(20\\d{2})`,
  'gi'
);

/** Extrae {start,end,phrase} de la PRIMERA fecha completa del texto (mes por
 *  nombre incluido). Sin día+mes+año explícitos devuelve null — nunca se
 *  publica una fecha inventada o parcial. */
function firstFullDate(text) {
  DATE_RE.lastIndex = 0;
  let m;
  while ((m = DATE_RE.exec(String(text))) !== null) {
    const d1 = parseInt(m[1], 10);
    const month = MONTHS[m[3].toLowerCase()];
    const year = parseInt(m[4], 10);
    if (!month || year < 2024 || d1 < 1 || d1 > 31) continue;
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${year}-${pad(month)}-${pad(d1)}`;
    const end = m[2] ? `${year}-${pad(month)}-${pad(parseInt(m[2], 10))}` : null;
    return { start, end: end && end > start ? end : null, phrase: m[0].trim() };
  }
  return null;
}

/** Eventos JSON-LD (schema.org/Event) embebidos en la página. */
function jsonLdEvents(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : [j, ...(j['@graph'] ?? [])];
    for (const n of nodes.flat()) {
      if (n && typeof n === 'object' && String(n['@type'] ?? '').toLowerCase().includes('event')) {
        out.push(n);
      }
    }
  }
  return out;
}

// ── Dedup vs seed curado (el curado SIEMPRE gana) ───────────────────────────

const curatedKeys = new Set();
const curatedHosts = new Set();
try {
  const cur = JSON.parse(fs.readFileSync(CURATED, 'utf8'));
  for (const e of cur.events ?? []) {
    curatedKeys.add(`${normTitle(e.title)}|${e.date}`);
    try {
      curatedHosts.add(new URL(e.officialUrl).host.replace(/^www\./, ''));
    } catch { /* URL curada inválida: ignorar para dedup */ }
  }
} catch { /* sin seed curado: no hay con qué chocar */ }

function isDuplicateOfCurated(title, date, url) {
  if (curatedKeys.has(`${normTitle(title)}|${date}`)) return true;
  try {
    return curatedHosts.has(new URL(url).host.replace(/^www\./, ''));
  } catch {
    return false;
  }
}

// ── Fuente 1: webs oficiales de las 4 ferias grandes ────────────────────────

async function fetchSiteText(site) {
  try {
    return { html: await fetchText(site.url), via: 'directo' };
  } catch (e) {
    if (!process.env.APIFY_TOKEN) throw e;
    console.log(`  · ${site.id} directo falló (${e.message}) — fallback apify/cheerio-scraper`);
    const items = await runApifyActor('apify~cheerio-scraper', {
      startUrls: [{ url: site.url }],
      maxRequestsPerCrawl: 3,
      pageFunction:
        'async function pageFunction(context) { const { $, request } = context; return { url: request.url, html: $.html() }; }',
    });
    const it = Array.isArray(items) ? items[0] : null;
    if (!it?.html) throw new Error(`cheerio-scraper sin HTML para ${site.id}`);
    return { html: it.html, via: 'apify-cheerio' };
  }
}

async function fetchOfficialSites() {
  const out = [];
  const siteErrors = [];
  for (const site of SITES_SEED) {
    try {
      const { html, via } = await fetchSiteText(site);
      let count = 0;
      // 1a) JSON-LD Event con startDate completa
      for (const ld of jsonLdEvents(html)) {
        const start = isoDay(ld.startDate);
        const end = isoDay(ld.endDate);
        const title = typeof ld.name === 'string' ? ld.name.trim() : null;
        if (!start || !title || start < TODAY) continue;
        if (isDuplicateOfCurated(title, start, ld.url || site.url)) continue;
        out.push(
          ScrapedEventSchema.parse({
            id: `web-${site.id}-${start}`,
            title,
            mode: 'presencial',
            type: inferType(title),
            country: 'PE',
            city: site.city,
            date: start,
            ...(end && end > start ? { endDate: end } : {}),
            officialUrl: /^https?:\/\//.test(String(ld.url ?? '')) ? String(ld.url) : site.url,
            organizer: null,
            source: 'web-oficial',
            scrapedAt: TODAY,
            lastSeenAt: TODAY,
            notes: `Detectado en la web oficial (${via}).`,
          })
        );
        count++;
      }
      // 1b) Regex de fechas en el texto visible (con y sin JSON-LD)
      if (count === 0) {
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z#0-9]+;/gi, ' ')
          .replace(/\s+/g, ' ');
        const hit = firstFullDate(text);
        const title = pageTitle(html);
        if (hit && hit.start >= TODAY && title) {
          if (!isDuplicateOfCurated(title, hit.start, site.url)) {
            out.push(
              ScrapedEventSchema.parse({
                id: `web-${site.id}-${hit.start}`,
                title,
                mode: 'presencial',
                type: inferType(title),
                country: 'PE',
                city: site.city,
                date: hit.start,
                ...(hit.end ? { endDate: hit.end } : {}),
                officialUrl: site.url,
                organizer: null,
                source: 'web-oficial',
                scrapedAt: TODAY,
                lastSeenAt: TODAY,
                notes: `Detectado en la web oficial (${via}): «${hit.phrase.slice(0, 200)}»`,
              })
            );
            count++;
          }
        }
      }
      console.log(`✓ web:${site.id} → ${count} eventos (${via})`);
    } catch (e) {
      // Un sitio caído solo quita su aporte; solo es fallo de la fuente si
      // TODOS los sitios fallan.
      console.error(`✗ web:${site.id} → ${e.message}`);
      siteErrors.push(`${site.id}: ${e.message}`);
    }
    await sleep(1500);
  }
  if (siteErrors.length && siteErrors.length === SITES_SEED.length) {
    throw new Error(`todos los sitios fallaron (${siteErrors.join(' | ')})`);
  }
  return out;
}

// ── Fuente 2/3: Facebook publicaciones (páginas curadas + búsqueda), cap ────

/** Señal de nicho (minera/laboral) en el TEXTO del post. */
const KEYWORD_TITLE_RE =
  /(miner|minera|miner[íi]a|\bmina\b|met[áa]lic|laboral|\bempleo\b|reclut|convocatoria|bolsa\s+de\s+trabajo|career\s*fair|geol)/i;

/** Señal de EVENTO en el texto: un post que solo es convocatoria de trabajo
 *  ("postula hasta el 30/09", régimen 20x10) NO es un evento y NO entra
 *  (decisión 2026-09-11: las convocatorias-posting son dominio del feed de
 *  jobs). Feria/charla/jornada/congreso/inscripciones sí son señal de evento. */
const EVENT_RE =
  /(feria|charla|jornada|expo\b|exposici|congreso|convención|convencion|webinar|seminario|career\s*fair|open\s*day|reclutamiento|inscripciones?)/i;

/** Campos tolerantes sobre el post crudo (patrón parseApifyItem de ingest.mjs).
 *  Los posts NO tienen título: el título es la primera línea del texto,
 *  verbatim, truncada a 200 chars (regla documentada — no es contenido
 *  inventado). La fecha del evento sale del texto vía regex: sin fecha
 *  completa futura el post NO entra (nunca se inventa). */
function parseFbPostItem(it) {
  const text = String(it.text ?? it.message ?? '').trim();
  const url = String(it.url ?? it.topLevelUrl ?? '');
  if (!text || !/^https?:\/\//.test(url)) return null;
  if (!KEYWORD_TITLE_RE.test(text)) return null; // señal de nicho
  if (!EVENT_RE.test(text)) return null; // señal de EVENTO (no job-call)
  // Gate Perú: virtual permitido; presencial exige señal Perú en el texto.
  const isVirtual = /virtual|online|en línea|en linea/i.test(text);
  if (!isVirtual && !PERU_RE.test(text)) return null;
  const hit = firstFullDate(text);
  if (!hit || hit.start < TODAY) return null; // sin fecha completa futura → no entra
  const title = text.split(/\n+/)[0].trim().slice(0, 200) || text.slice(0, 200);
  return {
    title,
    url,
    postId: String(it.postId ?? it.postFacebookId ?? ''),
    date: hit.start,
    endDate: hit.end,
    phrase: hit.phrase,
    isVirtual,
    organizer: it.pageName ?? it.user?.name ?? null,
    text,
  };
}

function cityFrom(loc) {
  if (!loc) return null;
  const m = loc.match(PERU_RE);
  if (!m) return null;
  const word = m[0];
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function scrapeEventsFromPosts(items) {
  // El mismo post puede llegar por páginas Y por búsqueda → dedupe por id/URL.
  const seen = new Set();
  const accepted = [];
  for (const raw of items) {
    const url = String(raw.url ?? raw.topLevelUrl ?? '');
    const key = String(raw.postId ?? raw.postFacebookId ?? '') || url;
    if (key && seen.has(key)) continue;
    const p = parseFbPostItem(raw);
    if (!p) continue;
    if (key) seen.add(key);
    if (isDuplicateOfCurated(p.title, p.date, p.url)) continue;
    const candidate = ScrapedEventSchema.safeParse({
      id: `fbp-${(p.postId || p.url).replace(/[^a-z0-9]+/gi, '-').slice(-60)}`,
      title: p.title,
      mode: p.isVirtual ? 'virtual' : 'presencial',
      type: inferType(p.text),
      country: 'PE',
      city: p.isVirtual ? null : cityFrom(p.text),
      date: p.date,
      ...(p.endDate && p.endDate > p.date ? { endDate: p.endDate } : {}),
      officialUrl: p.url,
      organizer: p.organizer,
      source: 'facebook-post',
      scrapedAt: TODAY,
      lastSeenAt: TODAY,
      notes: `Detectado en publicación de Facebook${p.organizer ? ` de ${p.organizer}` : ''}: «${p.phrase.slice(0, 200)}»`,
    });
    if (candidate.success) accepted.push(candidate.data);
    else console.warn(`WARNING post FB inválido (${candidate.error.issues[0]?.path?.join('.') ?? '?'}) — descartado`);
  }
  return accepted;
}

/** remaining = pool GLOBAL; cap = tope de este canal. El budget devuelto
 *  descuenta del pool global para que la búsqueda siempre reciba su parte. */
async function fetchFbPagePosts(remaining, cap) {
  if (!process.env.APIFY_TOKEN) {
    console.log('ℹ Facebook (posts de páginas) skipped (set APIFY_TOKEN to enable)');
    return { items: [], ok: true, skipped: true, budget: remaining };
  }
  const n = Math.min(remaining, cap);
  if (n <= 0) return { items: [], ok: true, budget: remaining };
  const items = await runApifyActor(FB_POSTS_ACTOR, {
    startUrls: FB_PAGES_SEED.map((p) => ({ url: p.url })),
    resultsLimit: n,
    onlyPostsNewerThan: FB_POSTS_WINDOW,
  });
  // El actor puede ignorar resultsLimit (35 con cap 30 en la prueba real):
  // recortar al presupuesto para que la cuenta nunca quede negativa.
  const capped = items.slice(0, n);
  console.log(
    `✓ fb-posts-pages → ${capped.length}/${items.length} posts (budget left ${Math.max(remaining - capped.length, 0)})`
  );
  return { items: capped, ok: true, budget: remaining - capped.length };
}

/** Búsqueda de publicaciones por keyword (factura por post; el cap cuenta
 *  posts raw). Los 3 keywords del seed se ejecutan en orden de prioridad.
 *  powerai exige maxResults ≥ 10 → el canal solo corre con presupuesto ≥ 10.
 *  La búsqueda puede devolver posts de grupos públicos; el gate EVENT_RE +
 *  Perú decide qué entra (fase 2 = rastrear grupos específicos). */
async function fetchFbPostSearch(remaining, cap) {
  if (!process.env.APIFY_TOKEN) {
    console.log('ℹ Facebook (búsqueda de posts) skipped (set APIFY_TOKEN to enable)');
    return { items: [], ok: true, skipped: true, budget: remaining };
  }
  const n = Math.min(remaining, cap);
  if (n < 10) {
    console.log(`ℹ Facebook (búsqueda de posts) necesita presupuesto ≥ 10 (tiene ${n})`);
    return { items: [], ok: true, budget: remaining };
  }
  const items = [];
  let spent = 0;
  for (const kw of FB_KEYWORDS) {
    if (spent >= n) break;
    // FB raciona la búsqueda y el actor "termina OK" con 0 items (probado en
    // vivo 2026-09-11). Las corridas vacías NO facturan (pay-per-result) →
    // un reintento es gratis y recupera corridas racionadas.
    let batch = [];
    for (let attempt = 0; ; attempt++) {
      batch = await runApifyActor(FB_POST_SEARCH_ACTOR, {
        query: kw,
        maxResults: Math.max(10, Math.min(n - spent, 30)),
      });
      if (batch.length > 0 || attempt >= 1) break;
      console.log(`  · "${kw}" devolvió 0 (FB raciona la búsqueda) — reintento en 15s`);
      await sleep(15000);
    }
    spent += batch.length;
    items.push(...batch);
    console.log(`✓ fb-posts-search:"${kw}" → ${batch.length} posts (budget left ${Math.max(remaining - spent, 0)})`);
  }
  return { items, ok: true, budget: remaining - spent };
}

// ── Ejecución ───────────────────────────────────────────────────────────────

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const cutoff = new Date(Date.now() - TTL_GRACE_DAYS * 86400000).toISOString().slice(0, 10);

// Merge: el existente aporta scrapedAt (primera captura); el nuevo aporta datos frescos.
const byId = new Map((prev?.events ?? []).map((e) => [e.id, e]));
const byUrl = new Map((prev?.events ?? []).map((e) => [e.officialUrl, e]));

function upsert(events, candidate) {
  const prevEvent = byId.get(candidate.id) ?? byUrl.get(candidate.officialUrl);
  if (prevEvent) {
    events.push({ ...candidate, scrapedAt: prevEvent.scrapedAt ?? TODAY, lastSeenAt: TODAY });
    byId.delete(prevEvent.id);
    byUrl.delete(prevEvent.officialUrl);
  } else {
    events.push(candidate);
  }
}

let okSources = 0;
const errors = [];

// Fuente 1 — webs oficiales (keyless, 0 costo; política: si falla, solo quita su aporte)
let officialEvents = [];
try {
  officialEvents = await fetchOfficialSites();
  okSources++;
} catch (e) {
  errors.push(`webs-oficiales: ${e.message}`);
  console.error(`✗ fuente webs-oficiales completa → ${e.message}`);
}

// Fuente 2/3 — Facebook publicaciones (cap compartido; un throw por actor no mata a la otra)
let fbRemaining = CAP_FB;
const fbPostRaw = [];
const FB_SOURCES = [
  ['fb-posts-pages', fetchFbPagePosts, CAP_FB_PAGES], // páginas: prioridad, cap propio
  ['fb-posts-keywords', fetchFbPostSearch, Infinity], // búsqueda: llena el resto
];
for (const [name, fn, cap] of FB_SOURCES) {
  try {
    const r = await fn(fbRemaining, cap);
    fbRemaining = r.budget;
    if (!r.skipped) {
      okSources++;
      fbPostRaw.push(...(r.items ?? []));
    }
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
    console.error(`✗ ${name} → ${e.message}`);
  }
}

// Si NO hubo ninguna fuente operativa: conservar archivo anterior y salir en rojo.
if (okSources === 0) {
  console.error('ERROR: ninguna fuente respondió — se conserva el archivo anterior sin cambios.');
  process.exit(1);
}

const merged = [];
for (const e of officialEvents) upsert(merged, e);
for (const e of scrapeEventsFromPosts(fbPostRaw)) upsert(merged, e);

// TTL: podar lo pasado (endDate/date < hoy − gracia)
const filtered = merged
  .filter((e) => (e.endDate ?? e.date) >= cutoff)
  .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

const out = { _comment: FILE_COMMENT, generatedAt: new Date().toISOString(), events: filtered };

// Validación dura antes de escribir (el build re-parsea con src/schemas.ts);
// _comment es documentación, no parte del schema → se valida sin él.
const { _comment: _c, ...outValidatable } = out;
const parsed = ScrapedEventFileSchema.safeParse(outValidatable);
if (!parsed.success) {
  console.error('ERROR: el resultado no valida contra el schema — se conserva el archivo anterior.');
  console.error(parsed.error.message);
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `Escrito: ${path.relative(ROOT, OUT)} (${filtered.length} eventos${
    errors.length ? ` · errores parciales: ${errors.join(' | ')}` : ''
  })`
);
