import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — Wave A / P03.
 *
 * Default local + CI E2E runs against the **Vite dev server** (no build, no
 * minification, no PWA Service Worker). This is the agent-loop fast path:
 * webServer boot drops from ~build+preview (~60-80 s cold) to dev-server
 * ready (~3-8 s).
 *
 * To still catch the things dev mode hides (rubber-duck #2: PWA SW
 * registration, code-split chunk wiring, minifier-induced bugs, runtime
 * caching), CI also runs the `prod-bundle` project against
 * `vite preview` of a freshly built bundle. Specs that *must* run against
 * the prod bundle should be tagged with `@prod-bundle` in their title or
 * `test.describe`. They are excluded from the dev-server projects and
 * included only in `prod-bundle`.
 *
 * Process-safety reminder (binding — see plan §P03):
 *   ❌ Do NOT use `kill-port 4173` / `taskkill /IM node.exe` to free the
 *      E2E port. Those nuke unrelated dev servers and Playwright workers.
 *   ✅ If 4173 is busy, set `E2E_PORT` to another port:
 *        $env:E2E_PORT=4179; npx playwright test ...
 *      Playwright owns the lifecycle of the webServer it spawned.
 */

const e2ePort = process.env.E2E_PORT ? parseInt(process.env.E2E_PORT, 10) : 4173;
const prodBundlePort = process.env.E2E_PROD_PORT
  ? parseInt(process.env.E2E_PROD_PORT, 10)
  : e2ePort + 100;

const isCI = !!process.env.CI;
const baseURL = `http://127.0.0.1:${String(e2ePort)}`;
const prodBaseURL = `http://127.0.0.1:${String(prodBundlePort)}`;

// Prod-bundle project runs only in CI to keep local agent loops fast.
// Locally you can opt-in via `RUN_PROD_BUNDLE=1`.
const includeProdBundle = isCI || process.env.RUN_PROD_BUNDLE === '1';

const devProjects = [
  {
    name: 'chromium-desktop',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 800 },
      baseURL
    },
    grepInvert: /@prod-bundle/
  },
  {
    name: 'mobile-portrait',
    use: {
      ...devices['Pixel 5'],
      viewport: { width: 360, height: 640 },
      baseURL
    },
    grepInvert: /@prod-bundle/
  }
];

const prodBundleProject = {
  name: 'prod-bundle',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    baseURL: prodBaseURL
  },
  grep: /@prod-bundle/
};

const devWebServer = {
  // `vite dev` (no build) — the fast path.
  command: `npx vite dev --port ${String(e2ePort)} --host 127.0.0.1 --strictPort`,
  url: baseURL,
  reuseExistingServer: !isCI,
  timeout: 60 * 1000,
  env: {
    VITE_E2E: 'true'
  }
};

const prodWebServer = {
  // Build once, then `vite preview` — exercised by `prod-bundle` project only.
  // Sequenced as a single shell pipeline so Playwright treats it as one server.
  command:
    process.platform === 'win32'
      ? `cmd /c "set VITE_E2E=true&& npm run build && npx vite preview --port ${String(prodBundlePort)} --host 127.0.0.1 --strictPort"`
      : `VITE_E2E=true npm run build && VITE_E2E=true npx vite preview --port ${String(prodBundlePort)} --host 127.0.0.1 --strictPort`,
  url: prodBaseURL,
  reuseExistingServer: !isCI,
  timeout: 180 * 1000,
  env: {
    VITE_E2E: 'true'
  }
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  outputDir: 'playwright-report',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: includeProdBundle ? [...devProjects, prodBundleProject] : devProjects,
  // Playwright supports an array of webServers. We only spawn the prod one
  // when the prod-bundle project is active, to avoid paying the build cost
  // on local fast-path runs.
  webServer: includeProdBundle ? [devWebServer, prodWebServer] : devWebServer
});
