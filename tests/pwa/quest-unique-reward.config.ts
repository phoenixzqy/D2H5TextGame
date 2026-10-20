import { defineConfig, devices } from '@playwright/test';
import production from './playwright.config';

/** Real production claim/save wiring; keep outside the debug-enabled E2E runner. */
export default defineConfig({
  ...production,
  testMatch: ['quest-unique-reward.spec.ts'],
  outputDir: process.env.QUEST_REWARD_OUTPUT_DIR ?? '../../test-results/quest-unique-reward',
  projects: [
    ...[
      { name: 'mobile-small', viewport: { width: 360, height: 640 } },
      { name: 'mobile-tall', viewport: { width: 412, height: 915 } },
      { name: 'mobile-landscape', viewport: { width: 640, height: 360 } }
    ].map(({ name, viewport }) => ({ name, use: { ...devices['Pixel 5'], viewport } })),
    ...[
      { name: 'desktop', viewport: { width: 1280, height: 800 } },
      { name: 'desktop-wide', viewport: { width: 1920, height: 1080 } }
    ].map(({ name, viewport }) => ({ name, use: { ...devices['Desktop Chrome'], viewport } }))
  ]
});
