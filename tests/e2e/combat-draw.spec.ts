/** Imported durable low-damage hero proves result wiring, not fresh-game balance. */
import { expect, test, type Page } from '@playwright/test';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

async function exportSave(page: Page): Promise<SaveCurrent> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const stream = await (await download).createReadStream();
  if (!stream) throw new Error('Missing save download stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as SaveCurrent;
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`a surviving draw ends without a clear and offers return controls ${locale} @responsive`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'DrawBoundary' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true }).click();
    const save = await exportSave(page);
    const imported: SaveCurrent = {
      ...save,
      player: {
        ...save.player,
        comboOrder: [],
        derivedStats: {
          ...save.player.derivedStats,
          attack: 0, defense: 100_000, life: 1_000_000, lifeMax: 1_000_000
        }
      }
    };
    const importLabel = locale === 'en' ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(imported));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await navTo(page, 'map');
    const row = page.getByTestId('sub-area-row-a1-blood-moor');
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toBeDisabled();
    await row.getByRole('button', { name: locale === 'en' ? 'Enter' : '进入', exact: true }).click();
    await expect(page.getByTestId('combat-screen')).toBeVisible();
    await page.getByTestId('skip-button').click();
    const panel = page.getByTestId('defeat-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading')).toHaveText(
      locale === 'en' ? 'The battle ends in a draw.' : '战斗以平局结束。'
    );
    await expect(page.getByTestId('victory-panel')).toHaveCount(0);
    await expect(page.getByTestId('continue-next-subarea')).toHaveCount(0);
    await expect(page.getByTestId('return-to-town')).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId('return-to-map').click();
    await expect(page.getByTestId('map-screen')).toBeVisible();
    await expect(page.getByTestId('cleared-badge-a1-blood-moor')).toHaveCount(0);
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toBeDisabled();
    await navTo(page, 'settings');
    const after = await exportSave(page);
    expect(after.player).toEqual(imported.player);
    expect(after.inventory).toEqual(imported.inventory);
    expect(after.map.clearedSubAreas).toEqual([]);
    await page.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true }).click();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    expect((await exportSave(page)).map.clearedSubAreas).toEqual([]);
    await navTo(page, 'map');
    await expect(page.getByTestId('farm-locked-a1-blood-moor')).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
