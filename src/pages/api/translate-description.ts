export const prerender = false;

/* On-demand "clear view" for job descriptions: AI translation + restructure.
 * The client sends the description HTML already rendered on the page (keeps
 * jobs.json out of the Worker bundle). One LLM call via the multi-provider
 * chain (src/lib/llm.js — Mistral → Workers AI → OpenCode Go, env-driven)
 * returns structured JSON; the server renders deterministic, escaped HTML
 * (key-facts grid + bullet sections). Results are edge-cached by content hash
 * + lang and sent with a 24h browser cache. Fail-open: every error path
 * returns non-200 and the UI keeps showing the original description. */

/* NOTE: root-absolute import ('/src/lib/llm.js'), not '../lib/llm.js' — with
 * @astrojs/cloudflare (Astro 7.3), relative specifiers inside API routes fail
 * to resolve both in `astro dev` (workerd module runner) and `astro build`.
 * The Node-side consumer (scripts/ingest.mjs) imports the same file with its
 * explicit relative path. */
import { callProvider, extractJson, resolveChain, withFailover } from '/src/lib/llm.js';

const LANGS = new Set(['es', 'en', 'pt']);
const LANG_NAMES: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese' };
const MAX_HTML = 10_000;
const RATE_LIMIT_PER_HOUR = 20;
const LLM_TIMEOUT_MS = 60_000;
const CACHE_TTL = 60 * 60 * 24; // 24h — content is hash-keyed, so effectively immutable

type Provider = Awaited<ReturnType<typeof resolveChain>>[number];
type Chain = Provider[];

type Fact = { icon: string; label: string; value: string };
type Section = { heading: string; bullets: string[] };
type Clarity = { summary: string; facts: Fact[]; sections: Section[] };

const ICON_WHITELIST = [
  'location', 'salary', 'roster', 'contract', 'experience', 'schedule', 'benefits', 'generic',
] as const;

const ICONS: Record<string, string> = {
  location: '<path d="M12 21c-4-3.8-6-7-6-10a6 6 0 1 1 12 0c0 3-2 6.2-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
  salary: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5h.01M18 14.5h.01"/>',
  roster: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  contract: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15.5h5"/>',
  experience: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M3 12.5h18"/>',
  schedule: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
  benefits: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  generic: '<path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z"/>',
};

async function envGetter(): Promise<(key: string) => string | undefined> {
  // Astro 7 + @astrojs/cloudflare: bindings/secrets come from cloudflare:workers
  // (production + wrangler-driven dev). Plain Node dev falls back to process.env.
  let cfEnv: Record<string, string | undefined> | undefined;
  try {
    const cf = await import('cloudflare:workers');
    cfEnv = (cf as { env?: Record<string, string | undefined> }).env;
  } catch {
    /* not running in workerd */
  }
  return (key) => cfEnv?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : undefined);
}

const json = (obj: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* --- edge cache / rate limit (Cache API; unavailable in plain Node dev) --- */

async function cacheGet(key: string): Promise<Response | null> {
  try {
    if (typeof caches === 'undefined') return null;
    return await caches.default.match(key);
  } catch {
    return null;
  }
}

async function cachePut(key: string, res: Response): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    await caches.default.put(key, res);
  } catch {
    /* cache is best-effort */
  }
}

async function rateLimitOk(request: Request): Promise<boolean> {
  try {
    if (typeof caches === 'undefined') return true;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const key = new Request(`https://ratelimit.labormin.internal/v1/${ip}`);
    const cache = caches.default;
    const hit = await cache.match(key);
    const count = Number(await hit?.text()) || 0;
    if (count >= RATE_LIMIT_PER_HOUR) return false;
    await cache.put(
      key,
      new Response(String(count + 1), { headers: { 'cache-control': 'public, max-age=3600' } }),
    );
    return true;
  } catch {
    return true; // fail-open
  }
}

/* --- prompt --- */

function systemPrompt(lang: string): string {
  const name = LANG_NAMES[lang];
  return [
    `You rewrite mining job descriptions into a scannable structure. Write ALL text in ${name}.`,
    'Input: a JSON object {"description":"<html job description>"}.',
    'Output: ONLY a JSON object, no markdown fences, with this shape:',
    '{"summary": string, "facts": [{"icon": string, "label": string, "value": string}], "sections": [{"heading": string, "bullets": [string, ...]}]}.',
    `"summary" is 1-2 sentences capturing the role. "icon" must be one of: ${ICON_WHITELIST.join(', ')}.`,
    'Convert long prose into concise bullets grouped under 2-5 section headings (e.g. what you will do, requirements, benefits).',
    'Keep every fact from the original verbatim: never invent, never drop requirements, salary, location, roster or safety conditions. Omit facts (pay, perks) that are absent — do not guess.',
    'Output text must be plain text: no HTML tags, no markdown, no quotes around the object.',
  ].join(' ');
}

