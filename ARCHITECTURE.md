# Labormine — Architecture

Labormine (a Bit SamurAI product) is a global mining-jobs hub. It presents real,
publicly-sourced mining job listings through a scroll-driven narrative, filters by
nationality context (home country → visa-eligible → remote), and monetizes with
clearly-labeled native Google AdSense placements.

## 1. System overview

```
                 ┌──────────────────────────────────────────────┐
                 │  Public job sources                          │
                 │  • Greenhouse / Lever boards API             │
                 │  • Employer portals (SCC CAPPER, HiringRoom, │
                 │    SuccessFactors CSB, Oracle HCM, PageUp,   │
                 │    SmartRecruiters, Eightfold, Taleo RSS)    │
                 │  • Mining boards (Careermine, Brunel,        │
                 │    Globe 24-7, CA Mining, EmpleosMineros)    │
                 │  • LatAm boards (Computrabajo, Bumeran,      │
                 │    Laborum — Navent API)                     │
                 │  • Government (Job Bank Canada) / PNet       │
                 │  • Arbeitnow / Remotive / Adzuna (keyed)     │
                 │  • LinkedIn top-50 seed via Apify (keyed)    │
                 └────────────────────┬─────────────────────────┘
                                      │  scripts/ingest.mjs (node 22, keys optional)
                                      ▼
                 ┌──────────────────────────────────────────────┐
                 │  src/data/jobs.json       normalized,        │
                 │  (committed to git)       deduped, 30-day TTL│
                 │  src/data/translation-cache.json (titles)    │
                 └────────────────────┬─────────────────────────┘
                                      │  GitHub Actions cron (daily 04:00 UTC)
                                      │  .github/workflows/refresh-jobs.yml
                                      ▼
                 ┌──────────────────────────────────────────────┐
                 │  Astro 7 static build    3 locales ×         │
                 │  + Cloudflare adapter    (home, /jobs,       │
                 │                          /jobs/[slug], …)    │
                 └────────────────────┬─────────────────────────┘
                                      ▼
                 ┌──────────────────────────────────────────────┐
                 │  Cloudflare Pages        root = es (default),│
                 │                          /en, /pt            │
                 │                          edge: /api/geo       │
                 └──────────────────────────────────────────────┘
```

Design principle: the site is **static-first**. The only on-demand route is
`/api/geo`. Freshness comes from rebuilding the feed and the site on a schedule,
not from runtime API calls.

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
| `country` | ISO-2 from the 14 supported mining countries, else `GLOBAL` |
| `city`, `locationRaw` | split from source location string |
| `remote` | boolean |
| `visaReported` | keyword heuristic — surfaced as "reported", never guaranteed |
| `category` | `exploration · drill-blast · geology · hse · maintenance · processing · engineering · operations · other` |
| `salary` | `{min, max, currency, period}` or null (parsed heuristically) |
| `postedAt` | ISO date; **older than 30 days is dropped at ingest** |
| `url` | original posting — every UI path must link back here |
| `description` | sanitized HTML (tags stripped → entities decoded → paragraphs). **Never translated.** |
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

Current seed (verified 2026-09-08): AU 462 / 417 / 482 / 500, CA IEC Working
Holiday + Young Professionals + TFWP + study-permit work, US H-2B.

## 3. Job sources (policy)

