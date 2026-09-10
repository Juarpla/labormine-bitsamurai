import { locales, defaultLocale, getDictionary, languages, type Locale, type Dictionary } from '../i18n/ui';

export { languages };

export function getLangFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  if (locales.includes(first as Locale)) return first as Locale;
  return defaultLocale;
}

/** Prefix a path with the locale unless it's the default (es). */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

export function useTranslations(locale: Locale) {
  const dict: Dictionary = getDictionary(locale);
  return function t(key: keyof Dictionary, params?: Record<string, string | number>): string {
    let text: string = dict[key] ?? (key as string);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}

/** The niche mining countries, in UI priority order (Peru first) + Global */
export const miningCountries = [
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'CA', name: 'Canadá' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'AU', name: 'Australia' },
] as const;

/** Fixed user context: the niche launches Peru-first (peruano = país y nacionalidad). */
export const DEFAULT_COUNTRY = 'PE';
export const DEFAULT_NATIONALITY = 'PE';

export const GLOBAL = 'GLOBAL';

export function countryName(code: string): string {
  if (code === GLOBAL) return 'Global / Remoto';
  return miningCountries.find((c) => c.code === code)?.name ?? code;
}

export { getDictionary, defaultLocale };
export type { Locale, Dictionary };
