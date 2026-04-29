import { defineConfig, devices } from '@playwright/test';

const e2eWebServerCommand = process.platform === 'win32'
  ? 'set VITE_E2E=true&& npm run build && npm run preview'
  : 'VITE_E2E=true npm run build && VITE_E2E=true npm run preview';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  outputDir: 'playwright-report',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'mobile-portrait',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 640 }
      }
    }
  ],

  webServer: {
    command: e2eWebServerCommand,
    port: 4173,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      VITE_E2E: 'true'
    }
  }
});
