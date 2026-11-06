/** Imported owned-item fixture proves presentation/equip/persistence, not earned drops or balance. */
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const tiers = [
  ['wp1h-war-sword', 32, 32, 'War Sword', '战剑'],
  ['wp1h-legend-sword', 60, 75, 'Legend Sword', '传奇之剑']
] as const;
const candidates: Item[] = tiers.map(([slug, level, attack]) => ({
  id: `sword-ui-${slug}`, baseId: `items/base/${slug}`, rarity: 'normal',
  level, ilvl: level, identified: true, equipped: false,
  socketCapacity: 0, baseRolls: { attack }, affixes: []
}));
const starter: Item = { id: 'sword-ui-starter', baseId: 'items/base/wp1h-scimitar',
  rarity: 'normal', level: 8, ilvl: 8, identified: true, equipped: true,
  socketCapacity: 0, baseRolls: { attack: 13 }, affixes: [] };
const shield: Item = { id: 'sword-ui-shield', baseId: 'items/base/sh-buckler',
  rarity: 'normal', level: 1, ilvl: 1, identified: true, equipped: true,
  socketCapacity: 0, baseRolls: { defense: 5 }, affixes: [] };
const selected = candidates[1];
if (!selected) throw new Error('Missing sword browser fixture');

async function exportSave(page: Page): Promise<SaveCurrent> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const file = await (await download).path();
  return JSON.parse(await readFile(file, 'utf8')) as SaveCurrent;
}
function expectOwned(save: SaveCurrent, baseline: SaveCurrent) {
  expect(save.inventory.equipped).toEqual({ weapon: { ...selected, equipped: true }, offhand: shield });
  expect(save.inventory.backpack).toEqual([...candidates.slice(0, 1), { ...starter, equipped: false }]);
  expect(save.inventory.stash).toEqual([]);
  expect(save.inventory.currencies).toEqual(baseline.inventory.currencies);
  expect(save.player.level).toBe(60);
  expect(save.map).toEqual(baseline.map);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`sword upgrades display, equip and survive reload ${locale} @responsive`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'Sword UI fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
    const baseline = await exportSave(page);
    const fixture: SaveCurrent = { ...baseline,
      // Level-60 cumulative XP from progression-curve §2: sum floor(100 * L^2.5), L=1..59.
      player: { ...baseline.player, level: 60, experience: 46_419_067, equipment: [] },
      inventory: { ...baseline.inventory, backpack: [...candidates, { ...starter, equipped: false }],
        stash: [], equipped: { offhand: shield } }
    };
    const importLabel = locale === 'en' ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(fixture));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    // Native starter equip establishes level-60 derived stats before comparing upgrades.
    await navTo(page, 'inventory');
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-weapon-select').click({ position: { x: 8, y: 8 } });
    await page.getByTestId(`equip-picker-row-${starter.id}`).click();
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).toHaveCount(0);
    await navTo(page, 'settings');
    const before = await exportSave(page);
    await navTo(page, 'inventory');
    await page.locator('#tab-equipment').click();
    // Activate the native slot selector, independently of Details and Unequip.
    await page.getByTestId('equip-slot-weapon-select').click({ position: { x: 8, y: 8 } });
    for (const [slug, , , en, zh] of tiers) {
      const row = page.getByTestId(`equip-picker-row-sword-ui-${slug}`);
      await expect(row).toContainText(locale === 'en' ? en : zh);
      await row.scrollIntoViewIfNeeded();
      const icon = row.locator('img');
      await expect(icon).toHaveAttribute('src', /sword/);
      await expect.poll(() => icon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    await testInfo.attach('sword-upgrade-picker', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.getByTestId(`equip-picker-row-${selected.id}`).click();
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).toHaveCount(0);
    await expect(page.getByTestId('equip-slot-weapon')).toContainText(locale === 'en' ? 'Legend Sword' : '传奇之剑');
    await page.getByTestId('equip-slot-weapon-details').click();
    const detail = page.getByTestId('equipped-item-modal');
    await expect(detail).toContainText(locale === 'en' ? 'Legend Sword' : '传奇之剑');
    await expect(detail.getByTestId('item-tooltip').locator('img').first()).toHaveAttribute('src', /sword/);
    await testInfo.attach('sword-equipped-detail', { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' });
    await page.getByTestId('equipped-item-modal-close').click();

    await navTo(page, 'settings');
    await page.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true }).click();
    const equipped = await exportSave(page);
    expectOwned(equipped, baseline);
    expect(equipped.player.derivedStats.attack - before.player.derivedStats.attack).toBe(62);
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const restored = await exportSave(page);
    expectOwned(restored, baseline);
    expect(restored.player.derivedStats).toEqual(equipped.player.derivedStats);
    await navTo(page, 'inventory');
    await page.locator('#tab-equipment').click();
    await expect(page.getByTestId('equip-slot-weapon')).toContainText(locale === 'en' ? 'Legend Sword' : '传奇之剑');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
