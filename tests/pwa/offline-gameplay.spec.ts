/** Production service-worker acceptance using ordinary character/game controls. */
import { expect, test, type Page, type Response } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { createCharacter, navTo } from '../e2e/_helpers';

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const download = await pending;
  try {
    return JSON.parse(await readFile(await download.path(), 'utf8')) as SaveCurrent;
  } finally {
    await download.delete();
  }
}

/** Observe real persistence without a game bridge or storage writes. */
async function readStoredSave(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open saved character')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read saved character')); };
      get.onsuccess = () => {
        const record = get.result as { data: SaveCurrent } | undefined;
        db.close();
        if (!record) reject(new Error('No committed character'));
        else resolve(record.data);
      };
    };
  }));
}

async function saveBackup(page: Page, english: boolean): Promise<SaveCurrent> {
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
  const backup = await exportBackup(page);
  expect(await readStoredSave(page)).toEqual(backup);
  return backup;
}

async function expectProduction(page: Page): Promise<void> {
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
}

async function expectSettings(page: Page, english: boolean): Promise<void> {
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: english ? 'Save' : '保存', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectOfflineArtHelp(page: Page, english: boolean, offline: boolean): Promise<void> {
  const note = page.getByTestId('offline-art-help');
  if (offline) {
    await expect(note).toBeVisible();
    await expect(note).toHaveText(english
      ? 'You are offline. Some uncached artwork may be unavailable. Combat and saves remain usable.'
      : '当前处于离线状态，部分未缓存的美术资源可能无法显示。战斗和存档仍可正常使用。');
  } else {
    await expect(note).toHaveCount(0);
  }
}

async function currentWave(page: Page): Promise<number> {
  const text = await page.getByTestId('wave-counter').innerText();
  const number = /^\D*(\d+)/.exec(text)?.[1];
  if (!number) throw new Error(`Missing numeric wave counter: ${text}`);
  return Number(number);
}

/** Network is disabled by the caller. Require actual SW document and JS responses. */
async function reloadOffline(page: Page, expected: SaveCurrent, english: boolean): Promise<void> {
  const scripts: { url: string; ok: boolean; fromSW: boolean }[] = [];
  const observe = (response: Response): void => {
    if (response.request().resourceType() === 'script' && new URL(response.url()).pathname.endsWith('.js')) {
      scripts.push({ url: response.url(), ok: response.ok(), fromSW: response.fromServiceWorker() });
    }
  };
  page.on('response', observe);
  try {
    const response = await page.reload();
    expect(response?.ok()).toBe(true);
    expect(response?.fromServiceWorker()).toBe(true);
    await expectSettings(page, english);
    await expectOfflineArtHelp(page, english, true);
    await expectProduction(page);
    expect(await readStoredSave(page)).toEqual(expected);
    expect(await exportBackup(page)).toEqual(expected);
    const entry = await page.locator('script[type="module"][src]').getAttribute('src');
    if (!entry) throw new Error('Missing production entry module');
    expect(scripts.some(script => new URL(script.url).pathname === entry)).toBe(true);
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every(script => script.ok && script.fromSW)).toBe(true);
  } finally {
    page.off('response', observe);
  }
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`saved character reloads and fights offline in production ${locale}`, async ({ page, context }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // Each Playwright context is fresh: create the character via the shipped UI.
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Offline hero' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    // ready can resolve while the active worker is still activating. Wait for
    // its final state AND document control before disabling the network.
    await expect.poll(async () => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    await expectProduction(page);
    // Freeze save/reload time so unrelated timestamp drift cannot mask data loss.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await expectOfflineArtHelp(page, english, false);
    const before = await saveBackup(page, english);
    expect(before.player.name).toBe('Offline hero');
    expect(before.meta.settings.locale).toBe(locale);
    const documentTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await context.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await expectOfflineArtHelp(page, english, true);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentTimeOrigin);
    expect(await readStoredSave(page)).toEqual(before);
    expect(await exportBackup(page)).toEqual(before);
    await reloadOffline(page, before, english);

    // Town must work offline too; the other four screens are first visited offline.
    for (const route of ['town', 'inventory', 'skills', 'mercs', 'map']) {
      await navTo(page, route);
      await expect(page.getByTestId(`${route}-screen`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.getByTestId('sub-area-row-a1-blood-moor')
      .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    const firstWave = await currentWave(page);
    expect(firstWave).toBe(1);
    await expect(page.getByTestId('skip-button')).toBeEnabled();
    await page.getByTestId('skip-button').click();
    await page.clock.runFor(1600);
    // Hard proof of resolved recording: a new wave or a terminal run outcome.
    await expect.poll(async () =>
      await page.getByTestId('victory-panel').isVisible() ||
      await page.getByTestId('defeat-panel').isVisible() ||
      await currentWave(page) > firstWave
    ).toBe(true);
    if (await page.getByTestId('victory-panel').isVisible() || await page.getByTestId('defeat-panel').isVisible()) {
      await page.getByTestId('return-to-town').click();
      await expect(page.getByTestId('town-screen')).toBeVisible();
    } else {
      await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
      await expect(page.getByTestId('map-screen')).toBeVisible();
    }
    await navTo(page, 'settings');
    await expectSettings(page, english);
    await expectOfflineArtHelp(page, english, true);
    // Outcome-derived baseline proves persistence; reward math has separate tests.
    const after = await saveBackup(page, english);
    expect(after.player.name).toBe(before.player.name);
    expect(after.meta.settings.locale).toBe(locale);
    await reloadOffline(page, after, english);
    await context.setOffline(false);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
    await expectOfflineArtHelp(page, english, false);
    expect(await readStoredSave(page)).toEqual(after);
    expect(await exportBackup(page)).toEqual(after);
    expect(errors).toEqual([]);
  });
}
