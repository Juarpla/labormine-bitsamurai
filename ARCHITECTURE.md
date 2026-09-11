# Labormin — Architecture

Labormin (a Bit SamurAI product) is the **Peru-first** mining-jobs hub: a
Spanish-only, static site for an aspirational Peruvian audience. Real listings
from public sources are filtered to a strict niche (PE → remote → abroad with
reported visa support) at ingest, ordered by that tier hierarchy, and monetized
with clearly-labeled native Google AdSense placements. The site also hosts
official-source visa pathways for Peruvians, hand-curated mining events, and
original guides/FAQ.

## 1. System overview

```
                  ┌──────────────────────────────────────────────┐
                  │  Public job sources (nicho: PE/CL/CA/US/AU)  │
                  │  • Greenhouse / Lever boards API             │
                  │  • Employer portals (SCC CAPPER, HiringRoom, │
                  │    SuccessFactors CSB, Oracle HCM, PageUp,   │
                  │    SmartRecruiters, Taleo RSS)               │
                  │  • Mining boards (Careermine, Brunel,        │
                  │    Globe 24-7, CA Mining, EmpleosMineros)    │
                  │  • LatAm boards (Computrabajo PE/CL,         │
                  │    Bumeran, Laborum — Navent API)            │
                  │  • Government (Job Bank Canada, fglo=1)      │
                  │  • Arbeitnow / Remotive / RemoteOK /         │
                  │    Adzuna (keyed, solo los 5 países)         │
                  │  • LinkedIn top-50 seed via Apify (keyed)    │
                  └────────────────────┬─────────────────────────┘
                                       │  scripts/ingest.mjs (node 22, keys optional)
                                       │  inNiche(): hard-hide fuera de los tiers
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │  src/data/jobs.json       normalized,        │
                  │  (committed to git)       deduped, 30-day TTL│
                  │  src/data/translation-cache.json (titles es) │
                  └────────────────────┬─────────────────────────┘
                                       │  GitHub Actions cron (daily 04:00 UTC)
                                       │  .github/workflows/refresh-jobs.yml
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │  Astro 7 static build    es único (raíz) +   │
                  │  + Cloudflare adapter    /jobs/[slug] × ~400 │
                  │                          /eventos, /guias,   │
                  │                          /faq, /terms, …     │
                  └────────────────────┬─────────────────────────┘
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │  Cloudflare Pages        es en la raíz;      │
                  │                          usuario fijo Perú;  │
                  │                          SSR: /api/translate- │
                  │                          description          │
                  └──────────────────────────────────────────────┘
```

Design principle: the site is **static-first**. The only on-demand route is
`/api/translate-description` (AI clear view). Freshness comes from rebuilding
the feed and the site on a schedule, not from runtime API calls.

## 2. Data model

Schemas live in `src/schemas.ts` (Zod) and are enforced at build time by
`src/lib/jobs.ts`.

### Job
| Field | Notes |
| --- | --- |
| `id` | source-prefixed: `gh-` `lv-` `an-` `rm-` `az-` `scc-` `hr-` `csb-` `orc-` `pu-` `cm-` `br-` `g7-` `cam-` `jb-` `pn-` `ct-` `nv-` `sr-` `ef-` `ag-` `em-` `li-` |
| `slug` | `company-title-country-id`, used for `/jobs/[slug]` |
| `company`, `companySlug` | normalized display + dedupe key |
| `source` | platform id (see §3) |
| `country` | ISO-2 of a niche country (PE/CL/CA/US/AU), else `GLOBAL` (remotes only) |
| `city`, `locationRaw` | split from source location string |
| `remote` | boolean |
| `visaReported` | keyword heuristic — surfaced as "reported", never guaranteed |
| `openToInternational?` | set for Job Bank `fglo=1` rows (government-declared international candidacy); surfaces as a badge and counts as tier 3 |
| `category` | `exploration · drill-blast · geology · hse · maintenance · processing · engineering · operations · other` |
| `salary` | `{min, max, currency, period}` or null (parsed heuristically) |
| `postedAt` | ISO date; **older than 30 days is dropped at ingest** |
| `url` | original posting — every UI path must link back here |
| `description` | sanitized HTML (tags stripped → entities decoded → paragraphs). Never translated at ingest; the view layer can render an on-demand AI "clear version" (see §4) |
| `translations?` | `{es,en,pt}` auto-translated **titles** with a visible "auto-translated" flag in the UI |

