import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PWA_PORT ?? 4631);
const dist = process.env.NAVIGATION_ICON_DIST;
const output = process.env.NAVIGATION_ICON_OUTPUT;
const report = process.env.NAVIGATION_ICON_REPORT;
if (!dist || !output || !report)
  throw new Error('Set task-isolated NAVIGATION_ICON_DIST, OUTPUT and REPORT');
const quotedDist = "'" + dist.replaceAll("'", "'\\''") + "'";

export default defineConfig({
  testDir: '.',
  testMatch: 'navigation-icons.spec.ts',
  workers: 2,
  fullyParallel: true,
  retries: 0,
  timeout: 60_000,
  outputDir: output,
  reporter: [['line'], ['json', { outputFile: report }]],
  projects: [{ name: 'navigation-icons', use: { ...devices['Desktop Chrome'] } }],
  use: {
    baseURL: `http://127.0.0.1:${String(port)}`,
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${quotedDist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`,
    reuseExistingServer: false,
    timeout: 30_000
  }
});
