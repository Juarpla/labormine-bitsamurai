import raw from '../data/stocks.json';
import { StocksFileSchema, type StockCompany } from '../schemas';

const parsed = StocksFileSchema.parse(raw);
export const stocks = parsed;

/** Empresas ordenadas por variación anual desc; sin datos al final. */
export function companiesRanked(): StockCompany[] {
  return [...stocks.companies].sort((a, b) => {
    const ca = a.change1yPct ?? -Infinity;
    const cb = b.change1yPct ?? -Infinity;
    return cb - ca;
  });
}

/** Top `n` por variación anual (solo con datos computables). */
export function topPerformers(n = 3): StockCompany[] {
  return companiesRanked().filter((c) => c.change1yPct != null).slice(0, n);
}

/** Ganadora y rezagada del año (con variación computable); null si no alcanza. */
export function extremes(): { top: StockCompany; bottom: StockCompany } | null {
  const withData = stocks.companies.filter((c) => c.change1yPct != null);
  if (withData.length < 2) return null;
  const sorted = [...withData].sort((a, b) => b.change1yPct! - a.change1yPct!);
  return { top: sorted[0], bottom: sorted.at(-1)! };
}

/** Empresas que cotizan a menos de `thresholdPct` de su máximo de 52 semanas. */
export function countNearHigh(thresholdPct = 10): number {
  return stocks.companies.filter(
    (c) => c.high52w && c.change1yPct != null && c.price >= c.high52w * (1 - thresholdPct / 100)
  ).length;
}

/** Posición del precio actual dentro del rango 52s (0 = mín, 1 = máx). */
export function rangePos(c: StockCompany): number | null {
  if (!c.high52w || !c.low52w || c.high52w <= c.low52w) return null;
  return Math.min(1, Math.max(0, (c.price - c.low52w) / (c.high52w - c.low52w)));
}

/** Cuánto cayó del máximo de 52 semanas, en % (negativo; null sin datos). */
export function drawdownPct(c: StockCompany): number | null {
  if (!c.high52w || !c.price || c.high52w <= 0) return null;
  return (c.price / c.high52w) * 100 - 100;
}

/** ¿Cotiza a menos de `thresholdPct` de su máximo anual? (para la fila de puntos). */
export function isNearHigh(c: StockCompany, thresholdPct = 10): boolean {
  return c.high52w != null && c.change1yPct != null && c.price >= c.high52w * (1 - thresholdPct / 100);
}

/** Mejor y peor mes de la serie: variación % entre cierres consecutivos,
 *  con el índice del mes dentro de la serie (para etiquetar desde generatedAt). */
export function monthExtremes(
  c: StockCompany
): { best: { pct: number; index: number }; worst: { pct: number; index: number } } | null {
  if (c.series.length < 3) return null;
  let best = { pct: -Infinity, index: 1 };
  let worst = { pct: Infinity, index: 1 };
  for (let i = 1; i < c.series.length; i++) {
    const prev = c.series[i - 1];
    if (prev <= 0) continue;
    const pct = ((c.series[i] - prev) / prev) * 100;
    if (pct > best.pct) best = { pct, index: i };
    if (pct < worst.pct) worst = { pct, index: i };
  }
  if (!Number.isFinite(best.pct) || !Number.isFinite(worst.pct)) return null;
  return { best, worst };
}

const usdFmt = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
/** 29.4 → "US$ 29.40" con formato es-PE. */
export function fmtUSD(n: number): string {
  return usdFmt.format(n);
}
