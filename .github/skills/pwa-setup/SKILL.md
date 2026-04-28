---
name: pwa-setup
description: Configure or audit Progressive Web App support in this Vite + React + TypeScript repo using vite-plugin-pwa (Workbox). Use when wiring up the manifest, service worker, offline support, install prompt, icons, or precaching of game-data JSON.
---

# PWA Setup Skill

This game must be installable and offline-capable on **desktop and mobile** via a single PWA codebase.

## Required configuration

### 1. Install
```sh
npm i -D vite-plugin-pwa workbox-window
```

### 2. `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: '暗黑2 H5',
        short_name: 'D2H5',
        description: 'Diablo 2-inspired text ARPG',
        theme_color: '#0b0b0d',
        background_color: '#0b0b0d',
        display: 'standalone',
        orientation: 'any',
        lang: 'zh-CN',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/locales\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'i18n' },
          },
        ],
      },
    }),
  ],
});
```

### 3. Required icons in `public/icons/`
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, with safe zone padding)

### 4. App entry registration
```ts
// src/app/main.tsx
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
```

### 5. Acceptance checks
- `npm run build && npm run preview`, then in DevTools → Application:
  - Manifest is valid (no errors)
  - Service worker is **activated**
  - "Install" prompt appears on Chrome desktop and Android
- Offline: stop dev server, reload — app shell loads, last-cached map data plays.
- Lighthouse PWA category score ≥ 90.

## Don'ts
- Don't precache user save data (saves live in IndexedDB).
- Don't use `injectManifest` mode unless we need a hand-written SW.
- Don't fetch game data from a third-party origin without adding a `runtimeCaching` rule.
