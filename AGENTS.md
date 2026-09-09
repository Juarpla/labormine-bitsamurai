# Labormine — AGENTS.md

Labormine is a global mining-jobs hub by **Bit SamurAI**. It matches real mining job
listings to a visitor's nationality: jobs in your country first, then jobs with
reported visa support, visa pathways (working holiday / youth mobility / temporary /
student / sponsorship), and remote roles. Ads (Google AdSense) are integrated natively
but are **always labeled**.

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
node scripts/ingest.mjs   # refresh src/data/jobs.json from live sources
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
   fabricate listings when a source returns nothing.
2. **Ads are always labeled.** The `<AdSlot />` component always renders an
   "Ad / Anuncio / Anúncio" label. Never disguise ads as job cards beyond the
   native styling; deceptive ad framing is an AdSense policy violation and risks
   a account ban.
3. **Visa claims are heuristic.** Visa-sponsorship flags come from listing text
   keywords; UI copy must keep the "reported" framing ("Verify with the employer").
4. **Visa pathway data is official-sourced.** `src/data/pathways.json` entries must
   cite a government `officialUrl` and carry a `lastVerifiedAt` date. Re-verify
   before editing.
5. **Job descriptions are never machine-translated.** Job *titles* may be
   auto-translated (es/en/pt) at ingest via OrcaRouter — the UI must always show
   the visible "auto-translated" badge alongside the original title. Source data
   is ingested verbatim; never edit or "improve" it.

## Architecture & design docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, data flow, schemas,
  sources, i18n, ads wiring, phase-2 roadmap.
- [`DESIGN.md`](./DESIGN.md) — style guide (Apple HIG-informed), components,
  motion and ad-placement rules.

## Key paths

```
scripts/ingest.mjs            job ingestion (write jobs.json; +title translations)
src/data/companies.json       curated public boards (extend here to add companies)
src/data/pathways.json        curated visa pathways seed
src/data/jobs.json            generated feed (commit; refreshed daily by CI)
src/data/translation-cache.json  auto-translated titles cache (commit)
src/data/linkedin-company-ids.json  optional LinkedIn numeric company ids (kaix upgrade path)
src/schemas.ts                Zod schemas for Job / Pathway / feed
src/lib/jobs.ts               build-time data helpers
src/lib/i18n.ts               locales, localePath, mining countries
src/i18n/ui.ts                UI dictionaries (es / en / pt)
src/components/pages/*.astro  shared page views reused by es/en/pt routes
src/pages/                    routes: / (es, default), /en, /pt, /jobs, /visa-pathways, /api/geo
```

## Conventions

- Stack: pnpm, Astro 7 (static output + Cloudflare adapter), Tailwind v4, vanilla
  islands (`<script>`), Zod. No React/framework islands — keep it that way.
- i18n: **`es` is the default** (no URL prefix — the site's primary language is
  Spanish); `en` and `pt` live under `/en` and `/pt`. All locale routes render the
  same shared view components with a `locale` prop. IP-based auto-detection
  suggests a locale once; users switch manually via the header selector.
  Translate UI strings in `src/i18n/ui.ts`; job titles are auto-translated at
  ingest (badged); **never machine-translate job descriptions or content**.
- Country detection is IP-based (edge header) and city data is never stored.
- Client preference keys: `lm-country`, `lm-nationality`, `lm-locale` (localStorage).
- Deployment: Cloudflare Pages. Feed freshness via GitHub Actions cron
  (`.github/workflows/refresh-jobs.yml`) committing `src/data/jobs.json`.
