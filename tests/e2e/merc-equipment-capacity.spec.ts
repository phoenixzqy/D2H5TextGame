/** Imported overflow-recovery fixtures, not earned loot or combat acceptance. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { toJsonSafe } from '../../src/engine/save/serialize';
import { createCharacter, navTo } from './_helpers';

const mercId = 'mercs/act1-rogue-inner-sight';
function item(id: string, baseId: string, fields: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false, ...fields };
}
const source = item('S', 'items/base/helm-cap', { identified: false, ilvl: 7, baseRolls: { defense: 11 },
  affixes: [{ affixId: 'saved', values: new Map([['coreStats.vitality', 5]]) }] });
const boots = item('B', 'items/base/boot-leather', { baseRolls: { defense: 3 },
  affixes: [{ affixId: 'saved', values: new Map([['statMods.life', 9]]) }] });
const old = item('Old', 'items/base/helm-cap', { baseRolls: { defense: 6 },
  affixes: [{ affixId: 'saved', values: new Map([['statMods.life', 7]]) }] });
const fillers = Array.from({ length: 99 }, (_, i) => item(`F${String(i + 1)}`, 'items/base/wp1h-short-sword'));
const equipped = (value: Item, equipSlot: 'head' | 'boots'): Item => ({ ...value, equipped: true, equipSlot });

async function backup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function equipment(page: Page): Promise<void> {
  await navTo(page, 'mercs');
  await page.getByTestId(`merc-equipment-${mercId}`).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function checkSave(page: Page, expected: SaveCurrent): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navTo(page, 'settings');
  expect(await backup(page)).toEqual(toJsonSafe(expected));
}

async function discard(page: Page, id: string): Promise<void> {
  await navTo(page, 'inventory');
  await page.getByTestId(`inv-item-${id}`).click();
  await page.getByTestId('inv-discard-action').click();
  await page.getByTestId('inv-discard-confirm').click();
  await expect(page.getByTestId(`inv-item-${id}`)).toHaveCount(0);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`merc capacity keeps overflow gear and recovers through ordinary controls ${locale} @responsive`, async ({ page }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const fullMessage = english ? 'Backpack is full. Make room before moving or removing equipment.'
      : '背包已满，请腾出空间后再转移物品或卸下装备。';
    const unequipName = english ? 'Unequip' : '卸下';
    const equipName = english ? 'Equip' : '装备';
    async function unequip(slot: 'head' | 'boots', refuses = false) {
      await equipment(page);
      await page.getByTestId(`merc-equip-slot-${slot}`).getByRole('button', { name: unequipName, exact: true }).click();
      if (refuses) {
        await expect(page.getByRole('status')).toHaveText(fullMessage);
        await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
        await expect(page.getByTestId(`merc-equip-slot-${slot}`).getByRole('button', { name: unequipName, exact: true })).toBeVisible();
      } else {
        await expect(page.getByRole('status')).toHaveCount(0);
        await expect(page.getByTestId(`merc-equip-slot-${slot}`).getByRole('button', { name: unequipName, exact: true })).toHaveCount(0);
      }
    }
    async function equip(slot: 'head' | 'boots', count = 1) {
      await equipment(page);
      await page.getByTestId(`merc-equip-slot-${slot}`).getByText(
        slot === 'head' ? (english ? 'Head' : '头部') : (english ? 'Boots' : '靴子'), { exact: true }).click();
      const buttons = page.getByRole('button', { name: equipName, exact: true });
      await expect(buttons).toHaveCount(count);
      await buttons.first().click();
      await expect(buttons).toHaveCount(0);
      await expect(page.getByRole('status')).toHaveCount(0);
    }
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00Z'));
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Merc capacity' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await navTo(page, 'settings');
    const baseline = await backup(page);
    const fixture: SaveCurrent = { ...baseline,
      inventory: { ...baseline.inventory, backpack: [source, boots, ...fillers],
        stash: [item('stashed', 'items/base/helm-cap', { ilvl: 11 })], currencies: { wishstone: 7, 'rune-shard': 17 } },
      mercs: { ...baseline.mercs, mercEquipment: { [mercId]: { head: equipped(old, 'head'), boots: null } } } };
    const expected = (backpack: Item[], head: Item | null, feet: Item | null): SaveCurrent => ({ ...fixture,
      inventory: { ...fixture.inventory, backpack },
      mercs: { ...fixture.mercs, mercEquipment: { [mercId]: { head, boots: feet } } } });
    const importName = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(toJsonSafe(fixture)));
    await dialog.getByRole('button', { name: importName, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(await backup(page)).toEqual(toJsonSafe(fixture));

    await unequip('head', true);
    await checkSave(page, fixture);
    await equip('head');
    await checkSave(page, expected([boots, ...fillers, old], equipped(source, 'head'), null));
    await equip('boots');
    const full = expected([...fillers, old], equipped(source, 'head'), equipped(boots, 'boots'));
    await checkSave(page, full);
    await unequip('head', true);
    await checkSave(page, full);
    await equip('head');
    await checkSave(page, expected([...fillers, source], equipped(old, 'head'), equipped(boots, 'boots')));
    await discard(page, 'F1');
    await unequip('head');
    await checkSave(page, expected([...fillers.slice(1), source, old], null, equipped(boots, 'boots')));
    await equip('head', 2);
    await checkSave(page, expected([...fillers.slice(1), old], equipped(source, 'head'), equipped(boots, 'boots')));
    await unequip('head');
    const fullAgain = expected([...fillers.slice(1), old, source], null, equipped(boots, 'boots'));
    await checkSave(page, fullAgain);
    await unequip('boots', true);
    await checkSave(page, fullAgain);
    await discard(page, 'F2');
    await unequip('boots');
    const final = expected([...fillers.slice(2), old, source, boots], null, null);
    await checkSave(page, final);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await backup(page)).toEqual(toJsonSafe(final));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