Dedupe key: `companySlug + normalized-title + country`. Stale cutoff: 30 days.
Titles cache: `src/data/translation-cache.json` (committed; keyed `"<lang>::<title>"`).

### Pathway (`src/data/pathways.json`, curated by hand)
| Field | Notes |
| --- | --- |
| `country` | destination (ISO-2) |
| `type` | `working-holiday · temporary · student · sponsorship · skilled` |
| `eligibleNationalities` | ISO-2 list, or **null = open to all** (sponsorship/student) |
| `ageRange`, `duration`, `workRights` | display-only in MVP (age *filtering* is phase 2) |
| `officialUrl` | **government source** — required |
| `lastVerifiedAt` | re-verify date — required, surfaced in UI |

Current seed (verified 2026-09-08/10): AU 462 / 417 / 482 / 500, CA IEC Working
Holiday + Young Professionals + TFWP + study-permit work, US H-2B, and **CL —
Vacaciones y Trabajo Alianza del Pacífico** (peruanos 18–30, hasta 12 meses;
verified 2026-09-10). `PathwaysView` filters to `eligibleNationalities ∋ PE` or
null at build time.

### Event (`src/data/events.json`, hand-curated — never scraped)
| Field | Notes |
| --- | --- |
| `mode` | `presencial` (Peru only) or `virtual` (Peru or the power countries) |
| `type` | `feria-laboral · expo · conferencia · webinar` |
| `date` | ISO start date; month-precision entries carry "por confirmar" in `notes` |
| `city`, `country` | display only |
| `officialUrl` | **official source — required**; events without one don't enter |
| `lastVerifiedAt` | re-verify date — required, surfaced in UI |

Feed (`src/data/events.json`) is curated by hand; CI never writes it.

## 3. Job sources (policy)

Every source must be **public and keyless** (JSON API, sitemap, RSS, or a
server-rendered public listing page). All ingestion is **read-only** (GET, or
POST only for keyless public search endpoints), sends a truthful
`LaborminBot/1.0` UA by default (browser UA only where a site filters short
UAs), and respects `robots.txt` and per-site crawl-delays. Config lives in
`src/data/companies.json`.

### Official/employer boards (keyless)

| Source | Platform/parser | Notes |
| --- | --- | --- |
| KoBold (+ DRC, Zambia), Blue Moon | Greenhouse API | |
| Elk Valley Resources | Lever API | |
| Southern Copper | `scc-capper` | ASP.NET page-method POST `{"tipo":19}` (empleo; becas excluded). postedAt = ingest date (kept alive while listed). Peru-only (SPCC Perú). |
| Chinalco Perú, Cerro Verde, Hochschild | `hiringroom` | SSR cards + `get_vacancy` detail; relative ages → approximate dates (30-day TTL applies) |
| Minsur, Codelco, Antamina, BHP, Freeport-McMoRan, Fortescue, Woodside, Teck, Kinross | `sapsf-csb` | SuccessFactors Career Site Builder: sitemap.xml (+lastmod) → microdata JobPosting. Kinross serves a Google-base RSS with descriptions |
| The Redpath Group, Barrick | `oracle-hcm` | Oracle Recruiting Cloud REST (`recruitingCEJobRequisitions`) + jobpostings sitemap for canonical URLs |
| MMG (Las Bambas) | `pageup` | SSR results + JSON-LD detail (crawl-delay 5s) |
| Anglo American | `smartrecruiters` | Public SmartRecruiters JSON API |
| Agnico Eagle | `taleo-rss` | Taleo custom job-list RSS (partial coverage) |

### Mining / LatAm / government boards (keyless)

