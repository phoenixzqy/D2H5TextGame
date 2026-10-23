import { defineConfig, devices } from '@playwright/test';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.CRAFTING_UI_ROOT;
if (!root || !isAbsolute(root)) throw new Error('CRAFTING_UI_ROOT must be an absolute task-owned output directory');
const port = Number(process.env.PWA_PORT ?? 4431);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const baseURL = `http://127.0.0.1:${String(port)}`;
const dist = `'${join(root, 'dist').replace(/'/g, "'\\''")}'`;

/** Ordinary production build only; test bridge and dev store injection are prohibited. */
export default defineConfig({
  testDir: '.', testMatch: ['crafting.spec.ts', 'runeword-grants.spec.ts', 'runeword-actives.spec.ts'],
  fullyParallel: false, forbidOnly: true, workers: 1, retries: 0, timeout: 120_000,
  outputDir: join(root, 'browser'),
  reporter: [['line'], ['json', { outputFile: join(root, 'browser-report.json') }]],
  use: { baseURL, serviceWorkers: 'allow', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'crafting-production', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${dist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000
  }
});
