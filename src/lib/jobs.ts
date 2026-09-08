import raw from '../data/jobs.json';
import { JobFileSchema, type Job } from '../schemas';
import { GLOBAL, type Locale } from './i18n';

export const jobs: Job[] = JobFileSchema.parse(raw).jobs;
export const generatedAt: string = JobFileSchema.parse(raw).generatedAt;

export type JobIndexEntry = {
  id: string;
  slug: string;
  title: string;
  company: string;
  country: string;
  city: string | null;
  remote: boolean;
  visaReported: boolean;
  category: string;
  postedAt: string;
  salaryText: string | null;
  excerpt: string;
};

/** Lightweight index embedded into pages for client-side hydration */
export function jobIndex(): JobIndexEntry[] {
  return jobs.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    country: j.country,
    city: j.city,
    remote: j.remote,
    visaReported: j.visaReported,
    category: j.category,
    postedAt: j.postedAt,
    salaryText: formatSalary(j),
    excerpt: j.excerpt,
  }));
}

export function getJob(slug: string): Job | undefined {
  return jobs.find((j) => j.slug === slug);
}

export function byCountry(code: string): Job[] {
  return jobs.filter((j) => j.country === code);
}

export function remoteJobs(): Job[] {
  return jobs.filter((j) => j.remote);
}

/** Top N countries by job count (excluding Global) for spotlight chapters */
export function spotlightCountries(n = 3): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    if (j.country === GLOBAL) continue;
    counts.set(j.country, (counts.get(j.country) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function relatedJobs(job: Job, n = 4): Job[] {
  return jobs
    .filter((j) => j.id !== job.id && (j.country === job.country || j.category === job.category))
    .slice(0, n);
}

export function formatSalary(job: Job): string | null {
  if (!job.salary) return null;
  const { min, max, currency, period } = job.salary;
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  const range = max ? `${fmt(min)}–${fmt(max)}` : `${fmt(min)}+`;
  const suffix = period === 'year' ? '/yr' : period === 'month' ? '/mo' : period === 'day' ? '/day' : '/hr';
  return `${range} ${currency}${suffix}`;
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(iso));
}

export const categoryOrder = [
  'exploration', 'drill-blast', 'geology', 'hse', 'maintenance',
  'processing', 'engineering', 'operations', 'other',
];
