# BUG-144 — Apply the allocated Cold Mastery passive

Status: reproduced at861db8e; correction underway.
Severity: High — this advertised passive has no combat effect.
Owner: root integrator / engine-dev / content-designer / frontend-dev.

Environment: Vitest production hero factory and combat recorder, seed7;
browser-independent, both locales advertise resistance reduction.

1. Compose an otherwise identical level30 Sorceress with allocated Cold Mastery
   ranks0,1,2,20 through `playerToCombatUnit`.
2. Resolve one fixed100cold hit against50cold resistance and10magic mitigation.
3. Compare damage and target stats with the unallocated control.

Expected: allocated Cold Mastery reduces cold resistance for the bearer's
direct cold hits; rank1's advertised15percentage points yields55damage.
Actual: all ranks deal40damage, identical to the unallocated control.
The locales promise15% resistance reduction; JSON instead contains
`coldDamagePct:0.04`, which is also unused by hero composition.

Evidence: `src/stores/cold-mastery-composition.test.ts`, initial6failed/10passed,
`composition-red.log` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cold-mastery-z8mtwgmg`.
Negative controls for noncold hits, class and unlock pass before the fix.

Root cause: contradictory authored identity plus missing automatic projection
and source-owned resistance consumer. See the controlling
`docs/plans/decisions/D05-cold-mastery-v1.md` for the explicit reconciliation.
No workaround restores this passive; allocating other skills avoids its cost.
