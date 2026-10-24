/** Constructed L30 eligibility/owned weapons; real production learning, equip and persistence. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
const cases = [
  ['sword', 'wp1h-short-sword', 'Sword', '剑'],
  ['axe', 'weapon-axe', 'Axe', '斧'],
  ['mace', 'weapon-mace', 'Mace', '钝器'],
] as const;
for (const locale of ['en', 'zh-CN'] as const) {
  test('weapon-mastery learning, native swaps and exact Continue ' + locale, async ({ page: initial, context }, info) => {
    const english = locale === 'en', errors: string[] = [];
    const watch = (p: Page) => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    let page = initial; watch(page);
    await page.goto('/'); await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'barbarian', name: 'Mastery functional fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30,
      skillPoints: 3, skillLevels: { 'barbarian.bash': 1 }, comboOrder: ['skills-barbarian-bash'] },
      inventory: { ...fresh.inventory, backpack: [...fresh.inventory.backpack,
        ...cases.map(([key, base]) => ({ id: 'fixture-native-' + key, baseId: 'items/base/' + base,
          rarity: 'normal' as const, level: 1, identified: true, equipped: false,
          affixes: [], socketCapacity: 0 }))] } };
    const importName = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importName, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const prepared = await backup(page);
    expect(prepared.player).toEqual(incoming.player); expect(prepared.inventory).toEqual(incoming.inventory);
    for (const [key] of cases) {
      await navTo(page, 'skills');
      await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
      await page.getByTestId('skill-node-skills-barbarian-' + key + '-mastery').click();
      await page.mouse.move(1, 1);
      const panel = page.getByTestId('skill-detail-panel');
      await expect(panel).toContainText(english ? 'Automatically' : '自动生效');
      await expect(panel).toContainText(english ? 'weapon slot' : '武器栏');
      await expect(panel).not.toContainText(english ? 'attack rating' : '命中率');
      const allocate = panel.getByRole('button');
      await allocate.scrollIntoViewIfNeeded();
      const bounds = await allocate.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
      await allocate.click();
      await expect(panel).toContainText(english ? 'Lv. 1/20' : '等级 1/20');
      const rankSection = (name: string) => panel.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });
      const current = rankSection(english ? 'Current' : '当前');
      await expect(current.locator('dt').filter({ hasText: english ? 'Physical Damage' : '物理伤害' }).locator('+ dd')).toHaveText('3%');
      await expect(current.locator('dt').filter({ hasText: english ? 'Critical Chance' : '暴击率' }).locator('+ dd')).toHaveText('0.5%');
      const next = rankSection(english ? 'Next Level' : '下一级');
      await expect(next.locator('dt').filter({ hasText: english ? 'Critical Chance' : '暴击率' }).locator('+ dd')).toHaveText(/^1%\s*\(\+0\.5%\)$/);
      await expect(panel).not.toContainText('{{');
    }
    const allocated = await backup(page);
    expect(allocated.player.skillPoints).toBe(0);
    expect(allocated.player.derivedStats).toEqual(prepared.player.derivedStats);
    expect(allocated.player.skillLevels).toEqual({ 'barbarian.bash': 1,
      'barbarian.sword_mastery': 1, 'barbarian.axe_mastery': 1, 'barbarian.mace_mastery': 1 });
    const swaps: SaveCurrent[] = [];
    for (const [key, base] of cases) {
      await navTo(page, 'inventory');
      await page.locator('[role="tab"][aria-controls="tabpanel-equipment"]').click();
      await page.getByTestId('equip-slot-weapon').getByText(english ? 'Weapon' : '武器', { exact: true }).click();
      await page.getByTestId('equip-picker-row-fixture-native-' + key).click();
      await page.getByTestId('equip-picker-confirm').click();
      await expect(page.getByTestId('equip-picker-confirm')).toBeHidden();
      const snapshot = await backup(page); swaps.push(snapshot);
      expect(snapshot.inventory.equipped.weapon?.id).toBe('fixture-native-' + key);
      expect(snapshot.inventory.equipped.weapon?.baseId).toBe('items/base/' + base);
      const owned = [...snapshot.inventory.backpack, ...snapshot.inventory.stash,
        ...Object.values(snapshot.inventory.equipped).filter(item => item !== null)];
      for (const [id] of cases) expect(owned.filter(item => item?.id === 'fixture-native-' + id)).toHaveLength(1);
      expect(snapshot.map).toEqual(prepared.map); expect(snapshot.mercs).toEqual(prepared.mercs);
    }
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (const [key] of cases) await expect(page.locator('option[value="skills-barbarian-' + key + '-mastery"]')).toHaveCount(0);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const saved = await backup(page);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.close(); page = await context.newPage(); watch(page);
    await page.goto('/'); await page.getByTestId('home-continue').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    const loaded = await backup(page);
    expect(loaded.player).toEqual(saved.player); expect(loaded.inventory).toEqual(saved.inventory);
    expect(loaded.map).toEqual(saved.map); expect(loaded.mercs).toEqual(saved.mercs);
    expect(loaded.formation).toEqual(saved.formation);
    await navTo(page, 'skills');
    await page.getByTestId('skill-node-skills-barbarian-mace-mastery').click();
    await page.mouse.move(1, 1);
    await page.getByTestId('skill-detail-panel').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await info.attach('mastery-after-Continue', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('exact-Continue', { body: JSON.stringify({ saved, loaded, swaps, errors }, null, 2), contentType: 'application/json' });
    expect(errors).toEqual([]);
  });
}
