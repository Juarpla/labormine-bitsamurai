import raw from '../data/events.json';
import { EventFileSchema, type Event } from '../schemas';

const parsed = EventFileSchema.parse(raw);

export const events: Event[] = parsed.events;

/** Eventos que aún no terminan (usando endDate si es multi-día), ordenados por fecha de inicio. */
export function upcomingEvents(): Event[] {
  const today = new Date().toISOString().slice(0, 10);
  return events
    .filter((e) => (e.endDate ?? e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function countryLabel(code: string, countryName: (c: string) => string): string {
  return code === 'PE' ? 'Perú' : countryName(code);
}
