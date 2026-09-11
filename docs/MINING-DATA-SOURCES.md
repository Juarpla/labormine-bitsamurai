# Fuentes de datos oficiales para los gráficos de Labormin

Documento de referencia para el pipeline mensual de datos que alimenta los
gráficos visuales del site (precio de cobre/oro, empleo minero mensual,
provincias con más proyectos, formalidad). Cumple la regla dura del repo:
toda cifra citada aquí es trazable a su fuente oficial y todo claim fue
verificado contra la fuente primaria el **2026-09-10**.

Método de verificación: se descargaron en vivo los archivos y endpoints
citados (GetCapabilities del WMS, queries REST, archivos XLSX/PDF del CDN de
gob.pe, API del World Bank y BCRP, listado completo de dataflows de OECD) el
2026-09-10. Lo que no se pudo confirmar en vivo está marcado explícitamente
como NO VERIFICADO.

Clasificación por método de consumo:

- **REST** — API HTTP documentada, respuesta JSON/XML consultable por URL.
- **OGC** — servicio estándar de mapas/datos geográficos (WMS/WFS/WMTS).
- **DESCARGA** — archivo (XLSX/CSV/PDF/ZIP) que se descarga de una URL estable.
- **MIXTO** — combina los anteriores.

---

## 1. GEOCATMIN — INGEMMET (catastro minero)

**URL oficial verificada:** https://geocatmin.ingemmet.gob.pe/geocatmin
(sistema de información geográfica del catastro minero, operado por INGEMMET)

**Método de consumo: MIXTO (OGC + REST + DESCARGA)**

### Servicio WMS del catastro minero (verificado en vivo)

```
https://geocatmin.ingemmet.gob.pe/arcgis/services/SERV_CATASTRO_MINERO/MapServer/WMSServer?service=WMS&request=GetCapabilities
```

- Respuesta real a la consulta (2026-09-10): XML WMS **versión 1.3.0** válido,
  título del servicio `SERV_CATASTRO_MINERO`.
- Capas expuestas: **"Catastro Minero"** (id 0) y **"Catastro Minero - DGM
  (MINEM)"** (id 1). Consumible en QGIS, ArcGIS y Google Earth.
- Para Google Earth existe además el archivo KMZ
  https://geocatmin.ingemmet.gob.pe/apps/google_earth/WMS_CATASTRO.kmz
  (HTTP 200 verificado, `application/vnd.google-earth.kmz`).

### Servicio ArcGIS REST con atributos (verificado en vivo)

```
https://geocatmin.ingemmet.gob.pe/arcgis/rest/services/SERV_CATASTRO_MINERO/MapServer
```

- Directorio de servicios con la API REST estándar de ArcGIS Server (v10.91).
- Consulta probada en vivo sobre la capa 1:
  `.../MapServer/1/query?where=1%3D1&outFields=...&f=pjson` → devuelve
  registros JSON **sin key ni token**.
- Conteo total de la capa (`returnCountOnly=true`, 2026-09-10): **2.120
  registros** en "Catastro Minero - DGM (MINEM)" (límite por consulta:
  `maxRecordCount: 1000`; el servicio **no soporta paginación**).
- Campos de la capa 1 (verificados en el schema JSON): `CODIGOU` (código del
  derecho), `CONCESION` (nombre), `TIT_CONCES` (titular), `HECTAGIS`
  (hectáreas), `ESTADO` (código de estado: p. ej. `T` titulado, `Q` en
  trámite), `DEMAGIS` (ubigeo, con lista separada por `;` cuando el derecho
  cubre varios), además de `LEYENDA`, `ESTADO_MINEM`, `FEC_DENU`.
- El campo `DEMAGIS` (ubigeo) es lo que permite agregar por **distrito /
  provincia / departamento**.

### WFS

**NO habilitado** en este servicio: la petición
`.../MapServer/WFSServer?service=WFS&request=GetCapabilities` devuelve un
error de ArcGIS Server ("Error occurred while processing request",
verificado 2026-09-10). Para geometría/atributos usar el WMS o el REST.

### Descargas y datos abiertos

- Portal de datos abiertos de INGEMMET (ArcGIS Hub, operativo, verificado):
  https://datosabiertos-ingemmet-peru.hub.arcgis.com/ — citado por la ficha
  oficial del Estado https://www.gob.pe/7665-consultar-datos-abiertos-sobre-mineria-y-geologia,
  que indica que las tablas se entregan en **hoja de cálculo, KML y
  shapefile**, con "descarga libre e ilimitada". Algunos datasets de INGEMMET
  están también alojados como servicios hospedados en ArcGIS Online (org
  GEOCATMIN, orgId `IOnDXYLCAWAfoO54`, p. ej. "GEOCATMIN - Catastro Minero",
  verificado vía búsqueda de https://www.arcgis.com/sharing/rest/search).
- La aplicación web GEOCATMIN ofrece consulta y exportación de derechos
  mineros desde su interfaz; no fue posible verificar esa función de forma
  programática (app de navegador). El camino reproducible para un pipeline es
  el WMS/REST de arriba o el Hub.

### Cadencia y cobertura

- La descripción del propio servicio declara: *"La actualización de derechos
  mineros es diaria"* (texto de `serviceDescription` del MapServer,
  verificado 2026-09-10). Cobertura: todo el territorio nacional (catastro
  minero vigente, derecho por derecho).
