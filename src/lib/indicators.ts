import raw from '../data/indicators.json';
import { IndicatorsFileSchema, type IndicatorPoint, type IndicatorSeries } from '../schemas';
import { jobs } from './jobs';

const parsed = IndicatorsFileSchema.parse(raw);
export const indicators = parsed;

export function seriesById(id: string): IndicatorSeries | undefined {
  return indicators.series.find((s) => s.id === id);
}

/** Último punto de la serie (el más reciente). */
export function latest(series: IndicatorSeries): IndicatorPoint | undefined {
  return series.points.at(-1);
}

/** Variación % interanual: último punto vs. el del mismo mes del año anterior. */
export function yoyPct(series: IndicatorSeries): number | null {
  const last = latest(series);
  if (!last) return null;
  const yearAgo = series.points.find((p) => {
    const [, m] = last.date.split('-');
    return p.date === `${Number(last.date.slice(0, 4)) - 1}-${m}`;
  });
  if (!yearAgo || !yearAgo.value) return null;
  return ((last.value - yearAgo.value) / yearAgo.value) * 100;
}

/** Top `n` departamentos por unidades metálicas en producción. */
export function topDepartments(n = 5) {
  return indicators.departments?.rows.slice(0, n) ?? [];
}

/** Buckets semanales de ofertas publicadas (lunes UTC), últimos ≤12 con datos.
 *  Computado del feed en build: siempre sincronizado con el cron diario. */
export function postingsTrend(): IndicatorPoint[] {
  const byWeek = new Map<string, number>();
  for (const j of jobs) {
    const d = new Date(j.postedAt);
    const day = (d.getUTCDay() + 6) % 7; // lunes = 0
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    const key = start.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  return [...byWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-12)
    .map(([date, value]) => ({ date, value }));
}

/** Total de ofertas activas del feed (los tres tiers del nicho). */
export function activePostings(): number {
  return jobs.length;
}

const nf = new Intl.NumberFormat('es-PE');
export function formatN(n: number): string {
  return nf.format(Math.round(n));
}

const monthFmt = new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric' });
/** "2026-08" (o ISO completo) → "ago 2026" */
export function fmtMonth(iso: string): string {
  return monthFmt.format(new Date(`${iso.slice(0, 10)}-01T12:00:00Z`));
}

const dayFmt = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
/** "2026-09-10" (o ISO completo) → "10 sep 2026" */
export function fmtDay(iso: string): string {
  return dayFmt.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
}

/** "+5,8" / "−2,1" con signo unicode para chips. */
export function signedPct(pct: number | null): string | null {
  if (pct === null || !Number.isFinite(pct)) return null;
  const rounded = Math.abs(pct) < 0.05 ? 0 : Math.round(pct * 10) / 10;
  const str = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(Math.abs(rounded));
  return `${rounded >= 0 ? '+' : '−'}${str}`;
}
