import { defineConfig, devices } from '@playwright/test';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.MATERIALS_UI_ROOT;
if (!root || !isAbsolute(root)) throw new Error('MATERIALS_UI_ROOT must be an absolute task-owned output directory');
const port = Number(process.env.PWA_PORT ?? 4403);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const baseURL = `http://127.0.0.1:${String(port)}`;
const dist = `'${join(root, 'dist').replace(/'/g, "'\\''")}'`;

/** Build production into the task-owned root before this bounded UI regression. */
export default defineConfig({
  testDir: '.', testMatch: 'materials-panel.spec.ts',
  fullyParallel: false, forbidOnly: true, workers: 1, retries: 0, timeout: 90_000,
  outputDir: join(root, 'browser'),
  reporter: [['line'], ['json', { outputFile: join(root, 'browser-report.json') }]],
  use: { baseURL, serviceWorkers: 'allow', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'materials-production', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${dist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000
  }
});
