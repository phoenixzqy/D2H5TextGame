/**
 * dev-tool-shell.spec — smoke-tests the dev-tool image preview + weapon
 * dropdown flow.
 *
 * NOTE: The dev tool only mounts when `import.meta.env.DEV === true`
 * (see `src/app/routes.tsx`). The Playwright `webServer` runs the
 * production preview build (`npm run preview`), which sets DEV = false,
 * so `/dev/*` routes redirect to `/`.
 *
 * To exercise the dev tool end-to-end you must run Playwright against
 * `npm run dev` instead. Until that wiring lands we document the
 * intended assertions here as `test.skip` so the contract is visible
 * but doesn't fail CI. Vitest covers the component-level behavior in
 * `src/features/dev/DevImageField.test.tsx` and `ItemsEditor.test.tsx`.
 */
import { test, expect } from '@playwright/test';

test.describe('dev tool — image preview + weapon dropdowns', () => {
  test.skip(true, 'Dev tool only mounts in DEV mode; preview build does not expose /dev/*. Re-enable when a dev-server-backed Playwright project lands.');

  test('items editor shows image preview + Inferred badge for a base item', async ({ page }) => {
    await page.goto('/dev/items');
    const field = page.getByTestId('dev-image-field').first();
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('data-override-state', /override|inferred/);
    const badge = page.getByTestId('dev-image-field-badge').first();
    await expect(badge).toBeVisible();
  });

  test('weapon base reveals weaponType + handedness selects', async ({ page }) => {
    await page.goto('/dev/items');
    // Pick a weapon entry — the data file ships `items/base/wp1h-short-sword`.
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await expect(page.getByTestId('weapon-fields')).toBeVisible();
    await expect(page.getByLabel(/weapon type|武器类型/i)).toBeVisible();
    await expect(page.getByLabel(/handedness|持握方式/i)).toBeVisible();
  });

  test('non-weapon base hides weaponType + handedness selects', async ({ page }) => {
    await page.goto('/dev/items');
    await page.locator('select').nth(1).selectOption({ index: 0 });
    await expect(page.getByTestId('weapon-fields')).toHaveCount(0);
  });
});
