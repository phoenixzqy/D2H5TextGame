/** Production-only bonus presentation; no combat or manufactured save state. */
import { expect, test, type Locator, type Page } from '@playwright/test';
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

function projectedSave(before: SaveCurrent, elapsed: number): SaveCurrent {
  const now = returnedAt + elapsed * 1000;
  return { ...before, timestamp: now, meta: { ...before.meta, idleState: {
    ...before.meta.idleState, lastOnline: now, offlineTime: 8 * 3_600_000,
    activeMultiplier: 1 + 0.5 * (7200 - elapsed) / 7200,
    multiplierSecondsRemaining: 7200 - elapsed
  } } };
}

async function expectMeter(surface: Locator, english: boolean, value: number): Promise<void> {
  const meter = surface.getByRole('meter', {
    name: english ? 'Current XP and Magic Find bonus' : '当前经验与魔法寻获加成'
  });
  await expect(meter).toBeVisible();
  await expect(meter).toHaveAttribute('aria-valuemin', '0');
  await expect(meter).toHaveAttribute('aria-valuemax', '50');
  await expect.poll(async () => Number(await meter.getAttribute('aria-valuenow'))).toBeCloseTo(value, 8);
  expect(await meter.evaluate(element => Number.parseFloat((element.firstElementChild as HTMLElement).style.width)))
    .toBeCloseTo(value * 2, 8);
  expect(await surface.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`offline bonus labels, meters and keyboard help ${locale}`, async ({ page: first, context }, testInfo) => {
    const english = locale === 'en';
    const errors: string[] = [];
    context.on('page', opened => opened.on('pageerror', error => errors.push(error.message)));
    first.on('pageerror', error => errors.push(error.message));
    let page = first;
    await page.clock.install({ time: createdAt });
    await page.clock.pauseAt(createdAt);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Bonus display' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    const before = await backup(page, english);
    expect(before.timestamp).toBe(createdAt);
    expect(before.meta.idleState.activeMultiplier).toBe(1);

    await page.close();
    page = await context.newPage();
    await page.clock.setSystemTime(returnedAt);
    await context.setOffline(true);
    const response = await page.goto('/');
    expect(response?.fromServiceWorker()).toBe(true);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const banner = page.getByTestId('offline-bonus-banner');
    await expect(banner).toContainText(english ? '+50% XP / Magic Find' : '离线加成 +50% 经验／魔法寻获');
    await expectMeter(banner, english, 50);
    await testInfo.attach('home-bonus', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByTestId('home-continue').click();
    const chip = page.getByTestId('offline-bonus-chip');
    await expect(chip).toHaveAccessibleName(english ? '+50% XP and Magic Find for 120 min' : '+50% 经验与魔法寻获加成，剩余 120 分钟');
    await expectMeter(chip, english, 50);
    await navTo(page, 'settings');
    expect(await backup(page, english)).toEqual(projectedSave(before, 0));

    const help = page.getByTestId('offline-bonus-help');
    const summary = help.locator('summary');
    await expect(summary).toHaveText(english ? 'Offline bonus rules' : '离线加成规则');
    await expect(help).not.toHaveAttribute('open', '');
    await summary.focus();
    await expect(summary).toBeFocused();
    await summary.press('Enter');
    await expect(help).toHaveAttribute('open', '');
    await expect(help.locator('p')).toHaveCount(3);
    await expect(help.locator('p').first()).toContainText(english ? 'no direct XP, items or currency' : '不会直接获得经验、物品或货币');
    await expect(help).toContainText('+8%');
    await expect(help).toContainText('+50%');
    await expect(help).toContainText(english ? '20 minutes' : '20 分钟');
    await expect(help).toContainText(english ? '2 hours' : '2 小时');
    await expect(help).toContainText(english ? 'linearly to zero' : '线性衰减至零');
    const box = await summary.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await help.locator('p').last().scrollIntoViewIfNeeded();
    await expect(help.locator('p').last()).toBeInViewport();
    await testInfo.attach('settings-help', { body: await page.screenshot(), contentType: 'image/png' });
    await summary.press('Space');
    await expect(help).not.toHaveAttribute('open', '');

    await page.clock.fastForward(1_800_000);
    await expectMeter(chip, english, 37.5);
    await expect(chip).toHaveAccessibleName(english ? '+38% XP and Magic Find for 90 min' : '+38% 经验与魔法寻获加成，剩余 90 分钟');
    expect(await backup(page, english)).toEqual(projectedSave(before, 1800));
    // Reflow only the affected surfaces; no campaign or reward checks repeat.
    for (const viewport of [{ width: 360, height: 640 }, { width: 412, height: 915 },
      { width: 640, height: 360 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await expectMeter(chip, english, 37.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.clock.fastForward(5_400_000);
    await expect(chip).toHaveCount(0);
    await expect(page.getByRole('meter')).toHaveCount(0);
    expect(await backup(page, english)).toEqual(projectedSave(before, 7200));
    expect(errors).toEqual([]);
  });
}
