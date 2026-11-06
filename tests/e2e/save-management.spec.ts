/** Ordinary controls; imported fixtures prove persistence, not earned campaign progression. */
import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

// Keep Node's test runner free of browser migrations; typecheck guards version drift.
const currentSaveVersion = 33 satisfies SaveCurrent['version'];

async function exportViaSettings(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await pending).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

/** Observe the committed checkpoint without writing storage or game state. */
async function readStoredSave(page: Page): Promise<SaveCurrent> {
  return page.evaluate(() => new Promise<SaveCurrent>((resolve, reject) => {
    const open = indexedDB.open('D2H5TextGame');
    open.onerror = () => { reject(new Error('Could not open game save')); };
    open.onsuccess = () => {
      const db = open.result;
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
      get.onerror = () => { db.close(); reject(new Error('Could not read game save')); };
      get.onsuccess = () => {
        const record = get.result as { encoding?: string; data: SaveCurrent | string } | undefined;
        db.close();
        if (!record) reject(new Error('No committed game save'));
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

async function importViaSettings(page: Page, json: string) {
  await page.getByRole('button', { name: /^(Import Save|导入存档)$/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(json);
  await dialog.getByRole('button', { name: /^(Import Save|导入存档)$/ }).click();
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`save/export/import preserve latest progress and locale ${locale} @responsive`, async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Original' });
    await navTo(page, 'settings');
    await page
      .getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
      .click();
    // Freeze only timer transport: the save/export path must capture state before debounce.
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const sound = page.getByRole('checkbox', { name: /^(Sound|音效)$/ });
    await sound.uncheck();
    await page
      .getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
      .click();
    const backup = await exportViaSettings(page);
    expect(backup.player.name).toBe('Original');
    expect(backup.meta.settings.soundEnabled).toBe(false);
    expect(backup.meta.settings.locale).toBe(locale);
    expect(backup.version).toBe(currentSaveVersion);

    const imported = { ...backup, player: { ...backup.player, name: 'Restored' } };
    // This mutation queues an old-character autosave; Import must cancel it.
    await sound.check();
    await importViaSettings(page, JSON.stringify(imported));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(sound).not.toBeChecked();
    const immediatelyExported = await exportViaSettings(page);
    expect(immediatelyExported).toEqual(imported);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await readStoredSave(page)).timestamp)
      .toBeGreaterThanOrEqual(imported.timestamp + 500);
    const committed = await readStoredSave(page);
    expect(committed.timestamp).toBeLessThanOrEqual(imported.timestamp + 1000);
    // Check against the known import before using this observed clock basis.
    // A stale old-character write must still fail complete save equality.
    expect(committed).toEqual({ ...imported, timestamp: committed.timestamp,
      meta: { ...imported.meta, idleState: { ...imported.meta.idleState,
        lastOnline: committed.timestamp } } });
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(
      page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
    ).toBeVisible();
    const restored = await exportViaSettings(page);
    // Async transport can commit at different clock instants across locales.
    // Account for exactly the gap after the verified committed checkpoint.
    // Keep this first reload free of manual Save to detect stale old writes.
    const awayGap = imported.timestamp + 1000 - Math.max(
      committed.timestamp, committed.meta.idleState.lastOnline);
    expect(restored).toEqual({ ...imported, timestamp: imported.timestamp + 1000,
      meta: { ...imported.meta, idleState: { ...imported.meta.idleState,
        lastOnline: imported.timestamp + 1000,
        offlineTime: imported.meta.idleState.offlineTime + awayGap } } });
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    expect(await exportViaSettings(page)).toEqual(restored);
    await navTo(page, 'town');
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('char-name')).toHaveText('Restored');
    expect(errors).toEqual([]);
  });
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`malformed import preserves the live and stored character ${locale} @responsive`, async ({ page }, testInfo) => {
    const english = locale === 'en';
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text());
    });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'amazon', name: 'Preserved' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    // Fix save timestamps while allowing browser focus restoration timers to run.
    await page.clock.setFixedTime(new Date(Date.now() + 1000));
    await page.getByRole('button', { name: english ? 'Save' : '保存', exact: true }).click();
    const before = await exportViaSettings(page);
    const storedBefore = await readStoredSave(page);
    await importViaSettings(page, '{"version":7}');
    const dialog = page.getByRole('dialog');
    const failureText = english ? 'Current progress was kept' : '当前进度已保留';
    await expect(dialog.getByRole('alert')).toContainText(failureText);
    await expect(dialog.getByRole('alert')).toBeFocused();
    await expect(page.getByText(english ? 'Save exported' : '已导出存档', { exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('textbox')).toHaveValue('{"version":7}');
    const cdp = await page.context().newCDPSession(page);
    try {
      const tree = await cdp.send('Accessibility.getFullAXTree');
      expect(tree.nodes.some(node => !node.ignored && node.role?.value === 'alert')).toBe(true);
    } finally { await cdp.detach(); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await testInfo.attach('import-error', { body: await page.screenshot(), contentType: 'image/png' });
    // Selecting a different source clears the old error; a rejected file stays selected for retry.
    const file = dialog.getByTestId('import-save-file');
    await file.setInputFiles({ name: 'invalid-backup.json', mimeType: 'application/json', buffer: Buffer.from('{"version":7}') });
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(dialog.getByText('invalid-backup.json', { exact: true })).toBeVisible();
    const confirm = dialog.getByRole('button', { name: english ? 'Import Save' : '导入存档', exact: true });
    await confirm.click();
    await expect(dialog.getByRole('alert')).toContainText(failureText);
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog.getByRole('alert')).toContainText(failureText);
    await expect(dialog.getByText('invalid-backup.json', { exact: true })).toBeVisible();
    await expect(confirm).toBeEnabled();
    await expect(dialog.getByRole('alert')).toBeFocused();
    expect(await readStoredSave(page)).toEqual(storedBefore);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(await exportViaSettings(page)).toEqual(before);
    await page.getByRole('button', { name: english ? 'Import Save' : '导入存档', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(dialog.getByRole('textbox')).toHaveValue('');
    await file.setInputFiles({ name: 'valid-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
    await expect(dialog.getByText('valid-backup.json', { exact: true })).toBeVisible();
    await confirm.click();
    await expect(dialog).toHaveCount(0);
    expect(await exportViaSettings(page)).toEqual(before);
    await page.reload();
    expect(await exportViaSettings(page)).toEqual(before);
    expect(errors).toEqual([]);
  });
}

test('save controls remain reachable at required viewport sizes @responsive', async ({ page }) => {
  await clearGameStorage(page);
  await createCharacter(page, { class: 'sorceress', name: 'Layout' });
  await navTo(page, 'settings');
  for (const [width, height] of [
    [360, 640],
    [412, 915],
    [640, 360],
    [1280, 800],
    [1920, 1080]
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId('export-save-button')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(0);
    const button = page.getByTestId('export-save-button');
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
});

test('storage failure recovery preserves unsaved progress while navigating to export @responsive', async ({
  page
}) => {
  await clearGameStorage(page);
  await createCharacter(page, { class: 'sorceress', name: 'Recovery' });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  // Simulate a platform write failure without changing any game store.
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  await page.getByRole('checkbox', { name: 'Sound', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('export a backup');
  await navTo(page, 'town');
  await page.getByRole('alert').getByRole('link', { name: 'Export Save' }).click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
  const backup = await exportViaSettings(page);
  expect(backup.player.name).toBe('Recovery');
  expect(backup.meta.settings.soundEnabled).toBe(false);
});
