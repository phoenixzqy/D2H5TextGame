/** Production startup receipt from real close/reopen, with no manufactured save. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

const createdAt = Date.parse('2026-10-20T12:00:00.000Z');
const returnedAt = createdAt + 8 * 3_600_000;

async function backup(page: Page, english: boolean): Promise<SaveCurrent> {
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try { return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent; }
  finally { await download.delete(); }
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`offline returning-player message ${locale}`, async ({ page: first, context }, testInfo) => {
    const english = locale === 'en';
    const errors: string[] = [];
    context.on('page', opened => opened.on('pageerror', error => errors.push(error.message)));
    first.on('pageerror', error => errors.push(error.message));
    let page = first;
    await page.clock.install({ time: createdAt });
    await page.clock.pauseAt(createdAt);
    await page.goto('/');
    await expect(page.getByTestId('offline-return-toast')).toHaveCount(0);
    await createCharacter(page, { class: 'sorceress', name: 'Return message' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    const before = await backup(page, english);
    expect(before.timestamp).toBe(createdAt);

    await page.close();
    page = await context.newPage();
    await page.clock.setSystemTime(returnedAt);
    await context.setOffline(true);
    const response = await page.goto('/');
    expect(response?.fromServiceWorker()).toBe(true);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const toast = page.getByTestId('offline-return-toast');
    await expect(toast).toBeVisible();
    await expect(page.getByTestId('offline-return-live-region')).toHaveAttribute('aria-live', 'polite');
    await expect(toast).toContainText(english ? 'Welcome back' : '欢迎归来');
    await expect(toast).toContainText(english ? '8h 0m' : '8 小时 0 分钟');
    await expect(toast).toContainText('+50%');
    await expect(toast).toContainText(english ? '120m 0s' : '120 分钟 0 秒');
    await expect(toast).toContainText(english ? 'On return' : '返回时');
    await testInfo.attach('return-home', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByTestId('home-continue').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    await navTo(page, 'settings');
    await expect(toast).toHaveCount(1);
    const returned: SaveCurrent = { ...before, timestamp: returnedAt, meta: { ...before.meta,
      idleState: { ...before.meta.idleState, lastOnline: returnedAt, offlineTime: 8 * 3_600_000,
        activeMultiplier: 1.5, multiplierSecondsRemaining: 7200 } } };
    expect(await backup(page, english)).toEqual(returned);
    const close = toast.getByRole('button', { name: english ? 'Close' : '关闭' });
    for (const viewport of [{ width: 360, height: 640 }, { width: 412, height: 915 },
      { width: 640, height: 360 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await expect(toast).toBeInViewport();
      await expect(close).toBeInViewport();
      expect(await toast.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const box = await close.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await page.setViewportSize(testInfo.project.use.viewport ?? { width: 360, height: 640 });
    await close.focus();
    await expect(close).toBeFocused();
    await testInfo.attach('return-keyboard', { body: await page.screenshot(), contentType: 'image/png' });
    await close.press(english ? 'Enter' : 'Space');
    await expect(toast).toHaveCount(0);
    await navTo(page, 'town');
    await navTo(page, 'settings');
    expect(await backup(page, english)).toEqual(returned);
    await expect(toast).toHaveCount(0);

    // Same-clock offline restart keeps the committed bonus without a new receipt.
    await page.close();
    page = await context.newPage();
    const reopened = await page.goto('/');
    expect(reopened?.fromServiceWorker()).toBe(true);
    await expect(page.getByTestId('offline-bonus-banner')).toContainText('+50%');
    await expect(page.getByTestId('offline-return-toast')).toHaveCount(0);
    await page.getByTestId('home-continue').click();
    await navTo(page, 'settings');
    expect(await backup(page, english)).toEqual(returned);
    expect(errors).toEqual([]);
  });
}
