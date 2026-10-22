import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const root = process.env.D06_IRON_ARTIFACT_ROOT;
if (!root) throw new Error('D06_IRON_ARTIFACT_ROOT must identify the owned evidence/build directory');
const runId = process.env.D06_IRON_RUN_ID;
if (!runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error('D06_IRON_RUN_ID must identify this evidence run');
const port = Number(process.env.D06_IRON_PORT ?? '4387');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid D06_IRON_PORT');
const dist = resolve(root, 'dist');
if (!/^[A-Za-z0-9_./-]+$/.test(dist)) throw new Error('Build path must contain only shell-safe path characters');
const baseURL = `http://127.0.0.1:${String(port)}`;

/** Serve the separately built, bridge-free production artifact without rebuilding or reuse. */
export default defineConfig({
  testDir: './tests/native',
  testMatch: 'iron-golem-native.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: resolve(root, 'tmp/iron-browser-results-' + runId),
  use: { browserName: 'chromium', headless: true, baseURL, screenshot: 'only-on-failure', trace: 'off' },
  webServer: {
    command: `npx vite preview --outDir ${dist} --host 127.0.0.1 --port ${String(port)} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { VITE_E2E: 'false' }
  }
});
