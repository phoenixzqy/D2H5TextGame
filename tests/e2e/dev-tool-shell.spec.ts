/**
 * Dev Tool shell E2E:
 *  - HUD must not render on /dev or /dev/* routes.
 *  - Sidebar must show a "back to game" link.
 *  - Clicking it routes to /town when a player exists, /  otherwise.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter } from './_helpers';

test.describe('Dev tool shell — HUD + back-to-game', () => {
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
