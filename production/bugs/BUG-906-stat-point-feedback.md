# BUG-906 — Surface stat points after leveling

- Status: Fixed in 02b800d5
- Severity: Medium
- Reproduction: `b5df22de`, Edge/Chrome at 360×640, zh-CN; gain enough XP to level, then open Character → Attributes.
- Expected: Level-up feedback names both rewards and available stat points are visible beside the stat controls.
- Actual: The level-up log gives only the new level, and the stat-point count is after the scrollable attributes list. Skill allocation is easier to discover than stat allocation.
- Evidence: `src/stores/combatHelpers.ts` level-up log; `src/features/character/CharacterScreen.tsx` attributes panel; user report and screenshot. Engine/store tests confirm +5 stat points per level, so this is a feedback and layout issue rather than a missing award.
- Affected systems: frontend-dev, writer.
- Seed: XP award deterministic; combat reproduction uses seed 7 in `CombatScreen.level-up.test.tsx`.
- Regression: `src/features/character/CharacterStatDraft.test.tsx` and `src/features/combat/CombatScreen.level-up.test.tsx`.
