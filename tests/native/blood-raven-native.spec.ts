/** Imported earned checkpoint: production rendering and controls, not fresh acquisition proof. */
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
    test(`Blood Raven ordinary import, encounter and Save/Continue ${locale} ${String(width)}`, async ({ page, context }, info) => {
      const fixturePath = process.env.BLOOD_RAVEN_EARNED_SAVE;
      if (!fixturePath) throw new Error('Set BLOOD_RAVEN_EARNED_SAVE to the retained earned four-map export');
      const bytes = await readFile(fixturePath);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe('c32f919de346b2230322630254e7d1e2c3e0cd0185398cc210064aa7ae22c3e0');
      const fixture = JSON.parse(bytes.toString()) as SaveCurrent;
      const english = locale === 'en';
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(1792497600000);
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
      await page.getByTestId('home-new-game').click();
      await page.getByTestId('class-sorceress').click();
      await page.getByTestId('character-name-input').fill('Blood Raven display QA');
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
      await page.getByTestId('sub-area-row-a1-burial-grounds')
        .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
      await expect(page.getByTestId('combat-screen')).toBeVisible();
      for (let wave = 1; wave < 4; wave++) {
        await expect(page.getByTestId('wave-counter')).toContainText(english ? `Wave ${String(wave)} / 4` : `第 ${String(wave)} 波 / 共 4 波`);
        await page.getByTestId('skip-button').click();
        await expect(page.getByTestId('wave-counter')).toContainText(english ? `Wave ${String(wave + 1)} / 4` : `第 ${String(wave + 1)} 波 / 共 4 波`);
      }
      const log = page.getByTestId('combat-log');
      await expect(log).toContainText(english ? 'Raise Dead' : '复活死尸', { timeout: 20000 });
      const summons = log.locator(':scope > div').filter({ hasText: english ? /summons Zombie/ : /召唤了 僵尸/ });
      await expect(summons).toHaveCount(3);
      await expect(log).toContainText(english ? 'Fire Arrow' : '火焰箭', { timeout: 20000 });
      const text = await log.innerText();
      expect(text).not.toMatch(/blood_raven_zombie|monster-blood-raven|combat:summons/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await info.attach('localized-raven-actions.txt', { body: text, contentType: 'text/plain' });
      await info.attach('raven-encounter.png', { body: await page.getByTestId('combat-screen').screenshot(), contentType: 'image/png' });
      await page.getByTestId('skip-button').click();
      await expect(page.getByTestId('victory-panel')).toBeVisible();
      await nav(page, 'settings');
      await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
      const saved = await backup(page);
      expect(saved.map.clearedSubAreas).toContain('areas/act1-burial-grounds');
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
