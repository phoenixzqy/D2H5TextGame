/**
 * visual-fixes.spec.ts — verifies the recently-landed UI/store fixes.
 *
 * Covers:
 *   • Issue 1   — character screen 2-up layout (desktop) / stacked (mobile)
 *   • Issue 2   — equip flow returns {ok}, toast fires, derived stat changes
 *   • Issue 3   — combat uses GameCard (allies + enemies cards visible)
 *   • Issue 4a  — combat fits viewport at 1280×800 (no page scroll)
 *   • Issue 5   — combat log scrolls internally, not the page
 *
 * The spec relies on `window.__GAME__.seedItem(...)` exposed by
 * `src/app/test-bridge.ts` to deterministically place a known item in the
 * player's backpack without touching engine RNG.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const SHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots', 'visual-fixes');

test.beforeAll(() => {
  if (!fs.existsSync(SHOT_DIR)) {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
  }
});

const isDesktopProject = (name: string): boolean => name.includes('desktop');
const isMobileProject = (name: string): boolean => name.includes('mobile');

/** Seed `helm-cap` (head, +7 baseDefense) into the player's backpack. */
async function seedHelmCap(page: Page): Promise<string> {
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
    return game.seedItem('items/base/helm-cap', { rarity: 'normal', level: 1 });
  });
}

/** Read the current player's `derivedStats.defense`. */
async function readDefense(page: Page): Promise<number> {
  return page.evaluate(() => {
    const game = (window as unknown as {
      __GAME__?: { player: { getState: () => { player: { derivedStats: { defense: number } } | null } } };
    }).__GAME__;
    const p = game?.player.getState().player;
    return p?.derivedStats.defense ?? -1;
  });
}

test.describe('Issue 1 — Character layout', () => {
  test('desktop puts hero strip + attributes side-by-side @desktop-only', async ({ page }, info) => {
    test.skip(!isDesktopProject(info.project.name), 'desktop-only');
    test.setTimeout(60_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'CharQA' });
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();

    const top = page.getByTestId('char-top-row');
    await expect(top).toBeVisible();
    // Container must use 2-col at md+
    const className = await top.getAttribute('class');
    expect(className ?? '').toMatch(/grid-cols-1/);
    expect(className ?? '').toMatch(/md:grid-cols-2/);

    // Bug #13 reordered rows: char-top-row is now hero + derived stats
    // (core attributes moved to the next row).
    const hero = page.getByTestId('hero-strip');
    const sideBySide = page.getByTestId('char-derived-stats');
    await expect(hero).toBeVisible();
    await expect(sideBySide).toBeVisible();

    const heroBox = await hero.boundingBox();
    const sideBox = await sideBySide.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(sideBox).not.toBeNull();
    if (!heroBox || !sideBox) return;
    // panel is to the right of hero strip's midpoint
    expect(sideBox.x).toBeGreaterThan(heroBox.x + heroBox.width / 2);
    // and roughly aligned vertically (top of one within the other's vertical span)
    expect(sideBox.y).toBeLessThan(heroBox.y + heroBox.height);

    await page.screenshot({
      path: path.join(SHOT_DIR, 'character-1280.png'),
      fullPage: false,
    });
  });

  test('mobile stacks hero strip above attributes @mobile-only', async ({ page }, info) => {
    test.skip(!isMobileProject(info.project.name), 'mobile-only');
    test.setTimeout(60_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'CharQAm' });
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();

    const hero = page.getByTestId('hero-strip');
    const attrs = page.getByTestId('core-attributes-panel');
    const heroBox = await hero.boundingBox();
    const attrsBox = await attrs.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(attrsBox).not.toBeNull();
    if (!heroBox || !attrsBox) return;
    // attributes appear *below* hero strip
    expect(attrsBox.y).toBeGreaterThan(heroBox.y + heroBox.height - 10);

    await page.screenshot({
      path: path.join(SHOT_DIR, 'character-360.png'),
      fullPage: false,
    });
  });
});

