import { expect, test } from '@playwright/test';
import { clearGameStorage, createCharacter, flushSave, navTo } from './_helpers';

for (const locale of ['en', 'zh-CN'] as const) {
  test(`loot filter preferences persist and fit the viewport (${locale}) @responsive`, async ({
    page
  }, info) => {
    test.setTimeout(60_000);
    const english = locale === 'en';
    const title = english ? 'Loot Filter' : '掉落过滤';
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'LootFilter' });
    await navTo(page, 'settings');
    await page.getByRole('button', { name: english ? 'English' : '简体中文', exact: true }).click();
    const existingItemId = await page.evaluate(() => {
      if (!window.__GAME__) throw new Error('Test bridge unavailable');
      return window.__GAME__.seedItem('items/base/helm-cap', { rarity: 'normal', level: 1 });
    });

    await navTo(page, 'inventory');
    const opener = page.getByTestId('inventory-loot-filter');
    await opener.click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    const panel = dialog.getByTestId('loot-filter-panel');
    await expect(dialog).toBeFocused();
    await expect(panel.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    for (const rarity of ['normal', 'magic', 'rare', 'unique', 'set']) {
      await expect(panel.getByTestId(`loot-filter-${rarity}`)).toHaveValue('keep');
    }
    await expect(panel).toContainText(english ? 'new combat loot only' : '仅处理新获得的战斗掉落');
    await expect(panel).toContainText(english ? 'personalized gear' : '个性化装备');
    await expect(panel).toContainText(english ? 'crafting scrap' : '制作废料');
    await expect(panel).not.toContainText('lootFilter.');

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const controls = await panel.locator('button, input, select').evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          right: bounds.right,
          left: bounds.left
        };
      })
    );
    expect(controls).toHaveLength(7);
    for (const bounds of controls) {
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(Math.ceil(bounds.right)).toBeLessThanOrEqual(viewport?.width ?? 0);
    }
    expect(
      await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath('loot-filter.png') });

    await panel.getByTestId('loot-filter-normal').selectOption('salvage');
    await panel.getByTestId('loot-filter-magic').selectOption('discard');
    await panel.getByTestId('loot-filter-set').selectOption('discard');
    const level = panel.getByRole('textbox', {
      name: english ? 'Maximum item level' : '物品等级上限'
    });
    await level.fill('20');
    await panel.getByRole('switch').click();
    await expect(panel.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await level.fill('-1');
    await expect(level).toHaveValue('-1');
    await expect(level).toHaveAttribute('aria-invalid', 'true');
    await expect(panel.getByRole('alert')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.getByTestId(`inv-item-${existingItemId}`)).toBeVisible();

    await navTo(page, 'settings');
    await page.getByRole('tab', { name: title, exact: true }).click();
    const settingsPanel = page.getByTestId('loot-filter-panel');
    await expect(settingsPanel.getByRole('textbox')).toHaveValue('20');
    await expect(settingsPanel.getByTestId('loot-filter-normal')).toHaveValue('salvage');
    await expect(settingsPanel.getByTestId('loot-filter-set')).toHaveValue('discard');
    await settingsPanel.getByRole('switch').click();
    await expect(settingsPanel.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await flushSave(page);
    await page.goto('/');
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.getByTestId('home-continue').click();
    await expect(page.getByTestId('town-screen')).toBeVisible();
    await navTo(page, 'inventory');
    await page.getByTestId('inventory-loot-filter').click();
    const restored = page.getByRole('dialog', { name: title }).getByTestId('loot-filter-panel');
    await expect(restored.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await expect(restored.getByRole('textbox')).toHaveValue('20');
    await expect(restored.getByTestId('loot-filter-normal')).toHaveValue('salvage');
    await expect(restored.getByTestId('loot-filter-magic')).toHaveValue('discard');
    await expect(restored.getByTestId('loot-filter-set')).toHaveValue('discard');
    expect(pageErrors).toEqual([]);
  });
}

test('loot filter reflows across portrait, landscape and desktop sizes @desktop-only', async ({
  page
}) => {
  await clearGameStorage(page);
  await createCharacter(page, { class: 'barbarian', name: 'LootLayout' });
  await navTo(page, 'inventory');
  await page.getByTestId('inventory-loot-filter').click();
  const dialog = page.getByRole('dialog');
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 412, height: 915 },
    { width: 640, height: 360 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(viewport);
    const lastRule = dialog.getByTestId('loot-filter-set');
    await lastRule.selectOption('keep');
    await lastRule.scrollIntoViewIfNeeded();
    await expect(lastRule).toBeInViewport();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.ceil((bounds?.y ?? 0) + (bounds?.height ?? 0))).toBeLessThanOrEqual(
      viewport.height
    );
    expect(
      await dialog.evaluate((element) => element.scrollWidth - element.clientWidth)
    ).toBeLessThanOrEqual(1);
    const close = dialog.getByRole('button', { name: /^(Close|关闭)$/ });
    await close.scrollIntoViewIfNeeded();
    await expect(close).toBeInViewport();
  }
});
