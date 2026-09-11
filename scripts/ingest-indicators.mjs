#!/usr/bin/env node
/**
 * Ingesta mensual de indicadores del sector minero (1 vez al mes, cron CI).
 *
 * Fuentes (verificadas 2026-09-10 — ver docs/MINING-DATA-SOURCES.md):
 *  1. World Bank "Pink Sheet" (CMO-Historical-Data-Monthly.xlsx) — precios
 *     mensuales de cobre y oro (USD, promedio del mes).
 *  2. MINEM — Mapa de Principales Unidades Mineras en Producción (XLSX anual)
 *     — unidades metálicas en producción por departamento.
 *  3. Tendencia de ofertas publicadas — NO se ingesta: se computa en build a
 *     partir de src/data/jobs.json (ver src/lib/indicators.ts).
 *
 * Reglas duras: nada se inventa. Cada serie trae `sourceId` y su entrada en
 * `sources` lleva `officialUrl` + `lastVerifiedAt` (la fecha en que este
 * script la leyó con éxito). Si una fuente falla, conserva sus datos y su
 * fecha anteriores y el script lo reporta como WARNING.
 *
 * El bloque `sector` es CURADO A MANO (mismo patrón que pathways/events):
 * cifras verificadas contra el PDF oficial con `officialUrl` + `lastVerifiedAt`.
 * Este script lo preserva tal cual y lo siembra solo si el archivo no existe.
 *
 * GEOCATMIN (WMS/REST on-prem) queda fuera del pipeline: el servidor envía
 * una cadena TLS incompleta (verify code 21) y no hospeda feature service en
 * ArcGIS Online. Documentado en docs/MINING-DATA-SOURCES.md para un futuro
 * mapa vivo con manejo de AIA.
 */

import { createRequire } from 'node:module';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require2 = createRequire(import.meta.url);
const { read, utils } = require2('xlsx');

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'src/data/indicators.json');
const TODAY = new Date().toISOString().slice(0, 10);

/** Datos curados del BEM jun-2026 (verificados contra el PDF oficial 2026-09-10). */
const SECTOR_SEED = {
  employment: {
    label: 'Empleo minero formal',
    value: 291044,
    unit: 'puestos formales',
    period: '2026-06',
    changeYoYPct: 11.1,
    breakdown: [
      { label: 'Empresas mineras', value: 79161 },
      { label: 'Contratistas y conexos', value: 211883 },
    ],
    note: 'Empleo directo formal declarado por titulares mineros (ESTAMIN) al Boletín Estadístico Minero de MINEM.',
    officialUrl:
      'https://cdn.www.gob.pe/uploads/document/file/10440697/8470716-bem-junio-2026.pdf',
    lastVerifiedAt: '2026-09-10',
  },
};

const MINEM_UNITS_ITEM =
  'https://www.gob.pe/institucion/minem/informes-publicaciones/6911615-mapa-principales-unidades-mineras-en-produccion-2025';
const PINK_SHEET_PAGE = 'https://www.worldbank.org/en/research/commodity-markets';
const PINK_SHEET_KNOWN =
  'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx';

function fetchBuf(url, redirects = 4) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Labormin ingest)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects <= 0) return reject(new Error('Demasiados redirects: ' + url));
          return resolve(fetchBuf(new URL(res.headers.location, url).href, redirects - 1));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function fetchText(url) {
  return (await fetchBuf(url)).toString();
}

/** Serie mensual de un commodity del Pink Sheet, últimos `n` meses con dato. */
function parsePinkSheet(buf, n = 24) {
  const wb = read(buf);
  const ws = wb.Sheets['Monthly Prices'];
  if (!ws) throw new Error('Pink Sheet: falta la hoja "Monthly Prices"');
  const rows = utils.sheet_to_json(ws, { header: 1, defval: null });

  const headerRow = rows.findIndex((r) => r.some((c) => typeof c === 'string' && /copper/i.test(c)));
  if (headerRow < 0) throw new Error('Pink Sheet: no se encontró la columna Copper');
  const header = rows[headerRow];
  const colOf = (name) => header.findIndex((c) => typeof c === 'string' && c.toLowerCase().includes(name));

  const points = { copper: [], gold: [] };
  for (const row of rows.slice(headerRow + 2)) {
    const d = typeof row[0] === 'string' && /^(\d{4})M(\d{2})$/.exec(row[0]);
    if (!d) continue;
    const date = `${d[1]}-${d[2]}`;
    for (const [key, name] of [
      ['copper', 'copper'],
      ['gold', 'gold'],
    ]) {
      const col = colOf(name);
      const v = Number(row[col]);
      if (Number.isFinite(v)) points[key].push({ date, value: v });
    }
  }
  if (points.copper.length < n) throw new Error(`Pink Sheet: solo ${points.copper.length} puntos de cobre`);
  return {
    copper: points.copper.slice(-n),
    gold: points.gold.slice(-n),
  };
}

