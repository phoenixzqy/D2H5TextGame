/** Fresh character/free hire; ordinary controls and persistence in a production bundle. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'mercs/act1-rogue-inner-sight';
const order = ['mskill-inner-sight', 'mskill-pierce-arrow', 'mskill-basic-arrow'];
async function nav(page: Page, route: string) {
  await page.locator(`a[href="/${route}"]`).first().click();
  await expect(page.getByTestId(`${route}-screen`)).toBeVisible();
}
async function backup(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const file = await pending;
  try { return JSON.parse(await readFile(await file.path(), 'utf8')) as Record<string, unknown>; }
  finally { await file.delete(); }
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`native merc skill priority and Save/Continue ${locale}`, async ({ page, context }, info) => {
    const english = locale === 'en';
    const errors: string[] = [];
    context.on('page', opened => opened.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(1792497600000);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
    await page.getByTestId('home-new-game').click();
    await page.getByTestId('class-sorceress').click();
    await page.getByTestId('character-name-input').fill('Merc priority QA');
    await page.getByTestId('character-start-btn').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    await nav(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await nav(page, 'mercs');
    await page.getByTestId(`hire-merc-${id}`).getByRole('button', { name: english ? 'Hire' : '招募', exact: true }).click();
    const card = page.getByTestId(`merc-card-${id}`);
    const priority = card.getByRole('region', { name: english ? 'Skill priority' : '技能优先级' });
    const earlier = english ? 'Move Pierce Arrow earlier' : '提高穿透箭的优先级';
    const basicEarlier = english ? 'Move Basic Arrow earlier' : '提高基础射击的优先级';
    await expect(priority.getByRole('button', { name: basicEarlier })).toBeDisabled();
    expect(await priority.getByRole('button').count()).toBe(4);
    const move = priority.getByRole('button', { name: earlier });
    await move.focus();
    await page.keyboard.press('Enter');
    await expect(move).toBeDisabled();
    await expect(priority.getByRole('button', { name: basicEarlier })).toBeEnabled();

    for (const [width, height] of [[360, 640], [412, 915], [640, 360], [1280, 800], [1920, 1080]] as const) {
      await page.setViewportSize({ width, height });
      await priority.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      expect(await page.getByRole('main').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
      for (const button of await priority.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      await info.attach(`priority-${String(width)}x${String(height)}`, { body: await priority.screenshot(), contentType: 'image/png' });
    }
    await nav(page, 'settings');
    const chosen = await backup(page);
    const mercs = chosen.mercs as { ownedMercs: { id: string; comboOrder: string[] }[] };
    expect(mercs.ownedMercs.find(merc => merc.id === id)?.comboOrder).toEqual(order);
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    const saved = await backup(page);
    expect(saved).toEqual(chosen);
    await info.attach('chosen-save.json', { body: JSON.stringify(saved, null, 2), contentType: 'application/json' });
    await page.close();
    const reopened = await context.newPage();
    await reopened.clock.setFixedTime(1792497600000);
    await reopened.setViewportSize({ width: 360, height: 640 });
    await reopened.goto('/');
    await reopened.waitForLoadState('networkidle');
    expect(await reopened.evaluate(() => '__GAME__' in window)).toBe(false);
    await reopened.getByTestId('home-continue').click();
    await expect(reopened.getByTestId('town-screen')).toBeVisible();
    await nav(reopened, 'mercs');
    await expect(reopened.getByTestId(`merc-card-${id}`).getByRole('button', { name: earlier })).toBeDisabled();
    await nav(reopened, 'settings');
    expect(await backup(reopened)).toEqual(saved);
    expect(errors).toEqual([]);
    await reopened.close();
  });
}
