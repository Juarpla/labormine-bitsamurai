import { z } from 'astro/zod';

export const SalarySchema = z
  .object({
    min: z.number(),
    max: z.number().nullable(),
    currency: z.string(),
    period: z.enum(['year', 'month', 'day', 'hour']).default('year'),
  })
  .nullable();

export const JobSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  company: z.string(),
  companySlug: z.string(),
  source: z.string(),
  /** ISO-3166 alpha-2 of a supported mining country, or "GLOBAL" */
  country: z.string(),
  city: z.string().nullable(),
  locationRaw: z.string(),
  remote: z.boolean(),
  /** Heuristic visa-sponsorship signal — shown as "reported", never guaranteed */
  visaReported: z.boolean(),
  /** Listing source explicitly opens the job to international candidates
   *  (e.g. Canada Job Bank with the international-candidates filter). */
  openToInternational: z.boolean().optional(),
  /** Detectado en ingest por heurística de título/descripción: práctica
   *  (pre)profesional, trainee o becario. Se lista solo en /practicas (Perú). */
  internship: z.boolean().optional(),
  category: z.string(),
  salary: SalarySchema,
  postedAt: z.string(),
  url: z.string().url(),
  description: z.string(),
  /** Auto-translated job titles (descriptions are only AI-translated on demand, view-layer). */
  translations: z
    .object({
      es: z.string().optional(),
      en: z.string().optional(),
      pt: z.string().optional(),
    })
    .optional(),
});

export const JobFileSchema = z.object({
  generatedAt: z.string(),
  jobs: z.array(JobSchema),
});

export const PathwaySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['working-holiday', 'temporary', 'student', 'sponsorship', 'skilled']),
  /** Destination country (ISO-2) */
  country: z.string(),
  /** ISO-2 nationality codes. null = open to all nationalities */
  eligibleNationalities: z.array(z.string()).nullable(),
  ageRange: z.string().nullable(),
  duration: z.string(),
  workRights: z.string(),
  officialUrl: z.string().url(),
  notes: z.string().optional(),
  lastVerifiedAt: z.string(),
});

/** Evento minero curado a mano: seed oficial verificado a mano (officialUrl +
 *  lastVerifiedAt reales). Nunca recibe contenido de la ingesta automática —
 *  los eventos scrapeados viven en ScrapedEventSchema (events-scraped.json),
 *  siempre se muestran con badge y el seed curado gana el dedup. */
export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** presencial: only Peru. virtual: Peru or the mining powers. */
  mode: z.enum(['presencial', 'virtual']),
  type: z.enum(['feria-laboral', 'expo', 'conferencia', 'webinar']),
  /** ISO-2: PE for presencial; PE/CL/CA/US/AU for virtual */
  country: z.string(),
  city: z.string().nullable(),
  /** ISO date (YYYY-MM-DD) — start */
  date: z.string(),
  /** ISO date (YYYY-MM-DD), optional — last day of multi-day events */
  endDate: z.string().optional(),
  officialUrl: z.string().url(),
  notes: z.string().optional(),
  lastVerifiedAt: z.string(),
});

export const EventFileSchema = z.object({
  generatedAt: z.string(),
  events: z.array(EventSchema),
});

/** Evento detectado automáticamente (web oficial del organizador o una
 *  publicación de Facebook que anuncia un evento fechado) por
 *  scripts/ingest-events.mjs. Nivel de confianza MENOR que el seed curado:
 *  la UI siempre muestra el badge "Agregado automáticamente" y el CTA es
 *  "verificar con el organizador". type se infere por keywords (fallback
 *  'otro'). En los posts el título es la primera línea del texto verbatim
 *  (los posts no tienen título) y la fecha sale por regex del texto: nunca se
 *  inventa — sin fecha completa futura el evento no entra. */
export const ScrapedEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** presencial: only Peru. virtual: Peru or the mining powers. */
  mode: z.enum(['presencial', 'virtual']),
  type: z.enum(['feria-laboral', 'expo', 'conferencia', 'webinar', 'otro']),
  /** v1: PE only */
  country: z.string(),
  city: z.string().nullable(),
  /** ISO date (YYYY-MM-DD) — start */
  date: z.string(),
  /** ISO date (YYYY-MM-DD), optional — last day of multi-day events */
  endDate: z.string().optional(),
  /** Event page at the source (site of the organizer or the platform listing) */
  officialUrl: z.string().url(),
  organizer: z.string().nullable(),
  source: z.enum(['web-oficial', 'facebook-post']),
  /** Date (YYYY-MM-DD) of the run that first captured it */
  scrapedAt: z.string(),
  /** Date (YYYY-MM-DD) of the last run that saw it (TTL reference) */
  lastSeenAt: z.string(),
  notes: z.string().optional(),
});

export const ScrapedEventFileSchema = z.object({
  generatedAt: z.string(),
  events: z.array(ScrapedEventSchema),
});

/** Punto mensual de una serie de indicadores (fecha YYYY-MM). */
export const IndicatorPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

/** Serie de indicadores generada por scripts/ingest-indicators.mjs (cron mensual). */
export const IndicatorSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  sourceId: z.string(),
  points: z.array(IndicatorPointSchema),
});

/** Ranking de unidades metálicas en producción por departamento (MINEM, anual). */
export const DepartmentsSchema = z.object({
  sourceId: z.string(),
  label: z.string(),
  totalMetallic: z.number(),
  totalAll: z.number(),
  rows: z.array(z.object({ name: z.string(), count: z.number() })),
});

/** Cifra curada a mano del empleo minero formal (BEM MINEM, mensual). */
export const EmploymentStatSchema = z.object({
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  period: z.string(),
  changeYoYPct: z.number(),
  breakdown: z.array(z.object({ label: z.string(), value: z.number() })),
  note: z.string(),
  officialUrl: z.string().url(),
  lastVerifiedAt: z.string(),
});

export const IndicatorSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  officialUrl: z.string().url(),
  lastVerifiedAt: z.string(),
});

export const IndicatorsFileSchema = z.object({
  generatedAt: z.string(),
  series: z.array(IndicatorSeriesSchema),
  departments: DepartmentsSchema.nullable(),
  sector: z.object({ employment: EmploymentStatSchema.nullable() }),
  sources: z.array(IndicatorSourceSchema),
});

/** Cotización mensual de una minera listada (Yahoo Finance, ADR en USD).
 *  name/ticker/exchange/metal/mines son CURADOS en scripts/ingest-stocks.mjs;
 *  los números los produce la ingesta. */
export const StockCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  exchange: z.string(),
  exchangeRef: z.string().nullable(),
  metal: z.string(),
  mines: z.string(),
  currency: z.string(),
  price: z.number(),
  yearAgoClose: z.number(),
  change1yPct: z.number().nullable(),
  high52w: z.number().nullable(),
  low52w: z.number().nullable(),
  series: z.array(z.number()),
});

export const StocksFileSchema = z.object({
  generatedAt: z.string(),
  source: IndicatorSourceSchema,
  companies: z.array(StockCompanySchema),
});

export type Job = z.infer<typeof JobSchema>;
export type Salary = z.infer<typeof SalarySchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type Event = z.infer<typeof EventSchema>;
export type ScrapedEvent = z.infer<typeof ScrapedEventSchema>;
export type IndicatorSeries = z.infer<typeof IndicatorSeriesSchema>;
export type IndicatorPoint = z.infer<typeof IndicatorPointSchema>;
export type Departments = z.infer<typeof DepartmentsSchema>;
export type EmploymentStat = z.infer<typeof EmploymentStatSchema>;
export type StockCompany = z.infer<typeof StockCompanySchema>;
