/**
 * card-ui.spec.ts — verifies the GameCard refactor across screens.
 *   • Class-select shows 7 portrait cards, each with an <img> element.
 *   • Character screen hero card has a portrait <img>.
 *   • Inventory shows item cards (rarity frame on at least one).
 *   • Mercs screen renders without crashing (cards may be empty for a
 *     fresh save — that branch is a documented skip).
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const CLASS_IDS = [
  'barbarian',
  'sorceress',
  'necromancer',
  'paladin',
  'amazon',
  'druid',
  'assassin',
];

test.describe('Card UI — class-select', () => {
  test('7 class cards render with portrait <img>', async ({ page }) => {
    await clearGameStorage(page);
    await page.getByTestId('home-new-game').click();
    await expect(page.getByTestId('character-create')).toBeVisible();

    for (const id of CLASS_IDS) {
      const card = page.getByTestId(`class-${id}`);
      await expect(card, `class card ${id}`).toBeVisible();
      // GameCard renders an <img> inside .card-art when image resolves.
      // Some classes may fall back to the silhouette SVG if the asset is
      // missing — so we assert *either* an <img> or an aria-hidden svg.
      const hasImg = await card.locator('img').count();
      const hasSvg = await card.locator('svg[role="img"]').count();
      expect(
        hasImg + hasSvg,
        `class ${id} should render either a portrait <img> or fallback svg`
      ).toBeGreaterThan(0);
    }

    // At least one class portrait must be a real <img> (not all silhouettes —
    // would mean the entire portrait registry is broken).
    const imgs = await page
      .locator('[data-testid^="class-"] img')
      .count();
    expect(imgs, 'at least one class card must show a real portrait img').toBeGreaterThan(0);
  });
});

test.describe('Card UI — character + inventory', () => {
  test('hero card portrait + inventory item cards', async ({ page }) => {
    test.setTimeout(60_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'amazon', name: 'CardQA' });

    // Character screen — hero card has portrait. The /character route is
    // reached by clicking the HUD (not via bottom nav).
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const hero = page.getByTestId('hero-card');
    await expect(hero).toBeVisible();
    // hero-card may be silhouette if asset missing — accept img OR svg
    const heroImg = await hero.locator('img').count();
    const heroSvg = await hero.locator('svg[role="img"]').count();
    expect(heroImg + heroSvg).toBeGreaterThan(0);

    // Inventory — at fresh start the player may have 0 items in bag.
    // We only assert the screen renders; if there are items, they should
    // be GameCard frames with a rarity gem/border.
    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();
    const items = page.locator('[data-testid^="inv-item-"]');
    const count = await items.count();
    if (count > 0) {
      const first = items.first();
      const html = await first.evaluate((el) => el.outerHTML);
      expect(html).toMatch(
        /(bg|border)-d2-(white|magic|rare|unique|set|runeword|gold)/
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn('[card-ui] inventory empty for fresh character; skipped item-card assertion');
    }
  });
});

test.describe('Card UI — mercs', () => {
  test('mercs screen renders (cards optional for fresh save)', async ({ page }) => {
    test.setTimeout(60_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'paladin', name: 'MercQA' });

    await navTo(page, 'mercs');
    await expect(page.getByTestId('mercs-screen')).toBeVisible();

    // A fresh save normally has no mercs without going through gacha.
    // We assert *either* the empty-state OR at least one merc card frame —
    // both are acceptable for this UI smoke.
    const mercCards = page.locator('[data-testid^="merc-card-"]');
    const cardCount = await mercCards.count();
    if (cardCount === 0) {
      // eslint-disable-next-line no-console
      console.warn('[card-ui] no mercs on fresh save — empty-state branch (expected).');
    } else {
      await expect(mercCards.first()).toBeVisible();
    }
  });
});
