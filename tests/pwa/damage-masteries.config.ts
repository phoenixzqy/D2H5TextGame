import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PWA_PORT ?? 4456);
const baseURL = `http://127.0.0.1:${String(port)}`;
export default defineConfig({
  testDir: '.', testMatch: 'damage-masteries.spec.ts', workers: 1,
  retries: 0, timeout: 60_000,
  outputDir: process.env.DAMAGE_MASTERY_OUTPUT_DIR ?? '../../test-results/damage-masteries',
  reporter: [['line'], ['json', { outputFile: process.env.DAMAGE_MASTERY_REPORT ?? '../../test-results/damage-masteries.json' }]],
  use: { baseURL, serviceWorkers: 'allow', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'damage-mastery-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'damage-mastery-mobile', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 640 } } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${process.env.DAMAGE_MASTERY_BUILD_DIR ?? 'dist'} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 30_000,
  },
});
