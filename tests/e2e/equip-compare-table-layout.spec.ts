/**
 * equip-compare-table-layout.spec.ts — visual evidence that the equip
 * comparison panel renders as a single 3-column table with vertically
 * aligned [Stat | Current | Candidate(±Δ)] cells.
 *
 * Captures screenshots at desktop (1280×800) and mobile (360×640) in
 * both zh-CN and en, and asserts the table testid is present.
 *
 * Run via:  npx playwright test equip-compare-table-layout
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const OUTDIR = path.resolve(process.cwd(), '.screenshots', 'equip-compare-table-layout');

for (const locale of ['zh-CN', 'en'] as const) {
  test(`equip-compare panel is a 3-col table (${locale})`, async ({ page, viewport }) => {
    test.setTimeout(60_000);
    const tag = (viewport?.width ?? 0) <= 480 ? 'mobile' : 'desktop';

    await clearGameStorage(page);
    await page.addInitScript((loc) => {
      try { localStorage.setItem('i18nextLng', loc); } catch { /* noop */ }
    }, locale);

    await createCharacter(page, { class: 'barbarian', name: 'TableLayout' });

    const seeded = await page.evaluate(() => {
      const game = (window as unknown as {
        __GAME__?: { seedItem: (id: string, opts?: { rarity?: string }) => string };
      }).__GAME__;
      if (!game) throw new Error('test bridge not installed');
      const a = game.seedItem('items/base/wp1h-short-sword', { rarity: 'normal' });
      const b = game.seedItem('items/base/wp1h-short-sword', { rarity: 'magic' });
      return { a, b };
    });

    await navTo(page, 'inventory');
    const equipTab = page.getByRole('tab', { name: /装备|Equipment/i }).first();
    await equipTab.click();

    // 1. candidate-only mode (slot empty + candidate selected)
    const slot = page.getByTestId('equip-slot-weapon');
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible();
    await page.getByTestId(`equip-picker-row-${seeded.a}`).click();
    const compareTable = page.getByTestId('stat-compare-table');
    await expect(compareTable).toBeVisible();
    await expect(compareTable).toHaveAttribute('data-cols', '2');
    await page.screenshot({
      path: path.join(OUTDIR, `candidate-only-${tag}-${locale}.png`),
      fullPage: false
    });
    await page.getByTestId('equip-picker-confirm').click();

    // 2. compare-with-current (3 cols)
    await slot.click({ position: { x: 24, y: 24 } });
    await page.getByTestId(`equip-picker-row-${seeded.b}`).click();
    await expect(compareTable).toBeVisible();
    await expect(compareTable).toHaveAttribute('data-cols', '3');
    await page.screenshot({
      path: path.join(OUTDIR, `compare-3col-${tag}-${locale}.png`),
      fullPage: false
    });
    await page.getByTestId('equip-picker-close').click();
  });
}
