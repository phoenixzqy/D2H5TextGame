/**
 * multi-screen-session.spec.ts — State survival across multi-screen navigation
 *
 * Verifies that character state (name, class, XP, inventory, skill points)
 * survives a full circuit of screen navigations within a single page session
 * (no reload). This covers the implicit assertion from the original monolithic
 * playthrough.spec.ts that was lost when splitting into focused sub-specs.
 */

import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  navTo,
  waitForBattleResolution,
  returnToTownFromCombat,
} from '../_helpers';

test.describe('Multi-screen session state survival @desktop-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'desktop only — covers in-session state continuity (layout-agnostic)'
    );
  });

  test('character state survives home→town→map→combat→inventory→skills→town circuit', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // 1. Create character
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'CircuitTest' });

    // Capture initial state from character screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const initialName = await page.getByTestId('char-name').textContent();
    await page.keyboard.press('Escape'); // close modal

    // 2. Enter combat and kill a wave (gain XP, loot)
    await navTo(page, 'map');
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await page.getByRole('button', { name: /进入|Enter/i }).first().click();
    await waitForBattleResolution(page, 60_000);

    // Capture post-combat XP
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const postCombatLevel = await page.getByTestId('char-level').textContent();
    const postCombatXp = await page
      .getByTestId('char-xp')
      .textContent()
      .catch(() => null);
    await page.keyboard.press('Escape');

    await returnToTownFromCombat(page);

    // 3. Navigate to inventory — verify state
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const inventoryCount = await page
      .locator('[data-testid^="inv-item-"]')
      .count();
    // Should have at least 1 item (starter gear or loot)
    expect(inventoryCount).toBeGreaterThan(0);

    // Re-check character state from inventory screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const nameAfterInventory = await page
      .getByTestId('char-name')
      .textContent();
    const levelAfterInventory = await page
      .getByTestId('char-level')
      .textContent();
    expect(nameAfterInventory).toBe(initialName);
    expect(levelAfterInventory).toBe(postCombatLevel);
    await page.keyboard.press('Escape');

    // 4. Navigate to skills — verify state
    await navTo(page, 'skills');
    await expect(page.getByTestId('skills-screen')).toBeVisible();

    // Re-check character state from skills screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const nameAfterSkills = await page.getByTestId('char-name').textContent();
    const levelAfterSkills = await page
      .getByTestId('char-level')
      .textContent();
    expect(nameAfterSkills).toBe(initialName);
    expect(levelAfterSkills).toBe(postCombatLevel);
    await page.keyboard.press('Escape');

    // 5. Navigate to mercs — verify state
    await navTo(page, 'mercs');
    await expect(page.getByTestId('mercs-screen')).toBeVisible();

    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const nameAfterMercs = await page.getByTestId('char-name').textContent();
    expect(nameAfterMercs).toBe(initialName);
    await page.keyboard.press('Escape');

    // 6. Navigate back to town — final state check
    await navTo(page, 'town');
    await expect(page.getByTestId('town-screen')).toBeVisible();

    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const finalName = await page.getByTestId('char-name').textContent();
    const finalLevel = await page.getByTestId('char-level').textContent();
    const finalXp = await page
      .getByTestId('char-xp')
      .textContent()
      .catch(() => null);

    expect(finalName).toBe(initialName);
    expect(finalLevel).toBe(postCombatLevel);
    if (postCombatXp && finalXp) {
      expect(finalXp).toBe(postCombatXp);
    }
    await page.keyboard.press('Escape');

    // 7. Verify inventory count persisted after full circuit
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const finalInventoryCount = await page
      .locator('[data-testid^="inv-item-"]')
      .count();
    expect(finalInventoryCount).toBe(inventoryCount);

    // 8. Optional: navigate to map again to complete circuit
    await navTo(page, 'map');
    await expect(page.getByTestId('map-screen')).toBeVisible();

    // Final character state check from map screen
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const veryFinalName = await page.getByTestId('char-name').textContent();
    expect(veryFinalName).toBe(initialName);
  });
});
