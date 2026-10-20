/** Imported legacy inventories prove recovery through ordinary controls, not earned loot. */
import { expect, test, type Page } from '@playwright/test';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

function savedItems(prefix: string, count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index)}`,
    baseId: 'items/base/helm-cap',
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: false
  }));
}

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const stream = await (await download).createReadStream();
  if (!stream) throw new Error('Backup download has no readable stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as SaveCurrent;
}

async function selectItem(page: Page, id: string): Promise<void> {
  const card = page.getByTestId(`inv-item-${id}`);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await card.click();
  await expect(page.getByTestId('inv-detail-panel')).toBeVisible();
}

async function discardSelected(page: Page): Promise<void> {
  await page.getByTestId('inv-discard-action').click();
  await page.getByTestId('inv-discard-confirm').click();
  await expect(page.getByTestId('inv-detail-panel')).toHaveCount(0);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`legacy overflow import retains every item and can recover ${locale} @responsive`, async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Legacy inventory' });
    await navTo(page, 'settings');
    await page
      .getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
      .click();
    const before = await exportBackup(page);
    const imported: SaveCurrent = {
      ...before,
      inventory: {
        ...before.inventory,
        backpack: savedItems('backpack', 101),
        stash: savedItems('stash', 501)
      }
    };
    const importLabel = locale === 'en' ? 'Import Save' : '导入存档';
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(imported));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect((await exportBackup(page)).inventory).toEqual(imported.inventory);
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    // Startup currently renders zh-CN despite a saved English preference.
    // Reapply through the normal control so this inventory proof uses its named locale.
    await page
      .getByRole('button', { name: locale === 'en' ? 'English' : '简体中文', exact: true })
      .click();
    expect((await exportBackup(page)).inventory).toEqual(imported.inventory);

    await navTo(page, 'inventory');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await selectItem(page, 'backpack-100');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    await page.locator('#tab-stash').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(502);
    await selectItem(page, 'backpack-100');
    await discardSelected(page);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(501);
    await selectItem(page, 'stash-500');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(500);
    await page.locator('#tab-backpack').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await selectItem(page, 'stash-500');
    await discardSelected(page);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    // Go below the nominal cap and confirm placeholder rendering resumes.
    await selectItem(page, 'backpack-99');
    await discardSelected(page);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(99);
    await expect(page.getByTestId('inv-empty-99')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    await navTo(page, 'settings');
    await page
      .getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
      .click();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const recovered = await exportBackup(page);
    expect(recovered.inventory.backpack.map((item) => item.id)).toEqual(
      savedItems('backpack', 99).map((item) => item.id)
    );
    expect(recovered.inventory.stash.map((item) => item.id)).toEqual(
      savedItems('stash', 500).map((item) => item.id)
    );
    expect(errors).toEqual([]);
  });
}
