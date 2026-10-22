import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

const port = Number(process.env.PWA_PORT ?? 4398);
const baseURL = `http://127.0.0.1:${String(port)}`;
const dist = process.env.CORPSE_DIST ?? 'dist';
const quotedDist = `'${dist.replace(/'/g, "'\\''")}'`;

/** Run the clean production build/bridge scan before this preview-only acceptance. */
export default defineConfig({
  ...production,
  testMatch: 'corpse-explosion.spec.ts',
  fullyParallel: false, workers: 1, retries: 0, maxFailures: 1, timeout: 90_000,
  outputDir: process.env.CORPSE_OUTPUT_DIR ?? '../../test-results/corpse-explosion',
  reporter: [['line'], ['json', { outputFile: process.env.CORPSE_REPORT ?? '../../test-results/corpse-explosion-report.json' }]],
  use: { ...production.use, baseURL, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'corpse-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'corpse-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } }
  ],
  webServer: { ...production.webServer,
    command: `node_modules/.bin/vite preview --outDir ${quotedDist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000 }
});