Every source must be **public and keyless** (JSON API, sitemap, RSS, or a
server-rendered public listing page). All ingestion is **read-only** (GET, or
POST only for keyless public search endpoints), sends a truthful
`LabormineBot/1.0` UA by default (browser UA only where a site filters short
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
| Vale | `eightfold` | Public Eightfold JSON API (descriptions included) |
| Agnico Eagle | `taleo-rss` | Taleo custom job-list RSS (partial coverage) |

### Mining / LatAm / government boards (keyless)

| Source | Platform/parser | Notes |
| --- | --- | --- |
| Careermine | `jobiqo` | sitemap + JobPosting JSON-LD; bot-check cookie; **Crawl-delay 10s**; `/api/gmapi` is robots-disallowed and never used |
| Brunel | `brunel` | `/en/jobs/mining` facet + JSON-LD detail (mining filter applied) |
| Globe 24-7 | `globe247` | WP Job Manager list + JSON-LD detail |
| CA Mining | `camining` | Simple Job Board sitemap + HTML (mining filter; beware lookalike domain `caming.com` = pharma) |
| Job Bank Canada | `jobbank` | Government SSR; Crawl-delay 5s; expired postings skipped |
| PNet (ZA) | `pnet` | Preloaded JSON state + detail pages |
| Computrabajo (PE/CL/MX) | `computrabajo` | SSR list (`-pN`) + JSON-LD JobPosting detail |
| Bumeran Perú, Laborum Chile | `navent` | **Keyless JSON `POST /api/avisos/searchV2`** with `x-site-id` + sitemap URL resolution. Undocumented API (documented exception); sitemap is the robots-clean fallback channel |
| EmpleosMineros.cl | `empleosmineros` | Keyless JSON API (low volume, low quality) |

### Aggregators & keyed sources

| Source | Platform | Notes |
| --- | --- | --- |
| Arbeitnow, Remotive | generic | mining-keyword filtered |
| Adzuna | `optionalKeyed` | runs LAST so official sources win dedupe |
| LinkedIn (top-50 MINING.COM seed) | `apify-linkedin` | **Guest-mode Apify actors** (`cheap_scraper` primary by company names; `kaix` cheaper-per-1k upgrade path when numeric company IDs are provided in `src/data/linkedin-company-ids.json`). No LinkedIn account/cookies involved. **Documented exception**: guest scraping of publicly-viewable job pages |
| OrcaRouter titles | translations | optional; see §7 |

### Performance guards
- `maxPerSource` (default 1500) + per-source `cap` protect `jobs.json` size.
- **Merge-from-previous**: sources that need per-job detail fetches reuse the
  stored description for known ids and only fetch new postings (critical for
  Careermine's 10s delay).
- `INGEST_FAST=<n>` env caps every source at n items (local smoke tests only).

### Deliberately out of scope
- **Seek, Careers24** (Apify-only + ToS explicitly prohibits scraping),
  **Antofagasta** (SuccessFactors RKP legacy, session-token JS), **Collahuasi**
  (Imperva WAF) — revisit as a paid Apify wave if ever needed.
- **Indeed / Glassdoor** — APIs dead, direct scraping Cloudflare-challenged,
  ToS prohibits; only ever via Apify, and not until a deliberate decision.
- **Minería en Línea** — job board discontinued.
- **Never** fabricate listings to fill empty countries. Empty is honest; fake is fatal.

## 4. Personalization & i18n

- Locales: `es` (default, **no prefix — Spanish is the site's primary language**),
  `en` (`/en`), `pt` (`/pt`). Dictionaries in `src/i18n/ui.ts`; route wrappers in
  `src/pages/{en,pt}` render the same shared views
  (`src/components/pages/*.astro`) with a `locale` prop.
- `/api/geo` (on-demand, edge) maps `cf-ipcountry` → `{country, suggestedLocale}`
  using the ES/PT country sets in the file. The client bootstrap in `Layout.astro`
  rewrites the URL to the suggested locale **only if no stored preference exists**
  (`lm-locale`); otherwise the user switches languages manually via the header
  selector. No browser geolocation permission is ever requested; city-level data
  is never requested or stored.
- Job **titles** are auto-translated (es/en/pt) at ingest via OrcaRouter and shown
  with a visible "auto-translated" badge + the original title. Job
  **descriptions are never translated**.
- Preference keys (localStorage): `lm-country` (work destination),
  `lm-nationality` (passport), `lm-locale`.

## 5. Scrollytelling home

`HomeView.astro` renders chapters with `Chapter.astro` (sticky narrative column +
reveal content column):

1. Hero — nationality + destination selectors (client-persisted)
2. *In your country* — hydrated client-side from the embedded index by `lm-country`
3. *Your passport opens doors* — top pathways for `lm-nationality`
4. Regional spotlights — server-rendered top-3 countries by job count (SEO-safe)
5. *Remote worldwide* — server-rendered remote jobs
6. CTA → `/jobs`

Motion: `IntersectionObserver` reveals (`.reveal` → `.is-visible`) with CSS
scroll-driven `animation-timeline: view()` as progressive enhancement; both
respect `prefers-reduced-motion`.

## 6. Ads (AdSense)

- `<AdSlot slotId format layoutKey />` — single component for all placements.
  Renders a real `adsbygoogle` unit only when `PUBLIC_ADSENSE_CLIENT` is set in
  production; otherwise a neutral labeled placeholder so layout is testable.
- Placements: home (2), `/jobs` in-feed every ~9 cards, `/jobs/[slug]` in-content.
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
| `APIFY_TOKEN` | no | enables LinkedIn top-50 ingest via Apify guest actors |
| `ORCAROUTER_API_KEY` | no | auto-translates job titles (model: `ORCAROUTER_MODEL`, default `orcarouter/free`) |
| `INGEST_FAST` | no | local only: caps every source at N items for fast smoke tests |

## 8. CI / deployment

- GitHub Actions (`refresh-jobs.yml`): daily `node scripts/ingest.mjs`, commits
  `src/data/jobs.json` if changed, push triggers the Cloudflare Pages Git build
  (or `CLOUDFLARE_DEPLOY_HOOK` secret as fallback).
- Cloudflare Pages: framework preset Astro, Node 22. pnpm is pinned via
  `packageManager` in package.json (12.3.x); CI installs it automatically via
  `pnpm/action-setup`. On Cloudflare Pages set `PNPM_VERSION=12.3.4` in the
  environment if its default pnpm is older (the lockfile is `lockfileVersion 9.0`,
  readable by any pnpm ≥ 9).

## 9. Phase 2 roadmap

1. Apify wave for the excluded boards (Seek, Careers24, Antofagasta RKP,
   Collahuasi) — paid actors, deliberate ToS decision required
2. Indeed pilot in "enrichment" mode (metadata + outbound link only, via Apify)
3. Full job-description translation (paid tier) if titles-only proves insufficient
4. Salary slider + active age filter in the pathways matrix
5. `/api/jobs` search endpoint (edge cache) if the client-side index outgrows memory
6. Email alerts by nationality/country
