/** Constructed L30 eligibility; production allocation and exact persistence, not earned balance. */
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
  ['avoid', [['Magical Dodge', '魔法闪避', '1%', '2%', '1%']]],
  ['evade', [['Physical Dodge', '物理闪避', '0.5%', '1%', '0.5%'],
    ['Magical Dodge', '魔法闪避', '0.5%', '1%', '0.5%']]],
  ['pierce', [['Physical Damage', '物理伤害', '2%', '4%', '2%'], ['Attack', '攻击', '1%', '2%', '1%']]],
] as const;
for (const locale of ['en', 'zh-CN'] as const) {
  test('remaining Amazon passive allocation and exact Continue ' + locale, async ({ page: initial, context }, info) => {
    const english = locale === 'en', errors: string[] = [];
    const watch = (p: Page) => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    let page = initial; watch(page);
    await page.goto('/'); await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'amazon', name: 'Amazon passive functional fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30,
      skillPoints: 4, skillLevels: { 'amazon.dodge': 1, 'amazon.critical_strike': 1, 'amazon.penetrate': 1 },
      comboOrder: [] } };
    const importName = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importName, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const prepared = await backup(page);
    expect(prepared.player).toEqual(incoming.player);
    for (const [key, rows] of cases) {
      await navTo(page, 'skills');
      await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
      await page.getByTestId('skill-node-skills-amazon-' + key).click();
      await page.mouse.move(1, 1);
      const panel = page.getByTestId('skill-detail-panel');
      await expect(panel).toContainText(english ? 'Automatically' : '自动生效');
      await expect(panel).toContainText(english ? 'next wave' : '下一波');
      await expect(panel).not.toContainText(english ? /while moving|ranged attacks|pass through targets/ : /移动时|远程攻击|穿透目标/);
      const allocate = panel.getByRole('button');
      await allocate.scrollIntoViewIfNeeded();
      const bounds = await allocate.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
      await allocate.click();
      await expect(panel).toContainText(english ? 'Lv. 1/20' : '等级 1/20');
      const rankSection = (name: string) => panel.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });
      const current = rankSection(english ? 'Current' : '当前'), next = rankSection(english ? 'Next Level' : '下一级');
      for (const [en, zh, value, nextValue, delta] of rows) {
        const label = english ? en : zh;
        await expect(current.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(value);
        await expect(next.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(new RegExp('^' + nextValue.replace('.', '[.]') + '[ ]*[(][+]' + delta.replace('.', '[.]') + '[)]$'));
      }
      await expect(panel).not.toContainText('{{');
      await info.attach('allocated-' + key, { body: await page.screenshot(), contentType: 'image/png' });
      if (key === 'evade') {
        await allocate.click();
        await expect(panel).toContainText(english ? 'Lv. 2/20' : '等级 2/20');
        for (const [en, zh] of rows) await expect(current.locator('dt').filter({ hasText: english ? en : zh }).locator('+ dd')).toHaveText('1%');
      }
    }
    const allocated = await backup(page);
    expect(allocated.player.skillPoints).toBe(0);
    expect(allocated.player.derivedStats).toEqual(prepared.player.derivedStats);
    expect(allocated.player.skillLevels).toEqual({ 'amazon.dodge': 1, 'amazon.critical_strike': 1,
      'amazon.penetrate': 1, 'amazon.avoid': 1, 'amazon.evade': 2, 'amazon.pierce': 1 });
    expect(allocated.inventory).toEqual(prepared.inventory);
    expect(allocated.map).toEqual(prepared.map); expect(allocated.mercs).toEqual(prepared.mercs);
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (const [key] of cases) await expect(page.locator('option[value="skills-amazon-' + key + '"]')).toHaveCount(0);
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
    await navTo(page, 'skills'); await page.getByTestId('skill-node-skills-amazon-evade').click();
    await page.mouse.move(1, 1); await page.getByTestId('skill-detail-panel').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await info.attach('amazon-after-Continue', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('exact-Continue', { body: JSON.stringify({ saved, loaded, errors }, null, 2), contentType: 'application/json' });
    expect(errors).toEqual([]);
  });
}
