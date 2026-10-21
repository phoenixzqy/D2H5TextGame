import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

const port = Number(process.env.PWA_PORT ?? 4367);
const baseURL = `http://127.0.0.1:${String(port)}`;

/** Preview only: run the clean production bridge/build gate before this spec. */
export default defineConfig({
  ...production,
  testMatch: 'meditation.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 90_000,
  outputDir: process.env.MEDITATION_OUTPUT_DIR ?? '../../test-results/meditation',
  reporter: [['line'], ['json', { outputFile: process.env.MEDITATION_REPORT ?? '../../test-results/meditation-report.json' }]],
  use: { ...production.use, baseURL, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'meditation-production', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: { ...production.webServer,
    command: `node_modules/.bin/vite preview --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000 }
});
