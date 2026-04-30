/**
 * equip-picker.spec.ts — Bug #9 + #10 regression
 *
 * Bug #9: Tapping an empty equipment slot must open the EquipPicker modal.
 * Bug #10: Selecting a candidate item must show the comparison panel with
 *          stat deltas (the `data-testid="item-compare"` element).
 *
 * After confirming in the picker, the modal must close and the equipped
 * item must appear in the slot.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from '../_helpers';

test.describe('Bug #9 + #10 — Equip picker and comparison panel @desktop-only', () => {
  test('empty slot opens picker, comparison shows stat deltas, equip closes modal', async ({ page }) => {
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'EquipTest' });

    // Seed a weapon into the backpack.
    const itemId = await page.evaluate(() => {
      const game = (
        window as unknown as {
          __GAME__?: {
            seedItem: (id: string, opts?: { rarity?: string }) => string;
          };
        }
      ).__GAME__;
      if (!game) throw new Error('test bridge not installed');
      return game.seedItem('items/base/wp1h-short-sword', { rarity: 'normal' });
    });
    expect(itemId).toMatch(/^seed-/);

    // Navigate to the Equipment tab of the inventory.
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    // Switch to the Equipment tab.
    const equipTab = page.getByRole('tab', { name: /装备|Equipment/i });
    if (await equipTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await equipTab.click();
    } else {
      // Fallback: tabs might be rendered as buttons.
      const equipBtn = page.getByRole('button', { name: /装备|Equipment/i });
      if (await equipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await equipBtn.click();
      }
    }

    // Bug #9: click the empty weapon slot → picker opens.
    const weaponSlot = page.getByTestId('equip-slot-weapon');
    await expect(weaponSlot).toBeVisible({ timeout: 5_000 });
    await weaponSlot.click();

    const picker = page.getByTestId('equip-picker');
    await expect(picker).toBeVisible({ timeout: 5_000 });

    // The picker must list our seeded item.
    const pickerRow = page.getByTestId(`equip-picker-row-${itemId}`);
    await expect(pickerRow).toBeVisible({ timeout: 3_000 });

    // Bug #10: selecting the candidate shows the comparison panel with deltas.
    await pickerRow.click();
    await expect(page.getByTestId('item-compare')).toBeVisible({ timeout: 3_000 });

    // Confirm equip → modal closes.
    const confirmBtn = page.getByTestId('equip-picker-confirm');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Picker must close.
    await expect(picker).not.toBeVisible({ timeout: 5_000 });

    // The weapon slot should now show the equipped item (not "empty").
    await expect(weaponSlot).not.toContainText(/空|empty/i);
  });
});
