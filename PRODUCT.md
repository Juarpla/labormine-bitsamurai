# Product

<!-- impeccable:product-schema 1 -->

Capturado en sesión de diseño (grilling + init, 2026-09-10) y modernizado al
esquema `product-schema 1` el mismo día. Fuente de verdad duradera; editar solo
con decisión de producto confirmada.

## Platform

web

## Users

- **Primario**: peruano aspiracional (18–35 aprox.) con recursos limitados, que
  ve la minería —en Perú o el extranjero— como la vía para ahorrar y construir
  un futuro. Busca su primera oportunidad o el siguiente peldaño, no la consulta
  corporativa.
- Situación típica: busca en español, desde el móvil, con poco tiempo; no sabe
  qué certificados necesita ni por dónde empezar a postular.
- Audiencia futura (no activa): Chile, Colombia, Argentina, Ecuador — el
  producto se expansiona a más hispanohablantes de LatAm, nunca fuera.

## Product Purpose

Labormin (Bit SamurAI) es el hub de empleos mineros **para peruanos**: un sitio
estático, gratuito y de nicho que encuentra y ordena ofertas reales de minería
por lo que el postulante peruano puede conseguir, con rutas de visa oficiales,
eventos del sector y contenido propio. Éxito: que el postulante encuentre una
oportunidad real y alcanzable, y sepa cuál es su siguiente paso (postular en la
fuente original, seguir una ruta de visa, asistir a un evento, leer una guía).

## Positioning

La **jerarquía honesta por tiers** es el mecanismo que un agregador vecino no
puede copiar con verdad:

1. Perú primero — sin visa; 2. remoto desde Perú (potencias o global); 3.
extranjero (Chile/Canadá/EE. UU./Australia) solo si la oferta **reporta** apoyo
de visa o el gobierno declara que acepta candidatos internacionales (Job Bank
Canadá, filtro oficial `fglo=1`). Todo lo demás se oculta en ingest
(hard-hide), no se degrada.

Sobre eso: datos verbatim de fuentes públicas legales (nunca inventados ni
editados), salarios solo si los declara la fuente, y rutas de visa con
`officialUrl` de gobierno + `lastVerifiedAt`.

## Operating Context

- Feed refrescado por GitHub Actions cron (diario) que commitea
  `src/data/jobs.json`; re-poda offline con `node scripts/ingest.mjs --prune`.
- Las reglas de nicho (`inNiche()`) se aplican en ingest, nunca en display.
- Rutas de visa y eventos se re-verifican a mano contra la fuente oficial antes
  de editar (`officialUrl` + `lastVerifiedAt` obligatorios); CI nunca escribe
  eventos.
- Monetización: solo publicidad (AdSense); proceso de admisión en
  `docs/ADSENSE-CHECKLIST.md`.
- Deploy: Cloudflare Pages (Astro 7 estático + adapter Cloudflare); único
  endpoint SSR: `/api/translate-description`.

## Capabilities and Constraints

Capacidades confirmadas:

- Feed diario de empleos con filtro de nicho estricto.
- Pulso del sector en `/`: gráficos de indicadores oficiales — precio de
  cobre/oro (Pink Sheet del World Bank, mensual), empleo minero formal (BEM
  de MINEM, curado a mano con `officialUrl` + `lastVerifiedAt`),
  departamentos con unidades metálicas en producción (Mapa de Unidades MINEM,
  anual) y ofertas por semana (computada del feed propio en build). Refresco
  mensual por CI (`refresh-indicators.yml`, día 4); si una fuente falla, sus
  datos y fecha previos envejecen visiblemente ("verificado {fecha}") sin
  inventar nada. Fuentes y método: `docs/MINING-DATA-SOURCES.md`.
- Bolsa de las mineras en `/` y en `/bolsa` (`StocksPulse.astro` +
  `BolsaView.astro`): cotizaciones anuales de las 12 mineras vinculadas a Perú
  (Yahoo Finance, todo normalizado a USD —ADR nativos o FX de Yahoo—; nombres
  comerciales y minas curados a mano), refresco mensual en el mismo cron del
  pulso. El home muestra "El año en revisión" compacto (ganadora/rezagada,
  cuántas cotizan cerca de su máximo anual —visual de 12 puntos—) y el top 3
  por crecimiento con CTA a `/bolsa`; ahí va el análisis completo sin jerga
  (termómetro 52s, caída desde la cima, mejor/peor mes, metales cobre/oro,
  tabla ordenable con enlace `/jobs?q=` por minera) para que el postulante se
  haga una idea de qué mineras están creciendo. Siempre con "no es asesoría de
  inversión"; Yahoo es agregador, no fuente primaria.
