import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PWA_PORT ?? 4515);
const dist = process.env.PERIODIC_SPELLS_DIST;
const output = process.env.PERIODIC_SPELLS_OUTPUT, report = process.env.PERIODIC_SPELLS_REPORT;
if (!dist || !output || !report) throw new Error('Set PERIODIC_SPELLS_DIST, PERIODIC_SPELLS_OUTPUT and PERIODIC_SPELLS_REPORT to task-isolated paths');
const quotedDist = "'" + dist.replaceAll("'", "'\\''") + "'";
export default defineConfig({
  testDir: '.', testMatch: 'periodic-spells.spec.ts', workers: 1, fullyParallel: false,
  retries: 0, maxFailures: 1, timeout: 60_000,
  outputDir: output,
  reporter: [['line'], ['json', { outputFile: report }]],
  use: { baseURL: `http://127.0.0.1:${String(port)}`, serviceWorkers: 'allow',
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'spell-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'spell-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } }
  ],
  webServer: { cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${quotedDist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`, reuseExistingServer: false, timeout: 30_000 }
});
