# BUG-341 — Bind Claim to its original merc recipient and verify its commit

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — Claim can retarget XP or pay again after a lost claimed flag.
Owner: root quest integrator / engine-dev.
Affected systems: shared quest Claim used by the planned Countess reward bundle.

## Reproduction

Base `b7bf3595912f7c461ad825382c989baaa91b8adc` plus the uncommitted pure
Countess contracts (no Claim source edits). Vitest1.6.1/jsdom, deterministic
constructed store fixtures; browser/locale and combat RNG not applicable.
Use the actual Den of Evil500XP bundle to reach shared Claim independently of
the unfinished Countess encounter. No earned gameplay or Countess acceptance
is represented by these fixtures.

1. Complete the canonical Den of Evil row and field an owned Rogue.
2. Subscribe to hero XP publication and synchronously field a different owned
   Rogue before the merc XP step. Claim the real quest.
3. In an independent fresh case, replace markQuestRewardClaimed with a silent
   no-op, leaving all native XP and reward effects active. Claim the quest.

Expected: the pre-publication merc receives375XP and the replacement receives
none. A missing claimed-last publication returns grant-failed after restoring
the participating bundle, permitting one subsequent successful retry.
Actual: the first original merc remains at216 cumulativeXP instead of591;
Claim retargets the currently fielded merc after the hero observer. The second
Claim returns ok although the claimed marker was silently lost.

## Evidence and cause

`shared-claim-boundary-red` exits1:2 failing reproductions/1 passing native
control. The control confirms500hero/375merc XP and write-free repeated Claim.
The original source/test/log/process/receipt are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/`.
Root owns verified retention/exact cleanup after dependent consumers finish.

claimReward captures fieldedMercId before writes but uses it only for the
mercenaryUnlock branch; other quests resolve the fielded merc again after
heroXP publication. The shared path also trusts markQuestRewardClaimed without
verifying the resulting row. Correct these upstream boundaries and retain
existing whole-bundle preflight, private seed, rollback and exclusion locks.
This reproduction does not establish additional rollback defects or complete
Countess functionality.

## First correction verification

The three new causal cases pass after recipient capture and claimed-last
verification. The broader278-case run has275passes/3failures: existing merc
rollback tests inject faults through shareExperienceWithFielded, which the
initial direct-addExperience correction bypassed. Preserve the existing shared
XP boundary with an optional captured recipient (explicit null means no merc),
then rerun these original failure/rollback/persistence cases unchanged.

## Final correction

Shared merc XP accepts the captured original recipient through its existing helper, preserving the established fault-injection/rollback boundary. Claimed-last publication is verified before success. Regressions: src/features/quests/claimReward.boundary.test.ts and existing quest Claim/merc rollback cases in the passing356-test native/source/Claim group.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

## Full-suite test-contract regression

Original full run9837 terminated1 after1475.69s:966files pass/1fails;
20,423tests pass/1fails/2existing opt-in skips. The sole failure is
`src/features/quests/sunReward.test.ts:67`: its spy requires the old
`shareExperienceWithFielded(4500)` argument list while Claim now passes
`(4500, capturedMercId)`. This is a stale interaction assertion, not a
wrong XP amount: the test still independently checks the native3375XP
outcome. The helper's public optional captured-recipient contract and
actual observer-swap regressions establish why the second argument is
required. Correct the exact expected arguments to4500and the hired ID;
retain all state assertions and do not revert the recipient fix.

Evidence: `final-full.log`, `final-full-receipt.json`, and unchanged-input/
protected-fixture `postterminal-input-fixture-rehash.json` in the same
task evidence directory. Root owns archival/cleanup after correction.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.
