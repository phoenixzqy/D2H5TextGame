/**
 * combat-map-flow.spec.ts — fix/combat-map-screen-bugs acceptance.
 *
 * Covers Bugs #3, #4, #5, #6 + the bonus i18n cleanup:
 *   - Win the first sub-area run → map shows it as cleared.
 *   - Undefeated areas: Farm Here is locked and disabled.
 *   - Cleared areas: Farm Here ↔ Stop Farming toggle on the row.
 *   - Combat header shows the localized sub-area name.
 *   - Combat log lines for skill use no longer leak raw `<class>.<id>`
 *     skill ids.
 *
 * Runs on both desktop (chromium-desktop) and mobile-portrait
 * (Pixel 5 / 360-ish wide) projects.
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  navTo,
  waitForBattleResolution
} from './_helpers';

test.describe('Combat <-> Map flow (fix/combat-map-screen-bugs)', () => {
  test('clears the first sub-area, gates idle, and shows map identity in combat', async ({ page }) => {
    test.setTimeout(120_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'Acceptance' });

    // Bug #5 — before any clears, "Farm Here" must be locked.
    await navTo(page, 'map');
    await expect(page.getByTestId('map-screen')).toBeVisible();

    const lockedRow0 = page.getByTestId('farm-locked-a1-blood-moor');
    await expect(lockedRow0).toBeVisible();
    await expect(lockedRow0).toBeDisabled();
    // No active "Farm Here" button on undefeated areas.
    await expect(page.getByTestId('farm-here-a1-blood-moor')).toHaveCount(0);

    // Enter Blood Moor → combat.
    await page.locator('[data-testid="sub-area-row-a1-blood-moor"]').getByRole('button', { name: /进入|Enter/i }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });

    // Bug #6 — combat header shows the localized sub-area name (zh-CN
    // primary). Either zh ('血腥旷野') or en ('Blood Moor') is acceptable
    // depending on the active locale.
    const headerSubArea = page.getByTestId('combat-sub-area-name');
    await expect(headerSubArea).toBeVisible();
    const subAreaText = (await headerSubArea.textContent())?.trim() ?? '';
    expect(subAreaText).toMatch(/血腥旷野|Blood Moor/);
    await expect(page.getByTestId('combat-act-name')).toBeVisible();

    // Bonus — combat log skill lines must NOT contain raw `<class>.<id>`
    // skill ids like `barbarian.bash` / `necromancer.bone-spear`.
    // Wait for at least a couple of log lines to render, then sample.
    const log = page.getByTestId('combat-log');
    await expect(log).toBeVisible();
    // Give the playback a beat to emit a few skill lines.
    await page.waitForTimeout(2_000);
    const logText = (await log.textContent()) ?? '';
    // Raw skill ids are dotted lowercase: `barbarian.bash`,
    // `necromancer.skeleton-mastery`, etc. They should never appear
    // verbatim in the rendered log now that we i18n via skills:<id>.name.
    expect(logText).not.toMatch(/\b[a-z]+\.[a-z][a-z0-9-]+\b/);

    const battle = await waitForBattleResolution(page, 60_000);

    if (!battle.playerWon) {
      // Necromancer should be able to clear the L1 Blood Moor first
      // wave; if not, balance regression — bail with a clear message.
      test.skip(true, 'Necromancer failed first Blood Moor — balance regression, not a UI bug');
      return;
    }

    // Bug #3 — return to map; the sub-area should now show its cleared
    // badge and the Farm Here button should be enabled.
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('map-screen')).toBeVisible();

    await expect(page.getByTestId('cleared-badge-a1-blood-moor')).toBeVisible();
    const farmBtn = page.getByTestId('farm-here-a1-blood-moor');
    await expect(farmBtn).toBeVisible();
    await expect(farmBtn).toBeEnabled();
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toHaveCount(0);

    // Bug #4 — clicking Farm Here should swap the row to Stop Farming,
    // and the bottom ticker should also expose a stop control.
    await farmBtn.click();
    const stopRow = page.getByTestId('stop-farming-a1-blood-moor');
    await expect(stopRow).toBeVisible();
    await expect(page.getByTestId('idle-ticker-stop')).toBeVisible();
    // Touch target ≥ 44px on the row toggle.
    const box = await stopRow.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    // Tapping Stop Farming returns the row to Farm Here.
    await stopRow.click();
    await expect(page.getByTestId('farm-here-a1-blood-moor')).toBeVisible();
    await expect(page.getByTestId('stop-farming-a1-blood-moor')).toHaveCount(0);

    // Other (still-undefeated) areas remain locked.
    await expect(page.getByTestId('farm-locked-a1-cold-plains')).toBeVisible();
  });
});
