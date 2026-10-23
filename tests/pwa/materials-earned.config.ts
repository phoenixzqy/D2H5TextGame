import { defineConfig, devices } from '@playwright/test';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.EARNED_MATERIALS_ROOT;
if (!root || !isAbsolute(root)) throw new Error('EARNED_MATERIALS_ROOT must be an absolute task-owned directory');
const port = Number(process.env.PWA_PORT ?? 4413);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const baseURL = `http://127.0.0.1:${String(port)}`;
const dist = `'${join(root, 'dist').replace(/'/g, "'\\''")}'`;

/** Single earned challenge; listing tests never launches combat. Build production separately. */
export default defineConfig({
  testDir: '.', testMatch: 'materials-earned.spec.ts',
  fullyParallel: false, forbidOnly: true, workers: 1, retries: 0,
  // Six native waves, each with a 60s engine deadline, real playback and UI/export overhead.
  timeout: 12 * 60_000,
  outputDir: join(root, 'browser'),
  reporter: [['line'], ['json', { outputFile: join(root, 'browser-report.json') }]],
  use: { baseURL, serviceWorkers: 'allow', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'earned-materials-production', use: {
    ...devices['Desktop Chrome'], viewport: { width: 360, height: 640 }
  } }],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${dist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000
  }
});
