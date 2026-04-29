/**
 * affix-rolls.spec.ts — vertical E2E coverage for per-drop item rolls.
 *
 * Verifies combat still produces loot, each generated drop can roll distinct
 * base/affix values, rare affix lines render in inventory, and equip compare
 * preserves those affix lines alongside stat deltas.
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  clearGameStorage,
  createCharacter,
  navTo,
} from './_helpers';
import {
  boostPlayer,
  enterFirstCombat,
  getBackpackCount,
  skipViaStore,
} from './playthrough/_setup';

const SHOT_DIR = path.join(process.cwd(), '.screenshots', 'affix-rolls');
const SHORT_SWORD = 'items/base/wp1h-short-sword';

type SeededItem = {
  readonly id: string;
  readonly rarity: string;
  readonly baseRolls?: Readonly<Record<string, number>>;
  readonly affixes?: readonly unknown[];
};

type E2EGame = {
  readonly seedItem: (id: string, opts?: { rarity?: string; level?: number }) => string;
  readonly inventory: { readonly getState: () => { readonly backpack: readonly SeededItem[] } };
};

type SeedResult = {
  readonly currentId: string;
  readonly candidateId: string;
  readonly comparisonId: string;
  readonly candidateAffixCount: number;
  readonly generatedDiffer: boolean;
};

test.beforeAll(() => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

async function winFightUntilLootDrops(page: Page): Promise<number> {
  const startingCount = await getBackpackCount(page);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await boostPlayer(page);
    await enterFirstCombat(page);
    await skipViaStore(page, 60_000);
    await expect(page.getByTestId('victory-panel')).toBeVisible({ timeout: 10_000 });

    const countAfterFight = await getBackpackCount(page);
    if (countAfterFight > startingCount) return countAfterFight - startingCount;

    await page.getByTestId('return-to-town').click();
    await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10_000 });
  }

  return 0;
}

async function seedRolledWeapons(page: Page): Promise<SeedResult> {
  return page.evaluate((baseId) => {
    const game = (window as unknown as { readonly __GAME__?: E2EGame }).__GAME__;
    if (!game) throw new Error('test bridge not installed');

    const currentId = game.seedItem(baseId, { rarity: 'magic', level: 30 });
    const candidateId = game.seedItem(baseId, { rarity: 'rare', level: 30 });
    const comparisonId = game.seedItem(baseId, { rarity: 'rare', level: 30 });
    const backpack = game.inventory.getState().backpack;
    const candidate = backpack.find((item) => item.id === candidateId);
    const comparison = backpack.find((item) => item.id === comparisonId);
    if (!candidate || !comparison) throw new Error('seeded items missing from backpack');

    const rollSignature = (item: SeededItem) => JSON.stringify({
      baseRolls: item.baseRolls ?? {},
      affixes: item.affixes ?? [],
    });

    return {
      currentId,
      candidateId,
      comparisonId,
      candidateAffixCount: candidate.affixes?.length ?? 0,
      generatedDiffer: rollSignature(candidate) !== rollSignature(comparison),
    };
  }, SHORT_SWORD);
}

for (const locale of ['zh-CN', 'en'] as const) {
  test(`combat loot + rare affix compare works (${locale})`, async ({ page, viewport }) => {
    test.setTimeout(180_000);
    const tag = (viewport?.width ?? 0) <= 480 ? 'mobile' : 'desktop';

    await clearGameStorage(page);
    await page.addInitScript((loc) => {
      try { localStorage.setItem('i18nextLng', loc); } catch { /* noop */ }
    }, locale);
    await createCharacter(page, { class: 'amazon', name: `Affix${tag}` });

    const droppedItems = await winFightUntilLootDrops(page);
    expect(droppedItems).toBeGreaterThan(0);
    await page.screenshot({
      path: path.join(SHOT_DIR, `combat-loot-${tag}-${locale}.png`),
      fullPage: false,
    });

    await page.getByTestId('return-to-town').click();
    await expect(page.getByTestId('town-screen')).toBeVisible({ timeout: 10_000 });

    const seeded = await seedRolledWeapons(page);
    expect(seeded.currentId).toMatch(/^seed-/);
    expect(seeded.candidateId).toMatch(/^seed-/);
    expect(seeded.comparisonId).toMatch(/^seed-/);
    expect(seeded.candidateAffixCount).toBeGreaterThanOrEqual(4);
    expect(seeded.generatedDiffer).toBe(true);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId(`inv-item-${seeded.candidateId}`).click();
    const rareAffixes = page.getByTestId('item-tooltip-affix');
    await expect(rareAffixes.first()).toBeVisible({ timeout: 5_000 });
    expect(await rareAffixes.count()).toBeGreaterThanOrEqual(seeded.candidateAffixCount);
    await expect(rareAffixes.first()).toContainText(/\+/);
    await page.screenshot({
      path: path.join(SHOT_DIR, `rare-tooltip-${tag}-${locale}.png`),
      fullPage: false,
    });

    const equipTab = page.getByRole('tab', { name: /装备|Equipment/i }).first();
    await equipTab.click();
    const slot = page.getByTestId('equip-slot-weapon');
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId(`equip-picker-row-${seeded.currentId}`).click();
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).not.toBeVisible({ timeout: 5_000 });

    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId(`equip-picker-row-${seeded.candidateId}`).click();
    await expect(page.getByTestId('item-compare')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('stat-compare-table')).toBeVisible();
    await expect(page.getByTestId('stat-sheet-affix')).toHaveCount(seeded.candidateAffixCount);
    await page.screenshot({
      path: path.join(SHOT_DIR, `compare-affixes-${tag}-${locale}.png`),
      fullPage: false,
    });
  });
}
