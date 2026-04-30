import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT) : 4173;
const e2eWebServerCommand = process.platform === 'win32'
  ? `set VITE_E2E=true&& npm run build && npm run preview -- --port ${String(e2ePort)}`
  : `VITE_E2E=true npm run build && VITE_E2E=true npm run preview -- --port ${String(e2ePort)}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: 'playwright-report',
  use: {
    baseURL: `http://localhost:${String(process.env.E2E_PORT ?? 4173)}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // P04 — per-project grepInvert + tag taxonomy.
  //
  // Tagging convention (one of the following appears in the test/describe
  // title — title text after the tag is irrelevant to the matcher):
  //   • @desktop-only — runs only in `chromium-desktop`. Reasons include:
  //       hover/keyboard focus, large-viewport-only layout assertions, dev
  //       tooling, engine-only invariants where layout doesn't matter, or
  //       the spec self-overrides its own viewport (so a single project
  //       run is sufficient).
  //   • @mobile-only — runs only in `mobile-portrait`. Reasons include:
  //       bottom-nav layout, mobile bottom-sheet, touch-target sizing,
  //       360×640 overflow assertions.
  //   • @responsive — must run in BOTH projects because the spec asserts
  //       a property that genuinely varies (or must be verified) across
  //       desktop/mobile shapes. Untagged is treated as @responsive (no
  //       grepInvert hit ⇒ runs in both projects). The current allow-list:
  //
  //       affix-rolls.spec.ts ……………… loot/affix flow per locale × viewport
  //       card-ui.spec.ts …………………… class-select / character / mercs cards
  //       combat-map-flow.spec.ts ……… combat ↔ map navigation + idle gating
  //       equip-compare-table-layout … 3-col table at 1280 AND 360
  //       equip-compare-ux-v2.spec.ts … bug-evidence screenshots both VPs
  //       i18n.spec.ts …………………………… locale switch invariant in both layouts
  //       playthrough.spec.ts ………… all 11 screens captured at desktop+mobile
  //       save-load.spec.ts ……………… export/reload round-trip both layouts
  //       smoke.spec.ts (default test) … home page loads in both shapes
  //       tooltip-edge-clip.spec.ts (top-level) … tooltip clip at BOTH VPs
  //       visual-fixes — Issues 3/4a/5 — Combat layout (per-VP branches)
  //       welcome-gate.spec.ts ……… settings-from-welcome routing both VPs
  //
  //   `grepInvert` is OR-ed across the matcher source, so a single regex
  //   per project is sufficient. Untagged specs match neither inversion
  //   pattern and therefore run in both projects (the conservative
  //   default — when in doubt, leave a spec untagged or use @responsive).
  // ─────────────────────────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium-desktop',
      grepInvert: /@mobile-only/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'mobile-portrait',
      grepInvert: /@desktop-only/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 }
      }
    }
  ],

  webServer: {
    command: e2eWebServerCommand,
    port: e2ePort,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      VITE_E2E: 'true'
    }
  }
});
