import { defineConfig, devices } from '@playwright/test';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.EARNED_SOCKET_ROOT;
if (!root || !isAbsolute(root)) throw new Error('EARNED_SOCKET_ROOT must be an absolute task-owned directory');
const port = Number(process.env.PWA_PORT ?? 4449);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid preview port');
const baseURL = `http://127.0.0.1:${String(port)}`;
const dist = `'${join(root, 'dist').replace(/'/g, "'\\''")}'`;

/** Exact earned continuation: no retries, test bridge, development server or existing server reuse. */
export default defineConfig({
  testDir: '.', testMatch: 'socket-earned.spec.ts', fullyParallel: false, forbidOnly: true,
  workers: 1, retries: 0, timeout: 12 * 60_000, expect: { timeout: 30_000 },
  outputDir: join(root, 'browser'),
  reporter: [['line'], ['json', { outputFile: join(root, 'browser-report.json') }]],
  use: { baseURL, actionTimeout: 30_000, navigationTimeout: 30_000,
    serviceWorkers: 'allow', trace: 'off', video: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'earned-socket-production', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 640 } } }],
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `node_modules/.bin/vite preview --outDir ${dist} --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 20_000
  }
});
