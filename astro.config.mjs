// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// En GitHub Actions, SITE_URL y BASE_PATH llegan desde actions/configure-pages,
// así el sitio funciona igual en usuario.github.io/repo o con dominio propio.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

// Origen de Supabase (si está configurado) para permitirlo en la política de seguridad
let supabase = 'https://*.supabase.co';
try {
  if (process.env.PUBLIC_SUPABASE_URL) supabase = new URL(process.env.PUBLIC_SUPABASE_URL).origin;
} catch {
  /* URL inválida: se deja el comodín de supabase.co */
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [
    preact(),
    sitemap({ filter: (pagina) => !pagina.includes('/admin') }),
  ],
  image: {
    // Fotos subidas desde el panel: se descargan y optimizan al construir el sitio
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  security: {
    // Content Security Policy: solo se ejecutan los scripts y estilos del propio sitio
    csp: {
      directives: [
        "default-src 'self'",
        `img-src 'self' data: blob: ${supabase}`,
        `connect-src 'self' ${supabase}`,
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
