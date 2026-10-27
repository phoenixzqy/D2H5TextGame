# BUG-323 — Synchronize the Cold Mastery design row with D05

Status: Fixed locally; independently reproduced by design/source review at `7c01aceb`.
Severity: Low — stale design documentation; the runtime already implements D05.
Owner: design-contract reviewer / root documentation integrator.

## Reproduction

Environment: repository Markdown at `7c01aceb`; browser, viewport, locale and
combat seed are not applicable to this documentation-only inconsistency.

1. Read the Cold Mastery row in `docs/design/skills-spec.md` (line 69).
2. Compare its flat enemy resistance reduction and level-12 unlock with
   `docs/plans/decisions/D05-cold-mastery-v1.md` and the authored skill.

Expected: the row describes personal direct cold penetration, 15 resistance
percentage points at rank 1, +4 per additional allocated rank, cap 20/91,
level-30 eligibility and automatic passive behavior, with a link to D05.

Actual: the row still reads `-15% enemy cold resist` and `Unlocks at L12`.
The stale summary can mislead future implementation and balance work.

Evidence: independent `[COLD-MASTERY-BOUNDED-REVIEW]: APPROVE` at `7c01aceb`
identified the exact row; D05 and the existing composition/lifecycle/schema/
damage/UI regressions define the implemented scope. No runtime failure is
inferred from this documentation finding.

Root cause: the implementation decision and source were updated without
synchronizing the older design summary. Workaround: read controlling D05.

## Correction and verification

The single design row now agrees with D05, including the personal scope,
percentage-point unit, growth, cap and unlock. The inventory leaves
`review-needed` for its existing bounded-functional disposition. Documentation
validation checks all 213 unique IDs, only the Cold Mastery inventory row changed,
and the linked D05 evidence. No gameplay/data/save source changed. Existing five
Cold Mastery regression files and historical RED/GREEN evidence are preserved;
no new runtime test is warranted for a documentation-only synchronization.

Independent current-head runtime QA, earned class/build comparisons and final
balance acceptance remain open. The provisional growth is not prior approval
or a final balance result. See the independent review addendum in
`docs/plans/evidence/p07-cold-mastery.md`.
