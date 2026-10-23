import { defineConfig } from '@playwright/test';
import production from './quest-unique-reward.config';

const port = Number(process.env.PWA_PORT ?? 4349);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid PWA_PORT');
if (!process.env.ACT3_DELIVERY_DIST || !process.env.ACT3_DELIVERY_OUTPUT) {
  throw new Error('Provide task-owned ACT3_DELIVERY_DIST and ACT3_DELIVERY_OUTPUT paths');
}

/** Imported fixtures verify production actions, not earned Act III campaign acceptance. */
export default defineConfig({
  ...production,
  testMatch: ['act3-delivery.spec.ts'],
  outputDir: process.env.ACT3_DELIVERY_OUTPUT,
  reporter: [['line'], ['json', { outputFile: `${process.env.ACT3_DELIVERY_OUTPUT}/report.json` }]],
  workers: 2,
  use: { ...production.use, baseURL: `http://127.0.0.1:${String(port)}`,
    contextOptions: { reducedMotion: 'reduce' } },
  webServer: {
    ...production.webServer,
    command: `npx vite preview --outDir "$ACT3_DELIVERY_DIST" --port ${String(port)} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${String(port)}`,
    reuseExistingServer: false
  }
});