/** Unidades mineras METÁLICAS en producción por departamento (XLSX anual MINEM). */
async function parseMinemUnits() {
  const html = await fetchText(MINEM_UNITS_ITEM);
  const xlsxUrl = html.match(/https:\/\/cdn\.www\.gob\.pe\/uploads\/document\/file\/[^"]+\.xlsx[^"]*/)?.[0];
  if (!xlsxUrl) throw new Error('MINEM: no se encontró el XLSX del mapa de unidades');
  const wb = read(await fetchBuf(xlsxUrl));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = utils.sheet_to_json(ws, { header: 1, defval: null });

  const headerRow = rows.findIndex((r) => r.some((c) => c === 'DEPARTAMENTO'));
  if (headerRow < 0) throw new Error('MINEM: no se encontró la fila de encabezado');
  const header = rows[headerRow];
  const colDep = header.indexOf('DEPARTAMENTO');
  const colTipo = header.indexOf('TIPO DE SUSTANCIA');

  const metallic = new Map();
  let totalAll = 0;
  for (const row of rows.slice(headerRow + 1)) {
    if (!row?.[colDep]) continue;
    totalAll += 1;
    if (row[colTipo] === 'MINERÍA METÁLICA') {
      const dep = row[colDep].trim();
      metallic.set(dep, (metallic.get(dep) ?? 0) + 1);
    }
  }
  if (metallic.size < 5) throw new Error(`MINEM: solo ${metallic.size} departamentos metálicos`);

  const rowsOut = [...metallic.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name: titleCase(name), count }));
  return { rows: rowsOut, totalMetallic: [...metallic.values()].reduce((a, b) => a + b, 0), totalAll };
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Ejecución ──────────────────────────────────────────────────────────────

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const out = {
  generatedAt: new Date().toISOString(),
  series: [],
  departments: null,
  sector: prev?.sector ?? SECTOR_SEED, // curado a mano: se preserva, se siembra si falta
  sources: [],
};

// 1) Pink Sheet — precios de cobre y oro
try {
  let xlsxUrl;
  try {
    // El doc-ID de la URL rota por edición: leerlo de la página oficial cada mes.
    const page = await fetchText(PINK_SHEET_PAGE);
    xlsxUrl = page.match(/https:\/\/thedocs\.worldbank\.org[^"'\s]*CMO-Historical-Data-Monthly\.xlsx/)?.[0];
  } catch {
    // sin la página, probar el doc-ID conocido
  }
  if (!xlsxUrl) xlsxUrl = PINK_SHEET_KNOWN;
  const data = parsePinkSheet(await fetchBuf(xlsxUrl));
  out.series.push(
    {
      id: 'copper-price',
      label: 'Precio del cobre',
      unit: 'USD/tm',
      sourceId: 'wb-pink-sheet',
      points: data.copper,
    },
    {
      id: 'gold-price',
      label: 'Precio del oro',
      unit: 'USD/oz',
      sourceId: 'wb-pink-sheet',
      points: data.gold,
    }
  );
  out.sources.push({
    id: 'wb-pink-sheet',
    name: 'Banco Mundial — Commodity Price Data (Pink Sheet)',
    officialUrl: PINK_SHEET_PAGE,
    lastVerifiedAt: TODAY,
  });
  console.log(`OK pink-sheet: cobre ${data.copper.length} pts, oro ${data.gold.length} pts (último ${data.copper.at(-1).date})`);
} catch (e) {
  if (prev?.series?.length) {
    const src = prev.sources.find((s) => s.id === 'wb-pink-sheet');
    out.series = prev.series.filter((s) => s.sourceId === 'wb-pink-sheet');
    if (src) out.sources.push(src);
    console.warn(`WARNING pink-sheet (${e.message}) — se conservan datos de ${src?.lastVerifiedAt}`);
  } else {
    console.warn(`WARNING pink-sheet (${e.message}) — sin datos previos, la serie no nace este mes`);
  }
}

// 2) MINEM — unidades en producción por departamento
try {
  out.departments = { sourceId: 'minem-units-map', label: 'Unidades mineras en producción', ...(await parseMinemUnits()) };
  out.sources.push({
    id: 'minem-units-map',
    name: 'MINEM — Mapa de Principales Unidades Mineras en Producción (edición anual vigente)',
    officialUrl: MINEM_UNITS_ITEM,
    lastVerifiedAt: TODAY,
  });
  console.log(`OK minem-units: ${out.departments.totalMetallic} unidades metálicas en ${out.departments.rows.length} departamentos`);
} catch (e) {
  if (prev?.departments) {
    out.departments = prev.departments;
    const src = prev.sources.find((s) => s.id === 'minem-units-map');
    if (src) out.sources.push(src);
    console.warn(`WARNING minem-units (${e.message}) — se conservan datos de ${src?.lastVerifiedAt}`);
  } else {
    console.warn(`WARNING minem-units (${e.message}) — sin datos previos, el ranking no nace este mes`);
  }
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');

const aged = [];
for (const src of out.sources) {
  const days = Math.round((Date.now() - new Date(src.lastVerifiedAt).getTime()) / 86400000);
  if (days > 60) aged.push(`${src.id} (${days} días)`);
}
if (aged.length) console.warn(`WARNING lastVerifiedAt antiguo (>60 días): ${aged.join(', ')}`);
console.log(`Escrito: ${path.relative(ROOT, OUT)}`);
