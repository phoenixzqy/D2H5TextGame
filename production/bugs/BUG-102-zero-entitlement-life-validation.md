# BUG-102 — Preserve stat composition without a quest Life entitlement

- Status: Open
- Severity: Medium
- Affected systems: engine-dev; shared equipped stats and summon eligibility
- Reproduction commit: `965bb8cb6d638071b11fa7be6ce4771a793c08bc`
- Environment: Node / Vitest; browser, viewport, and locale do not participate
- Seed: not applicable; deterministic stat composition without RNG

## Reproduction

1. Configure a player with a nonfinite level and no consumed Golden Bird potion.
2. Enter the existing summon preparation or Iron Skin configuration path.
3. Run `npx vitest run src/stores/summon-preparation-corpses-native.test.ts src/stores/combatHelpers.summon-eligibility.test.ts src/stores/iron-golem-configuration.test.ts src/stores/iron-skin-composition.test.ts`.

Expected: stat composition retains its previous output and the existing feature
eligibility checks exclude the malformed configuration without a new exception.

Actual: the unconditional Golden Bird arithmetic guard throws
`Unsafe quest Life arithmetic` even when the quest Life bonus is zero.
The frozen full run has 9 failures across these four existing test files;
9,330 tests pass. All 949 frozen source/tool files and HEAD remain unchanged.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a3-delivery-clenw50l/golden-unit-full-final.log`
and sibling `golden-unit-full-result.json`.

## Cause and correction

`deriveEquippedPlayerStats` validates a new participating calculation even when
no entitlement participates. Scope the new guard to a positive quest Life
bonus; retain all safety checks when that bonus applies. Preserve the existing
caller tests and add pure zero-entitlement / participating-bonus regressions in
`src/engine/progression/quest-life.test.ts`.
