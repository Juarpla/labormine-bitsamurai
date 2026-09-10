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

/** Curated mining event (manual seed, official source required — never scraped). */
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

export type Job = z.infer<typeof JobSchema>;
export type Salary = z.infer<typeof SalarySchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type Event = z.infer<typeof EventSchema>;
