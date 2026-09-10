/** Globals shared by vanilla island scripts. Usuario fijo: Perú, locale es. */
declare global {
  interface Window {
    Labormin?: { country: string; nationality: string; locale: string };
    __lmIndex?: Array<Record<string, unknown>>;
  }
}

export {};
