/** Ordinary earned upgrade and persistence; imported checkpoint, not fresh acquisition. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { SaveCurrent } from '../../src/engine/types/save';

async function nav(page: Page, route: string) {
  await page.locator(`a[href="/${route}"]`).first().click();
  await expect(page.getByTestId(`${route}-screen`)).toBeVisible();
}
async function backup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}
for (const locale of ['en', 'zh-CN'] as const) {
  for (const [width, height] of [[360, 640], [1280, 800]] as const) {
    test(`earned same-base rolled upgrade ${locale} ${String(width)}`, async ({ page, context }, info) => {
      const file = process.env.EQUIP_INSTANCE_EARNED_SAVE;
      if (!file) throw new Error('EQUIP_INSTANCE_EARNED_SAVE must identify the original earned L12 save');
      const bytes = await readFile(file);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe('8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc');
      const fixture = JSON.parse(bytes.toString()) as SaveCurrent;
      const current = fixture.inventory.equipped.boots;
      const candidate = fixture.inventory.backpack.find(item => item.id === 'it-87tii-9x');
      expect(current?.baseRolls?.defense).toBe(3);
      expect(candidate?.baseRolls?.defense).toBe(4);
      if (!current || !candidate) throw new Error('Earned boot instances missing');
      expect(candidate.baseId).toBe(current.baseId);
      expect(candidate.rarity).toBe(current.rarity);
      expect(candidate.affixes).toEqual(current.affixes);
      const english = locale === 'en';
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date(1792497600000) });
      await page.clock.setFixedTime(1792497600000);
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
      await page.getByTestId('home-new-game').click();
      await page.getByTestId('class-sorceress').click();
      await page.getByTestId('character-name-input').fill('Earned gear QA');
      await page.getByTestId('character-start-btn').click();
      await expect(page.getByTestId('town-screen')).toBeVisible();
      await nav(page, 'settings');
      await page.getByRole('button', { name: /^(Import Save|导入存档)$/ }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox').fill(JSON.stringify(fixture));
      await dialog.getByRole('button', { name: /^(Import Save|导入存档)$/ }).click();
      await expect(dialog).toHaveCount(0);
      expect(await backup(page)).toEqual(fixture);
      await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
      await nav(page, 'inventory');
      await page.getByRole('tab', { name: english ? 'Equipment' : '装备', exact: true }).click();
      // Activate the native slot selector, independently of Details and Unequip.
      await page.getByTestId('equip-slot-boots-select').press('Enter');
      const picker = page.getByTestId('equip-picker');
      await picker.getByTestId(`equip-picker-row-${candidate.id}`).click();
      await expect(picker.getByTestId('already-equipped-badge')).toHaveCount(0);
      await expect(picker.getByTestId('stat-compare-table')).toBeVisible();
      const defense = picker.getByRole('row').filter({ has: page.getByText(english ? 'Defense' : '防御', { exact: true }) });
      await expect(defense).toContainText('69');
      await expect(defense).toContainText('70');
      await expect(defense.getByTestId('stat-delta')).toHaveAttribute('data-trend', 'up');
      const confirm = picker.getByTestId('equip-picker-confirm');
      await expect(confirm).toBeEnabled();
      const rect = await confirm.boundingBox();
      expect(rect?.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await info.attach('earned-upgrade-comparison.png', { body: await picker.screenshot(), contentType: 'image/png' });
      await confirm.click();
      await expect(picker).toHaveCount(0);
      await nav(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.inventory).toEqual({ ...fixture.inventory,
        equipped: { ...fixture.inventory.equipped, boots: { ...candidate, equipped: true } },
        backpack: [...fixture.inventory.backpack.filter(item => item.id !== candidate.id), { ...current, equipped: false }] });
      expect(saved.player).toEqual({ ...fixture.player,
        derivedStats: { ...fixture.player.derivedStats, defense: 70 } });
      expect(saved.mercs).toEqual(fixture.mercs);
      expect(saved.map).toEqual(fixture.map);
      expect(saved.formation).toEqual(fixture.formation);
      await page.close();
      const reopened = await context.newPage();
      reopened.on('pageerror', error => errors.push(error.message));
      await reopened.clock.setFixedTime(1792497600000);
      await reopened.goto('/');
      await reopened.waitForLoadState('networkidle');
      await reopened.getByTestId('home-continue').click();
      await expect(reopened.getByTestId('town-screen')).toBeVisible();
      await nav(reopened, 'settings');
      expect(await backup(reopened)).toEqual(saved);
      expect(errors).toEqual([]);
      await reopened.close();
    });
  }
}
