/**
 * xp-after-fight.spec.ts — Bug #1 regression
 *
 * Asserts that character XP increases after winning a fight.
 * Creates a Sorceress, boosts stats to guarantee a win, enters Blood Moor,
 * skips to resolution, and reads XP from the test bridge.
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  enterFirstCombat,
  getXP,
  skipToResolution,
  boostPlayer,
} from './_setup';

test.describe('Bug #1 — XP after fight @desktop-only', () => {
  test('sorceress XP increases after winning a fight', async ({ page }) => {
    test.setTimeout(90_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'XpTest' });

    // Boost stats so the sorceress is guaranteed to win wave 1.
    await boostPlayer(page);

    const xpBefore = await getXP(page);

    await enterFirstCombat(page);

    // Skip wave 1 and wait for the victory message.
    await skipToResolution(page, 30_000);

    // XP is awarded by advanceWaveOrFinish() when outcome.winner === 'player'.
    // The store write happens synchronously in JS so within a few ticks of
    // the battle-end message appearing the XP should already be updated.
    await expect
      .poll(async () => getXP(page), { timeout: 8_000, intervals: [300] })
      .toBeGreaterThan(xpBefore);
  });
});
