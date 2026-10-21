import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

const port = Number(process.env.PWA_PORT ?? 4365);
const baseURL = `http://127.0.0.1:${String(port)}`;

/** Run after the clean production bridge/build gate; preview never rebuilds retained output. */
export default defineConfig({
  ...production,
  testMatch: 'skeleton-mastery.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  timeout: 50_000,
  outputDir: process.env.SKELETON_MASTERY_OUTPUT_DIR ?? '../../test-results/skeleton-mastery',
  reporter: [['line'], ['json', { outputFile: process.env.SKELETON_MASTERY_REPORT ?? '../../test-results/skeleton-mastery-report.json' }]],
  use: { ...production.use, baseURL, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'skeleton-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    
  ],
  webServer: { ...production.webServer,
    command: `node_modules/.bin/vite preview --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000 }
});
