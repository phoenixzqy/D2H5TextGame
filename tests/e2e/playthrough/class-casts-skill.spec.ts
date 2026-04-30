/**
 * class-casts-skill.spec.ts — Bug #3 regression
 *
 * For each of the 7 classes: creates a new character, boosts stats to
 * survive, enters combat, skips the first wave, and asserts that at
 * least one log entry shows a named skill cast (not just basic attack).
 *
 * Log patterns (localized):
 *   - Skill cast (ZH): "ActorName 施放了 skillId。"
 *   - Skill cast (EN): "ActorName casts skillId"
 *   - Basic attack (ZH): "ActorName 准备出招。" / "ActorName 普攻 ..."
 *   - Basic attack (EN): "ActorName attacks"
 *
 * Each class test is independent (beforeEach resets state).
 */
import { test, expect } from '@playwright/test';
import {
  clearGameStorage,
  createCharacter,
  enterFirstCombat,
  boostPlayer,
  waitForBattleLoaded,
  drainCurrentWave,
  ALL_CLASSES,
  type CharacterClass,
} from './_setup';

for (const cls of ALL_CLASSES) {
  test.describe(`Bug #3 — ${cls} casts a named skill @desktop-only`, () => {
    test(`${cls}: non-basic-attack skill appears in combat log by wave end`, async ({ page }) => {
      test.setTimeout(90_000);

      await clearGameStorage(page);
      await createCharacter(page, { class: cls as CharacterClass, name: `SkillTest` });
      await boostPlayer(page);

      await enterFirstCombat(page);

      // Wait for events, drain them, and read log from store directly.
      await waitForBattleLoaded(page, 10_000);
      const logText = await drainCurrentWave(page);

      // A named-skill action uses "施放了 <skillId>." (ZH) or "casts <skillId>" (EN).
      // Basic actions use "准备出招" / "普攻" (ZH) or "attacks" (EN) — no skill id.
      // We check that at least one log line mentions a specific skillId via
      // "施放了" (ZH cast indicator) or a casts-non-basic-attack pattern in EN.
      const hasNamedSkillCast =
        /施放了\s+\S/i.test(logText) ||
        /casts\s+\w+\.\w+/i.test(logText); // matches "casts class.skill_id"

      expect(
        hasNamedSkillCast,
        `${cls}: expected at least one named-skill cast in log, got:\n${logText.slice(0, 500)}`
      ).toBe(true);
    });
  });
}
