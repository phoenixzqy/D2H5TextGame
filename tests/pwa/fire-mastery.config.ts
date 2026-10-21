import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

const port = Number(process.env.PWA_PORT ?? 4349);
const baseURL = `http://127.0.0.1:${String(port)}`;

/** Run after the clean production bridge/build gate; preview never rebuilds retained output. */
export default defineConfig({
  ...production,
  testMatch: 'fire-mastery.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 50_000,
  outputDir: process.env.FIRE_MASTERY_OUTPUT_DIR ?? '../../test-results/fire-mastery',
  reporter: [['line'], ['json', { outputFile: process.env.FIRE_MASTERY_REPORT ?? '../../test-results/fire-mastery-report.json' }]],
  use: { ...production.use, baseURL, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'mastery-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mastery-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } }
  ],
  webServer: { ...production.webServer,
    command: `node_modules/.bin/vite preview --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000 }
});
