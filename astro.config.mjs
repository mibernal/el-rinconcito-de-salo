// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// En GitHub Actions, SITE_URL y BASE_PATH llegan desde actions/configure-pages,
// así el sitio funciona igual en usuario.github.io/repo o con dominio propio.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
