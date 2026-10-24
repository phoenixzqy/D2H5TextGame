# BUG-144 — Apply the allocated Cold Mastery passive

Status: fixed locally in `db3976b1550f113138f1544474dee2e707c0fcac`;
independent design/source/QA acceptance pending.
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
Before correction, allocating other skills avoided spending points on a no-op.

Correction: closed personal-penetration metadata and production hero/damage/
new-wave projection, plus truthful bilingual stat rows. Regression coverage is
in `src/stores/cold-mastery-composition.test.ts`,
`src/stores/cold-mastery-lifecycle.test.ts`,
`src/engine/skills/cold-mastery{,-schema}.test.ts` and
`src/features/skills/SkillsScreen.cold-mastery.test.tsx`.
Final focused78, engine5481, full11281with2existing skips, types/lint/build and
production10/10plus2mobile scroll checks pass. See
`docs/plans/evidence/p07-cold-mastery.md`. New rank-growth reconciliation and
independent acceptance remain pending; full campaign/v1 is not certified.