| Source | Platform/parser | Notes |
| --- | --- | --- |
| Careermine | `jobiqo` | sitemap + JobPosting JSON-LD; bot-check cookie; **Crawl-delay 10s**; `/api/gmapi` is robots-disallowed and never used |
| Brunel | `brunel` | `/en/jobs/mining` facet + JSON-LD detail (mining filter applied) |
| Globe 24-7 | `globe247` | WP Job Manager list + JSON-LD detail |
| CA Mining | `camining` | Simple Job Board sitemap + HTML (mining filter; beware lookalike domain `caming.com` = pharma) |
| Job Bank Canada | `jobbank` | Government SSR; query `sort=M&fglo=1` (official international-candidates filter) → rows marked `openToInternational: true`; Crawl-delay 5s; expired postings skipped |
| Computrabajo (PE/CL) | `computrabajo` | SSR list (`-pN`) + JSON-LD JobPosting detail |
| Bumeran Perú, Laborum Chile | `navent` | **Keyless JSON `POST /api/avisos/searchV2`** with `x-site-id` + sitemap URL resolution. Undocumented API (documented exception); sitemap is the robots-clean fallback channel |
| EmpleosMineros.cl | `empleosmineros` | Keyless JSON API (low volume, low quality) |

### Aggregators & keyed sources

| Source | Platform | Notes |
| --- | --- | --- |
| Arbeitnow, Remotive, RemoteOK | generic | mining-keyword filtered; RemoteOK added 2026-09-10 to reinforce the remote tier |
| Adzuna | `optionalKeyed` | **nicho: PE/CL/CA/US/AU only**; runs LAST so official sources win dedupe |
| LinkedIn (top-50 MINING.COM seed) | `apify-linkedin` | **Guest-mode Apify actors** (`cheap_scraper` primary by company names; `kaix` cheaper-per-1k upgrade path when numeric company IDs are provided in `src/data/linkedin-company-ids.json`). No LinkedIn account/cookies involved. **Documented exception**: guest scraping of publicly-viewable job pages |
| Indeed | `apify-indeed` | `factden/indeed-jobs-scraper`, pay-per-result. Markets in priority order **PE → CL → CA → US → AU** (keywords `minería`+`mining` in PE/CL); cap 100 is the **total per-run budget** and each query gets the remaining budget, so PE/CL fill first. Country = search scope. Runs Tue+Thu |
| Seek (AU) | `apify-seek` | `epicscrapers/seek-job-scraper`, AU national keyword search. Search-result fields only (teaser + bullets, verbatim); URL built from the listing's own `roleId`/`id`. Runs Sat+Tue |
| Glassdoor (CA/US/AU) | `apify-glassdoor` | `blackfalcondata/glassdoor-job-scraper`, country-scoped keyword search. Only markets that exist on Glassdoor (21 markets — **no South Africa site**). Runs Wed+Sun |
| LLM chain (titles) | translations | optional; see §7 |

**Marketplace aggregation via Apify — deliberate ToS decision (2026-09-09).** Seek,
Indeed and Glassdoor prohibit direct scraping and their public APIs are closed, so
they are ingested **exclusively through guest-mode Apify pay-per-result actors**
(no accounts, no cookies, public listings only) — the same pattern already
documented for LinkedIn. Rationale: Labormin links out to the original posting;
no listing content is altered. Budget guard: all four Apify sources fit the
Apify **Free plan ($5/mo credits)** with caps of 170 (LinkedIn, Mon/Wed/Fri/Sun),
100 (Indeed, Tue/Thu), 200 (Seek, Sat+Tue) and 100 (Glassdoor, Wed+Sun) —
≈ $4.93/mo ceiling. Weekday scheduling via `LM_SOURCES` in `refresh-jobs.yml`.
Validation gate: if a marketplace returns 0 items consistently for 2 weeks, it is
disabled in `companies.json` and the actor choice revisited. Pause order if the
budget tightens: Seek, then Glassdoor.

