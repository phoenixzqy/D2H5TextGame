/** Ordinary controls; imported fixtures prove persistence, not earned campaign progression. */
import { test, expect, type Page } from '@playwright/test';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

async function exportViaSettings(page: Page): Promise<SaveCurrent> {
  const pending = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const stream = await (await pending).createReadStream();
  if (!stream) throw new Error('Export did not produce a readable backup');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as SaveCurrent;
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
    expect(backup.version).toBe(7);

    const imported = { ...backup, player: { ...backup.player, name: 'Restored' } };
    // This mutation queues an old-character autosave; Import must cancel it.
    await sound.check();
    await importViaSettings(page, JSON.stringify(imported));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(sound).not.toBeChecked();
    const immediatelyExported = await exportViaSettings(page);
    expect({ ...immediatelyExported, timestamp: imported.timestamp }).toEqual(imported);
    await page.clock.runFor(1000);
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(
      page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
    ).toBeVisible();
    expect({ ...(await exportViaSettings(page)), timestamp: imported.timestamp }).toEqual(imported);
    await navTo(page, 'town');
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('char-name')).toHaveText('Restored');
    expect(errors).toEqual([]);
  });
}

test('malformed import preserves the live and stored character @responsive', async ({ page }) => {
  await clearGameStorage(page);
  await createCharacter(page, { class: 'amazon', name: 'Preserved' });
  await navTo(page, 'settings');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const before = await exportViaSettings(page);
  await importViaSettings(page, '{"version":7}');
  await expect(page.getByRole('status')).toContainText('Current progress was kept');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect({ ...(await exportViaSettings(page)), timestamp: before.timestamp }).toEqual(before);
  await page.reload();
  expect({ ...(await exportViaSettings(page)), timestamp: before.timestamp }).toEqual(before);
});

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
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
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
