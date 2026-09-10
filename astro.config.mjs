// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://labormin.com',
  output: 'static',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  // No route uses Astro.session; disabling avoids requiring a SESSION KV
  // namespace binding in the deployed Worker.
  session: false,
  // /ops/* es el panel interno — fuera del sitemap público.
  integrations: [sitemap({ filter: (page) => !page.includes('/ops/') })],
  i18n: {
    defaultLocale: 'es',
    // Solo español: la audiencia es Perú/LatAm hispanohablante (en/pt quedaron fuera del build)
    locales: ['es'],
    prefixDefaultLocale: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
