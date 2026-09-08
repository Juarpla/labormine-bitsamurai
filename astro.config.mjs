// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://labormine.com',
  output: 'static',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt'],
    prefixDefaultLocale: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
