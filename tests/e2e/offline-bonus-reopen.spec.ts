/** Ordinary page termination/startup acceptance; no PWA or earned-progression claim. */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const A = 1_792_454_400_000;
const B = A + 3_600_000;
const C = B + 600_000;
const D = C + 180_000;
const INITIAL_OFFLINE_TIME = 123;

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  const path = await download.path();
  try {
    return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
  } finally {
    await download.delete();
  }
}

/** Native readonly observation of the real committed save, without a game bridge. */
async function readStoredSave(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open saved character')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read committed character')); };
      get.onsuccess = () => {
        const record = get.result as { encoding?: string; data: SaveCurrent | string } | undefined;
        db.close();
        if (!record) reject(new Error('No committed character'));
        else {
          try {
            if (Object.hasOwn(record, 'encoding') && record.encoding !== 'json-v1') {
              throw new Error('Unsupported storage encoding');
            }
            resolve(record.encoding === 'json-v1' ? JSON.parse(record.data as string) as SaveCurrent
              : record.data as SaveCurrent);
          } catch (error) { reject(error instanceof Error ? error : new Error(String(error))); }
        }
      };
    };
  }));
}

async function importBackup(page: Page, save: SaveCurrent, english: boolean): Promise<void> {
  const label = english ? 'Import Save' : '导入存档';
  await page.getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(JSON.stringify(save));
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

async function saveAndVerify(page: Page, expected: SaveCurrent, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  expect(await readStoredSave(page)).toEqual(expected);
  expect(await exportBackup(page)).toEqual(expected);
}

function expectedSave(base: SaveCurrent, now: number, multiplier: number,
  seconds: number, offlineTime: number): SaveCurrent {
  return { ...base, timestamp: now, meta: { ...base.meta, idleState: {
    ...base.meta.idleState, lastOnline: now, activeMultiplier: multiplier,
    multiplierSecondsRemaining: seconds, offlineTime
  } } };
}

async function expectNoOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectChip(page: Page, english: boolean, pct: number, minutes: number): Promise<void> {
  const chip = page.getByTestId('offline-bonus-chip');
  await expect(chip).toHaveText(`⏳ +${String(pct)}% · ${String(minutes)}${english ? 'm' : '分钟'}`);
  await expect(chip).toHaveAccessibleName(english
    ? `+${String(pct)}% XP for ${String(minutes)} min`
    : `+${String(pct)}% 经验加成，剩余 ${String(minutes)} 分钟`);
  const box = await chip.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('Missing visible chip/configured viewport');
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  await expectNoOverflow(page);
}

/** Clock installation and pause are context-wide; never reinstall on a new page. */
async function reopenAt(context: BrowserContext, previous: Page, now: number): Promise<Page> {
  await previous.close();
  const page = await context.newPage();
  // The old application is gone before wall time changes. The only live page
  // is blank, so no old lifecycle timer can checkpoint the intended away gap.
  await page.clock.setSystemTime(now);
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible();
  return page;
}

async function expectReopened(page: Page, expected: SaveCurrent, english: boolean,
  pct: number, minutes: number): Promise<void> {
  const banner = page.getByTestId('offline-bonus-banner');
  await expect(banner).toContainText(english ? `+${String(pct)}% XP boost` : `离线奖励 +${String(pct)}% 经验`);
  await expect(banner).toContainText(english ? `next ${String(minutes)} min` : `剩余 ${String(minutes)} 分钟`);
  await expect(page.getByTestId('home-settings')).toHaveText(english ? 'Settings' : '设置');
  await expectNoOverflow(page);
  // Startup must durably reconcile before publishing this active bonus.
  expect(await readStoredSave(page)).toEqual(expected);
  await page.getByTestId('home-settings').click();
  await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  await expectChip(page, english, pct, minutes);
  expect(await exportBackup(page)).toEqual(expected);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`true close/reopen accrues once and preserves stronger remaining bonus ${locale} @responsive`, async ({ page: initialPage, context }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    const observeErrors = (page: Page): void => {
      page.on('pageerror', error => errors.push(error.message));
    };
    observeErrors(initialPage);
    context.on('page', observeErrors);
    let page = initialPage;
    // Install and pause exactly once per context, after ordinary setup loads.
    await page.clock.install({ time: A - 60_000 });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Reopen acceptance' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await page.clock.pauseAt(A);
    const original = await exportBackup(page);
    const inactive: SaveCurrent = { ...original, timestamp: A, meta: { ...original.meta,
      idleState: { lastOnline: A, offlineTime: INITIAL_OFFLINE_TIME,
        activeMultiplier: 1, multiplierSecondsRemaining: 0 } } };
    await importBackup(page, inactive, english);
    await expect(page.getByTestId('offline-bonus-chip')).toHaveCount(0);
    await saveAndVerify(page, inactive, english);

    const atB = expectedSave(inactive, B, 1.08, 1200, INITIAL_OFFLINE_TIME + 3_600_000);
    page = await reopenAt(context, page, B);
    await expectReopened(page, atB, english, 8, 20);
    page = await reopenAt(context, page, B);
    await expectReopened(page, atB, english, 8, 20);

    // Quiet online time: no setting, target, import, Save or other domain write.
    // Deliver regular timers so a recent periodic checkpoint must exist on disk.
    await page.clock.runFor(C - B);
    await expect.poll(async () => (await readStoredSave(page)).timestamp).toBeGreaterThanOrEqual(B + 570_000);
    const periodic = await readStoredSave(page);
    expect(periodic.timestamp).toBeLessThanOrEqual(C);
    const onlineSeconds = (periodic.timestamp - B) / 1000;
    const remainingSeconds = 1200 - onlineSeconds;
    const multiplier = 1 + (1.08 - 1) * (remainingSeconds / 1200);
    // Complete oracle derives solely from the known B fixture and a bounded
    // checkpoint timestamp, never from an arbitrary observed save payload.
    expect(periodic).toEqual(expectedSave(atB, periodic.timestamp, multiplier,
      remainingSeconds, INITIAL_OFFLINE_TIME + 3_600_000));
    // The chip may still show its last legal 30-second projection at this
    // frozen minute boundary. Remount through ordinary read-only navigation
    // before requiring the exact current text, without advancing the clock.
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('offline-bonus-chip')).toHaveCount(0);
    await navTo(page, 'settings');
    await expectChip(page, english, 4, 10);
    const atC = expectedSave(atB, C, 1.04, 600, INITIAL_OFFLINE_TIME + 3_600_000);
    await saveAndVerify(page, atC, english);

    // Three minutes away offers a weaker fresh bonus; retain 1.04/600 exactly.
    const atD = expectedSave(atC, D, 1.04, 600, INITIAL_OFFLINE_TIME + 3_780_000);
    page = await reopenAt(context, page, D);
    await expectReopened(page, atD, english, 4, 10);
    page = await reopenAt(context, page, D);
    await expectReopened(page, atD, english, 4, 10);
    await page.close();
    expect(errors).toEqual([]);
  });
}
