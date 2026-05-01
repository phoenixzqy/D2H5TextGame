/**
 * service-worker.spec.ts — Wave B / F3 baseline.
 *
 * Smoke-checks the PWA / Service Worker path that ONLY exists in a
 * production build (`vite-plugin-pwa` does not register a SW under
 * `vite dev`). This spec is therefore tagged `@prod-bundle` and is
 * scoped to the `prod-bundle` Playwright project — it is **excluded**
 * from `chromium-desktop` and `mobile-portrait` (see playwright.config.ts).
 *
 * Local opt-in:
 *   RUN_PROD_BUNDLE=1 npx playwright test --project=prod-bundle --grep @prod-bundle
 *
 * It runs in CI by default (the `prod-bundle` project is included when
 * `CI=1` or `RUN_PROD_BUNDLE=1`).
 *
 * Tagged `@desktop-only` purely as a redundant guard so it never sneaks
 * into the mobile project even if grep config drifts.
 */
import { test, expect } from '@playwright/test';

test.describe('PWA / Service Worker @prod-bundle @desktop-only', () => {
  test('manifest is reachable, parseable, and exposes name/start_url', async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(30_000);
    // vite-plugin-pwa emits `manifest.webmanifest` at the site root.
    const url = new URL('/manifest.webmanifest', baseURL ?? 'http://127.0.0.1');
    const res = await request.get(url.toString());
    expect(res.status(), 'manifest.webmanifest reachable').toBe(200);
    const manifest = await res.json();
    expect(typeof manifest.name, 'manifest.name is a string').toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(typeof manifest.start_url, 'manifest.start_url is a string').toBe('string');
    expect(manifest.start_url.length).toBeGreaterThan(0);
  });

  test('service worker registers and controls the page after first nav', async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.goto('/');

    // `navigator.serviceWorker.ready` resolves with the active registration
    // once the SW reaches the activated state. On a fresh load the page may
    // not yet be controlled (SW takes control of clients on next nav), so we
    // tolerate either: ready-resolved is the load-bearing assertion.
    const swInfo = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return { supported: false } as const;
      }
      const reg = await Promise.race([
        navigator.serviceWorker.ready.then((r) => r),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000)),
      ]);
      return {
        supported: true,
        readyOk: !!reg,
        scope: reg?.scope ?? null,
        hasController: !!navigator.serviceWorker.controller,
      } as const;
    });

    expect(swInfo.supported, 'browser advertises serviceWorker support').toBe(true);
    expect(swInfo.readyOk, 'navigator.serviceWorker.ready resolves').toBe(true);
    expect(typeof swInfo.scope).toBe('string');

    // After a reload the SW should now control the document (covers the
    // "next navigation" handoff that vite-plugin-pwa's autoUpdate uses).
    await page.reload();
    const controlled = await page.evaluate(
      () => !!navigator.serviceWorker.controller
    );
    expect(controlled, 'page is controlled by the SW after one reload').toBe(true);
  });
});
