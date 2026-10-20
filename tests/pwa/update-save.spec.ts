/** Real SW replacement between configured-version builds of the same schema. */
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

async function save(page: Page, english: boolean): Promise<void> {
  await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(english ? 'Saved' : '已保存');
}

async function expectVersion(page: Page, english: boolean, version: 'A' | 'B'): Promise<void> {
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  await expect(page.getByText(`${english ? 'Version' : '版本'}: p17b03a-${version}`, { exact: true }))
    .toBeVisible();
  await expect(page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function replaceWorker(page: Page): Promise<void> {
  // Keep the old worker identity in this observation handle, not in game/global state.
  const observation = await page.evaluateHandle(() => {
    const previous = navigator.serviceWorker.controller;
    if (!previous) throw new Error('No original controlling worker');
    let eventSeen = false;
    const observe = (): void => { eventSeen = true; };
    navigator.serviceWorker.addEventListener('controllerchange', observe);
    return {
      read: () => ({ eventSeen,
        distinct: navigator.serviceWorker.controller !== previous,
        state: navigator.serviceWorker.controller?.state }),
      dispose: () => { navigator.serviceWorker.removeEventListener('controllerchange', observe); }
    };
  });
  try {
    // Native browser update trigger, with the controller observer already installed.
    await page.evaluate(async () => { await (await navigator.serviceWorker.ready).update(); });
    // Playwright polls on the host; frozen page timers cannot suppress observation.
    await expect.poll(() => observation.evaluate(value => value.read()), { timeout: 30_000 })
      .toEqual({ eventSeen: true, distinct: true, state: 'activated' });
  } finally {
    await observation.evaluate(value => { value.dispose(); });
    await observation.dispose();
  }
}

async function reloadVersionB(page: Page, english: boolean, expected: SaveCurrent): Promise<void> {
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
    await expectVersion(page, english, 'B');
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
  test(`worker replacement preserves pending and saved character ${locale}`, async ({ page, context, request }) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    expect((await request.post('/__pwa-test/deploy/A')).ok()).toBe(true);
    await page.goto('/');
    await createCharacter(page, { class: 'sorceress', name: 'Update hero' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state),
      { timeout: 60_000 }).toBe('activated');
    await expectVersion(page, english, 'A');
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await save(page, english);
    const baseline = await exportBackup(page);
    expect(baseline.player.name).toBe('Update hero');
    expect(baseline.meta.settings.locale).toBe(locale);
    expect(await readStoredSave(page)).toEqual(baseline);

    const sound = page.getByRole('checkbox', { name: english ? 'Sound' : '音效', exact: true });
    const enabled = !baseline.meta.settings.soundEnabled;
    const pending: SaveCurrent = { ...baseline, meta: { ...baseline.meta,
      settings: { ...baseline.meta.settings, soundEnabled: enabled } } };
    await sound.setChecked(enabled);
    expect(await exportBackup(page)).toEqual(pending);
    // The debounce is paused: this distinguishes pending state from stored state.
    expect(await readStoredSave(page)).toEqual(baseline);

    expect((await request.post('/__pwa-test/deploy/B')).ok()).toBe(true);
    await replaceWorker(page);
    await expectVersion(page, english, 'A');
    await expect(sound).toBeChecked({ checked: enabled });
    expect(await exportBackup(page)).toEqual(pending);
    expect(await readStoredSave(page)).toEqual(baseline);
    await save(page, english);
    expect(await readStoredSave(page)).toEqual(pending);
    expect(await exportBackup(page)).toEqual(pending);
    await reloadVersionB(page, english, pending);
    await context.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await reloadVersionB(page, english, pending);
    await expect(sound).toBeChecked({ checked: enabled });
    expect(errors).toEqual([]);
  });
}