### Performance guards
- `maxPerSource` (default 1500) + per-source `cap` protect `jobs.json` size.
- **Merge-from-previous**: sources that need per-job detail fetches reuse the
  stored description for known ids and only fetch new postings (critical for
  Careermine's 10s delay).
- `INGEST_FAST=<n>` env caps every source at n items (local smoke tests only).

### Deliberately out of scope
- **Careers24** (Apify-only + ToS explicitly prohibits scraping),
  **Antofagasta** (SuccessFactors RKP legacy, session-token JS), **Collahuasi**
  (Imperva WAF) — revisit as a paid Apify wave if ever needed.
- **Glassdoor ZA, Seek outside AU** — no such market/site exists on those
  boards; PE/CL marketplace coverage comes from Indeed + LinkedIn company seed.
- **PNet (ZA), Computrabajo MX, Vale (BR)** — removed 2026-09-10: single-country
  sources outside the niche (PE/CL/CA/US/AU).
- **Minería en Línea** — job board discontinued.
- **Never** fabricate listings to fill empty countries. Empty is honest; fake is fatal.

## 4. Personalization & i18n (removed — niche decision 2026-09-10)

- **Spanish only, user fixed to Peru.** `es` lives at the root; the /en and /pt
  route mirrors, the `/api/geo` edge route, the IP-based locale suggestion and
  the `lm-country` / `lm-nationality` / `lm-locale` localStorage keys were all
  removed. `DEFAULT_COUNTRY`/`DEFAULT_NATIONALITY` (`'PE'`, `src/lib/i18n.ts`)
  replace any runtime detection; stale keys in old visitors' browsers are ignored.
- The en/pt dictionaries in `src/i18n/ui.ts` stay dormant (typed, unused) for a
  future LatAm (Spanish-speaking) expansion; `Locale` is currently `'es'`.
- Job **titles** are auto-translated to **`es` only** at ingest via the
  multi-provider LLM chain (`src/lib/llm.js`, §7) and shown
  with a visible "auto-translated" badge + the original title. Job descriptions
  are not translated at ingest.
- **Description "clear view" (AI, on demand)** — `/api/translate-description`
  (server, `prerender = false`). The client POSTs the description HTML already on
  the page plus the target locale; one LLM call via the provider chain returns
  structured JSON
  (`summary`, `facts[{icon,label,value}]`, `sections[{heading,bullets}]`) which
  the route renders to deterministic escaped HTML (key-facts grid + bullet
  sections; icons from a fixed inline-SVG whitelist). It translates only when the
  source language differs from the locale. Cache: Cloudflare Cache API keyed by
  `lang + sha256(html)` + `Cache-Control: public, max-age=86400` in the browser;
  per-IP rate limit (~20/h). Safeguards: original description is the default
  view, a visible "generated with AI" badge + disclaimer are mandatory, a toggle
  restores the original, facts stay verbatim, and output is never written to
  `src/data/jobs.json` (view-layer only). Fail-open: any error → the UI keeps
  the original and shows a notice.
- Preference keys: none — the country context is fixed (Peru) at build time.

## 5. Tiered home

`HomeView.astro` renders server-rendered chapters with `Chapter.astro` (sticky
narrative column + reveal content column) in the niche hierarchy:

1. Hero — fixed Peru-first promise, CTAs to `/jobs` and `/visa-pathways`
2. *Minería en Perú* — top PE jobs (tier 1)
3. *Eventos mineros* — 3 next curated events → `/eventos`
4. *Remoto desde Perú* — remote jobs (tier 2)
5. *Minería en el extranjero* — tier-3 jobs (visa reported / international)
6. *Rutas de visa para peruanos* — PE-eligible pathways → `/visa-pathways`
7. *Kit del postulante* — guías + FAQ teaser → `/guias`, `/faq`
8. CTA → `/jobs`

Everything is static (SEO-safe); no client hydration beyond the JobDrawer index.
Motion: `IntersectionObserver` reveals (`.reveal` → `.is-visible`) with CSS
scroll-driven `animation-timeline: view()` as progressive enhancement; both
respect `prefers-reduced-motion`.

## 6. Ads (AdSense)

- `<AdSlot slotId format layoutKey size media />` — single component for all placements.
  Renders a real `adsbygoogle` unit only when `PUBLIC_ADSENSE_CLIENT` is set in
  production; otherwise a neutral labeled placeholder so layout is testable.
  Fixed-size units (`size`) emit AdSense fixed-size code; `media` gates the
  `adsbygoogle.push` call so a unit never requests an ad outside its breakpoint
  (nothing is hidden after serving).
- Placements: home (2), `/jobs` always-on slots outside the filterable grid (mobile/
  tablet: 320×50 above the filters + 320×100 after the list; desktop ≥lg: 970×90
  after the list; ≥1280px adds 160×600 side rails, sticky-bounded to the section so
  they release before the bottom ad and footer), `/jobs/[slug]`
  in-content, `/visa-pathways` (1), `/eventos` (1).
- **Policy constraints (non-negotiable):** every unit is labeled ("Ad" /
  "Anuncio" / "Anúncio"); units must not be designed to induce accidental clicks;
  ad density stays low. See DESIGN.md §6.
- AdSense site approval prerequisites shipped: privacy policy (with cookies
  disclosure), about, contact, `public/ads.txt` (replace placeholder publisher id).
- `/jobs/[slug]` pages emit `JobPosting` JSON-LD for Google Jobs eligibility.

## 7. Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `PUBLIC_ADSENSE_CLIENT` | no | `ca-pub-…` publisher id; absent → labeled placeholders |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | no | enables Adzuna country searches at ingest |
| `APIFY_TOKEN` | no | enables the Apify sources (`apify-linkedin` / `apify-indeed` / `apify-seek` / `apify-glassdoor`) via guest actors |
| `LM_SOURCES` | no | CI-only: comma list of Apify platforms to run; derived from the weekday by `refresh-jobs.yml` (empty/unset = run all, e.g. local dev) |
| `MISTRAL_API_KEY` / `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` / `OPENCODE_GO_API_KEY` | no | multi-provider LLM chain (`src/lib/llm.js`): auto-translates job titles at ingest and powers the on-demand description clear-view API. Failover order via `LLM_PROVIDER_ORDER` (default `MISTRAL_MODEL,WORKERS_AI_MODEL,OPENCODE_GO_MODEL`); models via `MISTRAL_MODEL` (`codestral-2508`) / `WORKERS_AI_MODEL` (`@cf/qwen/qwen3-30b-a3b-fp8`) / `OPENCODE_GO_MODEL` (`mimo-v2.5`); providers without credentials are skipped |
| `INGEST_FAST` | no | local only: caps every source at N items for fast smoke tests |

## 8. CI / deployment

- GitHub Actions (`refresh-jobs.yml`): daily `node scripts/ingest.mjs` (04:00 UTC),
  commits `src/data/jobs.json` if changed, push triggers the Cloudflare Pages Git
  build (or `CLOUDFLARE_DEPLOY_HOOK` secret as fallback). The paid Apify sources
  are spread across the week via a derived `LM_SOURCES` (see §3) — official/keyless
  sources and Adzuna run every day. `workflow_dispatch` accepts a `sources` input
  to override the weekday schedule for testing. Offline re-filter without
  re-fetching: `node scripts/ingest.mjs --prune` (nicho rules + TTL).
- Cloudflare Pages: framework preset Astro, Node 22. pnpm is pinned via
  `packageManager` in package.json (12.3.x); CI installs it automatically via
  `pnpm/action-setup`. On Cloudflare Pages set `PNPM_VERSION=12.3.4` in the
  environment if its default pnpm is older (the lockfile is `lockfileVersion 9.0`,
  readable by any pnpm ≥ 9).

## 9. Phase 2 roadmap

1. Apify wave for the excluded boards (Careers24, Antofagasta RKP, Collahuasi) —
   paid actors, deliberate ToS decision required
2. ~~Indeed pilot in "enrichment" mode~~ — superseded 2026-09-09: Indeed, Seek (AU)
   and Glassdoor ship as **full-feed** marketplace sources via Apify pay-per-result
   actors (see §3); the deliberate ToS decision is documented there
3. ~~Full job-description translation~~ — shipped as the on-demand AI clear view (`/api/translate-description`); possible follow-up: pre-warming popular descriptions in CI
4. Salary slider + active age filter in the pathways matrix
5. `/api/jobs` search endpoint (edge cache) if the client-side index outgrows memory
6. Email alerts by nationality/country
