import { defineConfig } from '@playwright/test';
import production from './quest-unique-reward.config';

const port = Number(process.env.PWA_PORT ?? 4361);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid PWA_PORT');
if (!process.env.ACT5_DELIVERY_DIST || !process.env.ACT5_DELIVERY_OUTPUT || !process.env.ACT5_INPUT_SAVE) {
  throw new Error('Provide task-owned ACT5_DELIVERY_DIST, ACT5_DELIVERY_OUTPUT and ACT5_INPUT_SAVE');
}

/** Ordinary production controls from an actual constructed-power A4 export; never earned C2 evidence. */
export default defineConfig({
  ...production,
  testMatch: ['act5-delivery.spec.ts'],
  outputDir: process.env.ACT5_DELIVERY_OUTPUT,
  reporter: [['line'], ['json', { outputFile: `${process.env.ACT5_DELIVERY_OUTPUT}/report.json` }]],
  workers: 2,
  timeout: 600_000,
  use: { ...production.use, baseURL: `http://127.0.0.1:${String(port)}`,
    contextOptions: { reducedMotion: 'reduce' } },
  webServer: {
    ...production.webServer,
    command: `npx vite preview --outDir "$ACT5_DELIVERY_DIST" --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`,
    reuseExistingServer: false
  }
});
