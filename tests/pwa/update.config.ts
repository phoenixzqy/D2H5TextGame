import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PWA_UPDATE_PORT ?? 4330);
const baseURL = `http://127.0.0.1:${String(port)}`;

/** One deployed version at a time; fresh isolated context for every case. */
export default defineConfig({
  testDir: '.',
  testMatch: 'update-save.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'line',
  outputDir: '../../test-results/pwa-update',
  use: {
    baseURL,
    serviceWorkers: 'allow',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'update-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'update-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } }
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: 'node tests/pwa/update-server.mjs',
    url: baseURL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    timeout: 240_000
  }
});
