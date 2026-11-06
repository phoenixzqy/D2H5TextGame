/** Real production combat timing feedback; ordinary UI admission, no debug bridge. */
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

for (const locale of ['en', 'zh-CN'] as const) {
  test(`hero attack cadence ${locale}`, async ({ page }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Cadence browser' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByTestId('export-save-button').click();
    const download = await pending;
    let saved: SaveCurrent;
    try { saved = JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
    finally { await download.delete(); }
    const speed = saved.player.derivedStats.attackSpeed;
    const period = Math.max(400, Math.min(2000, 2500 - Math.floor(speed) * 8));
    const seconds = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(period / 1000);
    await navTo(page, 'map');
    await page.getByTestId('sub-area-row-a1-blood-moor')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    const indicator = page.getByTestId('hero-attack-cadence');
    await expect(indicator).toBeVisible();
    await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click();
    await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect(indicator).toContainText(english ? `Attack interval: ${seconds}s` : `攻击间隔：${seconds}秒`);
    await expect(indicator).toContainText(english ? 'Attack Speed from gear: +0%' : '装备攻击速度：+0%');
    await expect(indicator).not.toHaveAttribute('aria-live');
    const initial = await indicator.innerText();
    const playbackSpeed = page.getByRole('button', { name: english ? 'Speed' : '速度', exact: true });
    await playbackSpeed.click();
    await expect(playbackSpeed).toHaveText('2x');
    expect(await indicator.innerText()).toBe(initial);
    await playbackSpeed.click();
    await expect(playbackSpeed).toHaveText('4x');
    expect(await indicator.innerText()).toBe(initial);
    for (const viewport of [{ width: 360, height: 640 }, { width: 412, height: 915 },
      { width: 640, height: 360 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await indicator.scrollIntoViewIfNeeded();
      await expect(indicator).toBeInViewport();
      expect(await indicator.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize(info.project.use.viewport ?? { width: 360, height: 640 });
    await indicator.scrollIntoViewIfNeeded();
    await info.attach('attack-cadence', { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach('native-cadence', { body: JSON.stringify({ speed, period, initial }), contentType: 'application/json' });
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    expect(errors).toEqual([]);
  });
}
