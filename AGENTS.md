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
node scripts/ingest.mjs   # refresh src/data/jobs.json from live sources
```

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

## Architecture & design docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, data flow, schemas,
  sources, i18n, ads wiring, phase-2 roadmap.
- [`DESIGN.md`](./DESIGN.md) — style guide (Apple HIG-informed), components,
  motion and ad-placement rules.

## Key paths

```
scripts/ingest.mjs            job ingestion (write jobs.json)
src/data/companies.json       curated public boards (extend here to add companies)
src/data/pathways.json        curated visa pathways seed
src/data/jobs.json            generated feed (commit; refreshed daily by CI)
src/schemas.ts                Zod schemas for Job / Pathway / feed
src/lib/jobs.ts               build-time data helpers
src/lib/i18n.ts               locales, localePath, mining countries
src/i18n/ui.ts                UI dictionaries (en / es / pt)
src/components/pages/*.astro  shared page views reused by en/es/pt routes
src/pages/                    routes: / (en), /es, /pt, /jobs, /visa-pathways, /api/geo
```

## Conventions

- Stack: pnpm, Astro 7 (static output + Cloudflare adapter), Tailwind v4, vanilla
  islands (`<script>`), Zod. No React/framework islands — keep it that way.
- i18n: `en` is default (no URL prefix); `es` and `pt` live under `/es`, `/pt`.
  All locale routes render the same shared view components with a `locale` prop.
  Translate UI strings in `src/i18n/ui.ts`; never machine-translate job content.
- Country detection is IP-based (edge header) and city data is never stored.
- Client preference keys: `lm-country`, `lm-nationality`, `lm-locale` (localStorage).
- Deployment: Cloudflare Pages. Feed freshness via GitHub Actions cron
  (`.github/workflows/refresh-jobs.yml`) committing `src/data/jobs.json`.