- Páginas: `/` (capítulos por tier), `/jobs` (feed por tiers + filtros, con
  prefiltro `?q=` desde los enlaces de /bolsa), `/bolsa` (análisis de las
  12 mineras), `/visa-pathways`, `/eventos`, `/guias` (2 guías), `/faq`,
  `/about`, `/privacy`, `/terms`, `/contact`, y detalle de cada empleo con
  JobPosting JSON-LD.
- Vista IA de descripciones bajo demanda (`/api/translate-description`) con
  badge "generado con IA" y toggle de vuelta; la original es el default.

Restricciones duras:

- **Idioma único: español** (es vive en la raíz; no hay /en ni /pt).
- **Usuario fijo: Perú** — sin detección por IP ni selectores de país/idioma.
- Solo 5 países en el feed: PE, CL, CA, US, AU; GLOBAL únicamente si es remoto.
- Nunca generar/editar contenido de ofertas; nunca inventar empleos, eventos ni
  cifras de salario.
- Traducción automática solo de títulos a `es` (badged); descripciones solo con
  IA bajo demanda y badged.
- Señales de visa siempre en framing "reported" / "verifica con el empleador".

Decidido explícitamente: Chile puede quedar en 0 ofertas — el vacío es aceptado
por decisión del owner; la ruta de visa de Chile queda como referencia.

## Brand Commitments

- Nombre: **Labormin**; compañía: **Bit SamurAI** (footer: "Un producto de Bit
  SamurAI.").
- Voz: directo, honesto, sin hype, en español; aspiracional sin promesas de
  ingresos.
- Framing de visa siempre "reported" / "verifica con el empleador".
- Publicidad siempre etiquetada ("Anuncio"), nunca disfrazada de oferta.

## Evidence on Hand

- Feed real: `src/data/jobs.json` — ~387 empleos al 2026-09-10 (PE 299, US 39,
  CA 13, GLOBAL remoto 33, AU 3; Chile 0).
- Rutas de visa verificadas: `src/data/pathways.json` — AU 462/417/482/500, CA
  IEC + Young Professionals + TFWP + study-permit work, US H-2B, y CL
  "Vacaciones y Trabajo" Alianza del Pacífico (peruanos 18–30; verificados
  2026-09-08/10).
- Eventos curados a mano: `src/data/events.json` (fuente oficial obligatoria;
  nunca scraped).
- Indicadores del sector: `src/data/indicators.json` (series cobre/oro +
  ranking de departamentos con `sourceId`; bloque `sector` curado a mano) —
  semilla verificada 2026-09-10 contra Pink Sheet y XLSX de MINEM;
  investigación de fuentes en `docs/MINING-DATA-SOURCES.md` (GEOCATMIN queda
  fuera del pipeline por cadena TLS rota del servicio on-prem; OECD no publica
  precios de commodities).
- Cotizaciones de mineras: `src/data/stocks.json` — 8 empresas con operaciones
  en Perú (Yahoo Finance, semilla real 2026-09-10: NEXA +172%, NGLOY +54,8%);
  empresa/minas curados en `scripts/ingest-stocks.mjs`.
- Contenido propio: 2 guías + FAQ.

**Ausencias que el trabajo futuro no debe fabricar**: sin investigación de
usuarios, sin testimonios, sin cifras de tráfico, sin prensa, y sin cuenta de
AdSense todavía (ver `docs/ADSENSE-CHECKLIST.md`). Tier 2 (remoto) es el más
chico del feed — reforzar fuentes remotas es mejora continua.

## Product Principles

1. **Verdad de datos primero** — ofertas verbatim; nunca inventar, editar ni
   "mejorar" contenido de terceros.
2. **Jerarquía honesta** — Perú primero; lo que no entra en los tiers se
   oculta, no se degrada.
3. **Fuente oficial o no entra** — pathways y eventos exigen `officialUrl` +
   `lastVerifiedAt` reales.
4. **Un idioma, un usuario** — español único, visitante peruano fijo; sin
   detección ni selectores.
5. **Publicidad transparente** — AdSense siempre etiquetado e integrado sin
   engaño.

## Accessibility & Inclusion

- Contenido 100% legible sin JS (capítulos server-rendered; JS solo potencia
  filtros, drawer quick-view y toggle IA).
- Mobile-first: el usuario primario llega desde el móvil, con recursos
  limitados.
- Español único, pensado para hispanohablantes; sin rutas de idioma
  alternativas.
- El piso técnico de contraste, foco y landmarks vive en DESIGN.md §8.
