/**
 * Production panel/layout/persistence acceptance with explicitly imported holdings.
 * This constructed save proves display and conservation, never earned acquisition.
 * No combat, hidden game bridge, direct store writes or storage writes are used.
 */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const sizes = [[320,640],[360,640],[412,915],[640,360],[768,1024],[1280,800],[1920,1080]] as const;

async function backup(page: Page): Promise<SaveCurrent> {
  await navTo(page, 'settings');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

async function importHoldings(page: Page, save: SaveCurrent, english: boolean): Promise<void> {
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`material catalog and constructed holdings stay usable and saved ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Material Viewer' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const fresh = await backup(page);
    expect(fresh.inventory.materials).toEqual({});
    await navTo(page, 'inventory');
    const panel = page.getByRole('region', { name: english ? 'Materials' : '材料', exact: true });
    await expect(panel).toContainText(english ? 'No materials yet.' : '尚无材料。');

    const catalog = panel.getByRole('button', { name: english ? 'All materials' : '全部材料', exact: true });
    await catalog.click();
    await expect(panel.getByTestId(/^material-/)).toHaveCount(69);
    await expect(panel.getByTestId('material-gems/topaz/perfect')).toContainText(english ? 'Perfect Topaz' : '完美的黄宝石');
    await expect(panel.getByTestId('material-materials/scrap')).toContainText(english ? 'Scrap' : '废料');
    const metrics = [];
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await catalog.scrollIntoViewIfNeeded();
      const geometry = await panel.evaluate(node => {
        const main = document.querySelector('main');
        return {
          documentOverflow: document.documentElement.scrollWidth - innerWidth,
          mainOverflow: main ? main.scrollWidth - main.clientWidth : -1,
          controls: [...node.querySelectorAll('button')].map(button => {
            const b = button.getBoundingClientRect();
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            return { width: b.width, height: b.height, reachable: hit !== null && button.contains(hit) };
          }),
          rowsFit: [...node.querySelectorAll('li')].every(row => row.scrollWidth <= row.clientWidth)
        };
      });
      expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
      expect(geometry.mainOverflow).toBe(0);
      expect(geometry.rowsFit).toBe(true);
      for (const control of geometry.controls) {
        expect(control.width).toBeGreaterThanOrEqual(44);
        expect(control.height).toBeGreaterThanOrEqual(44);
        expect(control.reachable).toBe(true);
      }
      metrics.push({ width, height, ...geometry });
      if (width === 360 || width === 1280) await info.attach(`catalog-${String(width)}-${locale}`, {
        body: await page.screenshot(), contentType: 'image/png'
      });
    }
    await info.attach('catalog-layout', { body: JSON.stringify(metrics), contentType: 'application/json' });
    const owned = panel.getByRole('button', { name: english ? 'Owned materials' : '已持有材料', exact: true });
    await owned.focus();
    await page.keyboard.press('Enter');
    await expect(owned).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByTestId(/^material-/)).toHaveCount(0);

    // Deliberately constructed native input exercises long counts; it is not an earned reward.
    const fixture: SaveCurrent = { ...fresh, inventory: { ...fresh.inventory, materials: {
      'runes/el': Number.MAX_SAFE_INTEGER, 'gems/ruby/perfect': 3, 'materials/scrap': 4
    } } };
    await navTo(page, 'settings');
    await importHoldings(page, fixture, english);
    await navTo(page, 'inventory');
    await expect(panel.getByTestId(/^material-/)).toHaveCount(3);
    await expect(panel.getByTestId('material-runes/el')).toContainText(new Intl.NumberFormat(locale).format(Number.MAX_SAFE_INTEGER));
    await page.setViewportSize({ width: 360, height: 640 });
    expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth &&
      [...node.querySelectorAll('li')].every(row => row.scrollWidth <= row.clientWidth))).toBe(true);
    const beforeClose = await backup(page);
    expect(beforeClose.inventory).toEqual(fixture.inventory);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.close();
    const continued = await context.newPage();
    continued.on('pageerror', error => errors.push(error.message));
    await continued.goto('/');
    await continued.getByTestId('home-continue').click();
    await expect(continued.getByTestId('town-screen')).toBeVisible();
    await navTo(continued, 'inventory');
    const restored = continued.getByTestId('materials-panel');
    await expect(restored.getByTestId(/^material-/)).toHaveCount(3);
    await expect(restored.getByTestId('material-runes/el')).toContainText(new Intl.NumberFormat(locale).format(Number.MAX_SAFE_INTEGER));
    const afterContinue = await backup(continued);
    expect(afterContinue.inventory).toEqual(fixture.inventory);
    expect(errors).toEqual([]);
    await continued.close();
  });
}
