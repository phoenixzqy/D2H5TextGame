/** Production entry/persistence check from an earned import; no fresh-route claim. */
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
    test(`fresh challenge resources and saved-pool preservation ${locale} ${String(width)}`, async ({ page, context }, info) => {
      const file = process.env.CHALLENGE_ENTRY_EARNED_SAVE;
      if (!file) throw new Error('CHALLENGE_ENTRY_EARNED_SAVE must point to the original earned L12 save');
      const bytes = await readFile(file);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe('8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc');
      const fixture = JSON.parse(bytes.toString()) as SaveCurrent;
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
      await page.getByTestId('character-name-input').fill('Entry resource QA');
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
      await nav(page, 'map');
      // Freeze native playback before entering; ordinary controls still create the real run.
      await page.clock.pauseAt(new Date(1792497660000));
      await page.getByTestId('sub-area-row-a1-blood-moor')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      const screen = page.getByTestId('combat-screen');
      await expect(screen).toBeVisible();
      // Compact battlefield HP is a visual fill; numeric MP uses StatBar.
      const hp = page.getByTestId(`unit-card-${fixture.player.id}`).locator('.bg-red-600');
      const mp = screen.getByRole('group', { name: english ? 'MP' : '法力', exact: true }).getByRole('progressbar');
      await expect(hp).toBeVisible();
      await expect(hp).toHaveAttribute('style', /^width: 100(?:\.0+)?%;?$/);
      await expect(mp).toHaveAttribute('aria-valuenow', '188');
      await expect(mp).toHaveAttribute('aria-valuemax', '188');
      expect(fixture.player.derivedStats.life).toBe(120);
      expect(fixture.player.derivedStats.mana).toBe(102);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await info.attach('full-entry-resources.png', { body: await screen.screenshot(), contentType: 'image/png' });
      await screen.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
      await nav(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.player).toEqual(fixture.player);
      expect(saved.inventory).toEqual(fixture.inventory);
      expect(saved.mercs).toEqual(fixture.mercs);
      expect(saved.map.clearedSubAreas).toEqual(fixture.map.clearedSubAreas);
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