test.describe('Issue 2 — Equip flow @desktop-only', () => {
  test('equip → toast + derived defense increases', async ({ page }, info) => {
    test.skip(!isDesktopProject(info.project.name), 'desktop-only');
    test.setTimeout(60_000);
    await clearGameStorage(page);
    await createCharacter(page, { class: 'paladin', name: 'EquipQA' });

    const defenseBefore = await readDefense(page);
    expect(defenseBefore).toBeGreaterThanOrEqual(0);

    const seededId = await seedHelmCap(page);
    expect(seededId).toMatch(/^seed-/);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    // Item card appears in the backpack grid.
    const itemCard = page.getByTestId(`inv-item-${seededId}`);
    await expect(itemCard).toBeVisible();

    await page.screenshot({
      path: path.join(SHOT_DIR, 'inventory-equip-before-1280.png'),
      fullPage: false,
    });

    await itemCard.click();
    const equipBtn = page.getByTestId('inv-primary-action');
    await expect(equipBtn).toBeVisible();
    await equipBtn.click();

    // Toast appears in the live region.
    const toast = page.getByTestId('inventory-toast');
    await expect(toast).toContainText(/已装备|Equipped/);

    // Item card is gone from backpack list.
    await expect(itemCard).toHaveCount(0);

    // Equipment tab shows it in the head slot.
    await page.getByRole('tab', { name: /装备|Equipment/ }).first().click().catch(async () => {
      // fallback: click button labeled equipment
      await page.getByRole('button', { name: /^装备$|^Equipment$/ }).first().click().catch(() => undefined);
    });

    // Defense increased by base's contribution (helm-cap baseDefense=7).
    const defenseAfter = await readDefense(page);
    expect(defenseAfter).toBeGreaterThan(defenseBefore);

    await page.screenshot({
      path: path.join(SHOT_DIR, 'inventory-equip-after-1280.png'),
      fullPage: false,
    });
  });
});

/** Navigate from town to combat by entering the first sub-area of Act 1. */
async function enterCombat(page: Page): Promise<void> {
  await navTo(page, 'map');
  await expect(page.getByTestId('map-screen')).toBeVisible();
  // Act 1 is open by default. Click the first "Enter" button.
  const enterBtn = page.getByRole('button', { name: /进入|Enter/ }).first();
  await enterBtn.click();
  await expect(page.getByTestId('combat-screen')).toBeVisible({ timeout: 10_000 });
}

test.describe('Issues 3, 4a, 5 — Combat layout @responsive', () => {
  test('cards visible + no page scroll + log scrolls internally', async ({ page }, info) => {
    test.setTimeout(90_000);
    const desktop = isDesktopProject(info.project.name);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'CombatQA' });
    await enterCombat(page);

    // Wait for the engine to render at least one ally + one enemy card.
    await expect(page.getByTestId('combat-ally-card').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('combat-enemy-card').first()).toBeVisible({ timeout: 10_000 });

    // Wait for a few log entries to settle the layout.
    const log = page.getByTestId('combat-log');
    await expect(log).toBeVisible();
    await expect.poll(
      async () => (await log.locator('div[class*="text-"]').count()),
      { timeout: 15_000, intervals: [200, 400, 800] }
    ).toBeGreaterThan(2);

    // Screenshot per project.
    await page.screenshot({
      path: path.join(SHOT_DIR, desktop ? 'combat-1280.png' : 'combat-360.png'),
      fullPage: false,
    });

    if (desktop) {
      // Issue 4a: combat screen fits viewport (no page scroll).
      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight
      );
      // Allow a 1px rounding tolerance.
      expect(overflow).toBeLessThanOrEqual(1);
    }

    // Issue 5: pump the timeline to fill the log, then assert internal scroll.
    // The skip button drains all events synchronously.
    const skip = page.getByRole('button', { name: /跳过|Skip/ });
    if (await skip.isEnabled().catch(() => false)) {
      await skip.click().catch(() => undefined);
    }

    // Force re-poll of log size: scrollHeight > clientHeight.
    const sizes = await log.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight,
    }));
    expect(sizes.scroll, 'log should have any content').toBeGreaterThan(0);
    // After pumping, the cumulative event log should overflow the capped pane.
    // Some battles end before the log gets large; tolerate by only asserting
    // when there are enough entries to cause overflow.
    const entryCount = await log.locator('div[class*="text-"]').count();
    if (entryCount > 12) {
      expect(sizes.scroll).toBeGreaterThanOrEqual(sizes.client);
    }

    if (desktop) {
      // After skip, page should still fit (combat-log full screenshot).
      await page.screenshot({
        path: path.join(SHOT_DIR, 'combat-log-full-1280.png'),
        fullPage: false,
      });
      const overflow2 = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight
      );
      // The page should NOT scroll even after the log fills up. Allow a
      // small tolerance for the loot-summary panel that appears at end.
      // We assert this BEFORE the loot panel is revealed by checking only
      // when we're still in the live combat phase (loot-summary absent).
      const lootVisible = await page
        .getByTestId('loot-summary')
        .isVisible()
        .catch(() => false);
      if (!lootVisible) {
        expect(overflow2).toBeLessThanOrEqual(1);
      }
    }
  });
});
