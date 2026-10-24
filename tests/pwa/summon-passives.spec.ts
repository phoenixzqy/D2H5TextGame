/** Constructed L30 functional eligibility; native allocation/persistence, no earned-balance claim. */
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
  { classId: 'necromancer', slug: 'summon-mastery', canonical: 'necromancer.summon_mastery',
    rows: [['Summon Life', '召唤物生命', 5], ['Summon Attack', '召唤物攻击', 2]] },
  { classId: 'necromancer', slug: 'summon-resist', canonical: 'necromancer.summon_resist',
    rows: [['Summon All Resist', '召唤物全抗', 2]] },
] as const;
for (const locale of ['en', 'zh-CN'] as const) {
  for (const c of cases) {
    test(c.canonical + ' native allocation and exact Continue ' + locale, async ({ page: initial, context }, info) => {
      const english = locale === 'en', errors: string[] = [];
      const watch = (p: Page) => {
        p.on('pageerror', error => errors.push(error.message));
        p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      };
      let page = initial; watch(page);
      await page.goto('/'); await page.waitForLoadState('networkidle');
      await createCharacter(page, { class: c.classId, name: 'Mastery functional fixture' });
      await navTo(page, 'settings');
      await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
      const fresh = await backup(page);
      const incoming: SaveCurrent = { ...fresh, player: { ...fresh.player, level: 30,
        skillPoints: 2, skillLevels: { 'necromancer.clay_golem': 1, 'necromancer.golem_mastery': 1 }, comboOrder: [] } };
      const importName = english ? 'Import Save' : '导入存档';
      await page.getByRole('button', { name: importName, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox').fill(JSON.stringify(incoming));
      await dialog.getByRole('button', { name: importName, exact: true }).click();
      await expect(dialog).toHaveCount(0);
      const prepared = await backup(page);
      expect(prepared.player).toEqual(incoming.player);
      await navTo(page, 'skills');
      await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
      const id = 'skills-' + c.classId + '-' + c.slug;
      await page.getByTestId('skill-node-' + id).click();
      await page.mouse.move(1, 1);
      const panel = page.getByTestId('skill-detail-panel');
      await expect(panel).toContainText(english ? 'Automatically' : '自动生效');
      await expect(panel).toContainText(english ? 'next wave' : '下一波');
      await expect(panel).toContainText(english ? 'maximum 20 ranks' : '最高20级');
      await expect(panel).not.toContainText('{{');
      const allocate = panel.getByRole('button');
      await allocate.scrollIntoViewIfNeeded();
      const bounds = await allocate.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44); expect(bounds?.height).toBeGreaterThanOrEqual(44);
      const current = panel.locator('section').filter({ has: page.getByRole('heading', { name: english ? 'Current' : '当前', exact: true }) });
      const next = panel.locator('section').filter({ has: page.getByRole('heading', { name: english ? 'Next Level' : '下一级', exact: true }) });
      for (const rank of [1, 2]) {
        await allocate.click();
        await expect(panel).toContainText(english ? 'Lv. ' + String(rank) + '/20' : '等级 ' + String(rank) + '/20');
        for (const [en, zh, bonus] of c.rows) {
          const label = english ? en : zh;
          await expect(current.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(String(bonus * rank) + '%');
          await expect(next.locator('dt').filter({ hasText: label }).locator('+ dd')).toHaveText(
            new RegExp('^' + String(bonus * (rank + 1)).replace('.', '[.]') + '%[ ]*[(][+]' + String(bonus).replace('.', '[.]') + '%[)]$'));
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await info.attach('allocated-mastery', { body: await page.screenshot(), contentType: 'image/png' });
      const allocated = await backup(page);
      expect(allocated.player.skillPoints).toBe(0);
      expect(allocated.player.skillLevels).toEqual({ ...prepared.player.skillLevels, [c.canonical]: 2 });
      expect(allocated.player.derivedStats).toEqual(prepared.player.derivedStats);
      expect(allocated.inventory).toEqual(prepared.inventory); expect(allocated.map).toEqual(prepared.map);
      expect(allocated.mercs).toEqual(prepared.mercs); expect(allocated.formation).toEqual(prepared.formation);
      await navTo(page, 'skills');
      await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
      await expect(page.locator('option[value="' + id + '"]')).toHaveCount(0);
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
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
      await navTo(page, 'skills'); await page.getByTestId('skill-node-' + id).click();
      await page.mouse.move(1, 1); await page.getByTestId('skill-detail-panel').scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await info.attach('mastery-after-Continue', { body: await page.screenshot(), contentType: 'image/png' });
      await info.attach('exact-Continue', { body: JSON.stringify({ saved, loaded, errors }, null, 2), contentType: 'application/json' });
      expect(errors).toEqual([]);
    });
  }
}
