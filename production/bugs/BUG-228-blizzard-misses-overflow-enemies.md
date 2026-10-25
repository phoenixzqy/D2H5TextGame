# BUG-228 — Make Blizzard reach every advertised enemy

- Status: locally fixed/verified; independent design/QA and earned balance open.
- Severity: Medium — Blizzard casts, but misses hostiles outside its box.
- Owner: root, data/engine/UI; independent design/QA and earned balance open.
- Reproduction build: `abf86f5c` plus new cold-attack contract/causal tests; runtime unchanged.
- Environment: Node24/Vitest native L30Sorceress, ranks1/2/20 and
  seeds7/19/41/97. No browser viewport; en/zh-CN both promise all enemies.
- Affected systems: Blizzard authored/legacy target geometry and truthful copy.

## Reproduction

1. Allocate the complete legal Ice Bolt→Ice Blast→Glacial Spike→Blizzard chain
   through native player composition and prioritize Blizzard at the desired rank.
2. Declare synthetic2000HP/100MP pools and12living enemies in four rows of
   three distinct cells, all with zero MR/Cold resistance and held from time0.
3. Let the hero cast at1700ms; hold it only from1701ms to isolate one cast.
4. Run `node_modules/.bin/vitest run src/stores/sorceress-cold-attacks.causal.test.ts`.
   This file also retains BUG227 and24passing Ice Bolt/Frost Nova controls.

Expected: the paid spell reaches all12living hostiles, including the fourth
row, as both locale descriptions promise. Damage/rank/cost/cooldown/Chill
retain existing authored values; one cast pays once.

Actual: all12Blizzard rank/seed cases attempt only `target-0` through
`target-8`. Targets9–11are untouched. The data/builder select a3×3area instead
of the advertised all-enemy pool. Immutable input, exact same-seed replay and
ordinary runBattle equality execute before the target assertion. The complete
48-case run reports24failed (12Orb/12Blizzard) and24passed controls.

Evidence: `geometry-red.log` and `geometry-red-result.json` under the current
cold-attack task output, to retain in its final packet. Cause: the wrong
upstream target/shape, not missing units or a need for a new combat loop.
[Contract](../../docs/plans/decisions/D04-sorceress-cold-attacks-v1.md).
At reproduction time, no repair/skill credit, genuine campaign action or global balance claim was made.


## Local delivery — 2026-10-25

Source dc489cb1 repairs authored and legacy target geometry and adds an
identity/schema guard. Ranks1/2/20 ×four seeds prove actual paid recipients,
HP/MP conservation and Chill. Full15610/711/two existing skips, engine7933/296,
loader292/1, types/lint/build/precache and16public browser cases pass.
[Delivered evidence](../../docs/plans/evidence/d04-sorceress-cold-attacks.md).
Independent design/QA and earned campaign/balance acceptance remain open.
