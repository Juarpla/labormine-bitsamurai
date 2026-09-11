---
version: 1
slug: "src-pages-practicas-astro"
primary_target: "src/pages/practicas.astro"
related_targets: ["src/components/pages/PracticasView.astro"]
---

# Surface: /practicas

## Scope & mode

- Route: `src/pages/practicas.astro` → `src/components/pages/PracticasView.astro`.
- Mode: **Operate** — the visitor (estudiante peruano) scans active prácticas and posts at the source.
- Extension of the established Labormin world (DESIGN.md); inherits the /jobs listing anatomy (rails + centered column + card grid).

## Brief

- Audience: estudiante peruano (18–25, móvil, poco tiempo) buscando práctica pre/profesional, trainee o becario en minería.
- Job: ver qué prácticas están activas HOY y postular en la fuente original.
- Action: escanear cards → detail page (/jobs/[slug]) → apply at source.
- Proof/content: solo ofertas reales del feed (`internship: true`, Perú); conteo honesto; empty-state honesto con salida a /jobs y a la guía.
- Constraints: ads always-on estándar (slots `practicas-*`), fuera del grid, nunca ocultos; español único; nada inventado; sin feature flag.

## Direction contract

THESIS: la misma verdad del feed, recortada al primer peldaño — la página de prácticas es /jobs sin lo que no es práctica, no un producto nuevo. Rechaza el arreglo por defecto de la categoría (landing educativa con pasos y tips): aquí solo hay ofertas activas, contadas, con la guía como un enlace, no como contenido relleno.

OWN-WORLD: graphite dark industrial + ámbar escaso (una marca por área), Fraunces display / Inter UI, cards `rounded-2xl` border-graphite-800 — vocabulario idéntico a /jobs; el único gesto propio es el conteo vivo "{n} prácticas activas" y el badge de tipo de puesto cuando exista.

STORY: el visitante entiende en segundos que estas son prácticas mineras reales en Perú, cuántas hay hoy, que postula en la fuente original, y que si no hay hoy, el feed se renueva a diario y hay una guía para entrar sin experiencia.

FIRST VIEWPORT: rail ad 160×600 izquierda (≥1280) — columna max-w-4xl: H1 Fraunces 4xl→5xl "Prácticas en minería", lead de 2 líneas en graphite-400, ad 320×50 (≤lg) centrado, línea de conteo "{n} prácticas activas" en text-sm graphite-400, grid `sm:grid-cols-2` de JobCards server-rendered ordenadas postedAt desc; CTA visible = las cards mismas (título → detail). Rail derecha simétrica.

FORM: precisely specified extension (grilling 2026-09-11 asentó composición, ads, empty-state, nav) — JobsView anatomy inherited; no concept-seed run; code-led build (no image generation available).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Resolved decisions (post-review, 2026-09-11)

- Nav position: owner signed off "pegado al CTA" — Prácticas is the last header
  nav link, immediately left of the "Ver empleos" CTA (Empleos is not a nav
  link; it is the CTA button). Recorded in Header.astro comment.
- Pre-existing drift reported, not repaired here: /about has no header link
  (owner chose to leave it); AdSlot placeholder contrast fixed this session
  (graphite-600 → graphite-400, system-wide).
