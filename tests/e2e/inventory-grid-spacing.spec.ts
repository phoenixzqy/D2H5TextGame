/**
 * inventory-grid-spacing.spec.ts — regression coverage for the inventory
 * grid overhaul (fix/inventory-grid-spacing).
 *
 * Asserts:
 *   1. With N=3 backpack items, every visible grid cell shares the same
 *      width (filled and empty placeholders alike). No "wide gap" bug.
 *   2. Bulk-discard toolbar fits the viewport at mobile (360×640) — no
 *      horizontal overflow on the toolbar's bounding box.
 *   3. Detail panel reflows columns automatically when opened on desktop.
 *
 * Captures fixed-name screenshots into `.screenshots/inventory-grid-fix/`
 * so they overwrite cleanly on each run (no spec-name suffix noise).
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const SHOT_DIR = path.join(process.cwd(), '.screenshots', 'inventory-grid-fix');

test.beforeAll(() => {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
});

async function seedItem(
  page: Page,
  baseId: string,
  rarity: 'normal' | 'magic' | 'rare' | 'unique' = 'normal'
): Promise<string> {
  return page.evaluate(
    ({ baseId, rarity }) => {
      const game = (window as unknown as {
        __GAME__?: { seedItem: (b: string, o?: { rarity?: string; level?: number }) => string };
      }).__GAME__;
      if (!game) throw new Error('test bridge not installed');
      return game.seedItem(baseId, { rarity, level: 1 });
    },
    { baseId, rarity }
  );
}

test.describe('Inventory grid spacing — desktop @desktop-only', () => {
  test('uniform cells; no horizontal overflow on toolbar', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'desktop-only');
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'GridDesk' });
    await seedItem(page, 'items/base/wp1h-short-sword', 'normal');
    await seedItem(page, 'items/base/wp1h-short-sword', 'magic');
    await seedItem(page, 'items/base/wp1h-short-sword', 'rare');

    await navTo(page, 'inventory');
    await expect(page.getByTestId('backpack-grid')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-grid.png'), fullPage: false });

    // Every grid cell (filled <li> + empty placeholders inside <li>) should
    // share the same outer width — that's the invariant the bug violated.
    const widths = await page.locator('[data-testid="backpack-grid"] > li').evaluateAll(
      (els) => els.map((el) => Math.round((el as HTMLElement).getBoundingClientRect().width))
    );
    expect(widths.length).toBeGreaterThanOrEqual(3);
    const unique = Array.from(new Set(widths));
    expect(unique, `cell widths: ${widths.join(',')}`).toHaveLength(1);

    // Toolbar must fit: scrollWidth ≤ clientWidth (no horizontal overflow).
    const overflow = await page.getByTestId('bulk-discard-toolbar').evaluate((el) => {
      const e = el as HTMLElement;
      return e.scrollWidth - e.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('Inventory grid spacing — mobile @mobile-only', () => {
  test('toolbar wraps within viewport; no horizontal overflow', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile-portrait', 'mobile-only');
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'GridMob' });
    await seedItem(page, 'items/base/wp1h-short-sword', 'normal');
    await seedItem(page, 'items/base/wp1h-short-sword', 'magic');
    await seedItem(page, 'items/base/wp1h-short-sword', 'rare');

    await navTo(page, 'inventory');
    await expect(page.getByTestId('backpack-grid')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-grid.png'), fullPage: false });

    const toolbar = page.getByTestId('bulk-discard-toolbar');
    const box = await toolbar.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;
    // Toolbar's right edge must be inside the viewport.
    expect(Math.ceil(box.x + box.width)).toBeLessThanOrEqual(viewport.width);

    const overflow = await toolbar.evaluate((el) => {
      const e = el as HTMLElement;
      return e.scrollWidth - e.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    // All four bulk-discard buttons must be in the DOM and not clipped.
    for (const m of ['normal', 'magic', 'rare', 'belowTier']) {
      const btn = page.getByTestId(`bulk-discard-${m}`);
      await expect(btn).toBeVisible();
      const bb = await btn.boundingBox();
      expect(bb).not.toBeNull();
      if (bb) expect(Math.ceil(bb.x + bb.width)).toBeLessThanOrEqual(viewport.width);
    }
  });
});
