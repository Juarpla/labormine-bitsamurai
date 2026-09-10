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
   the four power countries.
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
src/data/companies.json       curated public boards (extend here to add companies — niche: PE/CL/CA/US/AU)
src/data/pathways.json        curated visa pathways seed (Peru-eligible focus)
src/data/events.json          hand-curated mining events seed (officialUrl + lastVerifiedAt required)
src/data/jobs.json            generated feed (commit; refreshed daily by CI; niche-filtered)
src/data/translation-cache.json  auto-translated titles cache (commit)
src/data/linkedin-company-ids.json  optional LinkedIn numeric company ids (kaix upgrade path)
src/schemas.ts                Zod schemas for Job / Pathway / Event / feeds
src/lib/jobs.ts               build-time data helpers (tierOf, tier ranking)
src/lib/events.ts             build-time event helpers (upcoming)
src/lib/llm.js               multi-provider LLM chain (titles + clear view)
src/lib/i18n.ts               localePath, niche countries, DEFAULT_COUNTRY/DEFAULT_NATIONALITY
src/i18n/ui.ts                UI dictionary (es active; en/pt dormant)
src/components/pages/*.astro  page views (HomeView, JobsView, JobDetailView, PathwaysView, EventsView)
src/pages/                    routes: /, /jobs, /visa-pathways, /eventos, /guias(+2 guías), /faq,
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
- Ads: `AdSlot` slot ids are per page/section (`home-*`, `jobs-infeed-*`,
  `job-detail-1`, `pathways-1`, `events-1`). Placeholders render in dev/absent
  client id; real ads need `PUBLIC_ADSENSE_CLIENT` + prod + publisher ID in
  `public/ads.txt` (see `docs/ADSENSE-CHECKLIST.md`).
- Deployment: Cloudflare Pages. Feed freshness via GitHub Actions cron
  (`.github/workflows/refresh-jobs.yml`) committing `src/data/jobs.json`.
