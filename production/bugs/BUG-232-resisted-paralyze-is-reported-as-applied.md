# BUG-232 — Report Paralyze only when its application succeeds

Severity: Medium. Status: locally fixed and verified; independent/earned acceptance open.
Owner: root (engine/log feedback); independent QA open.

## Reproduction

Source `812dc76a` plus the working BUG231 chain fix. Node/Vitest native
Sorceress/production combat, seeds7and19. Browser/viewport/locale not needed;
the same emitted event drives both translated combat logs.

1. Give the synthetic Sorceress legal rank1 Chain Lightning and one action.
2. Give the only living enemy an active Paralyze residual marker until5000ms.
3. Cast at1700ms and inspect actual status snapshots and status-log events.

Expected: a resisted repeat application leaves no Paralyze and emits no
successful-affliction event. Direct damage and one25MP payment still settle.
Actual: the state correctly rejects Paralyze for both seeds, but one successful
Paralyze status event is emitted anyway. Two causal regressions fail;86controls
pass, including the independent seeded acceptance decision and actual state.

Evidence: `src/stores/sorceress-direct-lightning.causal.test.ts`, retained
`causal-matrix.log` and actual exit1 receipt in the final lightning packet.
Root cause: applyStatus returns only a unit, concealing its rejected outcome;
combat damage/debuff callers emit success unconditionally afterward.
Workaround: inspect the actual enemy status chip instead of trusting the log.

## Verification gap at reproduction

Pending an explicit application result with legacy API compatibility, truthful
event emission and actual native/focused/full regression proof. No tuning or
genuine campaign actions are authorized by this report.


## Delivered local repair

Source `c8510388a357151eb32df1e107fa0d2800136739`; final full15935/721/two existing skips, engine8018/300,
final types/lint/build and16production browser cases pass. See
[direct lightning evidence](../../docs/plans/evidence/d04-sorceress-direct-lightning.md)
for original REDs, actual native/control state and feedback, exact persistence,
all terminal failures/receipts and source delivery. Root author verification
only; independent design/QA and earned balance remain open.
