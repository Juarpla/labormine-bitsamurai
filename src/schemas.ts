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
  category: z.string(),
  salary: SalarySchema,
  postedAt: z.string(),
  url: z.string().url(),
  description: z.string(),
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

export type Job = z.infer<typeof JobSchema>;
export type Salary = z.infer<typeof SalarySchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
