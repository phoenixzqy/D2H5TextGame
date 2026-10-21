import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

const port = Number(process.env.PWA_PORT ?? 4354);
const baseURL = `http://127.0.0.1:${String(port)}`;

/** The separately bounded production build precedes this preview-only regression. */
export default defineConfig({
  ...production,
  testMatch: 'skills-header-layout.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 0,
  timeout: 50_000,
  outputDir: process.env.HEADER_LAYOUT_OUTPUT_DIR ?? '../../test-results/skills-header-layout',
  reporter: [['line'], ['json', { outputFile: process.env.HEADER_LAYOUT_REPORT ?? '../../test-results/skills-header-layout-report.json' }]],
  use: { ...production.use, baseURL, trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name:'header-desktop', use:{ ...devices['Desktop Chrome'], viewport:{ width:1280,height:800 } } }],
  webServer: { ...production.webServer,
    command: `node_modules/.bin/vite preview --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url:baseURL, reuseExistingServer:false, timeout:20_000 }
});
