import { locales, defaultLocale, getDictionary, languages, type Locale, type Dictionary } from '../i18n/ui';

export { languages };

export function getLangFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  if (locales.includes(first as Locale)) return first as Locale;
  return defaultLocale;
}

/** Prefix a path with the locale unless it's the default (en). */
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

/** Map of ISO-3166 alpha-2 → locale suggestion, used by /api/geo */
export const countryToLocale: Record<string, Locale> = {
  // Spanish-speaking
  AR: 'es', BO: 'es', CL: 'es', CO: 'es', CR: 'es', CU: 'es', DO: 'es', EC: 'es',
  SV: 'es', GQ: 'es', GT: 'es', HN: 'es', MX: 'es', NI: 'es', PA: 'es', PY: 'es',
  PE: 'es', PR: 'es', ES: 'es', UY: 'es', VE: 'es',
  // Portuguese-speaking
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
};

/** The 14 mining countries + Global, in UI order */
export const miningCountries = [
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'US', name: 'United States' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'CD', name: 'DR Congo' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'KZ', name: 'Kazakhstan' },
] as const;

export const GLOBAL = 'GLOBAL';

export function countryName(code: string): string {
  if (code === GLOBAL) return 'Global / Remote';
  return miningCountries.find((c) => c.code === code)?.name ?? code;
}

export { getDictionary };
export type { Locale, Dictionary };
