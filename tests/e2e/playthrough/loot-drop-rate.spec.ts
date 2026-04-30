import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  getBackpackCount,
  boostPlayer,
  skipViaStore,
} from './_setup';

test.describe('Bug #4 — Loot drop rate > 0 @desktop-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'loot-drop-rate runs on desktop only'
    );
  });

  test('at least 1 item in backpack after <=10 fights', async ({ page }) => {
    test.setTimeout(300_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'amazon', name: 'LootTest' });

    const MAX_FIGHTS = 10;

    for (let i = 0; i < MAX_FIGHTS; i++) {
      // Boost player stats to guarantee wins (must happen before entering combat).
      await boostPlayer(page);

      // Navigate to map from town
      await page.getByTestId('town-set-out').click();
      await expect(page.getByTestId('map-screen')).toBeVisible({ timeout: 8_000 });
      const enterBtn = page.getByRole('button', { name: /进入|Enter/i }).first();
      await enterBtn.click();
      await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });

      // Skip all waves using the store (no UI click race condition).
      await skipViaStore(page, 60_000);

      // Check loot immediately (store has latest data).
      const count = await getBackpackCount(page);
      if (count > 0) break;

      // Return to town for the next fight.
      const returnToTown = page.getByTestId('return-to-town');
      if (await returnToTown.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await returnToTown.click();
      } else {
        // Fallback: flee via town nav link
        await page.locator('a[href="/town"]').first().click();
      }
      await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 8_000 });
    }

    await expect
      .poll(() => getBackpackCount(page), { timeout: 3_000, intervals: [300] })
      .toBeGreaterThan(0);
  });
});