function clean(s: unknown, max: number): string {
  return typeof s === 'string' ? s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function parseClarity(raw: string): Clarity {
  const obj = JSON.parse(extractJson(raw));
  const summary = clean(obj?.summary, 400);
  const facts: Fact[] = Array.isArray(obj?.facts)
    ? obj.facts
        .slice(0, 8)
        .map((f: Record<string, unknown>) => ({
          icon: ICON_WHITELIST.includes(f?.icon as never) ? String(f.icon) : 'generic',
          label: clean(f?.label, 60),
          value: clean(f?.value, 160),
        }))
        .filter((f: Fact) => f.label && f.value)
    : [];
  const sections: Section[] = Array.isArray(obj?.sections)
    ? obj.sections
        .slice(0, 6)
        .map((s: Record<string, unknown>) => ({
          heading: clean(s?.heading, 120),
          bullets: Array.isArray(s?.bullets)
            ? s.bullets.slice(0, 12).map((b: unknown) => clean(b, 400)).filter(Boolean)
            : [],
        }))
        .filter((s: Section) => s.heading && s.bullets.length > 0)
    : [];
  if (!summary && facts.length === 0 && sections.length === 0) throw new Error('empty clarity');
  return { summary, facts, sections };
}

/* Fallback: ingest-style plain translation of the text runs (tags preserved). */

async function plainTranslate(html: string, lang: string, chain: Chain, log: (m: string) => void): Promise<string> {
  const name = LANG_NAMES[lang];
  const tokens = html.split(/(<[^>]*>)/);
  const texts = [...new Set(tokens.filter((t) => !t.startsWith('<') && t.trim().length > 1))];
  const map = new Map<string, string>();
  for (let i = 0; i < texts.length; i += 12) {
    const batch = texts.slice(i, i + 12);
    const out = await withFailover(
      chain,
      async (p: Provider) => {
        const raw = await callProvider(p, {
          messages: [
            {
              role: 'system',
              content: `You are a translator for mining job descriptions. Input: a JSON object {"texts":[...]}. Output: ONLY a JSON object {"translations":[...]} with one faithful translation per input item, in the same order, written in ${name}. Never add, drop or embellish information. Plain text only.`,
            },
            { role: 'user', content: JSON.stringify({ texts: batch }) },
          ],
          maxTokens: 3000,
          timeoutMs: LLM_TIMEOUT_MS,
        });
        const arr = JSON.parse(extractJson(raw))?.translations;
        if (!Array.isArray(arr) || arr.length !== batch.length) throw new Error('translation shape mismatch');
        return arr;
      },
      log,
    );
    batch.forEach((t, k) => map.set(t, String(out[k] || t).trim()));
  }
  return tokens.map((t) => (t.startsWith('<') ? t : (map.get(t) ?? t))).join('');
}

/* --- deterministic HTML rendering (everything escaped) --- */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function iconSvg(name: string): string {
  return (
    `<svg class="mt-0.5 h-4 w-4 shrink-0 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.generic}</svg>`
  );
}

function renderClarity(c: Clarity): string {
  const parts: string[] = ['<div class="not-prose">'];
  if (c.summary) {
    parts.push(`<p class="text-base leading-relaxed text-graphite-100">${esc(c.summary)}</p>`);
  }
  if (c.facts.length) {
    parts.push('<div class="mt-4 grid gap-2 sm:grid-cols-2">');
    for (const f of c.facts) {
      parts.push(
        `<div class="flex items-start gap-2.5 rounded-lg border border-graphite-700 bg-graphite-850 p-3">` +
          iconSvg(f.icon) +
          `<span class="min-w-0"><span class="block text-[10px] font-medium uppercase tracking-wide text-graphite-400">${esc(f.label)}</span>` +
          `<span class="block text-sm text-graphite-100">${esc(f.value)}</span></span></div>`,
      );
    }
    parts.push('</div>');
  }
  for (const s of c.sections) {
    parts.push(`<h3 class="mt-5 font-display text-lg font-semibold text-graphite-100">${esc(s.heading)}</h3>`);
    parts.push(
      '<ul class="mt-2 space-y-1.5">' +
        s.bullets
          .map(
            (b) =>
              `<li class="flex gap-2"><span class="mt-0.5 shrink-0 text-brand-500" aria-hidden="true">▸</span><span class="text-sm leading-relaxed text-graphite-200">${esc(b)}</span></li>`,
          )
          .join('') +
        '</ul>',
    );
  }
  parts.push('</div>');
  return parts.join('');
}

async function generate(html: string, lang: string, chain: Chain, log: (m: string) => void): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt(lang) },
    { role: 'user', content: JSON.stringify({ description: html }) },
  ];
  try {
    // One attempt per provider in chain order; invalid model JSON counts as a
    // failure and falls through to the next provider.
    return await withFailover(
      chain,
      async (p: Provider) =>
        renderClarity(parseClarity(await callProvider(p, { messages, maxTokens: 2000, timeoutMs: LLM_TIMEOUT_MS }))),
      log,
    );
  } catch (err) {
    console.error('clarity structured generation failed:', err);
  }
  /* Rare: every provider failed to produce valid structured output. Last
   * resort: ingest-style plain translation of the text runs (tags preserved). */
  return plainTranslate(html, lang, chain, log);
}

/* --- handler --- */

export async function POST({ request }: { request: Request }) {
  let body: { html?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const html = typeof body.html === 'string' ? body.html : '';
  const lang = typeof body.lang === 'string' ? body.lang : '';
  if (!LANGS.has(lang)) return json({ error: 'invalid lang' }, 400);
  if (!html || html.length > MAX_HTML) return json({ error: 'invalid html' }, 400);

  if (!(await rateLimitOk(request))) return json({ error: 'rate limited' }, 429);

  const cacheKey = `https://clarity.labormin.internal/v1/${lang}/${await sha256(`${lang}::${html}`)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const log = (m: string) => console.error(m);
  const chain = resolveChain(await envGetter(), log);
  if (chain.length === 0) return json({ error: 'no LLM provider configured' }, 503);

  let out: string;
  try {
    out = await generate(html, lang, chain, log);
  } catch (err) {
    console.error('description clarity failed:', err);
    return json({ error: 'generation failed' }, 502);
  }

  const res = json({ html: out }, 200, { 'cache-control': `public, max-age=${CACHE_TTL}` });
  await cachePut(cacheKey, res.clone());
  return res;
}
