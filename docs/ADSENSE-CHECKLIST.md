# Checklist de admisión en Google AdSense — Labormin

Estado del sitio (sep 2026): preparado para solicitar AdSense. Lo que falta depende de la cuenta.

## Ya listo en el código

- [x] **Publicidad etiquetada** — `<AdSlot />` siempre imprime la etiqueta "Anuncio" (regla dura del repo); nunca se disfraza como contenido.
- [x] **Colocaciones nativas**: Home (2), Empleos (5 slots fijos siempre activos, fuera de la grilla filtrable: 320×50 sobre los filtros [móvil/tablet], 970×90 al final [desktop ≥lg] o 320×100 [móvil/tablet], railes sticky 160×600 en los costados [desktop ≥1280px]), Detalle de empleo (1), Rutas de visa (5, misma distribución que /jobs), Eventos (5, misma distribución), Guías (5 compartidos entre índice y las 2 guías detalladas, misma distribución), Acerca de (solo el par horizontal al final: 970×90 desktop / 320×100 móvil, sin rieles). Los units fuera del breakpoint nunca piden anuncio (`matchMedia` antes del push); nada se oculta tras servirse, ni siquiera con 0 resultados.
- [x] **Política de privacidad** con mención de cookies de AdSense (`/privacy`).
- [x] **Términos y condiciones** (`/terms`) — requisito práctico de revisión.
- [x] **Página "Acerca de" y "Contacto"** con mailto real (contact@labormin.com).
- [x] **Contenido original**: guías (`/guias`), FAQ (`/faq`), eventos curados con fuente oficial — no hay páginas thin.
- [x] **Ofertas reales**: cada empleo enlaza a la fuente original (nunca inventado) — clave para las políticas de contenido.
- [x] **Enlaces internos íntegros**: reparado `/es/contact` → `/contact`.
- [x] **`robots.txt` + sitemap** generados.
- [x] **Sin IP-detection**: sitio estático es-only, sin puntos de datos personales innecesarios.

## Pendientes del propietario (fuera del código)

1. **Contestar al encabezado de AdSense**: crear/ingresar la cuenta; colocar `PUBLIC_ADSENSE_CLIENT` (`ca-pub-…`) en las variables del deploy.
2. **`ads.txt`**: reemplazar el placeholder por el publisher ID real (instrucciones dentro del archivo).
3. **Consentimiento de cookies (CMP)**: activar el *Consent Management Platform* nativo de Google desde el panel de AdSense (Privacidad → Consent Management). No requiere código; se activa para tráfico EEA/UK. Decisión del owner: pospuesto hasta tener la cuenta.
4. **Unidades en el panel de AdSense** (cuando exista publisher ID): crear las unidades fijas de /jobs — 320×50 (`jobs-top-1`), 970×90 (`jobs-bottom-desktop-1`), 320×100 (`jobs-bottom-mobile-1`) y 160×600 (`jobs-side-1` / `jobs-side-2`) — y las gemelas de las demás secciones con la misma distribución: `pathways-*` (top/side×2/bottom×2), `events-*` (ídem), `guias-*` (ídem, compartidas por las 3 páginas de la sección) y el par horizontal de /about (`about-bottom-desktop-1`, `about-bottom-mobile-1`); reemplazar los slot ids del código por los reales.
5. **Revisión de contenido**: el feed cambia a diario (jobs). Si el sitio aún no está aprobado, el volumen mínimo se sostiene con las guías + FAQ + pathways + eventos.
5. **Verificación editorial final antes de aplicar**: sin errores 404, sin páginas vacías de eventos (el seed mantiene ≥ 1 evento vigente; si la lista se vacía, re-curar).

## Reglas de oro (política AdSense relevantes para este sitio)

- Nunca generar ni editar contenido de ofertas (regla #1 del repo): AdSense castiga contenido fabricado.
- Nunca enmarcar anuncios como ofertas de empleo ni ocultar la etiqueta (regla #2): penaliza la cuenta.
- Mantener el framing "verifica con el empleador" en visa (regla #3): evita reclamos engañosos.
- Los eventos y pathways solo entran con `officialUrl` verificable + `lastVerifiedAt` (regla #4).
- Salarios: solo cifras declaradas por la fuente; jamás inventar rangos (regla #1 + FAQ).
