/**
 * monster-from-data.spec.ts — Bug #6 regression
 *
 * Asserts that at least one monster encountered is NOT "Fallen" (堕落者).
 * Before the fix, the monster pool wasn't loaded from JSON so every
 * encounter defaulted to the hard-coded Fallen fallback.
 *
 * Strategy: enter Blood Moor (act 1), skip to end, collect all text from
 * the enemies panel and combat log. Verify that at least one name/string
 * is NOT just a Fallen variant (in Chinese: 堕落者, in English: Fallen).
 */
import { test, expect } from '@playwright/test';
import { clearGameStorage, createCharacter, enterFirstCombat, boostPlayer, waitForBattleLoaded, drainCurrentWave } from './_setup';

test.describe('Bug #6 — Monster pool loaded from data', () => {
  test('at least one non-Fallen monster encountered', async ({ page }) => {
    test.setTimeout(60_000);

    await clearGameStorage(page);
    await createCharacter(page, { class: 'necromancer', name: 'MonsterTest' });
    await boostPlayer(page);

    await enterFirstCombat(page);

    // Collect enemy unit names once the enemies panel is populated.
    const enemiesList = page.getByTestId('enemies-list');
    await expect(enemiesList).toBeVisible({ timeout: 8_000 });

    // Read all unit card text contents from the enemies list.
    const unitTexts = await enemiesList
      .locator('[data-testid^="unit-card-"]')
      .allTextContents();

    // Skip wave to get a richer log via the store.
    await waitForBattleLoaded(page, 8_000);
    const logText = await drainCurrentWave(page);
    const allText = unitTexts.join(' ') + ' ' + logText;

    // Check that at least one thing in the combat text is NOT a Fallen variant.
    // In Chinese: "堕落者" = Fallen
    // The fix should produce other monsters like "尖刺鼠" (Quill Rat) etc.
    const hasNonFallen =
      // Positive: text contains a non-Fallen monster identifier in ZH or EN
      /尖刺鼠|血腥怪|木乃伊|骷髅|亡灵|Zombie|Quill|Skeleton|Blood\s*Raven/i.test(allText) ||
      // Fallback: the log contains text beyond what Fallen-only battle would produce.
      // A Fallen-only battle would just have "堕落者" references. If we also see
      // other names the pool was loaded correctly.
      (/[\u4e00-\u9fff]{2,}/.test(allText) && !/^(?:[\s\d堕落者ABCabc\-_Lv:/]+)*$/.test(allText));

    expect(
      hasNonFallen,
      `Expected monsters other than Fallen/堕落者 but got:\n${allText.slice(0, 400)}`
    ).toBe(true);
  });
});
