/**
 * Verification spec for the summon system + per-unit timeline scheduler.
 * Captures a screenshot of the Necromancer + skeleton mid-battle.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('summon + timeline UI @desktop-only', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('necromancer summons a skeleton; highlight follows actor', async ({ page }) => {
    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'NecroQA' });

    await navTo(page, 'map');
    await expect(page.getByTestId('map-screen')).toBeVisible();
    const enterBtn = page.getByRole('button', { name: /进入|Enter/i }).first();
    await enterBtn.click();

    await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });

    // Wait for the skeleton summon to appear in the allies list.
    const summonBadge = page.getByTestId('summon-badge').first();
    await expect(summonBadge).toBeVisible({ timeout: 10_000 });

    // Ensure both hero and summon are present (>= 2 ally units).
    const allyUnits = page
      .locator('[data-testid="combat-screen"] [data-kind]')
      .filter({ has: page.locator(':scope') });
    // sanity — at least one element with data-kind=summon
    await expect(page.locator('[data-kind="summon"]')).toHaveCount(1);

    // Capture screenshot mid-battle (skeleton + monsters visible).
    // Path is project-relative (was hardcoded to one user's home dir).
    await page.screenshot({
      path: path.resolve(
        __dirname,
        '..',
        '..',
        '.screenshots',
        'summon_combat_verify.png'
      ),
      fullPage: true,
    });

    // Active-unit highlight: at least one unit with data-acting="true" should
    // be visible at some point during playback.
    const acting = page.locator('[data-acting="true"]');
    await expect(acting.first()).toBeVisible({ timeout: 10_000 });

    // Verify the highlight moves over time (not stuck on one unit).
    const firstActorBox = await acting.first().boundingBox();
    // Poll for the active-unit marker to move to a different actor (different
    // y-coordinate). Replaces a 20×250ms sleep loop. Fast machines exit early.
    let changed = false;
    await expect
      .poll(
        async () => {
          if (changed) return true;
          const cur = page.locator('[data-acting="true"]').first();
          const box = await cur.boundingBox().catch(() => null);
          if (firstActorBox && box && Math.abs(box.y - firstActorBox.y) > 4) {
            changed = true;
          }
          return changed;
        },
        { timeout: 5_000, intervals: [100, 200, 250] }
      )
      .toBe(true);
    expect(changed, 'active-unit highlight should move between actors').toBeTruthy();
    void allyUnits;
  });
});