- Aviso del servicio: la información tiene *"carácter referencial y es solo
  de consulta"*.

### Restricciones de acceso

- Sin key, sin token, sin registro. El servidor responde con cabeceras CORS
  (verificado en la respuesta del KMZ). Consumo automático factible con
  simples GET.

### Indicador Labormin que puede alimentar

- **Provincias / departamentos con más derechos mineros activos** (ranking o
  mapa por `DEMAGIS`→ubigeo, con `HECTAGIS` y estado del derecho).
- Contexto de "dónde está la minería" para reforzar CTA en provincias
  objetivo. No confundir con *proyectos en producción*: eso lo cubre el Mapa
  de Unidades Mineras de MINEM (sección 3).

`lastVerifiedAt: 2026-09-10` (GetCapabilities WMS, query REST, count,
KMZ, Hub, schema de campos: todos probados en vivo).

---

## 2. Portal Nacional de Datos Abiertos (datos.gob.pe / datosabiertos.gob.pe)

**Hallazgo crítico:** el dominio `datos.gob.pe` **no existe hoy**. Probado con
los resolutores públicos 1.1.1.1 y 8.8.8.8 el 2026-09-10: `datos.gob.pe` y
`www.datos.gob.pe` devuelven NXDOMAIN. El portal nacional vigente es la
**Plataforma Nacional de Datos Abiertos** en
`https://www.datosabiertos.gob.pe` (resuelve vía Huawei Cloud WAF; verificado
en vivo).

**URL oficial verificada:** https://www.datosabiertos.gob.pe/

**Método de consumo: DESCARGA (no hay API utilizable)**

- Tecnología: **DKAN** (Drupal; se confirma por los assets del propio portal,
  p. ej. `/profiles/dkan/modules/dkan/dkan_dataset/...` vistos en el HTML de
  un dataset, verificado 2026-09-10).
- La ruta CKAN-compatile `/api/3/action/package_search` **no responde con
  JSON usable** (respuesta vacía/bloqueada probada con `Accept:
  application/json` el 2026-09-10). Consumo automático = scrape de páginas
  dataset o lectura de su exportación de metadatos JSON por dataset (el
  portal anuncia *"La información en esta página (los metadatos del conjunto
  de datos) también está disponible en formato (json)"*).
- Ejemplos verificados de datasets minero-enérgeticos con recursos
  descargables:
  - "Pequeña minería" — https://www.datosabiertos.gob.pe/dataset/peque%C3%B1a-miner%C3%ADa
    (recursos: ~33 CSV, 8 XLSX, 1 PDF contados en la página, 2026-09-10).
  - "Registro Especial de Comercializadores y Procesadores de Oro" —
    https://www.datosabiertos.gob.pe/dataset/registro-especial-de-comercializadores-y-procesadores-de-oro (PDF).
- Cobertura temporal: variable por dataset (registros administrativos, no
  series mensuales armadas).

**Indicador Labormin que puede alimentar:** ninguno directamente para los
gráficos mensuales. El portal publica registros (listados de titulares,
comercializadores de oro, etc.), no series estadísticas mensuales. Para las
series (producción, empleo) ir directo a MINEM y BCRP (secciones 3 y 6).

`lastVerifiedAt: 2026-09-10` (DNS, páginas de datasets, prueba de API).

---

## 3. MINEM — Boletín Estadístico Minero (BEM), empleo minero y anuarios

**URL oficial verificada (colección):**
https://www.gob.pe/institucion/minem/colecciones/12125-estadisticas-mineras
(compendio con producción, inversión y empleo; archivos en ZIP/XLSX/PDF)

**Método de consumo: DESCARGA (PDF/XLSX/ZIP de URLs del CDN oficial
cdn.www.gob.pe; sin API)**

### Empleo directo minero mensual por departamento (XLSX — verificado)

- Página del ítem: https://www.gob.pe/institucion/minem/informes-publicaciones/4291678-empleo-minero
- Archivo: https://cdn.www.gob.pe/uploads/document/file/6357723/4291678-empleo-2020-a-jun-2026.xlsx?v=1787773484
- Verificado en vivo (descarga y lectura del XLSX, 2026-09-10): hoja
  "Empleo Minero" con el cuadro **"CUADRO HISTÓRICO DE EMPLEO MINERO A NIVEL
  DEPARTAMENTAL (2020 - A JUNIO 2026)"**: matriz departamentos × meses
  (ene-dic), fuente *Declaración Estadística Mensual (ESTAMIN) - MINEM*,
  elaboración DGPSM, cifras ajustadas *"a lo reportado por los Titulares
  Mineros al 30 de julio de 2026"*.
- Cobertura: mensual, nivel nacional y departamental, 2020 → mes de referencia
  más reciente (jun-2026 en la versión descargada).
- Cadencia: se republisha como XLSX acumulado (versión citada actualizada el
  26/08/2026 según la colección).

### Boletín Estadístico Minero (mensual, PDF)

