# BUG-667 — Invest late Javelin points in its physical signature

Status: Fixed locally; earned whole-route viability remains under BUG642.
Severity: High (intended build progression). Owner: root / game-designer.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
Native Node campaign; browser, viewport and locale not applicable. Original
Chaos705 wave6 uses runSeed1451398233 / engineSeed84330382. The level49
intended Javelin has Lightning Strike20, Impale8 and Critical Strike15.
Hero1051Life/23Mana survives, but Diablo retains9162Life after60s.
The recorded original fight is retained; no new reproduction replay is needed.

Expected: late investment develops the intended Lightning Strike/Impale pair
without changing the early bridge, granting points or bypassing native reset.
Actual: intended growth permanently caps Impale at8, then spends later points
on Critical Strike. Impale's authored fixed base gains150per rank; weapon Attack
does not scale it. Two separately frozen weapon comparisons also draw and remain
rejected. No production combat formula defect is established.

## Correction and evidence plan

Add an Impale20 target from level40 before final Critical Strike investment;
retain every existing target and priority. A native reset of an isolated copy
of the exact original successor must pay allowance3→2 and reallocate its58
actual ranks: Impale8→20, Critical Strike15→3, everything else exact, including
Magic Arrow1. Preserve all equipment, resources, economy, quests and clocks.
One candidate changes only canonical rank/passive composition in the original
Diablo input. Absolute carry, original full order and absent merc stay exact.
Adoption requires a living-hero victory; no campaign clear or renewed limit.

Affected systems: intended campaign growth and native regression checks.
Workaround: native town skill reset and physical-signature investment.
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-javelin-impale-investment-v1`.
Parent BUG642 retains the unresolved earned Diablo clear and every earlier failure.

## Verified correction, 2026-11-04

The new level40 Impale20 target is implemented without changing existing targets
or the early bridge. Twelve selected regressions, scoped strict types and
explicit no-ignore lint pass. The native reset spends allowance3→2 and moves
exactly12ranks from Critical Strike15→3 to Impale8→20; all other ranks and
whole-save domains are conserved. The sole retained Diablo candidate wins in
29,756ms with hero1081Life/24Mana. Separate retained-output readback passes;
this comparison grants no earned clear or formal balance cell.

A separate actual Chaos706 admission wins five waves then draws on the sixth
Mega Demon pack; Diablo is never staged. Exact successor49/next707, five enemies
alive, hero878Life/6Mana. Accounting V2 verifies all native save, ordered item,
reward, point, party, quest, clock, seed and ordinal transitions without combat
replay. Pack/mana viability remains unresolved under BUG642. See the
[combined evidence](../../docs/plans/evidence/p15-javelin-act4-and-owned-weapon.md).
