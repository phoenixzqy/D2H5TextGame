/**
 * no-gold-currency.spec.ts — Bug #12 regression
 *
 * After winning a fight the loot panel must NOT contain "金币" or "gold".
 * The game's economy uses rune shards, gems, and wishstones — gold was
 * removed. Any appearance of "金币" / "gold" in the loot panel is a regression.
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, enterFirstCombat, skipToResolution, boostPlayer } from './_setup';

test.describe('Bug #12 — No gold currency in loot panel', () => {
  test('loot panel contains no 金币 or gold string after fight', async ({ page }) => {
    test.setTimeout(90_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'barbarian', name: 'GoldTest' });
    await boostPlayer(page);

    await enterFirstCombat(page);
    await skipToResolution(page, 30_000);

    // If a victory panel is present check the loot-summary.
    const victoryPanel = page.getByTestId('victory-panel');
    if (await victoryPanel.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const lootSummary = page.getByTestId('loot-summary');
      const lootVisible = await lootSummary.isVisible().catch(() => false);
      if (lootVisible) {
        const text = (await lootSummary.textContent()) ?? '';
        expect(text).not.toMatch(/金币|gold/i);
      }
      // Also check the wider victory panel text.
      const panelText = (await victoryPanel.textContent()) ?? '';
      expect(panelText).not.toMatch(/金币|gold\s*:/i);
    }
  });
});
