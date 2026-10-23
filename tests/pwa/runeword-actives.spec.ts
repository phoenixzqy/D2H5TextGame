/** Constructed functional proof only; does not establish earned materials, campaign or pacing. */
import { expect, test, type Page, type Locator, type TestInfo, type BrowserContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const sizes = [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const;
const mercId = 'mercs/act1-rogue-inner-sight';
const rows = [
  { word: 'leaf', base: 'weapon-staff', runes: ['tir', 'ral'], slot: 'weapon',
    skill: 'sorceress.fire_bolt', en: 'Fire Bolt', zh: '火弹', rank: 3, mp: 8, cd: 1 },
  { word: 'hand-of-justice', base: 'wp1h-legend-sword', runes: ['sur', 'cham', 'amn', 'lo'], slot: 'weapon',
    skill: 'sorceress.blaze', en: 'Blaze', zh: '炽烈之径', rank: 5, mp: 22, cd: 3 },
  { word: 'death', base: 'wp1h-legend-sword', runes: ['hel', 'el', 'vex', 'ort', 'gul'], slot: 'weapon',
    skill: 'sorceress.chain_lightning', en: 'Chain Lightning', zh: '闪电链', rank: 5, mp: 25, cd: 2 },
  { word: 'phoenix', base: 'sh-monarch', runes: ['vex', 'vex', 'lo', 'jah'], slot: 'offhand',
    skill: 'item.redemption', en: 'Redemption', zh: '救赎', rank: 1, mp: 0, cd: 4 }
] as const;
async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download'); await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
async function layout(page: Page, scope: Locator) {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await scope.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  for (const control of await scope.locator('button,select').all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); expect(box?.width).toBeGreaterThanOrEqual(44);
  }
}
async function skills(page: Page) {
  await navTo(page, 'skills');
  await page.locator('button[aria-controls="tabpanel-active"]').click();
  return page.getByTestId('skills-active-panel');
}
async function continued(page: Page, context: BrowserContext, en: boolean, info: TestInfo, stage: string,
  viewport: { width: number; height: number }, observe: (page: Page) => void) {
  const before = await backup(page);
  await page.getByRole('button', { name: en ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(en ? 'Saved' : '已保存'); await page.close();
  const next = await context.newPage(); observe(next); await next.setViewportSize(viewport);
  expect(next.viewportSize()).toEqual(viewport);
  await next.goto('/'); await next.getByTestId('home-continue').click();
  await expect(next.getByTestId('town-screen')).toBeVisible();
  const after = await backup(next);
  for (const key of ['player', 'inventory', 'map', 'mercs', 'formation'] as const) expect(after[key]).toEqual(before[key]);
  await info.attach(stage, { body: JSON.stringify(after), contentType: 'application/json' });
  return next;
}
for (const locale of ['en', 'zh-CN'] as const) for (const [width, height] of sizes) {
  test(`active grants priorities and Continue ${locale} ${String(width)}x${String(height)}`, async ({ page: initial, context }, info) => {
    const en = locale === 'en', errors: string[] = [];
    const observe = (current: Page) => {
      current.on('pageerror', error => errors.push(error.message));
      current.on('console', entry => { if (entry.type() === 'error' || entry.type() === 'warning') errors.push(entry.text()); });
    };
    let page = initial; observe(page); await page.setViewportSize({ width, height });
    await page.goto('/'); await createCharacter(page, { class: 'paladin', name: 'Active Grant QA' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: en ? 'English' : '简体中文', exact: true }).click();
    await navTo(page, 'mercs');
    await page.getByTestId(`hire-merc-${mercId}`).getByRole('button', { name: en ? 'Hire' : '招募', exact: true }).click();
    const fresh = await backup(page);
    const items: Item[] = rows.map(row => ({ id: `active-${row.word}`, baseId: `items/base/${row.base}`, level: 70,
      rarity: 'runeword', runewordId: `runewords/${row.word}`, identified: true, equipped: false,
      socketCapacity: row.runes.length, socketContents: row.runes.map(id => ({ kind: 'rune', id: `runes/${id}` })) }));
    const fixture: SaveCurrent = { ...fresh,
      player: { ...fresh.player, level: 70, comboOrder: [],
        coreStats: { strength: 300, dexterity: 300, vitality: 50, energy: 20 }, equipment: [] },
      inventory: { ...fresh.inventory, equipped: {}, backpack: items, stash: [] },
      mercs: { ...fresh.mercs, ownedMercs: fresh.mercs.ownedMercs.map(merc => ({ ...merc, level: 70,
        coreStats: { strength: 300, dexterity: 300, vitality: 50, energy: 20 } })) } };
    const importName = en ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    await page.getByRole('dialog').getByRole('textbox').fill(JSON.stringify(fixture));
    await page.getByRole('dialog').getByRole('button', { name: importName, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await info.attach('constructed-actives-input', { body: JSON.stringify(fixture), contentType: 'application/json' });
    const priorities: string[] = [];
    for (const row of rows) {
      await navTo(page, 'inventory'); await page.getByTestId(`inv-item-active-${row.word}`).click();
      await page.mouse.move(0, 0);
      const detail = page.getByTestId('inv-detail-panel'), name = en ? row.en : row.zh;
      await expect(detail).toContainText(en
        ? `While equipped: grants ${name} (Rank ${String(row.rank)}), ${String(row.mp)} Mana, ${String(row.cd)}s cooldown`
        : `装备时：获得${name}（${String(row.rank)}级），消耗${String(row.mp)}法力，冷却${String(row.cd)}秒`);
      await layout(page, detail); await detail.getByTestId('inv-primary-action').click();
      let panel = await skills(page);
      await expect(panel.locator(`select option:checked[value="${row.skill}"]`)).toHaveCount(1);
      const savedBeforeEdit = await backup(page);
      expect(savedBeforeEdit.player.comboOrder).toEqual(priorities);
      expect(savedBeforeEdit.player.skillLevels).toEqual(fixture.player.skillLevels);
      panel = await skills(page);
      // Move the appended grant to the front using only ordinary editor controls.
      for (let index = priorities.length; index > 0; index--) {
        await panel.getByRole('button', { name: en ? 'Move up' : '上移', exact: true }).nth(index).click();
      }
      if (priorities.length === 0) await panel.getByRole('combobox').first().selectOption(row.skill);
      priorities.unshift(row.skill);
      await expect(panel.getByRole('combobox').first()).toHaveValue(row.skill);
      await layout(page, panel);
      const explicit = await backup(page);
      expect(explicit.player.comboOrder).toEqual(priorities);
      expect(explicit.player.skillLevels).toEqual(fixture.player.skillLevels);
      if (row.word === 'phoenix') {
        page = await continued(page, context, en, info, 'hero-active-equipped-continued', { width, height }, observe);
        panel = await skills(page); await expect(panel.getByRole('combobox').first()).toHaveValue(row.skill);
        await info.attach('hero-priorities-visible', { body: await page.screenshot(), contentType: 'image/png' });
      }
      await navTo(page, 'inventory');
      await page.getByRole('tab', { name: en ? 'Equipment' : '装备', exact: true }).click();
      await page.getByTestId(`equip-slot-${row.slot}`).getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
      panel = await skills(page);
      const dormant = panel.locator(`select option:checked[value="${row.skill}"]`);
      await expect(dormant).toHaveText(en ? `${name} (unavailable)` : `${name}（不可用）`);
      await expect(dormant).toBeDisabled();
    }
    // The same real Phoenix is transferred to the owned mercenary through its equipment dialog.
    await navTo(page, 'mercs'); await page.getByTestId(`merc-equipment-${mercId}`).click();
    await page.getByTestId('merc-equip-slot-offhand').getByText(en ? 'Offhand' : '副手', { exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: en ? 'Equip' : '装备', exact: true }).click();
    await page.keyboard.press('Escape');
    const mercCard = page.getByTestId(`merc-card-${mercId}`), redemptionName = en ? 'Redemption' : '救赎';
    await mercCard.getByRole('button', { name: en ? `Move ${redemptionName} earlier` : `提高${redemptionName}的优先级`, exact: true }).click();
    await layout(page, mercCard);
    const mercEquipped = await backup(page);
    expect(mercEquipped.mercs.ownedMercs[0]?.comboOrder)
      .toEqual(['mskill-inner-sight', 'mskill-basic-arrow', 'item.redemption', 'mskill-pierce-arrow']);
    expect(mercEquipped.player.comboOrder).toEqual(priorities);
    expect(mercEquipped.player.skillLevels).toEqual(fixture.player.skillLevels);
    page = await continued(page, context, en, info, 'merc-active-equipped-continued', { width, height }, observe);
    await navTo(page, 'mercs');
    await page.getByTestId(`merc-equipment-${mercId}`).click();
    await page.getByTestId('merc-equip-slot-offhand').getByRole('button', { name: en ? 'Unequip' : '卸下', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId(`merc-card-${mercId}`)).toContainText(en ? 'Redemption (unavailable)' : '救赎（不可用）');
    const removed = await backup(page);
    expect(removed.player.comboOrder).toEqual(priorities);
    expect(removed.player.skillLevels).toEqual(fixture.player.skillLevels);
    expect([...removed.inventory.backpack].sort((a, b) => a.id.localeCompare(b.id)))
      .toEqual([...items].sort((a, b) => a.id.localeCompare(b.id)));
    page = await continued(page, context, en, info, 'all-active-sources-removed-continued', { width, height }, observe);
    await navTo(page, 'mercs');
    await expect(page.getByTestId(`merc-card-${mercId}`)).toContainText(en ? 'Redemption (unavailable)' : '救赎（不可用）');
    const panel = await skills(page);
    for (const row of rows) await expect(panel.locator(`select option:checked[value="${row.skill}"]`)).toBeDisabled();
    await page.close(); expect(errors).toEqual([]);
  });
}
