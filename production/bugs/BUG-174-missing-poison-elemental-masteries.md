# BUG-174 — Apply authored Poison and Elemental Mastery bonuses

Severity: High. Status: fixed locally in `09a2722`; independent acceptance open.
Owner: engine-dev / frontend-dev. Base `b713c03` plus the shared-validator refactor.
Environment: Node24/Vitest; Chromium en/zh-CN, 1280×800 and 360×640 targets.
Seed: composition is RNG-free; seeded combat regressions will use seed7.

1. Construct a labeled level30 Necromancer or Druid functional fixture.
2. Compare `playerToCombatUnit` before/after allocating the exact authored passive.
3. Repeat at rank20; inspect both-language skill descriptions.

Expected: Necromancer gains authored .04 poison/.02 arcane damage per rank;
Druid gains .03 fire/cold damage and .005 magical dodge per rank. Class/unlock/cap
guards apply. Bonuses compose once with ordinary gear/runewords, clear on reset,
and never modify persisted pools or a frozen current recording.
Actual: neither passive has a combat consumer; current descriptions promise fixed30%.
Evidence: corrected `src/stores/damage-masteries-composition.test.ts` has4causal
failures/4passing controls; raw `red-composition-corrected.log` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-masteries-in_ia_ab`.
The first test attempt incorrectly compared distinct stored allocations/identities;
it is retained as a test-harness failure, not causal RED evidence.
Root cause: passive metadata is displayed/registered but never projected into the
fresh hero damage/dodge modifiers. No workaround; another passive cannot grant it.
Independent acceptance and earned class/build balance remain open.

Final validation:142focused/10files, engine5868/188, full11915/479 with two
existing skips, types/lint/build pass. Production bilingual/class/viewport8/8,
eight exact Save/close/Continue pairs and no captured errors. Strict schema,
real Poison Nova/DoT, per-type damage, actual magical misses, gear/runewords,
native next-wave/reset/replay covered. Original failures/corrections retained.
[Evidence](../../docs/plans/evidence/d05-poison-elemental-masteries.md).
