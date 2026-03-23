// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: false, // on gère le manifest nous-mêmes dans public/
      workbox: {
        // Précache tous les assets statiques générés par Astro
        globPatterns: ['**/*.{html,js,css,svg,png,webp,avif,woff2}'],
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
