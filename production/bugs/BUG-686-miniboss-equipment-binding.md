# BUG686 — Bind live miniboss equipment to its own reward contract

Status: Resolved locally, 2026-11-04 (uncommitted). Severity: High.
Input: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Environment: Node/Vitest pure engine; browser, locale and viewport not applicable.
Fixed RNG: constant .5 / .25 and seed7 with the first rarity variate .6.

## Reproduction

1. Load actual award pools and roll `boss`, `loot/mini-act1`, level10, MF0.
2. With constant .5, inspect ordinary item count and independent jewelry.
3. Repeat five acts and finite act caps59/72/87/101/122 with constant .25.
4. With seed7, force the first base variate0 and rarity variate .6.

Expected: drop-tables §3/§5.6: three trash-source equipment picks with minima+3,
one independent jewelry pick, 3/4/8 rarity multipliers, and the existing .5
rare+ bonus. Actual ilvl and D10 independent material/currency contracts persist.

Actual: historical five mixed mini-table draws, no independent jewelry group,
chapter-boss 4/6/12 rarity weights and incomplete high-level ordinary rewards.
The rare+ source also needs finite terminal eligibility at current replay levels.

Evidence: all11 reproduction cases fail in `src/engine/loot/miniboss-equipment.test.ts`;
original log retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-miniboss-equipment-v1/original-failure.log`.
Affected systems/ownership: engine-dev loot awards, content-designer authored
bindings, existing native settlement. No player workaround.
Root cause: absent live miniboss projection and absent distinct loot rarity
context; miniboss combat tier `boss` was reused for chapter-boss loot.

## Resolution

Closed authored bindings now prepare three shifted equipment picks, independent
jewelry and the unshifted finite bonus source. A local3/4/8 rarity context reaches
ordinary and conditional rolls without changing combat identity, chapter bosses,
goblins or explicit caches. D10 independent materials and currency budgets remain.

Regression: `src/engine/loot/miniboss-equipment.test.ts` (19 cases) and three
native cases in `src/stores/combatHelpers.settlement.test.ts`. All124selected
loot and33native settlement cases pass (overlapping runs); scoped types/lint,
production/precache and bridge scan pass. [Evidence and limits](../../docs/plans/evidence/p17-miniboss-equipment.md).
No commit/publication; full economy and private v1 acceptance remain open.
