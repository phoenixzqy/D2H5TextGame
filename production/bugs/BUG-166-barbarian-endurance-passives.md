# BUG-166 — Apply Barbarian endurance passive allocations

Severity: High. Status: fixed locally; independent acceptance pending.
Owner: engine-dev / frontend-dev. Affected: combat composition and Skills copy.

## Reproduction

Base `f7718ac`; native store/engine, Node/Vitest, both locales. Browser is not
required for the stat reproducer. Battle consumer seeds 1–64.

1. Construct a level30 Barbarian with no combo or equipment and retain its
   `playerToCombatUnit` projection.
2. Allocate rank1 or20 of Increased Stamina, Increased Speed or Natural
   Resistance, using the exact authored or canonical ID; project again.
3. Compare max life, attack speed, physical/magical dodge and six resistances.
4. Inspect each skill's en/zh description.

Expected: the authored per-rank coefficients change corresponding player
combat stats once. Stamina and Speed describe max life and attack speed/dodge.
Actual: all stats remain unchanged. Descriptions promise stamina/movement
or a fixed30% resistance that disagrees with the JSON.

Evidence: `src/stores/barbarian-passive-composition.test.ts`; initial and
corrected RED logs retained in the task evidence directory. Corrected fixture
uses the real `basicAttack` field and `maxRounds`; initial fixture mistakes
are retained and do not support cold-damage claims.

Root cause: these passive rows become named catalog markers; the fresh hero
boundary composes only Iron Skin for Barbarian. Workaround: none for these
allocated points; other skills remain available.

## Resolution

Controlling contract: `docs/plans/decisions/D05-barbarian-endurance-v1.md`.
Implementation and final verification are recorded in its evidence link:
11778 unit passes/two existing skips, typecheck/lint/build and four production
browser cases pass. Native recording/reset/replay/import cases are included.
