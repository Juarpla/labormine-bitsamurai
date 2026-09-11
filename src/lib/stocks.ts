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

const usdFmt = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
/** 29.4 → "US$ 29.40" con formato es-PE. */
export function fmtUSD(n: number): string {
  return usdFmt.format(n);
}
