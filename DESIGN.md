# Labormin — Design System

Apple HIG-informed (https://developer.apple.com/design/human-interface-guidelines):
**clarity, deference, depth**. The UI recedes so real job content leads; motion is
purposeful and always interruptible; ads integrate visually but are never deceptive.

## 1. Brand

- Product: **Labormin** — empleos mineros para peruanos: Perú primero, remoto y el extranjero.
- Company: **Bit SamurAI** (footer: "Un producto de Bit SamurAI.").
- Voice: directo, honesto, sin hype, en español. Señales de visa siempre "reported"/"verifica con el empleador". Aspiracional sin promesas de ingresos.

## 2. Color — "dark industrial premium"

| Token | Value | Use |
| --- | --- | --- |
| `graphite-950` | `#0A0B0E` | page background |
| `graphite-900/850/800` | `#10131A / #141822 / #1A1F2B` | cards, surfaces, borders |
| `graphite-600/400` | `#3A4356 / #7A8598` | muted borders / secondary text |
| `graphite-200/100` | `#C6CEDD / #E9EDF4` | body text / headings |
| `brand-500` | `#F5A623` | primary accent (CTAs, badges, kickers) |
| `brand-300/400` | `#FFD57A / #FFC247` | accent hover / highlights |

Rules: amber is **scarce** — one accent per viewport area maximum. Buttons are
filled amber (primary) or graphite outline (secondary). Never tint text below
4.5:1 contrast (WCAG AA).

## 3. Typography

- Display: **Fraunces** (600–700) — chapter titles, job titles, hero. Large sizes,
  tight leading (`leading-[1.1]`), editorial feel.
- Body/UI: **Inter** (400–700) — everything else.
- Scale (mobile → desktop): hero `text-4xl → 6xl`, chapter `text-3xl → 4xl`,
  card title `text-lg`, body `text-base`, meta `text-xs`.
- Kickers/labels: `text-xs font-semibold uppercase tracking-[0.2em] text-brand-500`.

## 4. Spacing & layout

- 4 pt base grid; section rhythm `py-24 md:py-36` (generous whitespace, HIG-style).
- Content max-width `max-w-6xl`; detail articles `max-w-4xl`.
- Cards: `rounded-2xl border-graphite-800 bg-graphite-900 p-5`, hover lifts 2 px
  with amber border. Radius vocabulary: `rounded-2xl` (cards), `rounded-xl`
  (inputs), `rounded-full` (buttons/badges).

## 5. Motion

- Reveal on scroll: `.reveal` fades+rises 24 px, `0.6s cubic-bezier(0.2,0.6,0.2,1)`,
  triggered by IntersectionObserver at 15% visibility.
- Progressive enhancement: where `animation-timeline: view()` is supported, CSS
  scroll-driven animations take over (zero-JS scrubbing).
- **Every** animation is disabled under `prefers-reduced-motion: reduce`.
- Chapter text columns are sticky (`top: 18vh`) so narrative stays anchored while
  job cards scroll — the scrollytelling core interaction.
- Skeleton shimmer for client-hydrated chapters (fast, honest loading state).

## 6. Ads — integration rules (AdSense policy-compliant)

1. Ads use the same card vocabulary (`rounded-2xl`, surface color) so the page
   feels coherent — **but** they are wrapped in `.ad-wrap` (dashed border) and
   always carry the `.ad-label` ("Ad / Anuncio / Anúncio").
2. Never place an ad such that it could be mistaken for the *next* job card in
   reading order; ads never show fabricated job titles.
3. Density cap: ≤ 1 ad per ~9 job cards; ≤ 2 ads per home chapter sequence; 1
   in-content ad on detail pages. No interstitials.
4. Placeholder (no publisher id / dev): neutral labeled box — layout is testable
   before AdSense approval, and the label contract is visible in every state.

## 7. Components inventory

| Component | Role |
| --- | --- |
| `Layout.astro` | SEO meta, canonical, fonts, AdSense script, reveal observer (usuario fijo Perú) |
| `Header/Footer.astro` | nav (empleos, rutas, eventos, guías) + CTA / legal links + disclosures |
| `Chapter.astro` | scrollytelling section (sticky text + reveal content) |
| `JobCard.astro` | server-rendered job card (tier badges, salary chip, international badge) |
| `AdSlot.astro` | labeled AdSense unit (in-feed/in-content; siempre "Anuncio") |
| `JobDrawer.astro` | quick-view `<dialog>` with apply-at-source CTA |
| `pages/HomeView` | 8-chapter tiered home (Perú → eventos → remoto → extranjero → pathways → guías) |
| `pages/JobsView` | full list ordered by tiers + client filters (country/category/type/visa/search) |
| `pages/JobDetailView` | detail + JSON-LD JobPosting + related + apply |
| `pages/PathwaysView` | official visa pathways filtered to Peruvian eligibility (server-rendered) |
| `pages/EventsView` | curated mining events (presencial PE / virtual potencias) |

## 8. Accessibility

- Landmarks: `header/main/footer/article/aside`; dialogs are native `<dialog>`.
- All filters/inputs have explicit `<label>`s; icon-only buttons have `aria-label`s.
- Focus: visible amber focus on all interactive elements (`focus:border-brand-500`).
- Content is fully readable with JS disabled — all chapters are server-rendered;
  JS only powers filters, the quick-view drawer and the AI clear-view toggle.
