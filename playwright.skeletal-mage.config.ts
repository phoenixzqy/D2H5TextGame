import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const root = process.env.D06_MAGE_ARTIFACT_ROOT;
const run = process.env.D06_MAGE_RUN_ID;
if (!root || !run || !/^[A-Za-z0-9_-]+$/.test(run)) throw new Error('Explicit artifact root and safe unique run ID required');
const port = Number(process.env.D06_MAGE_PORT ?? '4393');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid D06_MAGE_PORT');
const dist = resolve(root, 'dist');
if (!/^[A-Za-z0-9_./-]+$/.test(dist)) throw new Error('Build path must contain only shell-safe path characters');
const baseURL = `http://127.0.0.1:${String(port)}`;

/** Serve the separately built, bridge-free production artifact without rebuilding or reuse. */
export default defineConfig({
  testDir: './tests/native',
  testMatch: 'skeletal-mage-native.spec.ts',
  fullyParallel: false, workers: 1, retries: 0, timeout: 90_000,
  expect: { timeout: 10_000 }, reporter: 'list',
  outputDir: resolve(root, 'tmp', 'mage-browser-' + run),
  use: { browserName: 'chromium', headless: true, baseURL, screenshot: 'only-on-failure', trace: 'off' },
  webServer: {
    command: `npx vite preview --outDir ${dist} --host 127.0.0.1 --port ${String(port)} --strictPort`,
    url: baseURL, reuseExistingServer: false, timeout: 30_000,
    env: { VITE_E2E: 'false' }
  }
});
