/** Imported legacy inventories prove recovery through ordinary controls, not earned loot. */
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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
  const path = await (await download).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
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
    await expect(
      page.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
    ).toBeVisible();
    expect((await exportBackup(page)).inventory).toEqual(imported.inventory);

    await navTo(page, 'inventory');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await selectItem(page, 'backpack-100');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId('inventory-toast')).toContainText(locale === 'en'
      ? 'Stash is full. Make room before transferring items.'
      : '仓库已满，请腾出空间后再转移物品。');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(101);
    await expect(page.getByTestId('inv-detail-panel')).toBeVisible();
    await expect(page.getByTestId('inv-item-backpack-100')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('inv-detail-close').click();
    await page.locator('#tab-stash').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(501);
    await selectItem(page, 'stash-500');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId('inventory-toast')).toContainText(locale === 'en'
      ? 'Backpack is full. Make room before moving or removing equipment.'
      : '背包已满，请腾出空间后再转移物品或卸下装备。');
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(501);
    await expect(page.getByTestId('inv-detail-panel')).toBeVisible();
    await expect(page.getByTestId('inv-item-stash-500')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('inv-detail-close').click();
    await navTo(page, 'settings');
    const refused = await exportBackup(page);
    expect(refused.inventory).toEqual(imported.inventory);
    expect(refused.player).toEqual(imported.player);
    expect(refused.map).toEqual(imported.map);

    // Explicitly discard only these three IDs, then recover through both
    // directions once their respective destination has room.
    await navTo(page, 'inventory');
    await page.locator('#tab-stash').click();
    await selectItem(page, 'stash-500');
    await discardSelected(page);
    await selectItem(page, 'stash-499');
    await discardSelected(page);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(499);
    await page.locator('#tab-backpack').click();
    await selectItem(page, 'backpack-100');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId('inv-detail-panel')).toHaveCount(0);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    await selectItem(page, 'backpack-99');
    await discardSelected(page);
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(99);
    await expect(page.getByTestId('inv-empty-99')).toBeVisible();
    await page.locator('#tab-stash').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(500);
    await selectItem(page, 'backpack-100');
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId('inv-detail-panel')).toHaveCount(0);
    // Stash now has499; backpack has100, including the recovered legacy item.
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(499);
    await page.locator('#tab-backpack').click();
    await expect(page.locator('[data-testid^="inv-item-"]')).toHaveCount(100);
    await selectItem(page, 'backpack-100');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    await page.getByTestId('inv-detail-close').click();
    await navTo(page, 'settings');
    await page
      .getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true })
      .click();
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    const recovered = await exportBackup(page);
    expect(recovered.inventory).toEqual({
      ...imported.inventory,
      backpack: [...savedItems('backpack', 99), imported.inventory.backpack[100]],
      stash: savedItems('stash', 499)
    });
    expect(recovered.player).toEqual(imported.player);
    expect(recovered.map).toEqual(imported.map);
    expect(errors).toEqual([]);
  });
}
