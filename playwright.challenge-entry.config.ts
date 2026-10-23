import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = process.env.CHALLENGE_ENTRY_ARTIFACT_ROOT;
if (!root || !/^[A-Za-z0-9_./-]+$/.test(root)) throw new Error('Explicit shell-safe artifact root required');
const port = Number(process.env.CHALLENGE_ENTRY_PORT ?? '60423');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid port');
const url = `http://127.0.0.1:${String(port)}`;
export default defineConfig({
  testDir: './tests/native', testMatch: 'challenge-entry-native.spec.ts',
  fullyParallel: false, workers: 1, retries: 0, maxFailures: 1,
  timeout: 90_000, expect: { timeout: 10_000 }, reporter: 'json',
  outputDir: resolve(root, 'browser-output'),
  use: { browserName: 'chromium', headless: true, baseURL: url,
    screenshot: 'only-on-failure', trace: 'off' },
  webServer: { command: `npx vite preview --outDir ${resolve(root, 'dist')} --host 127.0.0.1 --port ${String(port)} --strictPort`,
    url, reuseExistingServer: false, timeout: 30_000, env: { VITE_E2E: 'false' } }
});
