/**
 * equip-compare-ux-v2.spec.ts — visual evidence for the fix to Bug A
 * (inline +/-Δ compare panel) and Bug B (read-only equipped stat sheet).
 *
 * Captures screenshots at desktop (1280×800) and mobile (360×640):
 *   - bugB-equip-picker-current-empty       (empty slot, current-only sheet)
 *   - bugA-equip-picker-compare-empty       (empty current vs candidate)
 *   - bugB-equip-picker-current-equipped    (current item, no candidate)
 *   - bugA-equip-picker-compare-equipped    (item vs candidate, real deltas)
 *   - bugB-character-equipped-modal         (read-only modal from char screen)
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { clearGameStorage, createCharacter, navTo } from './_helpers';

const OUTDIR = path.resolve(process.cwd(), '.screenshots', 'equip-compare-ux-v2');

test.describe('Equip compare UX v2 — visual evidence', () => {
  test('captures Bug A + Bug B screenshots', async ({ page, viewport }) => {
    test.setTimeout(60_000);
    const tag = (viewport?.width ?? 0) <= 480 ? 'mobile' : 'desktop';

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'CompareUX' });

    // Seed two weapons (different rarities differentiate visual rows).
    const seeded = await page.evaluate(() => {
      const game = (
        window as unknown as {
          __GAME__?: {
            seedItem: (id: string, opts?: { rarity?: string }) => string;
          };
        }
      ).__GAME__;
      if (!game) throw new Error('test bridge not installed');
      const a = game.seedItem('items/base/wp1h-short-sword', { rarity: 'normal' });
      const b = game.seedItem('items/base/wp1h-short-sword', { rarity: 'magic' });
      return { a, b };
    });
    expect(seeded.a).toMatch(/^seed-/);

    await navTo(page, 'inventory');
    await expect(page.getByTestId('inventory-screen')).toBeVisible();

    const equipTab = page.getByRole('tab', { name: /装备|Equipment/i }).first();
    await equipTab.click();

    // ----------------------------------------------------------------
    // Bug B (empty) — open weapon slot when nothing is equipped.
    // ----------------------------------------------------------------
    const slot = page.getByTestId('equip-slot-weapon');
    await expect(slot).toBeVisible();
    // Click the label area so we don't accidentally tap any nested
    // action button (Details / Unequip) when the slot has an item.
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible();
    const statSheet = page.getByTestId('item-stat-sheet');
    await expect(statSheet).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugB-equip-picker-current-empty-${tag}.png`),
      fullPage: false
    });

    // ----------------------------------------------------------------
    // Bug A (empty→candidate) — selecting a candidate flips to compare.
    // ----------------------------------------------------------------
    await page.getByTestId(`equip-picker-row-${seeded.a}`).click();
    await expect(page.getByTestId('item-compare')).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugA-equip-picker-compare-empty-${tag}.png`),
      fullPage: false
    });

    // Confirm equip → picker closes.
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).not.toBeVisible();

    // ----------------------------------------------------------------
    // Bug B (equipped) — re-open picker, current item shown, no candidate.
    // ----------------------------------------------------------------
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible();
    await expect(page.getByTestId('item-stat-sheet')).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugB-equip-picker-current-equipped-${tag}.png`),
      fullPage: false
    });

    // ----------------------------------------------------------------
    // Bug A (real deltas) — pick the magic candidate, see ±Δ rows.
    // ----------------------------------------------------------------
    await page.getByTestId(`equip-picker-row-${seeded.b}`).click();
    await expect(page.getByTestId('item-compare')).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugA-equip-picker-compare-equipped-${tag}.png`),
      fullPage: false
    });

    await page.getByTestId('equip-picker-close').click();
    await expect(page.getByTestId('equip-picker')).not.toBeVisible();

    // ----------------------------------------------------------------
    // Bug B — read-only modal from CharacterScreen (no swap mode).
    // BottomNav has no /character link; the CharacterHud (top-right)
    // is the documented entry point.
    // ----------------------------------------------------------------
    await page.getByTestId('character-hud').click();
    await expect(page.getByTestId('character-screen')).toBeVisible();
    const charSlot = page.getByTestId('char-equip-slot-weapon');
    await expect(charSlot).toBeVisible({ timeout: 5_000 });
    await charSlot.click();
    const modal = page.getByTestId('equipped-item-modal');
    await expect(modal).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugB-character-equipped-modal-${tag}.png`),
      fullPage: false
    });
    await page.getByTestId('equipped-item-modal-ok').click();
    await expect(modal).not.toBeVisible();
  });
});

