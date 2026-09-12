# Labormin — AGENTS.md

Labormin is the **Peru-first** mining-jobs hub by **Bit SamurAI**: a Spanish-only,
static, ad-funded site for an aspirational Peruvian audience. Real listings are
ordered by a strict tier hierarchy — jobs in Peru first, then remote roles a
Peruvian can do from home, then listings in Chile / Canada / USA / Australia that
**report** visa support or are officially open to international candidates. The
site also hosts official-source visa pathways (for Peruvians), hand-curated
mining events, and original guides/FAQ. Ads (Google AdSense) are integrated
natively but are **always labeled**.

## Development

Package manager: **pnpm** (pinned via `packageManager` in package.json; corepack
or pnpm ≥ 12 required). `pnpm-workspace.yaml` holds the `allowBuilds` approvals
(esbuild, workerd) — pnpm ≥ 11 blocks dependency build scripts by default.

When starting the dev server, use background mode:

```
pnpm astro dev --background
```

Manage the background server with `pnpm astro dev stop`, `pnpm astro dev status`, and
`pnpm astro dev logs`.

```bash
pnpm install      # install (pnpm-lock.yaml is the source of truth)
pnpm dev          # foreground dev server
pnpm build        # production build (static + Cloudflare adapter)
pnpm preview      # preview the production build
pnpm visual       # capture UI screenshots across chromium/webkit at
                  # mobile/tablet/desktop viewports into screenshots/
node scripts/ingest.mjs         # refresh src/data/jobs.json from live sources
node scripts/ingest.mjs --prune # offline: re-apply niche rules + TTL to the stored feed
node scripts/ingest-events.mjs  # refresh src/data/events-scraped.json (official sites keyless; FB via Apify; weekly CI)
```

### Verification

After any UI or layout change, run `pnpm visual` and inspect the captures in
`screenshots/` to verify the UI and its responsiveness across viewports and
engines before considering the change done. The script reuses a dev server
already running on localhost:4321-4326; otherwise it starts (and stops) its own.
`VISUAL_BROWSERS=firefox` opts into additional engines (install with
`npx playwright install firefox` first).

## Hard rules

1. **Real jobs only.** Every listing comes from a public, legal source
   (`scripts/ingest.mjs`). Never invent, edit, or "improve" job content, and never
   fabricate listings when a source returns nothing. Salary figures are shown
   **only** when the source declares them.
2. **Ads are always labeled.** The `<AdSlot />` component always renders the
   "Anuncio" label. Never disguise ads as job cards beyond the native styling;
   deceptive ad framing is an AdSense policy violation and risks an account ban.
3. **Visa claims are heuristic.** Visa-sponsorship flags come from listing text
   keywords; UI copy must keep the "reported" framing ("Verify with the employer").
4. **Official-source data.** `src/data/pathways.json` AND `src/data/events.json`
   entries must cite a verifiable `officialUrl` and carry a real `lastVerifiedAt`
   date. Re-verify before editing; if a source doesn't confirm an event/pathway,
   it doesn't enter the seed. Events: presencial = Peru only; virtual = Peru or
   the four power countries. **Automated scraped events live apart**
   (`src/data/events-scraped.json`, written weekly by CI via
   `scripts/ingest-events.mjs`): they always render the visible
   "Agregado automáticamente" badge with a "verify with the organizer" CTA,
   never enter the curated seed, and the curated seed always wins dedupe
   (normalized title + date, or same official-site host). Facebook contributes
   only **posts that announce a dated event** (`source: 'facebook-post'`,
   page posts — FB Events channels and the keyword post-search channel were
   removed 2026-09-11 / 2026-09-12); the post title is the verbatim first
   line of the text and the date is regex-extracted (never LLM).
5. **AI description views are view-layer only.** Job *titles* may be
   auto-translated to **`es` only** at ingest via the multi-provider LLM chain in
   `src/lib/llm.js` (Mistral → Workers AI → OpenCode Go, ordered by
   `LLM_PROVIDER_ORDER`) — the UI must always show
   the visible "auto-translated" badge alongside the original title. Descriptions
   may be machine-translated and AI-reformatted **only** on demand via
   `/api/translate-description`: the original is the default view, a visible
   "generated with AI" badge and a toggle back to the original are mandatory,
   facts must stay verbatim (never invent or omit requirements), and AI output is
   never written into `src/data/jobs.json`. Source data is ingested verbatim;
   never edit or "improve" it.
6. **Niche hierarchy is enforced at ingest, not at display.** `inNiche()`
   (`scripts/ingest.mjs`) hard-hides everything outside the tiers: PE → remote
   (powers/GLOBAL) → abroad (CL/CA/US/AU) with `visaReported` or
   `openToInternational` (Job Bank `fglo=1`). The UI sorts by tier
   (`tierOf` in `src/lib/jobs.ts`) but never re-expands what ingest dropped.
7. **Spanish only, Peru fixed.** `es` lives at the root; there are no /en or /pt
   routes and no IP-based detection. The visitor is assumed Peruvian
   (`DEFAULT_COUNTRY`/`DEFAULT_NATIONALITY` in `src/lib/i18n.ts`).

## Architecture & design docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, data flow, schemas,
  sources, i18n, ads wiring, phase-2 roadmap.
