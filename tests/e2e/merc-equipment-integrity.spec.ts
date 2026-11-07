/** Imported item-integrity fixtures, not earned loot or mercenary combat proof. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from './_helpers';

const mercId = 'mercs/act1-rogue-inner-sight';
const source: Item = { id: 'selected', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
  identified: false, equipped: false, socketCapacity: 0, ilvl: 7, baseRolls: { defense: 11 },
  affixes: [{ affixId: 'saved-affix', values: new Map([['coreStats.vitality', 5]]) }] };
const duplicate: Item = { id: 'other', baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 3,
  identified: true, equipped: false, socketCapacity: 0 };
const old: Item = { id: 'merc-cap', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
  identified: true, equipped: true, socketCapacity: 0, equipSlot: 'head', baseRolls: { defense: 6 },
  affixes: [{ affixId: 'saved-affix', values: new Map([['statMods.life', 7]]) }] };
const stashed: Item = { ...source, id: 'stashed', level: 7, identified: true };
const { equipSlot: _slot, ...oldFields } = old;
const returned: Item = { ...oldFields, equipped: false };

function toJsonSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, entry: unknown) =>
    entry instanceof Map ? [...entry.entries()] : entry)) as unknown;
}

function withMercEquipmentMirror(save: SaveCurrent): SaveCurrent {
  const equipment = Object.values(save.mercs.mercEquipment[mercId] ?? {})
    .filter((item): item is Item => item != null);
  return { ...save, mercs: { ...save.mercs, ownedMercs: save.mercs.ownedMercs.map(merc =>
    merc.id === mercId ? { ...merc, equipment } : merc) } };
}

async function backup(page: Page): Promise<SaveCurrent> {
  await page.getByRole('tab', { name: /Save Management|存档管理/ }).click();
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
  expect(await backup(page)).toEqual(toJsonSafe(withMercEquipmentMirror(expected)));
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`merc equipment swaps preserve complete items and save ${locale} @responsive`, async ({ page }) => {
    test.setTimeout(90_000);
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-20T12:00:00Z'));
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Merc gear integrity' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs');
    await page.getByRole('tab', { name: english ? 'Hire' : '招募', exact: true }).click();
    await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    await navTo(page, 'settings');
    const baseline = await backup(page);
    const fixture: SaveCurrent = { ...baseline,
      inventory: { ...baseline.inventory, backpack: [source, duplicate], stash: [stashed] },
      mercs: { ...baseline.mercs, mercEquipment: { [mercId]: { head: old } } } };
    const importName = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(toJsonSafe(fixture)));
    await dialog.getByRole('button', { name: importName, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(await backup(page)).toEqual(toJsonSafe(withMercEquipmentMirror(fixture)));

    await navTo(page, 'mercs');
    await page.getByTestId(`merc-card-${mercId}`).getByRole('button', {
      name: english ? 'Base abilities' : '基础能力', exact: true
    }).click();
    await expect(page.getByText(english
      ? 'Reduce all enemies’ Defense by 25% for 8 seconds. Costs 0 MP; 5-second cooldown.'
      : '使所有敌人防御降低25%，持续8秒。消耗0法力，冷却5秒。')).toBeVisible();
    await page.getByRole('tab', { name: english ? 'Skill priority' : '技能优先级' }).click();
    await expect(page.getByText(english
      ? 'Deals 16–26 physical damage plus 100% of the mercenary\'s Attack to one enemy. Cooldown: 1s. Costs no mana.'
      : '对一个敌人造成16–26点物理伤害，附加佣兵攻击力的100%。冷却1秒，不消耗法力。')).toBeVisible();
    await page.keyboard.press('Escape');

    const swapped: SaveCurrent = { ...fixture,
      inventory: { ...fixture.inventory, backpack: [duplicate, returned] },
      mercs: { ...fixture.mercs, mercEquipment: { [mercId]: { head: { ...source, equipped: true, equipSlot: 'head' } } } } };
    await equipment(page);
    await page.getByTestId('merc-equip-slot-head-details').click();
    await expect(page.getByTestId('item-tooltip').first()).toContainText(english ? 'Defense: 6' : '防御: 6');
    await page.getByRole('button', { name: english ? 'Back to equipment' : '返回装备栏', exact: true }).click();
    await page.getByTestId('merc-equip-slot-head-select').click();
    await page.getByTestId('merc-equip-candidates').getByText('#selected', { exact: true }).click();
    await expect(page.getByTestId('compare-panel')).toBeVisible();
    await page.getByRole('button', { name: english ? 'Equip on mercenary' : '交给佣兵装备', exact: true }).click();
    await checkSave(page, swapped);

    const swappedBack: SaveCurrent = { ...fixture,
      inventory: { ...fixture.inventory, backpack: [duplicate, source] } };
    await equipment(page);
    await page.getByTestId('merc-equip-slot-head-select').click();
    await page.getByTestId('merc-equip-candidates').getByText('#merc-cap', { exact: true }).click();
    await page.getByRole('button', { name: english ? 'Equip on mercenary' : '交给佣兵装备', exact: true }).click();
    await checkSave(page, swappedBack);

    const unequipped: SaveCurrent = { ...swappedBack,
      inventory: { ...fixture.inventory, backpack: [duplicate, source, returned] },
      mercs: { ...fixture.mercs, mercEquipment: { [mercId]: { head: null } } } };
    await equipment(page);
    await page.getByTestId('merc-equip-slot-head').getByRole('button', { name: english ? 'Unequip' : '卸下', exact: true }).click();
    await checkSave(page, unequipped);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await page.getByRole('tab', { name: english ? 'Language' : '语言', exact: true }).click();
    await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await backup(page)).toEqual(toJsonSafe(withMercEquipmentMirror(unequipped)));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
