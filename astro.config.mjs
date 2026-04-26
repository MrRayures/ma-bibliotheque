// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** @type {import('vite').Plugin} */
const devApiMock = {
  name: 'dev-api-mock',
  apply: 'serve',
  configureServer(server) {
    const dataPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      'src/dev-data.json',
    );

    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();

      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      // GET /api/library.php → données de dev
      if (req.url === '/api/library.php' && req.method === 'GET') {
        res.end(readFileSync(dataPath, 'utf-8'));
        return;
      }

      // POST /api/login.php → connexion toujours acceptée en dev, renvoie un token opaque
      if (req.url === '/api/login.php' && req.method === 'POST') {
        res.end(JSON.stringify({ ok: true, token: 'dev-session-token' }));
        return;
      }

      // POST /api/library.php → écriture ignorée en dev
      if (req.url?.startsWith('/api/library.php') && req.method === 'POST') {
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      next();
    });
  },
};

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), devApiMock],
  },
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: false, // on gère le manifest nous-mêmes dans public/
      workbox: {
        // Précache tous les assets statiques générés par Astro
        globPatterns: ['**/*.{html,js,css,svg,png,webp,avif,woff2}'],
        globIgnores: ['icons/icon-*.png', 'icons/apple-touch-icon.png'],
        // Stratégie réseau-en-premier pour les pages HTML
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ol-covers',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // désactivé en dev pour éviter les conflits
      },
    }),
  ],
});
