import { defineConfig } from '@playwright/test';
import production from './quest-unique-reward.config';

const port = Number(process.env.PWA_PORT ?? 4359);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid PWA_PORT');
if (!process.env.ACT4_DELIVERY_DIST || !process.env.ACT4_DELIVERY_OUTPUT || !process.env.ACT4_INPUT_SAVE) {
  throw new Error('Provide task-owned ACT4_DELIVERY_DIST, ACT4_DELIVERY_OUTPUT and ACT4_INPUT_SAVE');
}

/** Imported constructed A3 saves exercise A4 controls, not earned campaign balance. */
export default defineConfig({
  ...production,
  testMatch: ['act4-delivery.spec.ts'],
  outputDir: process.env.ACT4_DELIVERY_OUTPUT,
  reporter: [['line'], ['json', { outputFile: `${process.env.ACT4_DELIVERY_OUTPUT}/report.json` }]],
  workers: 2,
  use: { ...production.use, baseURL: `http://127.0.0.1:${String(port)}`,
    contextOptions: { reducedMotion: 'reduce' } },
  webServer: {
    ...production.webServer,
    command: `npx vite preview --outDir "$ACT4_DELIVERY_DIST" --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`,
    reuseExistingServer: false
  }
});
