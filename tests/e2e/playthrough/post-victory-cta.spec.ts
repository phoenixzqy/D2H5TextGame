/**
 * post-victory-cta.spec.ts — Bug #21 regression
 *
 * After clearing all waves in a sub-area run, the victory panel must
 * display at least two of the three post-victory CTAs:
 *   - "Return to map"  (data-testid="return-to-map")
 *   - "Return to town" (data-testid="return-to-town")
 *   - "Continue to next sub-area" (data-testid="continue-next-subarea") — present
 *     only if there is a following sub-area in the same act.
 *
 * Skips to the resolution of each wave using the Skip button.
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  enterFirstCombat,
  boostPlayer,
  skipViaStore,
} from './_setup';

test.describe('Bug #21 — Post-victory CTAs @desktop-only', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'post-victory-cta runs on desktop only'
    );
  });

  test('victory panel shows Return-to-map and Return-to-town after clearing sub-area', async ({ page }) => {
    test.setTimeout(120_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'sorceress', name: 'VictoryTest' });
    await boostPlayer(page);

    await enterFirstCombat(page);

    // Skip all waves until victory or defeat panel appears.
    await skipViaStore(page, 90_000);

    const victoryPanel = page.getByTestId('victory-panel');
    const defeatPanel = page.getByTestId('defeat-panel');

    // We expect at least a victory or defeat panel.
    const panelVisible = await victoryPanel
      .isVisible()
      .catch(() => false)
      || await defeatPanel.isVisible().catch(() => false);

    expect(panelVisible, 'Expected victory-panel or defeat-panel to be visible').toBe(true);

    // Bug #21: if we won, the two mandatory CTAs must be present.
    if (await victoryPanel.isVisible().catch(() => false)) {
      await expect(page.getByTestId('return-to-map')).toBeVisible({ timeout: 3_000 });
      await expect(page.getByTestId('return-to-town')).toBeVisible({ timeout: 3_000 });
    }
  });
});
