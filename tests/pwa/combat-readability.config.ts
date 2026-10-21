import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

/** Responsive presentation acceptance against the ordinary production bundle. */
export default defineConfig({
  ...production,
  testMatch: 'combat-readability.spec.ts',
  timeout: 90_000,
  retries: 0,
  use: { ...production.use, trace: 'off' },
  projects: [{ name: 'combat-layout', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 640 } } }]
});
