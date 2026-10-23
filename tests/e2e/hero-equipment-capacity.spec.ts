/** Imported legacy gear proves guarded recovery through ordinary controls. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { deriveStats } from '../../src/engine/progression/stats';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

function item(id: string, baseId = 'items/base/helm-cap', fields: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false, ...fields };
}

async function exportBackup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await download).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

async function selectItem(page: Page, id: string): Promise<void> {
  await page.getByTestId(`inv-item-${id}`).click();
  await expect(page.getByTestId('inv-detail-panel')).toBeVisible();
}

async function discard(page: Page, id: string): Promise<void> {
  await selectItem(page, id);
  await page.getByTestId('inv-discard-action').click();
  await page.getByTestId('inv-discard-confirm').click();
  await expect(page.getByTestId('inv-detail-panel')).toHaveCount(0);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`hero gear capacity retains overflow and recovers without item loss ${locale} @responsive`, async ({ page }) => {
    const english = locale === 'en';
    const fullMessage = english
      ? 'Backpack is full. Make room before moving or removing equipment.'
      : '背包已满，请腾出空间后再转移物品或卸下装备。';
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'Hero gear recovery' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const original = await exportBackup(page);
    const candidate = item('candidate-two-handed', 'items/base/wp2h-two-handed-sword', {
      rarity: 'rare', ilvl: 7, baseRolls: { attack: 19 }, statRolls: { 'statMods.life': 3 }
    });
    const oneHanded = item('candidate-one-handed', 'items/base/wp1h-short-sword');
    const oldWeapon = item('old-weapon', 'items/base/wp1h-short-sword', { rarity: 'magic', equipped: true });
    const oldShield = item('old-shield', 'items/base/sh-buckler', { equipped: true });
    const fillers = Array.from({ length: 99 }, (_, i) => item(`filler-${String(i)}`));
    const head = fillers[0];
    if (!head) throw new Error('Missing head fixture');
    const imported: SaveCurrent = {
      ...original,
      inventory: {
        questItems: {}, questServices: {}, legacyGearQuarantine: [],
        backpack: [candidate, oneHanded, ...fillers],
        stash: [item('stash-retained', 'items/base/ring', { rarity: 'rare', identified: false })],
        equipped: { weapon: oldWeapon, offhand: oldShield },
        currencies: { 'rune-shard': 17, 'gem-shard': 3 }
      }
    };
    const importLabel = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(imported));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const restored = await exportBackup(page);
    expect(restored.inventory).toEqual(imported.inventory);
    expect(restored.player).toEqual(imported.player);

    await navTo(page, 'inventory');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-weapon').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await expect(page.getByTestId('inventory-toast')).toContainText(fullMessage);
    await page.getByTestId('equip-slot-weapon').getByText(english ? 'Weapon' : '武器', { exact: true }).click();
    await page.getByTestId('equip-picker-row-candidate-two-handed').click();
    const selectedHeader = await page.getByTestId('candidate-item-header').innerText();
    await expect(page.getByTestId('equip-picker-confirm')).toBeEnabled();
    await page.getByTestId('equip-picker-confirm').click();
    const error = page.getByTestId('equip-picker-error');
    await expect(error).toBeVisible();
    await expect(error.locator('..')).toHaveAttribute('aria-live', 'polite');
    await expect(error).toContainText(fullMessage);
    await expect(page.getByTestId('equip-picker-row-candidate-two-handed')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('candidate-item-header')).toHaveText(selectedHeader, { useInnerText: true });
    const box = await error.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
      expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
    }
    for (const id of ['equip-picker-confirm', 'equip-picker-cancel']) {
      const target = await page.getByTestId(id).boundingBox();
      expect(target?.height).toBeGreaterThanOrEqual(44);
      expect(target?.width).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId('equip-picker-cancel').click();
    await page.locator('#tab-backpack').click();
    await selectItem(page, candidate.id);
    await page.getByTestId('inv-primary-action').click();
    await expect(page.getByTestId('inventory-toast')).toContainText(fullMessage);
    await expect(page.getByTestId('inv-detail-panel')).toBeVisible();
    await expect(page.getByTestId(`inv-item-${candidate.id}`)).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('inv-detail-close').click();
    const refused = await exportBackup(page);
    expect(refused.inventory).toEqual(imported.inventory);
    expect(refused.player).toEqual(imported.player);
    expect(refused.map).toEqual(imported.map);

    // Overflow101 permits a one-for-one swap, then empty head equip reduces100.
    await navTo(page, 'inventory');
    await selectItem(page, oneHanded.id);
    await page.getByTestId('inv-primary-action').click();
    await expect(page.getByTestId('inv-detail-panel')).toHaveCount(0);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await selectItem(page, head.id);
    await page.getByTestId('inv-primary-action').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-head').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await expect(page.getByTestId('inventory-toast')).toContainText(fullMessage);
    await page.locator('#tab-backpack').click();
    await discard(page, 'filler-1');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(99);
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-weapon').getByText(english ? 'Weapon' : '武器', { exact: true }).click();
    await page.getByTestId('equip-picker-row-candidate-two-handed').click();
    await expect(page.getByTestId('equip-picker-error')).toHaveCount(0);
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).toHaveCount(0);
    await page.getByTestId('equip-slot-weapon').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await expect(page.getByTestId('inventory-toast')).toContainText(fullMessage);
    await page.locator('#tab-backpack').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    await discard(page, 'filler-2');
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-weapon').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await expect(page.getByTestId('equip-slot-weapon').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true })).toHaveCount(0);
    await page.locator('#tab-backpack').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const recovered = await exportBackup(page);
    expect(recovered.inventory).toEqual({
      ...imported.inventory,
      backpack: [...fillers.slice(3), { ...oldWeapon, equipped: false }, oneHanded, { ...oldShield, equipped: false }, candidate],
      equipped: { head: { ...head, equipped: true }, weapon: null, offhand: null }
    });
    const expectedStats = deriveStats(imported.player.coreStats, imported.player.level, { flatDefense: 7 });
    expect(recovered.player).toEqual({
      ...imported.player,
      derivedStats: {
        ...expectedStats,
        life: Math.min(expectedStats.lifeMax, imported.player.derivedStats.life),
        mana: Math.min(expectedStats.manaMax, imported.player.derivedStats.mana)
      }
    });
    expect(recovered.map).toEqual(imported.map);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const persisted = await exportBackup(page);
    expect(persisted.inventory).toEqual(recovered.inventory);
    expect(persisted.player).toEqual(recovered.player);
    expect(persisted.map).toEqual(recovered.map);
    expect(errors).toEqual([]);
  });
}
