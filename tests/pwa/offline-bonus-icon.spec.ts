/** BUG681: actual offline return, font-independent home/HUD artwork, no combat. */
import { expect, test, type Locator } from '@playwright/test';
import { createCharacter, navTo } from '../e2e/_helpers';

const createdAt = Date.parse('2026-10-20T12:00:00.000Z');

async function expectHourglass(surface: Locator): Promise<void> {
  const icon = surface.locator('svg');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).toHaveAttribute('focusable', 'false');
  await expect(surface).not.toContainText('⏳');
  const box = await icon.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(14);
  expect(box?.height).toBeGreaterThanOrEqual(14);
  expect(await icon.evaluate(element => getComputedStyle(element).stroke)).toMatch(/^rgb\(/);
  expect(await surface.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`offline bonus font-independent hourglass ${locale}`, async ({ page: first, context }, testInfo) => {
    test.setTimeout(90_000);
    const english = locale === 'en';
    const errors: string[] = [];
    first.on('pageerror', error => errors.push(error.message));
    await first.clock.install({ time: createdAt });
    await first.clock.pauseAt(createdAt);
    await first.goto('/');
    await createCharacter(first, { class: 'sorceress', name: 'Hourglass check' });
    await navTo(first, 'settings');
    await first.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await first.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(first.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await expect.poll(() => first.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    await first.close();

    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setSystemTime(createdAt + 8 * 3_600_000);
    await context.setOffline(true);
    const response = await page.goto('/');
    expect(response?.fromServiceWorker()).toBe(true);
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    const banner = page.getByTestId('offline-bonus-banner');
    await expectHourglass(banner);
    await expect(banner).toContainText(english ? '+50% XP / Magic Find' : '离线加成 +50% 经验／魔法寻获');
    await testInfo.attach('home-hourglass', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByTestId('home-continue').click();
    const chip = page.getByTestId('offline-bonus-chip');
    await expectHourglass(chip);
    await expect(chip).toHaveAccessibleName(english ? '+50% XP and Magic Find for 120 min'
      : '+50% 经验与魔法寻获加成，剩余 120 分钟');
    await navTo(page, 'settings');
    await testInfo.attach('hud-hourglass', { body: await page.screenshot(), contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
