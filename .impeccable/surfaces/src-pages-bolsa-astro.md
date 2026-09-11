---
version: 1
slug: "src-pages-bolsa-astro"
primary_target: "src/pages/bolsa.astro"
related_targets: ["src/components/pages/BolsaView.astro","src/components/StocksPulse.astro"]
---

# Surface brief — /bolsa (+ StocksPulse en /)

## Scope & mode
- Superficie nueva `/bolsa` (BolsaView.astro) + refinamiento de la sección de bolsa del home (`StocksPulse.astro`). Modo: **Read** con gancho Persuade (el postulante entiende el mercado y actúa: ve empleos de cada minera).
- Mundo establecido: dark industrial premium (graphite/amber), Fraunces/Inter, server-rendered SVG, JS solo para la tabla ordenable. Extensión, no reemplazo de identidad.

## Audience / job / action / proof / constraints
- Postulante peruano sin conocimientos de finanzas, móvil, poco tiempo.
- Job: entender qué mineras están creciendo y qué dice eso de su próxima vacante. Action: tocar el nombre de una minera → `/jobs?q=`.
- Proof: 12 mineras reales (Yahoo Finance mensual, FX → USD), series verbatim; nada inventado. Metales (cobre/oro) de indicators.json.
- Constraints: es-only, disclaimer "no es asesoría de inversión" permanente, ads etiquetados con la anatomía de /jobs (`bolsa-top-1`, `bolsa-side-1/2`, `bolsa-bottom-desktop-1`, `bolsa-bottom-mobile-1`), paleta graphite/amber intacta, sin frameworks.

## Direction (aprobado por el owner tras grilling)
Home: título "Las mineras con mejor crecimiento en bolsa", franja "El año en revisión" compacta con fila de 12 puntos (● cerca del máximo), top 3 con gráficos anchos y bajos, CTA a /bolsa. /bolsa: H1 "Cómo van las mineras en la bolsa" + glosario plegable + 5 secciones: termómetro 52s por minera (marcador ámbar = cerca del máximo), caída desde la cima (barras), mejor/peor mes (chips con mes derivado de generatedAt), metales cobre/oro, tabla ordenable (aria-sort) con nombre→`/jobs?q=`. Memorable: el termómetro — 12 recorridos individuales del año.

## Unresolved
- Ninguno bloqueante. Los nombres de mes se derivan de generatedAt (aritmética, no invento); si Yahoo cambia la alineación de barras, revisar monthLabelOf.
