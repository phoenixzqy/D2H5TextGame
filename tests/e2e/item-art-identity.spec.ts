/** Imported fixtures prove item presentation and persistence, not earned unique drops. */
import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent } from '../../src/engine/types/save';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const UNIQUE_ART = '/assets/d2/generated/item-icons/items.unique.biggin-bonnet.png';
const BASE_ART = '/assets/d2/generated/item-icons/items.base.helm.png';
const bonnet: Item = {
  id: 'art-biggin',
  baseId: 'items/base/helm-cap',
  uniqueId: 'items/unique/biggin-bonnet',
  rarity: 'unique',
  level: 3,
  ilvl: 3,
  identified: true,
  equipped: false,
  affixes: [],
  baseRolls: {},
  statRolls: {}
};
const cap: Item = {
  id: 'art-base-cap',
  baseId: bonnet.baseId,
  rarity: 'normal',
  level: 1,
  identified: true,
  equipped: false
};

async function exportBackup(page: Page): Promise<SaveCurrent> {
  const download = page.waitForEvent('download');
  await page.getByTestId('export-save-button').click();
  const path = await (await download).path();
  return JSON.parse(await readFile(path, 'utf8')) as SaveCurrent;
}

async function expectArt(surface: Locator, url: string): Promise<void> {
  const image = surface.locator('img').first();
  await expect(image).toHaveAttribute('src', url);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0
  )).toBe(true);
}

async function inspectBonnet(page: Page, name: string, touch: boolean): Promise<void> {
  const card = page.getByTestId(`inv-item-${bonnet.id}`);
  await expectArt(card, UNIQUE_ART);
  await expect(card).toHaveAccessibleName(new RegExp(name));
  if (touch) {
    // Tap opens the mobile detail sheet; inspect ItemTooltip in equipped Details below.
    await card.tap();
  } else {
    await card.hover();
    const tooltip = page.getByTestId('item-tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(name);
    await expectArt(tooltip, UNIQUE_ART);
    await card.click();
  }
  const detail = page.getByTestId('inv-detail-panel');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(name);
  await expectArt(detail, UNIQUE_ART);
  await page.getByTestId('inv-detail-close').click();
  await expect(detail).toHaveCount(0);
}

function expectEquippedIdentity(save: SaveCurrent): void {
  expect(save.inventory.equipped.head).toEqual({ ...bonnet, equipped: true });
  expect(save.inventory.backpack).toEqual([cap]);
  expect(save.inventory.stash).toEqual([]);
}

for (const locale of ['en', 'zh-CN'] as const) {
  test(`unique art survives transfer, equip and save/reload ${locale} @responsive`, async ({
    page,
    isMobile
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const name = locale === 'en' ? "Biggin's Bonnet" : '毕金的便帽';
    const importLabel = locale === 'en' ? 'Import Save' : '导入存档';
    const saveLabel = locale === 'en' ? 'Save' : '保存';
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'Item art' });
    await navTo(page, 'settings');
    await page.getByRole('button', {
      name: locale === 'en' ? 'English' : '简体中文', exact: true
    }).click();
    const baseline = await exportBackup(page);
    const fixture: SaveCurrent = {
      ...baseline,
      player: { ...baseline.player, level: 3 },
      inventory: { ...baseline.inventory, backpack: [bonnet, cap], stash: [], equipped: {} }
    };
    await page.getByRole('button', { name: importLabel, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(JSON.stringify(fixture));
    await dialog.getByRole('button', { name: importLabel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await navTo(page, 'inventory');
    await expectArt(page.getByTestId(`inv-item-${cap.id}`), BASE_ART);
    await inspectBonnet(page, name, isMobile);
    await page.getByTestId(`inv-item-${bonnet.id}`).click();
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId(`inv-item-${bonnet.id}`)).toHaveCount(0);
    await page.locator('#tab-stash').click();
    await inspectBonnet(page, name, isMobile);
    await page.getByTestId(`inv-item-${bonnet.id}`).click();
    await page.getByTestId('inv-secondary-action').click();
    await expect(page.getByTestId(`inv-item-${bonnet.id}`)).toHaveCount(0);

    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-head-select').click();
    const candidate = page.getByTestId(`equip-picker-row-${bonnet.id}`);
    await expect(candidate).toContainText(name);
    await expectArt(candidate, UNIQUE_ART);
    await expectArt(page.getByTestId(`equip-picker-row-${cap.id}`), BASE_ART);
    const thumb = candidate.locator('img');
    await expect(thumb).toHaveCSS('object-fit', 'contain');
    const thumbBox = await thumb.boundingBox();
    expect(thumbBox?.width).toBeGreaterThanOrEqual(44);
    expect(thumbBox?.width).toBeLessThanOrEqual(48);
    await candidate.click();
    await expect(page.getByTestId('equip-picker-confirm')).toBeEnabled();
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).toHaveCount(0);
    await expect(page.getByTestId('equip-slot-head')).toContainText(name);
    await page.getByTestId('equip-slot-head-details').click();
    const equippedTooltip = page.getByTestId('equipped-item-modal').getByTestId('item-tooltip');
    await expect(equippedTooltip).toContainText(name);
    await expectArt(equippedTooltip, UNIQUE_ART);
    await page.getByTestId('equipped-item-modal-close').click();

    await navTo(page, 'settings');
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    expectEquippedIdentity(await exportBackup(page));
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(page.getByRole('button', { name: saveLabel, exact: true })).toBeVisible();
    expectEquippedIdentity(await exportBackup(page));
    await navTo(page, 'inventory');
    await expectArt(page.getByTestId(`inv-item-${cap.id}`), BASE_ART);
    await page.locator('#tab-equipment').click();
    await expect(page.getByTestId('equip-slot-head')).toContainText(name);
    await page.getByTestId('equip-slot-head-details').click();
    await expect(equippedTooltip).toContainText(name);
    await expectArt(equippedTooltip, UNIQUE_ART);
    await page.getByTestId('equipped-item-modal-close').click();

    // Abort only the known unique image source; ordinary controls still work.
    await page.getByTestId('equip-slot-head').getByRole('button', {
      name: locale === 'en' ? 'Unequip' : '卸下', exact: true
    }).click();
    await navTo(page, 'settings');
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    let aborted = 0;
    await page.route(`**${UNIQUE_ART}`, async (route) => {
      aborted += 1;
      await route.abort();
    });
    await page.reload();
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await navTo(page, 'inventory');
    await page.locator('#tab-equipment').click();
    await page.getByTestId('equip-slot-head-select').click();
    await expect(candidate.locator('img')).toHaveCount(0);
    await expect(candidate.getByText('?', { exact: true })).toBeVisible();
    await expect(candidate).toContainText(name);
    expect(aborted).toBeGreaterThan(0);
    await expectArt(page.getByTestId(`equip-picker-row-${cap.id}`), BASE_ART);
    await page.getByTestId('equip-picker-close').click();
    await page.unroute(`**${UNIQUE_ART}`);
    await page.getByTestId('equip-slot-head-select').click();
    await expectArt(candidate, UNIQUE_ART);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