- Listado oficial: https://www.gob.pe/institucion/minem/informes-publicaciones/tipos/2-boletin
- BEM junio 2026: https://www.gob.pe/institucion/minem/informes-publicaciones/8470716-boletin-estadistico-minero-junio-2026
  → PDF: https://cdn.www.gob.pe/uploads/document/file/10440697/8470716-bem-junio-2026.pdf
- Cadencia observada (fechas de publicación de cada ítem, verificadas en el
  listado oficial el 2026-09-10): BEM de **marzo 2026 → publicado 20-may-2026**,
  **abril → 18-jun-2026**, **mayo → 21-jul-2026**, **junio → 12-ago-2026**.
  Es decir, un desfase de ~7 semanas entre el mes de referencia y la
  publicación.

### Verificación del dato "291.044 empleos directos en junio 2026 (+11,1%)"

**VERIFICADO contra la fuente primaria.** El PDF oficial del BEM junio 2026
(descargado y leído con extractores el 2026-09-10) contiene, entre otras:

- *"Junio 2026: 291,044 puestos"* y *"un total de 291,044 trabajadores"*.
- Desglose por tipo de empleador: empresas mineras 79.161 + contratistas y
  conexas 211.883 = **291.044**; serie comparada *"TOTAL 261,895 291,044
  11.1%"* (junio 2025 → junio 2026, +11.1% interanual).
- Desglose por género: *"TOTAL 266,989 24,055 291,044 100.0%"* (24.055
  mujeres, ≈8,3% del total).

Fuentes citadas:

- PDF oficial del BEM junio 2026: https://cdn.www.gob.pe/uploads/document/file/10440697/8470716-bem-junio-2026.pdf
- Nota de prensa oficial de MINEM (24-ago-2026), "MINEM: Empleo en el sector
  minero creció 11.1% en junio del 2026":
  https://www.gob.pe/institucion/minem/noticias/1434033-minem-empleo-en-el-sector-minero-crecio-11-1-en-junio-del-2026
  (HTTP 200, contiene "291,044" y "11.1%", verificado 2026-09-10).

Contexto inmediato para referencia: mayo 2026 = 287.537 empleos directos
(+9,4% interanual) — nota oficial
https://www.gob.pe/institucion/minem/noticias/1423465-minem-sector-minero-genero-mas-de-287-mil-empleos-directos-la-cifra-mas-alta-de-2026.

### Informe de Empleo Minero (anual, DAC)

- Edición 2025 (basada en la Declaración Anual Consolidada): nota oficial
  https://www.gob.pe/institucion/minem/noticias/1319728-minem-presenta-informe-de-empleo-minero-en-el-peru-2025
  (24-dic-2025) → PDF:
  https://cdn.www.gob.pe/uploads/document/file/9187931/4350615-informe-de-empleo-2025.pdf
  Analiza empleo por región, función, estrato (régimen general / PPM / PMA),
  tipo de empleador y género.

### Otros productos útiles (verificados)

- **Anuario Minero 2024** (PDF + XLSX de anexos, serie 2015-2024):
  https://www.gob.pe/institucion/minem/informes-publicaciones/6827926-anuario-minero-2024
- **Producción minera mensual** (ZIP/XLSX por año, base ESTAMIN/DAC):
  https://www.gob.pe/institucion/minem/informes-publicaciones/5472883-produccion-minera
- **Mapa de Principales Unidades Mineras en Producción 2025** (PDF + XLSX de
  unidades georreferenciadas):
  https://www.gob.pe/institucion/minem/informes-publicaciones/6911615-mapa-principales-unidades-mineras-en-produccion-2025
- **Directorio Minero 2026** (titulares con derechos vigentes, XLSX):
  https://www.gob.pe/institucion/minem/informes-publicaciones/5424978-directorio-minero-2026
- **Dashboard Estadísticas Mineras** (inversión / producción / empleo):
  https://mineria.minem.gob.pe/dashboard/ (HTTP 200 verificado 2026-09-10).
- **Listado de Mineros Formalizados** (PDF por departamento):
  https://www.gob.pe/institucion/minem/informes-publicaciones/4631669-listado-de-mineros-formalizados

### Restricciones de acceso

- Descarga libre, sin key. Sin API: el pipeline mensual debe parsear las
  páginas de colección/ítems (IDs estables en la URL) o los archivos del CDN,
  cuyas URLs incluyen parámetros de versión (`?v=`). La cadencia de los
  productos: XLSX de empleo ~última semana del mes N+2 respecto al mes de
  referencia; BEM ~semana 7 del mes N+2.

### Indicadores Labormin que puede alimentar

- **Empleo minero mensual** (serie departamental XLSX; detalle por tipo de
  empleador y género del BEM).
- **Provincias con más actividad minera en producción** (Mapa de Unidades
  Mineras, anual) y Directorio Minero para titulares vigentes.
- Contexto de formalidad: el empleo ESTAMIN es empleo **formal** declarado
  por titulares (contrasta con el empleo total ENAHO de INEI).

`lastVerifiedAt: 2026-09-10` (XLSX de empleo descargado y parseado; PDF del
BEM junio 2026 descargado y leído; fechas de publicación verificadas; nota
1434033 viva).

---

