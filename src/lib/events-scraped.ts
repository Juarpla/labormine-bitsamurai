import raw from '../data/events-scraped.json';
import { ScrapedEventFileSchema, type ScrapedEvent } from '../schemas';
import { events as curatedEvents } from './events';

const parsed = ScrapedEventFileSchema.parse(raw);

/** Normaliza un título para dedup: lowercase, sin acentos ni puntuación. */
export function normEventTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const curatedKeys = new Set(
  curatedEvents.map((e) => `${normEventTitle(e.title)}|${e.date}`)
);
const curatedHosts = new Set(
  curatedEvents.map((e) => {
    try {
      return new URL(e.officialUrl).host.replace(/^www\./, '');
    } catch {
      return e.officialUrl;
    }
  })
);

/** El seed curado siempre gana: se oculta el scrapeado cuando coincide en
 *  título normalizado + fecha, o cuando su URL apunta al mismo sitio oficial. */
function isDuplicateOfCurated(e: ScrapedEvent): boolean {
  if (curatedKeys.has(`${normEventTitle(e.title)}|${e.date}`)) return true;
  try {
    return curatedHosts.has(new URL(e.officialUrl).host.replace(/^www\./, ''));
  } catch {
    return false;
  }
}

export const scrapedEvents: ScrapedEvent[] = parsed.events.filter(
  (e) => !isDuplicateOfCurated(e)
);

/** Eventos scrapeados que aún no terminan (endDate si es multi-día),
 *  ordenados por fecha de inicio. */
export function upcomingScrapedEvents(): ScrapedEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return scrapedEvents
    .filter((e) => (e.endDate ?? e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}
