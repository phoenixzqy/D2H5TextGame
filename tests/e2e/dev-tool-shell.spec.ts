/**
 * Dev Tool shell E2E:
 *  - HUD must not render on /dev or /dev/* routes.
 *  - Sidebar must show a "back to game" link.
 *  - Dev item editor exposes image preview plus weapon fields.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter } from './_helpers';

test.describe('Dev tool shell — HUD + back-to-game @desktop-only', () => {
  test('hides CharacterHud on /dev and /dev/items, and back link goes to /town when character exists', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'DevTester' });

    // Sanity: HUD is visible in town when character exists.
    await expect(page.getByTestId('character-hud')).toBeVisible();

    // Allow the debounced auto-save (AUTO_SAVE_DEBOUNCE_MS = 500ms) to flush
    // to IndexedDB before we hard-reload into /dev. Otherwise the reload
    // races autosave and the player store rehydrates as null.
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    await page.goto('/dev');
    const backLink = page.getByTestId('dev-back-to-game');
    await expect(backLink).toBeVisible();
    await expect(page.getByTestId('character-hud')).toHaveCount(0);

    await page.goto('/dev/items');
    await expect(page.getByTestId('dev-back-to-game')).toBeVisible();
    await expect(page.getByTestId('character-hud')).toHaveCount(0);

    // Wait for the player store to rehydrate from IndexedDB before clicking,
    // otherwise back-to-game (which routes based on usePlayerStore.player)
    // races the Dexie load and may route to '/'.
    await expect
      .poll(
        async () =>
          page.evaluate(() => Boolean(window.__GAME__?.player.getState().player)),
        { timeout: 15_000, intervals: [200, 500, 1000] }
      )
      .toBe(true);

    // Back-to-game from /dev/items → /town (in-memory navigation, no reload).
    await page.getByTestId('dev-back-to-game').click();
    await expect(page).toHaveURL(/\/town$/);
    await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('character-hud')).toBeVisible();
  });

  test('back-to-game from /dev goes to / when no character exists', async ({ page }) => {
    await clearGameStorage(page);
    // Don't create a character — go straight to dev tool.
    await page.goto('/dev');
    await expect(page.getByTestId('character-hud')).toHaveCount(0);

    const backLink = page.getByTestId('dev-back-to-game');
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-screen')).toBeVisible();
  });
});

test.describe('dev tool — image preview + weapon dropdowns @desktop-only', () => {
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
    const entrySelect = page.locator('select').nth(1);
    await expect(entrySelect).toContainText('items.base.wp1h-short-sword');
    await entrySelect.selectOption({ label: 'items.base.wp1h-short-sword' });
    const weaponFields = page.getByTestId('weapon-fields');
    await expect(weaponFields).toBeVisible();
    await expect(weaponFields.locator('#dev-weaponType')).toBeVisible();
    await expect(weaponFields.locator('#dev-handedness')).toBeVisible();
  });

  test('non-weapon base hides weaponType + handedness selects', async ({ page }) => {
    await page.goto('/dev/items');
    const entrySelect = page.locator('select').nth(1);
    await expect(entrySelect).toContainText('items.base.helm-cap');
    await entrySelect.selectOption({ label: 'items.base.helm-cap' });
    await expect(page.getByTestId('weapon-fields')).toHaveCount(0);
  });

  /**
   * Integration canary for the dev-data middleware contract.
   *
   * This test exists specifically to catch the regression class where the
   * Vite middleware path-pattern in `vite.config.ts` (or the schemaRules
   * entry) drifts away from the actual on-disk filename for
   * `src/data/image-overrides.json`. All other DevImageField tests mock at
   * the `loadDevJson` / `saveDevJson` boundary, so a 400 from
   * `/__dev/data` would slip through.
   *
   * What we assert:
   *   1. POST to `/__dev/data` returns HTTP 200 (NOT 400) on save.
   *   2. The badge flips inferred → override.
   *   3. Cleanup also returns 200 and the badge flips back.
   *
   * Cleanup leaves `src/data/image-overrides.json` byte-identical to its
   * pre-test contents (clear deletes the entry we added).
   */
  test('DevImageField save → /__dev/data round-trip returns 200, not 400', async ({ page }) => {
    const devDataResponses: { method: string; status: number; url: string }[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/__dev/data')) {
        devDataResponses.push({
          method: resp.request().method(),
          status: resp.status(),
          url: resp.url()
        });
      }
    });

    await page.goto('/dev/items');

    // Pick a base item with no current override.
    const entrySelect = page.locator('select').nth(1);
    await expect(entrySelect).toContainText('items.base.wp1h-short-sword');
    await entrySelect.selectOption({ label: 'items.base.wp1h-short-sword' });

    const field = page.getByTestId('dev-image-field').first();
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('data-override-state', 'inferred');

    const overrideInput = page.getByLabel(/override path|覆盖路径/i);
    await overrideInput.fill('assets/test/override.png');

    // Click Save and capture the POST response.
    const saveButton = page.getByRole('button', { name: /save override|保存覆盖/i }).first();
    const savePostPromise = page.waitForResponse((resp) =>
      resp.url().includes('/__dev/data') && resp.request().method() === 'POST'
    );
    await saveButton.click();
    const saveResp = await savePostPromise;
    expect(saveResp.status(), `Save POST should be 200, got ${String(saveResp.status())}`).toBe(200);

    // Badge flips to override.
    await expect(field).toHaveAttribute('data-override-state', 'override');

    // Clean up: clear override, also expect 200.
    const clearButton = page.getByRole('button', { name: /clear override|清除覆盖/i }).first();
    const clearPostPromise = page.waitForResponse((resp) =>
      resp.url().includes('/__dev/data') && resp.request().method() === 'POST'
    );
    await clearButton.click();
    const clearResp = await clearPostPromise;
    expect(clearResp.status(), `Clear POST should be 200, got ${String(clearResp.status())}`).toBe(200);

    // Badge flips back to inferred.
    await expect(field).toHaveAttribute('data-override-state', 'inferred');

    // Diagnostic: no recorded /__dev/data response should have status 400.
    const fourHundreds = devDataResponses.filter((r) => r.status === 400);
    expect(fourHundreds, `No /__dev/data responses should be 400; saw: ${JSON.stringify(fourHundreds)}`).toHaveLength(0);
  });
});