- [`DESIGN.md`](./DESIGN.md) — style guide (Apple HIG-informed), components,
  motion and ad-placement rules.

## Key paths

```
scripts/ingest.mjs            job ingestion (write jobs.json; +title translations; --prune niche filter)
scripts/ingest-stocks.mjs     stock quotes ingestion (write stocks.json; Yahoo Finance + FX → USD; monthly CI)
scripts/ingest-events.mjs     scraped-event ingestion (write events-scraped.json; official sites + Facebook via Apify; weekly CI)
src/data/companies.json       curated public boards (extend here to add companies — niche: PE/CL/CA/US/AU)
src/data/pathways.json        curated visa pathways seed (Peru-eligible focus)
src/data/events.json          hand-curated mining events seed (officialUrl + lastVerifiedAt required)
src/data/events-scraped.json  auto-detected events (badge "Agregado automáticamente"; curated seed wins dedupe)
src/data/jobs.json            generated feed (commit; refreshed daily by CI; niche-filtered)
src/data/translation-cache.json  auto-translated titles cache (commit)
src/schemas.ts                Zod schemas for Job / Pathway / Event / ScrapedEvent / feeds
src/lib/jobs.ts               build-time data helpers (tierOf, tier ranking)
src/lib/events.ts             build-time event helpers (upcoming)
src/lib/events-scraped.ts     build-time scraped-event helpers (upcoming + dedupe vs curated seed)
src/lib/llm.js               multi-provider LLM chain (titles + clear view)
src/lib/i18n.ts               localePath, niche countries, DEFAULT_COUNTRY/DEFAULT_NATIONALITY
src/i18n/ui.ts                UI dictionary (es active; en/pt dormant)
src/components/pages/*.astro  page views (HomeView, JobsView, JobDetailView, PathwaysView, EventsView, BolsaView, PracticasView)
src/pages/                    routes: /, /jobs, /bolsa, /practicas, /visa-pathways, /eventos, /guias(+2 guías), /faq,
                              /about, /contact, /privacy, /terms, /ops, /api/translate-description
docs/ADSENSE-CHECKLIST.md     AdSense admission checklist (owner + code states)
PRODUCT.md                    durable product truth (impeccable init)
```

## Conventions

- Stack: pnpm, Astro 7 (static output + Cloudflare adapter), Tailwind v4, vanilla
  islands (`<script>`), Zod. No React/framework islands — keep it that way.
- i18n: **`es` is the ONLY language** (lives at the root, no URL prefix). The
  en/pt dictionaries in `src/i18n/ui.ts` are dormant (kept for a future LatAm
  expansion; `Locale` is currently typed to `es`). Job titles are auto-translated
  to `es` at ingest (badged); **never machine-translate job descriptions or
  content**.
- Country context is FIXED to Peru (`DEFAULT_COUNTRY = 'PE'`): no IP detection,
  no selectors, no `lm-country`/`lm-nationality`/`lm-locale` localStorage keys —
  stale values in old visitors' browsers are simply ignored.
- Job feed order: tiers (`tierOf`) then `postedAt desc`. Tier 3 foreign listings
  are shown only with a reported-visa or international-candidate signal.
- Ads: `AdSlot` slot ids are per page/section (`home-*`; jobs: `jobs-top-1`,
  `jobs-side-1/2`, `jobs-bottom-desktop-1`, `jobs-bottom-mobile-1`;
  `job-detail-1`, `job-detail-2` (before "Empleos similares"); pathways: `pathways-top-1`, `pathways-side-1/2`,
  `pathways-bottom-desktop-1`, `pathways-bottom-mobile-1`; events: `events-top-1`,
  `events-side-1/2`, `events-bottom-desktop-1`, `events-bottom-mobile-1`;
  guías (shared by index + detail pages): `guias-top-1`, `guias-side-1/2`,
  `guias-bottom-desktop-1`, `guias-bottom-mobile-1`; bolsa: `bolsa-top-1`,
  `bolsa-side-1/2`, `bolsa-bottom-desktop-1`, `bolsa-bottom-mobile-1`;
  practicas: `practicas-top-1`, `practicas-side-1/2`, `practicas-bottom-desktop-1`,
  `practicas-bottom-mobile-1`;
  faq: `faq-bottom-desktop-1`, `faq-bottom-mobile-1`; about: `about-bottom-desktop-1`,
  `about-bottom-mobile-1`). /jobs, /bolsa, /visa-pathways, /eventos, /guias and /practicas share the
  same always-on distribution: fixed 320×50 top (mobile/tablet), 970×90 bottom
  (desktop ≥lg) or 320×100 (mobile/tablet), sticky 160×600 side rails (desktop
  ≥1280px) around a centered content column; /faq and /about carry only the horizontal
  bottom pair, no rails. Slots sit outside the filterable grid and are never
  hidden after serving. Placeholders render in dev/absent client id; real ads
  need `PUBLIC_ADSENSE_CLIENT` + prod + publisher ID in `public/ads.txt` (see
  `docs/ADSENSE-CHECKLIST.md`).
- Deployment: Cloudflare Pages. Feed freshness via GitHub Actions cron
  (`.github/workflows/refresh-jobs.yml`) committing `src/data/jobs.json`.
