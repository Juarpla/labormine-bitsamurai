# Checklist de admisión en Google AdSense — Labormin

Estado del sitio (sep 2026): preparado para solicitar AdSense. Lo que falta depende de la cuenta.

## Ya listo en el código

- [x] **Publicidad etiquetada** — `<AdSlot />` siempre imprime la etiqueta "Anuncio" (regla dura del repo); nunca se disfraza como contenido.
- [x] **Colocaciones nativas**: Home (2), Empleos (in-feed cada 9), Detalle de empleo (1), Rutas de visa (1), Eventos (1).
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
4. **Revisión de contenido**: el feed cambia a diario (jobs). Si el sitio aún no está aprobado, el volumen mínimo se sostiene con las guías + FAQ + pathways + eventos.
5. **Verificación editorial final antes de aplicar**: sin errores 404, sin páginas vacías de eventos (el seed mantiene ≥ 1 evento vigente; si la lista se vacía, re-curar).

## Reglas de oro (política AdSense relevantes para este sitio)

- Nunca generar ni editar contenido de ofertas (regla #1 del repo): AdSense castiga contenido fabricado.
- Nunca enmarcar anuncios como ofertas de empleo ni ocultar la etiqueta (regla #2): penaliza la cuenta.
- Mantener el framing "verifica con el empleador" en visa (regla #3): evita reclamos engañosos.
- Los eventos y pathways solo entran con `officialUrl` verificable + `lastVerifiedAt` (regla #4).
- Salarios: solo cifras declaradas por la fuente; jamás inventar rangos (regla #1 + FAQ).
