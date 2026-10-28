# BUG-342 — Verify Countess settlement context before publishing durable victory

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — the new source lacks its required victory/transaction contract.
Owner: root quest integrator / engine-dev.
Affected systems: accepted Countess playback, native payout, source proof and finite legacy repair.

## Reproduction

Base b7bf3595912f7c461ad825382c989baaa91b8adc plus the uncommitted Countess
entry/binding slice; Vitest1.6.1/jsdom, deterministic seed7 and constructed
high-stat gear. Browser viewport and locale do not affect these store tests.
No earned gameplay or historical replay.

1. Track Countess in canonical Normal/manual Dark Wood and explicitly enter
   act1-dw-countess. Verify its actual one-boss level13 source and native win.
2. Finish recorded playback. During native hero XP publication, silently mutate
   the original Countess objective in place, change location, or change difficulty.
3. Attempt accepted settlement.

Expected: changed pre-income source/context is detected, every participating
native payout/source slice is deeply restored while unrelated writes survive,
and the receipt enters a stable settlementFailed state under both exclusion locks.
Actual: each of the three reached XP observers changes context without a
settlement refusal. A normal uncontested win also lacks the required durable
Countess objective/action proof, so claimed-history repair cannot finish.

## Evidence and limits

source-settlement-stage-red:6failures/18passes across24real Countess API cases.
native-transactions-stage-red:9failures. Only the3XP-context injections reach
their fault boundaries at this stage. Five proof-publication/rollback cases
cannot reach their injected faults because proof is not implemented; the ninth
case fails the positive proof assertion. Do not claim those five publication or
restoration defects reproduced yet. Original logs/source/process/receipts are
retained in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/.
Root owns verified retention/exact cleanup after dependent consumers finish.

Entry15selectedcases, receipt230cases and Claim/merc/pure362cases pass;
independent review approves only those bounded slices. Implement the reviewed
Countess-specific deep scoped transaction, activate only its finite native23
proof graph, and verify exact completion/Claim symmetry without granting
legacy receipts, replay credit or ordinary area progression.

## Final correction

Accepted original-source settlement now verifies the captured context at each publication, deeply restores scoped participants, aggregates restoration failures and publishes only the exact current23 proof. Completed/claimed legacy rows explicitly earn missing proof without repeating quest reward. Regressions: src/stores/countessSettlement.test.ts and countessGearRollback.test.ts. Failed settlement restores the captured whole combat log; unrelated observer log writes may therefore be replaced, a disclosed bounded limitation.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.
