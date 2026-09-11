#!/usr/bin/env node
/**
 * Ingesta mensual de cotizaciones de las mineras con operaciones en Perú
 * (mismo cron que scripts/ingest-indicators.mjs — día 4 de cada mes).
 *
 * Fuente (verificada 2026-09-10 — ver docs/MINING-DATA-SOURCES.md):
 *  - Yahoo Finance, endpoint público de gráficos v8 (sin API key):
 *      https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?range=1y&interval=1mo
 *    Devuelve el precio actual (meta.regularMarketPrice), el cierre previo a la
 *    ventana (chartPreviousClose), el máximo/mínimo de 52 semanas y la serie
 *    de cierres mensuales del año.
 *
 * La lista de empresas es CURADA A MANO (mismo patrón que pathways/events y
 * que el bloque `sector` de indicators): nombre comercial + ticker + minas en
 * Perú. Para añadir una empresa, exténcele aquí. Este script solo pide
 * precios; nunca edita los metadatos curados.
 *
 * Reglas duras: nada se inventa. Si un ticker falla (429, símbolo muerto,
 * serie incompleta), se conserva su fila anterior con su fecha y el script lo
 * reporta como WARNING. La primera vez que una empresa no tiene datos, no
 * entra al JSON.
 *
 * Los ADR/OTC se eligen para que TODO esté en dólares (comparable y sin
 * peniques de la LSE para el público general): HCHDF (Hochschild, ADR 1:10)
 * y NGLOY (Anglo American, ADR). La variación % es la misma que la cotización
 * de Londres; el precio absoluto no.
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'src/data/stocks.json');
const TODAY = new Date().toISOString().slice(0, 10);

const SOURCE = {
  id: 'yahoo-finance',
  name: 'Yahoo Finance',
  officialUrl: 'https://finance.yahoo.com/',
  lastVerifiedAt: TODAY,
};

/** Empresas curadas con operaciones mineras en Perú (extendible por el owner).
 *  ticker: el que consulta Yahoo; exchange/exchangeRef: etiqueta visible. */
const COMPANIES_SEED = [
  {
    id: 'buenaventura',
    name: 'Buenaventura',
    ticker: 'BVN',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'oro',
    mines: 'El Brocal (Pasco) · Yumpag (Lima)',
  },
  {
    id: 'southern-copper',
    name: 'Southern Copper',
    ticker: 'SCCO',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'cobre',
    mines: 'Toquepala y Cuajone (Moquegua–Tacna) · fundición de Ilo',
  },
  {
    id: 'freeport',
    name: 'Freeport-McMoRan',
    ticker: 'FCX',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'cobre',
    mines: 'Cerro Verde (Arequipa)',
  },
  {
    id: 'nexa',
    name: 'Nexa Resources',
    ticker: 'NEXA',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'zinc',
    mines: 'Cerro Lindo (Ica) · Cajamarquilla (Lima)',
  },
  {
    id: 'hudbay',
    name: 'Hudbay Minerals',
    ticker: 'HBM',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'cobre',
    mines: 'Constancia (Cusco)',
  },
  {
    id: 'newmont',
    name: 'Newmont',
    ticker: 'NEM',
    exchange: 'NYSE',
    exchangeRef: null,
    metal: 'oro',
    mines: 'Yanacocha (Cajamarca)',
  },
  {
    id: 'hochschild',
    name: 'Hochschild Mining',
    ticker: 'HCHDF',
    exchange: 'OTC',
    exchangeRef: 'LSE: HOC',
    metal: 'oro',
    mines: 'Inmaculada (Ayacucho)',
  },
  {
    id: 'anglo-american',
    name: 'Anglo American',
    ticker: 'NGLOY',
    exchange: 'OTC',
    exchangeRef: 'LSE: AAL',
    metal: 'cobre',
    mines: 'Quellaveco (Moquegua)',
  },
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET con reintentos y backoff ante 429/5xx (Yahoo raciona por IP). */
function fetchJson(url, retries = 3) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }, async (res) => {
        if ((res.statusCode === 429 || res.statusCode >= 500) && retries > 0) {
          res.resume();
          const wait = [4000, 9000, 15000][3 - retries] ?? 15000;
          console.log(`  · HTTP ${res.statusCode} en ${url.split('/chart/')[1]} — reintento en ${wait / 1000}s`);
          await sleep(wait);
          return resolve(fetchJson(url, retries - 1));
        }
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error('respuesta no-JSON'));
          }
        });
      })
      .on('error', reject);
  });
}

async function fetchChart(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=1y&interval=1mo`;
  const j = await fetchJson(url);
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error('sin resultados');
  const meta = res.meta ?? {};
  const closes = (res.indicators?.quote?.[0]?.close ?? []).filter((v) => v != null && Number.isFinite(v));
  const price = Number(meta.regularMarketPrice);
  if (!Number.isFinite(price) || price <= 0) throw new Error('precio inválido');
  if (closes.length < 6) throw new Error(`serie incompleta (${closes.length} cierres)`);
  return {
    price,
    yearAgoClose: Number.isFinite(Number(meta.chartPreviousClose)) ? Number(meta.chartPreviousClose) : closes[0],
    high52w: Number.isFinite(Number(meta.fiftyTwoWeekHigh)) ? Number(meta.fiftyTwoWeekHigh) : null,
    low52w: Number.isFinite(Number(meta.fiftyTwoWeekLow)) ? Number(meta.fiftyTwoWeekLow) : null,
    series: closes,
  };
}

// ── Ejecución ──────────────────────────────────────────────────────────────

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const prevByTicker = new Map((prev?.companies ?? []).map((c) => [c.ticker, c]));

const companies = [];
const failed = [];

for (const seed of COMPANIES_SEED) {
  try {
    const q = await fetchChart(seed.ticker);
    const change1yPct =
      q.yearAgoClose > 0 ? ((q.price - q.yearAgoClose) / q.yearAgoClose) * 100 : null;
    companies.push({
      ...seed,
      currency: 'USD',
      price: q.price,
      yearAgoClose: q.yearAgoClose,
      change1yPct,
      high52w: q.high52w,
      low52w: q.low52w,
      series: q.series,
    });
    const pctTxt =
      change1yPct != null
        ? `${change1yPct >= 0 ? '+' : ''}${change1yPct.toFixed(1)}% en el año`
        : 'sin variación computable';
    console.log(
      `OK ${seed.ticker}: US$${q.price.toFixed(2)} · ${pctTxt} · 52s ${
        q.low52w != null ? q.low52w.toFixed(2) : '?'
      }–${q.high52w != null ? q.high52w.toFixed(2) : '?'}`
    );
  } catch (e) {
    if (prevByTicker.has(seed.ticker)) {
      companies.push(prevByTicker.get(seed.ticker));
      console.warn(`WARNING ${seed.ticker} (${e.message}) — se conservan datos previos`);
    } else {
      failed.push(seed.ticker);
      console.warn(`WARNING ${seed.ticker} (${e.message}) — sin datos previos, la empresa no entra este mes`);
    }
  }
  await sleep(1200);
}

if (companies.length === 0) {
  console.error('ERROR: ninguna empresa tiene datos — no se escribe el archivo.');
  process.exit(1);
}

const out = {
  generatedAt: new Date().toISOString(),
  source: SOURCE,
  companies,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `Escrito: ${path.relative(ROOT, OUT)} (${companies.length} empresas${
    failed.length ? `, fallidas nuevas: ${failed.join(', ')}` : ''
  })`
);
