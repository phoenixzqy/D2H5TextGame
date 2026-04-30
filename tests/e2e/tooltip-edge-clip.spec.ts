/**
 * tooltip-edge-clip.spec.ts — Bug #7 + #8 verification.
 *
 * Seeds a known item into the player's backpack, opens /inventory, hovers
 * the item card, and asserts:
 *   1. The tooltip is visible and contains the item type subtitle (Bug #7).
 *   2. The tooltip rect is fully inside the viewport (Bug #8).
 *
 * Captures screenshots at 360×640 (mobile) and 1280×800 (desktop) into
 * docs/qa/screenshots/2026-04-28-tooltip-fix/ so the fix has artefact
 * evidence outside CI.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const SHOT_DIR = path.join(
  process.cwd(),
  'docs',
  'qa',
  'screenshots',
  '2026-04-28-tooltip-fix'
);

test.beforeAll(() => {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
});

/** Seed a Short Sword into the backpack via the test bridge. */
async function seedShortSword(page: Page): Promise<string> {
  return page.evaluate(() => {
    const game = (window as unknown as {
      __GAME__?: {
        seedItem: (
          baseId: string,
          opts?: { rarity?: string; level?: number }
        ) => string;
      };
    }).__GAME__;
    if (!game) throw new Error('test bridge not installed');
    return game.seedItem('items/base/wp1h-short-sword', {
      rarity: 'normal',
      level: 1
    });
  });
}

test.describe('Bug #7 + #8 — Item tooltip @responsive', () => {
  test('shows type subtitle and stays inside viewport', async ({ page }, info) => {
    test.setTimeout(60_000);
    const projectName = info.project.name;
    const isDesktop = projectName.includes('desktop');

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'TipQA' });

    const seededId = await seedShortSword(page);
    expect(seededId).toMatch(/^seed-/);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    const card = page.getByTestId(`inv-item-${seededId}`);
    await expect(card).toBeVisible();

    // Hover the card; the floating tooltip should mount via portal.
    await card.hover();

    const tooltip = page.getByTestId('item-tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });

    // (Bug #7) — subtitle line with localized type · slot.
    const subtitle = page.getByTestId('item-tooltip-subtitle').first();
    await expect(subtitle).toBeVisible();
    const subtitleText = (await subtitle.textContent()) ?? '';
    expect(subtitleText.length).toBeGreaterThan(0);

    // (Bug #7) — damage line for weapons.
    await expect(page.getByTestId('item-tooltip-damage').first()).toBeVisible();

    // (Bug #8) — tooltip rect is fully inside the viewport.
    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);

    const fileName = isDesktop ? 'tooltip-1280.png' : 'tooltip-360.png';
    await page.screenshot({
      path: path.join(SHOT_DIR, fileName),
      fullPage: false
    });
  });
});
