import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const port = Number(process.env.PWA_PORT ?? 4597);
const dist = process.env.AMAZON_VOLLEY_DIST, output = process.env.AMAZON_VOLLEY_OUTPUT, report = process.env.AMAZON_VOLLEY_REPORT;
if (!dist || !output || !report) throw new Error('Set task-isolated AMAZON_VOLLEY_DIST, OUTPUT and REPORT');
const quotedDist = "'" + dist.replaceAll("'", "'\\''") + "'";
export default defineConfig({
  testDir: '.', testMatch: 'amazon-volley-acceptance.spec.ts', workers: 1,
  fullyParallel: false, retries: 0, maxFailures: 1, timeout: 180_000,
  outputDir: output, reporter: [['line'], ['json', { outputFile: report }]],
  use: { baseURL: `http://127.0.0.1:${String(port)}`, serviceWorkers: 'allow',
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'amazon-volley-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'amazon-volley-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } }
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${quotedDist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`, reuseExistingServer: false, timeout: 30_000
  }
});
