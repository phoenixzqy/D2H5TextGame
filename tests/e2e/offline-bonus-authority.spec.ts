/** Imported tuples prove UI/save wiring, not earned bonus or production PWA acceptance. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const NOW = 1_792_454_400_000;

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await pending).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

async function importBackup(page: Page, save: SaveCurrent, english: boolean): Promise<void> {
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

async function expectChip(page: Page, english: boolean, pct: number, minutes: number): Promise<void> {
  const chip = page.getByTestId('offline-bonus-chip');
  await expect(chip).toHaveText(`⏳ +${String(pct)}% · ${String(minutes)}${english ? 'm' : '分钟'}`);
  await expect(chip).toHaveAccessibleName(english
    ? `+${String(pct)}% XP for ${String(minutes)} min`
    : `+${String(pct)}% 经验加成，剩余 ${String(minutes)} 分钟`);
  const box = await chip.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Missing visible bonus chip');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Missing configured viewport');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

function expectProjectedSave(actual: SaveCurrent, fixture: SaveCurrent, now: number,
  multiplier: number, seconds: number): void {
  expect(actual.meta.idleState.activeMultiplier).toBeCloseTo(multiplier, 12);
  expect(actual).toEqual({ ...fixture, timestamp: now, meta: { ...fixture.meta,
    idleState: { ...fixture.meta.idleState, lastOnline: now,
      activeMultiplier: actual.meta.idleState.activeMultiplier, multiplierSecondsRemaining: seconds } } });
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`persisted bonus display consumes online time without reload refresh ${locale} @responsive`, async ({ page }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Install before navigation, then pause after ordinary setup has loaded.
    await page.clock.install({ time: NOW - 60_000 });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Bonus wiring' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await page.clock.pauseAt(NOW);
    const original = await exportBackup(page);
    const fixture: SaveCurrent = { ...original, timestamp: NOW - 86_400_000,
      meta: { ...original.meta, idleState: { lastOnline: NOW - 86_400_000,
        offlineTime: 123, activeMultiplier: 1.32, multiplierSecondsRemaining: 4800 } } };
    await importBackup(page, fixture, english);
    await expectChip(page, english, 32, 80);
    expectProjectedSave(await exportBackup(page), fixture, NOW, 1.32, 4800);

    // A long jump delivers due timers once; projection must consume absolute time.
    await page.clock.fastForward(600_000);
    await expectChip(page, english, 28, 70);
    const checkpoint = await exportBackup(page);
    expectProjectedSave(checkpoint, fixture, NOW + 600_000, 1.28, 4200);
    const saveLabel = english ? 'Save' : '保存';
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expectChip(page, english, 28, 70);
    expect(await exportBackup(page)).toEqual(checkpoint);
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toBeVisible();
    const banner = page.getByTestId('offline-bonus-banner');
    await expect(banner).toContainText(english ? '+28% XP boost' : '离线奖励 +28% 经验');
    await expect(banner).toContainText(english ? 'next 70 min' : '剩余 70 分钟');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId('home-settings').click();
    await expectChip(page, english, 28, 70);
    expect(await exportBackup(page)).toEqual(checkpoint);

    await page.clock.fastForward(600_000);
    await expectChip(page, english, 24, 60);
    expectProjectedSave(await exportBackup(page), fixture, NOW + 1_200_000, 1.24, 3600);
    await page.clock.fastForward(3_600_000);
    await expect(page.getByTestId('offline-bonus-chip')).toHaveCount(0);
    expectProjectedSave(await exportBackup(page), fixture, NOW + 4_800_000, 1, 0);

    // A second exact import updates the still-mounted hook between its ticks.
    await page.clock.runFor(10_000);
    const replacement: SaveCurrent = { ...fixture, meta: { ...fixture.meta,
      idleState: { ...fixture.meta.idleState, activeMultiplier: 1.2, multiplierSecondsRemaining: 20 } } };
    await importBackup(page, replacement, english);
    await expectChip(page, english, 20, 1);
    await page.clock.runFor(20_000);
    await expect(page.getByTestId('offline-bonus-chip')).toHaveCount(0);
    expectProjectedSave(await exportBackup(page), replacement, NOW + 4_830_000, 1, 0);

    // An ordinary document reload at this same clock exposes the /home banner.
    // Persist the short expired tuple first so startup has no away interval.
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect(page.getByTestId('offline-bonus-banner')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
