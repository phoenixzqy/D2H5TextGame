/**
 * equip-compare-ux-v2.spec.ts — visual evidence for the fix to Bug A
 * (inline +/-Δ compare panel) and Bug B (read-only equipped stat sheet).
 *
 * UPDATED for feat/equip-picker-v3 redesign: the picker now AUTO-SELECTS
 * the first eligible candidate on open, so the empty-current+candidate
 * compare view is reached without an explicit row click. Single-mode
 * `item-stat-sheet` is no longer rendered inside the picker (it's only
 * the fallback path when there are zero candidates). The character-screen
 * read-only modal still uses `item-stat-sheet` and is unchanged.
 *
 * Captures screenshots at desktop (1280×800) and mobile (360×640):
 *   - bugA-equip-picker-compare-empty       (empty current vs auto-picked candidate)
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

    // Empty slot + auto-selected candidate → compare panel visible.
    const slot = page.getByTestId('equip-slot-weapon');
    await expect(slot).toBeVisible();
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible();
    await expect(page.getByTestId('compare-panel')).toBeVisible();
    await expect(page.getByTestId('item-compare')).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugA-equip-picker-compare-empty-${tag}.png`),
      fullPage: false
    });

    // Confirm equip → picker closes.
    await page.getByTestId('equip-picker-confirm').click();
    await expect(page.getByTestId('equip-picker')).not.toBeVisible();

    // Re-open with weapon equipped → magic candidate remains in backpack;
    // auto-select picks it → real ±Δ rows visible.
    await slot.click({ position: { x: 24, y: 24 } });
    await expect(page.getByTestId('equip-picker')).toBeVisible();
    await expect(page.getByTestId('compare-panel')).toBeVisible();
    await page.getByTestId(`equip-picker-row-${seeded.b}`).click();
    await expect(page.getByTestId('item-compare')).toBeVisible();
    await page.screenshot({
      path: path.join(OUTDIR, `bugA-equip-picker-compare-equipped-${tag}.png`),
      fullPage: false
    });

    await page.getByTestId('equip-picker-close').click();
    await expect(page.getByTestId('equip-picker')).not.toBeVisible();

    // Bug B — read-only modal from CharacterScreen (no swap mode).
    // Unchanged by the redesign; this entry point still uses the single-
    // mode StatSheet (`item-stat-sheet`).
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
