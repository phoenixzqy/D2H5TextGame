/** Explicit imported L30 eligibility; real production allocation and Save/close/Continue. */
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
  ['increased-stamina', 'increased_stamina', 'Life', '生命', 3],
  ['increased-speed', 'increased_speed', 'Attack Speed', '攻击速度', 1],
  ['natural-resistance', 'natural_resistance', 'All Resist', '全抗', 2],
] as const;
for (const locale of ['en', 'zh-CN'] as const) {
  test('Barbarian endurance native learning and exact Continue ' + locale, async ({ page: initial, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const watch = (p: Page) => {
      p.on('pageerror', error => errors.push(error.message));
      p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    let page = initial; watch(page);
    await page.goto('/'); await page.waitForLoadState('networkidle');
    await createCharacter(page, { class: 'barbarian', name: 'Endurance fixture' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const fresh = await backup(page);
    const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30, skillPoints: 3,
      skillLevels: { 'barbarian.bash': 1, 'barbarian.iron_skin': 1 }, comboOrder: ['skills-barbarian-bash'] } };
    const importName = english ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importName, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
    await dialog.getByRole('button', { name: importName, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const prepared = await backup(page);
    expect(prepared.player).toEqual(incoming.player);
    for (const [id, canonical, en, zh, bonus] of cases) {
      await navTo(page, 'skills');
      await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
      await page.getByTestId('skill-node-skills-barbarian-' + id).click();
      await page.mouse.move(1, 1);
      const panel = page.getByTestId('skill-detail-panel');
      await expect(panel).toContainText(english ? 'Automatically' : '自动生效');
      await expect(panel).toContainText(english ? 'Barbarian only' : '仅野蛮人');
      await expect(panel).not.toContainText('{{');
      const allocate = panel.getByRole('button');
      await allocate.scrollIntoViewIfNeeded();
      const bounds = await allocate.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
      await allocate.click();
      await expect(panel).toContainText(english ? 'Lv. 1/20' : '等级 1/20');
      const current = panel.locator('section').filter({ has: page.getByRole('heading', {
        name: english ? 'Current' : '当前', exact: true }) });
      await expect(current.locator('dt').filter({ hasText: english ? en : zh }).locator('+ dd')).toHaveText(String(bonus) + '%');
      if (id !== 'increased-stamina') {
        const label = english ? (id === 'increased-speed' ? 'Physical Dodge' : 'Magical Dodge')
          : (id === 'increased-speed' ? '物理闪避' : '魔法闪避');
        await expect(current.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText('0.5%');
        const next = panel.locator('section').filter({ has: page.getByRole('heading', {
          name: english ? 'Next Level' : '下一级', exact: true }) });
        await expect(next.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(/^1%\s*\(\+0\.5%\)$/);
      }
      const checkpoint = await backup(page);
      expect(checkpoint.player.skillLevels?.['barbarian.' + canonical]).toBe(1);
      expect(checkpoint.player.derivedStats).toEqual(prepared.player.derivedStats);
      expect(checkpoint.inventory).toEqual(prepared.inventory);
      expect(checkpoint.map).toEqual(prepared.map);
    }
    await navTo(page, 'skills');
    await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
    for (const [id] of cases) expect(await page.locator(`option[value="skills-barbarian-${id}"]`).count()).toBe(0);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const saved = await backup(page);
    expect(saved.player.skillPoints).toBe(0);
    expect(saved.player.skillLevels).toEqual({ 'barbarian.bash': 1, 'barbarian.iron_skin': 1,
      'barbarian.increased_stamina': 1, 'barbarian.increased_speed': 1, 'barbarian.natural_resistance': 1 });
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
    await page.getByTestId('skill-node-skills-barbarian-natural-resistance').click();
    await page.mouse.move(1, 1);
    const panel = page.getByTestId('skill-detail-panel');
    await panel.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await info.attach('native-endurance-after-Continue', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('exact-Continue', { body: JSON.stringify({ saved, loaded, errors }, null, 2), contentType: 'application/json' });
    expect(errors).toEqual([]);
  });
}