## 4. INEI — ENAHO, censos y series de empleo

**URL oficial verificada (portal de microdatos):**
https://proyectos.inei.gob.pe/microdatos/ (sistema "Microdatos" del INEI,
verificado en vivo el 2026-09-10)

**Método de consumo: DESCARGA (app web con formularios; sin API pública)**

- El portal declara entregar *"las bases de datos y la documentación"*
  de las encuestas del INEI *"en formatos compatibles y de amplia divulgación
  (SPSS, Microsoft Excel, Acrobat Reader)"* (texto del propio portal,
  verificado).
- La encuesta se elige en el flujo AJAX "Consulta por Encuestas"
  (`https://proyectos.inei.gob.pe/microdatos/Consulta_por_Encuesta.asp?CU=19558`,
  verificado en vivo). El listado incluye los módulos ENAHO relevantes para
  empleo: *"Condiciones de Vida y Pobreza - ENAHO"*, *"Empleo e Ingreso -
  ENAHO"*, *"Educacion, Salud, Aspectos Demograficos, Empleo e Ingresos -
  ENAHO"*, etc. Cada módulo/año se descarga navegando el formulario (ZIP con
  bases .sav y documentación PDF).
- Cobertura: ENAHO continua anual (con módulos mensuales/trimestrales de
  empleo); censos económicos y otras encuestas aparecen en el mismo catálogo.
- **NO VERIFICADO en esta sesión:** el sistema ANDA de documentación de
  microdatos (https://anda.inei.gob.pe) no respondió (HTTP 000, inaccesible
  desde esta red el 2026-09-10).
- Catálogo de bases de datos del INEI (página oficial con la descripción de
  MICRODATOS y ANDA): https://www.inei.gob.pe/bases-de-datos
- Índice temático de estadísticas de minería:
  https://www.inei.gob.pe/estadisticas/indice-tematico/mining1

### Informe de Empleo (trimestral, ENAHO) — verificado

- Biblioteca virtual: https://www.inei.gob.pe/biblioteca-virtual/boletines/informe-de-empleo/1
  — edición vigente al 2026-09-10: *"Informe de Empleo N° 7 - Trimestre:
  Abr_May-Jun 2026"*, publicado el 15/07/2026 (PDF). Cadencia: mensual
  visible en el listado (un informe por trimestre móvil), PDF.

### Restricciones de acceso

- Sin API, sin key; requiere aceptar condiciones y navegar formularios para
  cada módulo. Los microdatos son pesados (bases .sav por módulo/año). Para
  automatización realista: descargar una vez por año el módulo 500 (empleo)
  de ENAHO; no es un feed mensual.

### Indicador Labormin que puede alimentar

- **Formalidad / informalidad en el empleo minero** y comparación
  minería-vs-resto-de-sectores (gráficos anuales o trimestrales estáticos).
- No es la fuente para el gráfico mensual de empleo (eso es MINEM/ESTAMIN,
  sección 3).

`lastVerifiedAt: 2026-09-10` (portal de microdatos y listado de módulos
ENAHO probados en vivo; Informe de Empleo N°7 verificado; ANDA: NO
VERIFICADO).

---

## 5. OECD / World Bank — precios de cobre/oro e indicadores minerales

### World Bank — "Pink Sheet" (Commodity Price Data) — VERIFICADO

**URL oficial verificada:** https://www.worldbank.org/en/research/commodity-markets

**Método de consumo: DESCARGA (XLSX mensual) — los precios de commodities NO
están en la API estándar `api.worldbank.org`**

- Archivo mensual vigente (XLSX, descargado y parseado el 2026-09-10):
  https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx
  (`Last-Modified: Wed, 02 Sep 2026 20:17:37 GMT` — edición septiembre 2026).
- Contenido verificado: hoja "Monthly Prices" (precios mensuales en USD
  nominales, 1960→presente, 806 filas), con columnas **Copper** y **Gold**.
  Últimos valores parseados:
  - Cobre: 2026M06 = **13.552 USD/mt**, 2026M07 = **13.543 USD/mt**,
    2026M08 = **14.326 USD/mt**.
  - Oro: 2026M06 = **4.228 USD/oz t**, 2026M07 = **4.073 USD/oz t**,
    2026M08 = **4.411 USD/oz t**.
