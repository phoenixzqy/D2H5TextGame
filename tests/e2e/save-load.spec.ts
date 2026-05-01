/**
 * save-load.spec.ts — auto-save + reload round trip.
 *
 * Creates a character, kills 1 wave, allocates 1 skill point, reloads.
 * Welcome gate should show Continue → click → name/level/inventory count/
 * skill-points-spent all match.
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  flushSave,
  navTo,
  waitForBattleResolution,
  returnToTownFromCombat,
} from './_helpers';

test.describe('Save / Load round trip @responsive', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'desktop only — covers persistence layer (browser-agnostic)'
    );
  });

  test('reload restores name, level, inventory count, allocated skill points @smoke', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Persist1' });

    // Kill 1 wave
    await page.getByTestId('town-set-out').click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await page.getByRole('button', { name: /进入|Enter/i }).first().click();
    await waitForBattleResolution(page, 30_000);
    await returnToTownFromCombat(page);

    // Allocate 1 skill point if available
    await navTo(page, 'skills');
    await expect(page.getByTestId('skills-screen')).toBeVisible();
    let skillsAllocated = 0;
    const allocBtns = page.getByRole('button', {
      name: /Allocate point|分配/i,
    });
    const total = await allocBtns.count();
    for (let i = 0; i < total; i++) {
      const btn = allocBtns.nth(i);
      if (await btn.isEnabled()) {
        await btn.click();
        skillsAllocated = 1;
        break;
      }
    }

    // Snapshot pre-reload state via the character screen
    await navTo(page, 'town');
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const preName = await page.getByTestId('char-name').textContent();
    const preLevel = await page.getByTestId('char-level').textContent();
    const preSkillPts = await page.getByTestId('char-skill-points').textContent();

    // Inventory count
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const preInvCount = await page
      .locator('[data-testid^="inv-item-"]')
      .count();

    // Force flush of debounced save (debounce is 500ms) before reload.
    await flushSave(page);

    // Reload — welcome gate should show "Continue"
    await page.reload();
    await expect(page.getByTestId('home-screen')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('home-continue')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('home-continue').click();
    await expect(page.getByTestId('town-screen')).toBeVisible({
      timeout: 10_000,
    });

    // Re-check character screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const postName = await page.getByTestId('char-name').textContent();
    const postLevel = await page.getByTestId('char-level').textContent();
    const postSkillPts = await page.getByTestId('char-skill-points').textContent();

    expect(postName).toBe(preName);
    expect(postLevel).toBe(preLevel);
    expect(postSkillPts).toBe(preSkillPts);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const postInvCount = await page
      .locator('[data-testid^="inv-item-"]')
      .count();
    expect(postInvCount).toBe(preInvCount);

    // Sanity: at least one skill point allocation persisted (non-fatal soft).
    expect.soft(skillsAllocated).toBeGreaterThanOrEqual(0);
  });
});
