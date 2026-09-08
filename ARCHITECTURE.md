# Labormine — Architecture

Labormine (a Bit SamurAI product) is a global mining-jobs hub. It presents real,
publicly-sourced mining job listings through a scroll-driven narrative, filters by
nationality context (home country → visa-eligible → remote), and monetizes with
clearly-labeled native Google AdSense placements.

## 1. System overview

```
                 ┌──────────────────────────┐
                 │  Public job sources      │
                 │  • Greenhouse boards API │
                 │  • Lever postings API    │
                 │  • Arbeitnow API         │
                 │  • Remotive API          │
                 │  • Adzuna API (keyed)    │
                 └────────────┬─────────────┘
                              │  scripts/ingest.mjs (node 22, no keys required)
                              ▼
                 ┌──────────────────────────┐
                 │  src/data/jobs.json      │  normalized, deduped, 30-day TTL
                 │  (committed to git)      │
                 └────────────┬─────────────┘
                              │  GitHub Actions cron (daily 04:00 UTC)
                              │  .github/workflows/refresh-jobs.yml
                              ▼
                 ┌──────────────────────────┐
                 │  Astro 7 static build    │  3 locales × (home, /jobs, /jobs/[slug],
                 │  + Cloudflare adapter    │  /visa-pathways, legal pages) + sitemap
                 └────────────┬─────────────┘
                              ▼
                 ┌──────────────────────────┐
                 │  Cloudflare Pages        │  edge: /api/geo (cf-ipcountry → locale hint)
                 └──────────────────────────┘
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
| `id` | `gh-<board>-<id>` / `lv-…` / `an-…` / `rm-…` / `az-…` |
| `slug` | `company-title-country-id`, used for `/jobs/[slug]` |
| `company`, `companySlug` | normalized display + dedupe key |
| `source` | `greenhouse \| lever \| arbeitnow \| remotive \| adzuna` |
| `country` | ISO-2 from the 14 supported mining countries, else `GLOBAL` |
| `city`, `locationRaw` | split from source location string |
| `remote` | boolean |
| `visaReported` | keyword heuristic — surfaced as "reported", never guaranteed |
| `category` | `exploration · drill-blast · geology · hse · maintenance · processing · engineering · operations · other` |
| `salary` | `{min, max, currency, period}` or null (parsed heuristically) |
| `postedAt` | ISO date; **older than 30 days is dropped at ingest** |
| `url` | original posting — every UI path must link back here |
| `description` | sanitized HTML (tags stripped → entities decoded → paragraphs) |

Dedupe key: `companySlug + normalized-title + country`. Stale cutoff: 30 days.

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

Every source must be a **public, legal, keyless** JSON API. Curated boards live in
`src/data/companies.json`:

| Source | Companies (verified live 2026-09-08) |
| --- | --- |
| Greenhouse | KoBold Metals (+ DRC, Zambia entities), Blue Moon Metals |
| Lever | Elk Valley Resources (Glencore coal, Canada) |
| Generic | Arbeitnow, Remotive (mining-keyword filtered) |
| Optional keyed | Adzuna (14 country searches; enabled via `ADZUNA_APP_ID`/`ADZUNA_APP_KEY`) |

**Deliberately out of scope for MVP:** most large miners (BHP, Rio Tinto, Anglo
American, Glencore, Newmont, Vale) run Workday / PageUp / SuccessFactors — no
clean public JSON API. Scraping them (Apify actors, EnsembleData, custom
cheerio/Playwright workers) is **Phase 2** and must respect each site's ToS.

**Never** fabricate listings to fill empty countries. Empty is honest; fake is fatal.

## 4. Personalization & i18n

- Locales: `en` (default, no prefix), `es` (`/es`), `pt` (`/pt`). Dictionaries in
  `src/i18n/ui.ts`; route wrappers in `src/pages/{es,pt}` render the same shared
  views (`src/components/pages/*.astro`) with a `locale` prop.
- Job content is **not translated** (phase 2 may add auto-translated titles with a
  visible "auto-translated" flag). UI chrome, chapters, categories and pathways
  metadata are translated.
- `/api/geo` (on-demand, edge) maps `cf-ipcountry` → `{country, suggestedLocale}`
  using the ES/PT country sets in the file. The client bootstrap in `Layout.astro`
  stores it and rewrites the URL to the suggested locale **only if no stored
  preference exists** (`lm-locale`). No browser geolocation permission is ever
  requested; city-level data is never requested or stored.
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

1. Apify actors / EnsembleData for Workday/PageUp-backed miners (BHP, Rio Tinto, …)
2. Auto-translated job titles with "auto-translated" flag
3. Salary slider + active age filter in the pathways matrix
4. `/api/jobs` search endpoint (edge cache) if the client-side index outgrows memory
5. Email alerts by nationality/country
