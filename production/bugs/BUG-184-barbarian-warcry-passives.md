# BUG-184 — Apply automatic personal Barbarian warcries

Severity: High
Status: fixed locally in `4045681a76e79a6cfe8558a91479bf5d3a414566`; independent acceptance/earned balance open
Owners: engine-dev, frontend-dev, content-designer

Baseline98c3d817ff5372c217165120514e03ae2688aace; local Vitest/jsdom,
both locales affected; deterministic battle seed7. Synthetic fixtures only.

1. Compose a level30 Barbarian with no combo and rank1 or20 Shout/Orders.
2. Compare fresh combat defense/life/recovery with the same unallocated hero.
3. Run identical seeded basic-attack battles; compare landed damage, HP and MP.

Expected: D05-barbarian-warcries-v1 contract applies authored3% defense and
4% life/1% recovery per rank automatically to the hero. Like passive percentages
add on fresh equipment stats. Native pools, next-wave/replay/save rules persist.
Actual: rows route to inert buff markers; fresh hero ignores both skills. Locales
also advertise contradictory fixed50%/party/timed or maximum-mana effects.

Evidence: barbarian-warcries-composition.test.ts corrected causal RED10fail/
6controls before production edits; raw core-red/core-causal-red/core-corrected-red
logs will be retained in docs/plans/evidence/fixtures/barbarian-warcries/raw.tar.gz.
Initial fixtures incorrectly compared retained allocations, used the wrong result
field, hit the damage floor, and then redeclared a variable; corrected causal
failures distinguish these test errors from the missing production effects.
Root cause: missing fresh hero consumer for these authored passive stat rows.
No gameplay workaround. Independent whole-build/earned acceptance remains open.

Regression: src/stores/barbarian-warcries-composition.test.ts,
src/stores/barbarian-warcries-native.test.ts,
src/engine/skills/barbarian-warcries.test.ts and
src/features/skills/SkillsScreen.barbarian-warcries.test.tsx.
Current verification: docs/plans/evidence/d05-barbarian-warcries.md.