- Cadencia: actualización el **2.º día hábil de cada mes** (la propia página
  oficial lo declara: *"Next update: October 2, 2026"* y el catálogo de datos
  https://datacatalog.worldbank.org/search/dataset/0038238/commodity-prices-history-and-projections
  dice *"Commodity prices are updated in the second business day of the
  month"*). El dato publicado en el mes N+1 corresponde al promedio del mes N
  (rezago ~1 mes).
- Cobertura: serie mundial (cotas globales, no específicas de Perú),
  mensual/ anual, en USD.
- Restricciones: sin key; licencia abierta (el catálogo enlaza a
  https://datacatalog.worldbank.org/public-licenses#cc-by).
- Existe también el archivo anual
  (`CMO-Historical-Data-Annual.xlsx`) en la misma carpeta
  `https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/`.
  Ojo: URLs antiguas de la misma ruta con doc-IDs previos (p. ej.
  `5d903e848db1d1b83e0ec8f744e55570-0350012021`) siguen sirviendo el archivo
  pero **congelado** (`Last-Modified: 03-ene-2025`, verificado) — usar
  siempre el doc-ID vigente publicado en
  https://www.worldbank.org/en/research/commodity-markets.

### api.worldbank.org (REST, sin key) — VERIFICADO

- Endpoint general: `https://api.worldbank.org/v2/country/PER/indicator/{CÓDIGO}?format=json`
- Indicadores probados en vivo el 2026-09-10:
  - `TX.VAL.MMTL.ZS.UN` — *"Ores and metals exports (% of merchandise
    exports)"* (WDI): Perú 2022 = 43,1; 2023 = 51,3; 2024 = **47,8%** de las
    exportaciones de mercancías. Serie anual.
  - `NY.GDP.MINR.RT.ZS` — *"Mineral rents (% of GDP)"* (WDI): el indicador
    existe, pero los valores de Perú 2022-2025 llegan `null` (la serie WDI va
    con rezago); último dato usable es anterior a 2022.
- Cobertura: anual, nivel país. Útil para gráficos anuales de contexto
  ("la minería es X% de las exportaciones del Perú").

### OECD — NO usable para precios de cobre/oro (verificado)

- API SDMX REST pública (sin key): `https://sdmx.oecd.org/public/rest/`
  (documentada en https://sdmx.oecd.org/public).
- Verificación negativa: se descargó el listado completo de dataflows de
  todas las agencias
  (`https://sdmx.oecd.org/public/rest/dataflow/all/all/latest`, ~8,9 MB,
  2026-09-10) y **no existe ningún dataset de precios de commodities
  metálicos** (no hay MEI ni series de cobre/oro; solo índices de precios al
  consumidor/HICP, precios de productores G20 y precios de vivienda). El
  histórico MEI con precios de commodities fue retirado en la migración a
  SDMX.
- Conclusión: para precios mensuales de cobre/oro, OECD no es una opción;
  usar el Pink Sheet (World Bank) o FRED/IMF (abajo).

### Alternativa REST sin key (FRED, redistribuye al IMF) — VERIFICADA para cobre

- `https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCOPPUSDM` — CSV sin
  key (serie IMF "Global price of Copper", USD/mt, mensual; última
  observación 2026-07 = 13.542,82, consistente con el Pink Sheet 13.543).
  Fuente en FRED: https://fred.stlouisfed.org/series/PCOPPUSDM
  (crédito: International Monetary Fund via FRED).
- El espejo de oro mensual en FRED no se pudo verificar en esta sesión
  (la petición fue bloqueada); el oro queda cubierto por el Pink Sheet.

`lastVerifiedAt: 2026-09-10` (XLSX Pink Sheet vigente descargado y parseado;
queries api.worldbank.org ejecutadas; dataflows OECD enumerados; FRED CSV
descargado).

---

## 6. (Adicional, verificada) BCRP — serie estadística REST de producción minera peruana

**URL oficial verificada:** https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/produccion-minera-e-hidrocarburos-miles-de-unidades-recuperables

**Método de consumo: REST (JSON, sin key)**

- Endpoint probado en vivo (2026-09-10):
  `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/{CÓDIGO}/json/{DESDE}/{HASTA}`
  - `PN01873AM` — Minería Metálica - Cobre (miles de toneladas): jun-2026 =
    **196,4**.
  - `PN01876AM` — Minería Metálica - Oro (la ficha del catálogo dice
    "Kilogramos"; la magnitud de la serie — ~10-11 por mes en 2026 —
    corresponde a **toneladas**; verificar la unidad en la ficha antes de
    publicar): jun-2026 = 10,41.
- Serie mensual desde ene-2000; el listado oficial muestra actualización
  20-ago-2026 con datos hasta jun-2026 (fuente declarada por BCRP: INEI y
  MINEM).
- Restricciones: sin key, CORS abierto; cadencia: días después de la
  publicación de ESTAMIN.

**Indicador Labormin:** producción mensual de cobre/oro en Perú (contexto
"el sector está en plena actividad") con la vía de automatización más barata
de todas las revisadas.

`lastVerifiedAt: 2026-09-10` (queries REST ejecutadas).

---

## 7. Yahoo Finance — cotizaciones de las mineras con operaciones en Perú

**URL oficial verificada:** https://finance.yahoo.com/ (endpoint público de
gráficos, sin API key: `https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?range=1y&interval=1mo`)

**Método de consumo: REST (JSON sin key)**

- Verificado en vivo el 2026-09-10 (~07:20 UTC) para los 8 tickers del seed:
  `meta.regularMarketPrice` (precio actual), `meta.chartPreviousClose` (cierre
  previo a la ventana de 1 año → base de la variación anual),
  `meta.fiftyTwoWeekHigh/Low` (máximo/mínimo de 52 semanas) y
  `indicators.quote[0].close` (cierres mensuales, 12 meses + mes en curso).
- Yahoo es un **agregador de mercado**, no la fuente primaria del precio; el
  dato es de referencia y la UI lo declara ("Cotizaciones de referencia en
  dólares (ADR cuando corresponde) · No es asesoría de inversión"). Los
  metadatos de empresa (nombre comercial, minas en Perú, metal) son curados a
  mano en `scripts/ingest-stocks.mjs` — Yahoo nunca los edita.
- **Empresas del seed (curadas, todas con operaciones en Perú):** BVN
  (Buenaventura, NYSE), SCCO (Southern Copper, NYSE), FCX (Freeport-McMoRan —
  mayoritario de Cerro Verde, NYSE), NEXA (Nexa Resources, NYSE), HBM (Hudbay
  Minerals, NYSE), NEM (Newmont — Yanacocha, NYSE), HCHDF (Hochschild Mining,
  OTC; ref. LSE: HOC), NGLOY (Anglo American — Quellaveco, OTC; ref. LSE: AAL).
  Se eligen **ADR/OTC en USD** para que todo sea comparable para el público
  general (sin libras/pence de la LSE); la variación % coincide con la
  cotización de Londres, el precio absoluto no.
- Restricciones: **rate limit por IP** (HTTP 429 — probado en vivo; la ráfaga
  inicial de 8 peticiones desde una IP puede quedar racionada por un rato). El
  script trae reintentos con backoff (4/9/15 s) y 1,2 s entre tickers; el cron
  mensual de CI (IP distinta cada corrida) es el caso nominal. Si un ticker
  falla se conserva su fila previa (patrón del pipeline del pulso).
- No confundir con la BVL: las cotizaciones limeñas en Yahoo (sufijo .LM) son
  intermitentes y poco líquidas; el seed solo usa tickers NYSE/OTC confiables.

`lastVerifiedAt: 2026-09-10` (endpoint v8 probado en vivo para los 8 tickers;
429 por ráfaga documentado).

---

## 8. Eventos de reclutamiento — webs oficiales de las ferias grandes + Facebook (Apify)

**Sección:** /eventos → "Ferias y reclutamiento" (`src/data/events-scraped.json`,
escrito por `scripts/ingest-events.mjs`; cron semanal domingo en
`refresh-events.yml`). Framing visible: badge "Agregado automáticamente" + CTA
"verificar con el organizador"; el seed curado (`events.json`) siempre gana el
dedup. Nada se publica sin fecha completa y futura; títulos verbatim, sin
traducción.

### 1. Webs oficiales de las ferias grandes (keyless, 0 costo) — VERIFICADAS

| Feria | URL oficial | Estado verificado 2026-09-11 |
| --- | --- | --- |
| EXPOMINA PERÚ | https://expominaperu.com/ | 2026 (9–11 set) — en el seed curado |
| PERUMIN | https://www.perumin.com/ | PERUMIN 38 set 2027 — en el seed curado |
| CONAMIN | https://conamin.ciplima.org.pe/ | XVI: 15–19 jun 2026, TECSUP Trujillo (ya pasada); XVII sin anunciar. Confirmada por Resolución Viceministerial N° 0125-2025-MINEM/VMM |
| proEXPLO | https://proexplo.com.pe/es | XV: 4–6 may 2026, Lima (ya pasada); proEXPLO 2028 con comité designado, fecha sin anunciar. Oficializada por Resolución de Secretaría General N° 0173-2026-RE |

Método: JSON-LD `schema.org/Event` + regex de fechas en español ("del 15 al 19
de junio de 2026") sobre el texto visible. Solo entra una fecha completa
(YYYY-MM-DD); la frase hallada va a `notes`. Fallback por sitio si bloquea
bots: `apify/cheerio-scraper`. El watcher detecta la próxima edición de
CONAMIN/proEXPLO en cuanto el organizador la publique.

### 2. Facebook publicaciones (no Eventos) vía Apify — VERIFICADO 2026-09-11

Decisión 2026-09-11: los canales de FB Events (scrapesage páginas-eventos +
keyword-eventos en 2 etapas) se retiraron — las convocatorias peruanas viven
casi siempre como **publicaciones** de páginas/grupos, no como Eventos FB.
Solo entra un post que **anuncia un evento fechado**: primera fecha completa
futura del texto vía regex (determinista, sin LLM); la frase de la fecha va
verbatim a `notes`; el título del evento es la primera línea del texto
verbatim (los posts no tienen título; truncada a 200 chars). La fecha de la
publicación NO es la fecha del evento — nunca se confunden.

- **Posts de páginas curadas** (`apify~facebook-posts-scraper`): input
  verificado — `startUrls` (lista), `resultsLimit` (cap), `onlyPostsNewerThan`
  ('6 months' acota el escaneo); salida `text`/`url`/`postId`/`pageName`/
  `time`/`timestamp`. Precio ≈ $5–8/1k posts. Sin login. Seed: SENATI,
  TECSUP, Antamina, Cerro Verde, Nexa, Buenaventura (slugs verificados por
  HTTP 200 el 2026-09-11); extender en `FB_PAGES_SEED`.
- **Búsqueda de posts por keyword** (`powerai~facebook-post-search-scraper`):
  input verificado — `query` + `maxResults` (mínimo 10). $4.99/1k, pure
  pay-per-result. 210k corridas. **Prueba en vivo 2026-09-11**: devuelve
  resultados reales de Perú ("CONVOCATORIA MINERA – YAULI, JUNÍN",
  "CONVOCATORIA MINERA EVS, UM Millotingo") — pero FB raciona la búsqueda y
  el actor "termina OK" con 0 items de forma intermitente (corridas vacías
  facturan $0, así que el script reintenta una vez). Queries: `feria laboral
  minería`, `convocatoria minera`, `feria de empleo minera`; exige señal
  minera/laboral, señal de EVENTO (feria|charla|jornada|congreso|… — los
  posts de puro job-call NO entran, decisión 2026-09-11) y señal Perú
  (virtual permitido). La búsqueda puede devolver posts de grupos públicos;
  el gate decide qué entra. Grupos específicos ("Bolsa de trabajo minería
  Perú"…): fase 2 con validación de ruido propia.
- Ambos canales comparten el cap 30/corrida (páginas primero, búsqueda llena
  el resto); dedupe intra-FB por postId/URL. Presupuesto posts ≈ $0.25/mo a
  cadencia semanal → total global < $2.4/mo dentro del plan free ($5). Formato
  de actor en la API: `username~actor-name` (¡tilde, no slash!).

`lastVerifiedAt: 2026-09-11` (4 webs oficiales verificadas; resoluciones
oficiales citadas; estado del login-wall de Facebook documentado por los
actores el 2026-08).

---

## Resumen rápido

| Fuente | Método | Consumo automático | Frecuencia | Indicador Labormin |
| --- | --- | --- | --- | --- |
| GEOCATMIN (INGEMMET) | MIXTO (WMS OGC + REST + descargas Hub) | Sí, sin key | Diaria (catastro) | Provincias/deptos con más derechos mineros |
| datosabiertos.gob.pe | DESCARGA (DKAN; sin API) | Solo scraping | Variable | Registros; no series mensuales |
| MINEM (BEM, empleo, anuarios) | DESCARGA (XLSX/PDF) | Scraping de URLs del CDN | Mensual (rezago ~7 sem.) | Empleo directo mensual por departamento; unidades en producción |
| INEI (ENAHO) | DESCARGA (microdatos .sav, sin API) | Difícil, por formularios | Anual/trimestral | Formalidad y ocupación por sector (anual) |
| World Bank Pink Sheet | DESCARGA (XLSX) | Sí, sin key | 2.º día hábil del mes | Precio cobre/oro (USD, global) |
| api.worldbank.org | REST | Sí, sin key | Anual (WDI) | Exportaciones minerales % Perú |
| OECD SDMX | REST (sin datos de precios) | n/a | n/a | — (no sirve para cobre/oro) |
| FRED (espejo IMF) | DESCARGA CSV (sin key) | Sí | Mensual | Precio cobre (USD/mt) |
| BCRP | REST JSON | Sí, sin key | Mensual (rezago días) | Producción cobre/oro Perú |
| Yahoo Finance | REST (sin key, rate limit) | Sí, con backoff | Mensual (día 4) | Cotización anual de las mineras con minas en Perú |

---

## Recomendación para el pipeline mensual

Pipeline mensual (cron de GitHub Actions, mismo patrón que `refresh-jobs.yml`),
en orden de automatización:

1. **Precio del cobre y oro** ← World Bank Pink Sheet
   `CMO-Historical-Data-Monthly.xlsx` (doc-ID vigente de
   worldbank.org/en/research/commodity-markets) ← DESCARGA XLSX el día 3-4 de
   cada mes; parsear columnas `Copper` y `Gold` de la hoja "Monthly Prices".
   Respaldo: FRED CSV para cobre. NO usar OECD (no existe el dataset). Para
   gráfico: último valor + variación intermensual/interanual.
2. **Empleo minero mensual** ← MINEM XLSX "Empleo Minero"
   (`4291678-empleo-2020-a-…xlsx`, URL del ítem
   /institucion/minem/informes-publicaciones/4291678-empleo-minero) ←
   DESCARGA ~fin de mes; matriz departamentos×meses. Detalle por tipo de
   empleador y género: del PDF del BEM del mes (URL del listado
   /informes-publicaciones/tipos/2-boletin). Para el gráfico: serie 2020→hoy
   + top 3 departamentos (Arequipa, La Libertad, Ica según el BEM de
   mayo/junio 2026). Cada cifra publicada en el site debe citar el PDF/XLSX
   de origen y llevar `lastVerifiedAt`.
3. **Producción minera peruana (contexto)** ← BCRP REST JSON
   (`PN01873AM` cobre, `PN01876AM` oro) — la llamada más barata del pipeline;
   corre el mismo cron.
4. **Provincias con más actividad minera** ← combinación: GEOCATMIN
   (derechos mineros activos por ubigeo vía REST/WMS, actualización diaria;
   conteo de derechos y hectáreas por provincia) + Mapa de Unidades Mineras
   en Producción de MINEM (anual, XLSX) para diferenciar "en producción" de
   "en exploración". Para el mapa del site basta el XLSX anual; el WMS sirve
   si se quiere un mapa vivo en el frontend (embed de tiles del WMS).
5. **Formalidad** ← el empleo ESTAMIN de MINEM ya es empleo formal reportado
   por titulares (usar ese framing). Complemento anual opcional: ENAHO de
   INEI (módulo empleo) para tasa de informalidad del sector; costo de
   automatización alto, mejor regenerarlo cada 6-12 meses a mano.

## Implementación v1 (2026-09-10)

Lo que efectivamente corre hoy (con `scripts/ingest-indicators.mjs` + cron
mensual `.github/workflows/refresh-indicators.yml`, día 4 a las 06:00 UTC):

- **Precio del cobre y del oro** ← Pink Sheet del World Bank, tal como se
  recomendó arriba: el script lee la página oficial cada corrida para obtener
  el doc-ID vigente (la URL rota por edición), descarga el
  `CMO-Historical-Data-Monthly.xlsx`, parsea las columnas `Copper`/`Gold` y
  guarda los últimos 24 meses en `src/data/indicators.json`
  (`copper-price` / `gold-price`).
- **Unidades metálicas en producción por departamento** ← XLSX del Mapa de
  Principales Unidades Mineras en Producción (MINEM, ed. 2025): el script
  descarga el XLSX del CDN, filtra `TIPO DE SUSTANCIA = MINERÍA METÁLICA` y
  agrega por `DEPARTAMENTO` (ranking `departments`).
- **Ofertas publicadas por semana** ← NO se ingesta: se computa en build a
  partir de `src/data/jobs.json` (`postingsTrend()` en `src/lib/indicators.ts`),
  así queda siempre sincronizada con el cron diario del feed.
- **Empleo minero formal (291.044, jun-2026, +11,1%)** ← bloque `sector`
  **curado a mano** (mismo patrón que pathways/events): cifras del BEM jun-2026
  verificadas contra el PDF oficial el 2026-09-10, con `officialUrl` +
  `lastVerifiedAt`. El script lo preserva; la verificación mensual es manual.
- **GEOCATMIN REST/WMS: fuera del pipeline automatizado** — dos bloqueos
  verificados hoy: (a) el servidor envía solo el certificado hoja (verify code
  21; OpenSSL/node no hace AIA, y el host `geocatminapp` no responde por
  HTTPS), lo que rompería el CI; (b) el catastro no tiene feature service
  hospedada en ArcGIS Online (el Web Map apunta al servidor on-prem). Queda
  documentado como vía futura para un mapa vivo (habría que implementar
  fetching de AIA o usar el KMZ/Hub).
- **Dependencia nueva**: `xlsx` (devDependency, solo para scripts; no llega al
  bundle del site).

### Cotizaciones de las mineras (regenerada el 2026-09-11 con el seed de 12, mismo cron)

- **`scripts/ingest-stocks.mjs`** (mismo ritmo mensual, día 4 — corre en el
  mismo workflow que el pulso): endpoint v8 de Yahoo Finance para los 12
  tickers del seed curado; guarda precio, cierre de hace un año, variación
  anual, máximo/mínimo de 52 semanas y la serie de cierres mensuales en
  `src/data/stocks.json` (esquema `StocksFileSchema` en `src/schemas.ts`).
- **Normalización a USD**: los ADR/OTC ya cotizan en dólares (HCHDF, NGLOY).
  MMG (1208.HK, HKD) y Glencore (GLEN.L, peniques GBp) se normalizan con el
  tipo de cambio público de Yahoo (`USDHKD=X`, `GBPUSD=X` + ÷100): aritmética
  sobre datos reales, nunca inventados. La variación % es independiente de la
  moneda, así que el ranking no cambia.
- Los metadatos de empresa (nombre comercial, ticker, minas en Perú, metal)
  viven curados en el script: para añadir una empresa, extender
  `COMPANIES_SEED` ahí. Seed actual (12): BVN, SCCO, FCX, NEXA, HBM, NEM,
  HCHDF, NGLOY, MMG (Las Bambas), BHP (Antamina), Glencore (Antamina),
  Teck (Antamina 22,5%). First Quantum queda fuera (sin mina operante en
  Perú) y Chinalco/Toromocho fuera (sin proxy listado confiable: ACH da un
  dato incoherente).
- La sección "Las mineras con mejor crecimiento en bolsa" (`StocksPulse.astro`
  en el home) muestra la franja compacta "El año en revisión" (ganadora,
  rezagada, cuántas cotizan a menos de 10% de su máximo con una fila de
  puntos por empresa), el top 3 por variación anual y un CTA a `/bolsa`.
  La página `/bolsa` (`BolsaView.astro`) lleva el análisis completo: el
  termómetro 52s de las 12, la caída desde la cima, el mejor/peor mes, los
  metales (cobre/oro del pulso) y una tabla ordenable donde cada nombre enlaza
  a `/jobs?q=<minera>`. Disclaimer permanente: no es asesoría de inversión.

Si una fuente falla o cambia de formato, el script conserva los datos previos
y su `lastVerifiedAt` (que envejece visible en la UI: "verificado {fecha}")
y lo reporta como WARNING sin romper el build.

---

Nota de cumplimiento: ninguna de estas fuentes exige key ni prohíbe el
consumo automático; el World Bank es CC BY (atribuir), y el catastro de
GEOCATMIN es referencial (mostrar como contexto, no como oferta laboral).

