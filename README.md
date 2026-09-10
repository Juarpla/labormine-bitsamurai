# Labormin

Global mining-jobs hub by Bit SamurAI. Real listings from public employer boards,
matched to your nationality: your country first, then reported visa support,
official visa pathways (working holiday / IEC / H-2B / sponsorship), and remote roles.

- Docs: [ARCHITECTURE.md](./ARCHITECTURE.md) · [DESIGN.md](./DESIGN.md) · agent rules in [AGENTS.md](./AGENTS.md)

## Quick start

Requires pnpm (≥ 12) — `corepack enable` or see https://pnpm.io/installation.

```bash
pnpm install
node scripts/ingest.mjs   # fetch real jobs → src/data/jobs.json
pnpm dev                  # http://localhost:4321
```

## Environment (all optional)

```bash
PUBLIC_ADSENSE_CLIENT=ca-pub-xxxx   # real AdSense unit rendering (prod)
ADZUNA_APP_ID=...                   # extra source at ingest
ADZUNA_APP_KEY=...
```
