/**
 * tooltip-edge-clip.spec.ts — Bug #7 + #8 regression (extended)
 *
 * Replaces / extends tests/e2e/tooltip-edge-clip.spec.ts.
 * Tests:
 *   - (Bug #7) Desktop: tooltip contains a localized item-type subtitle.
 *   - (Bug #8) Mobile: tooltip on top-left AND bottom-right inventory items
 *     stays fully inside the 360×640 viewport.
 *
 * Seeds items into corner positions of the backpack so we can reliably
 * trigger viewport-edge tooltips on the first and last item cards.
 */
import { test, expect, type Page } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from '../_helpers';

/** Seed a weapon (has damage line) into the backpack at a specific index. */
async function seedWeapon(page: Page, count = 1): Promise<string[]> {
  return page.evaluate((n: number) => {
    const game = (
      window as unknown as {
        __GAME__?: {
          seedItem: (id: string, opts?: { rarity?: string }) => string;
        };
      }
    ).__GAME__;
    if (!game) throw new Error('test bridge not installed');
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(game.seedItem('items/base/wp1h-short-sword', { rarity: 'normal' }));
    }
    return ids;
  }, count);
}

test.describe('Bug #7 — Item tooltip subtitle (desktop)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'subtitle test is desktop-only'
    );
  });

  test('tooltip shows localized item-type subtitle on desktop', async ({ page }) => {
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'TipDesktop' });

    const [seededId] = await seedWeapon(page);
    expect(seededId).toMatch(/^seed-/);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    const card = page.getByTestId(`inv-item-${seededId}`);
    await expect(card).toBeVisible();
    await card.hover();

    const tooltip = page.getByTestId('item-tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });

    // Bug #7: subtitle must exist and be non-empty.
    const subtitle = page.getByTestId('item-tooltip-subtitle').first();
    await expect(subtitle).toBeVisible();
    const text = (await subtitle.textContent()) ?? '';
    expect(text.trim().length).toBeGreaterThan(0);

    // Damage line must be present for a weapon.
    await expect(page.getByTestId('item-tooltip-damage').first()).toBeVisible();
  });
});

test.describe('Bug #8 — Tooltip viewport clip (mobile)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-portrait',
      'clip test is mobile-only'
    );
  });

  test('tooltip on top-left and bottom-right items stays within 360×640 viewport', async ({ page }) => {
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'TipMobile' });

    // Seed enough items to fill at least 2 rows so we have both top-left and
    // bottom-right positions (grid is 4-col on phones).
    await seedWeapon(page, 8);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    const allCards = page.locator('[data-testid^="inv-item-"]');
    await expect(allCards.first()).toBeVisible({ timeout: 5_000 });
    const total = await allCards.count();
    expect(total).toBeGreaterThanOrEqual(2);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    // Check first card (top-left corner).
    await allCards.first().hover();
    const tooltip1 = page.getByTestId('item-tooltip').first();
    await expect(tooltip1).toBeVisible({ timeout: 5_000 });
    const box1 = await tooltip1.boundingBox();
    expect(box1).not.toBeNull();
    if (box1) {
      expect(box1.x).toBeGreaterThanOrEqual(0);
      expect(box1.y).toBeGreaterThanOrEqual(0);
      expect(box1.x + box1.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box1.y + box1.height).toBeLessThanOrEqual(viewport.height + 1);
    }

    // Move away to dismiss the tooltip.
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await expect(tooltip1).toBeHidden({ timeout: 2_000 });

    // Check last card (bottom-right corner).
    await allCards.last().hover();
    const tooltip2 = page.getByTestId('item-tooltip').first();
    await expect(tooltip2).toBeVisible({ timeout: 5_000 });
    const box2 = await tooltip2.boundingBox();
    expect(box2).not.toBeNull();
    if (box2) {
      expect(box2.x).toBeGreaterThanOrEqual(0);
      expect(box2.y).toBeGreaterThanOrEqual(0);
      expect(box2.x + box2.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box2.y + box2.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  });
});
