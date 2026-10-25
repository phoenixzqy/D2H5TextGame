# BUG-231 — Make Chain Lightning bounce to five distinct enemies

Severity: Medium. Status: locally fixed and verified; independent/earned acceptance open.
Owner: root (engine/content/frontend); independent design/QA open.

## Reproduction

Source `812dc76a`, Node/Vitest production registry and native Sorceress
projector. Seed7; browser/viewport/locale not needed for this engine repro.

1. Give a synthetic L30 Sorceress legal prerequisites and Chain Lightning
   rank1/2/20,100MP and one action.
2. Place twelve living enemies in four rows of three.
3. Repeat with enemies separated by three rows.

Expected: the bilingual player description's chain bounces between up to five
distinct living enemies; the design table also promises five targets.
Actual: only three enemies in one row receive attempts, or one enemy in the
separated fixture. All four native regression cases fail.

Evidence: `src/stores/sorceress-direct-lightning.causal.test.ts` and retained
`targeting-red.log`/actual exit1 receipt in this batch's final evidence packet.
Root cause: authored/illustrative registration selects line-3; the targeting
resolver has no bounded chain ordering. Changing the prose or choosing another
small fixed footprint would leave the five-target chain unimplemented.
Workaround: none for reaching five distinct enemies in an ordinary 3-column row.

## Verification gap at reproduction

Pending actual chain selection, integration, public browser and regression proof.
No genuine campaign actions or skill verification credits occur at reproduction.


## Delivered local repair

Source `c8510388a357151eb32df1e107fa0d2800136739`; final full15935/721/two existing skips, engine8018/300,
final types/lint/build and16production browser cases pass. See
[direct lightning evidence](../../docs/plans/evidence/d04-sorceress-direct-lightning.md)
for original REDs, actual native/control state and feedback, exact persistence,
all terminal failures/receipts and source delivery. Root author verification
only; independent design/QA and earned balance remain open.
