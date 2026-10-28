# BUG-338 — Execute the explicitly selected Countess source

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — the approved optional Countess path is unavailable.
Owner: root quest integrator / engine-dev / content-designer.
Affected systems: run admission, original-source settlement, quest Claim and map UI.

## Reproduction

Commit `b7bf3595912f7c461ad825382c989baaa91b8adc`; Vitest1.6.1/jsdom,
constructed API state (no browser viewport or earned gameplay); locale default
zh-CN; run seed7. Original `source-api-red` exits1:20 failures/4 controls.

1. Set hydration ready, create a hero and track `quests/act1-forgotten-tower`
   inProgress/unclaimed in canonical Dark Wood without an area clear.
2. Call `startSubAreaRun` with act1/manual/Dark Wood and the explicit runtime
   option `questEncounter:'act1-dw-countess'`.
3. Independently test wrong mode/area/encounter and missing quest eligibility.
4. Construct a flag-only completed row with no victory receipt; call canClaim.

Expected: one level13 boss-tier Countess from the exact selected quest source;
invalid requests refuse without mutation; only accepted original-source victory
can prove completion or enable the first Claim. No ordinary ordinal or area clear.
Actual: the unrecognized option is ignored and starts the ordinary five-wave
challenge; multiple invalid requests mutate state instead of refusing. A legacy
flag-only completion can Claim without new proof. Actor-substitution assertions
cannot yet reach Countess because the selected encounter is absent.

## Evidence and cause

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/`
contains `countess-red.test.ts`, `source-api-red.log`, process and receipt.
Root owns this evidence through implementation/review, then verified retention
and exact cleanup. The current start API has no selected quest encounter option,
planner/source binding or accepted settlement proof. Implement the approved
[D11 contract](../../docs/plans/decisions/D11-act1-remaining-quests-v1.md)
with immutable original actors and scoped transactions; accepting generic kills
or changing ordinary Dark Wood composition would not implement the contract.

No player workaround; no deployment or genuine-save changes occurred.

## Receipt boundary reproduction before integration

`receipt-source-red` exits1 with3failures/1ordinary-receipt control. The
current holder retains future Countess metadata by reference, accepts it on
an ordinary area origin, and accepts an unknown optional quest origin. These
are missing new-contract boundaries, not an already-live Countess proof
exploit. Preserve privately copied/frozen original IDs and trusted finite run
identity; reject foreign admission and strip it for explicit replay. Logs,
source and terminal process/receipt are in the same Countess evidence root.

## Final correction

Source admission, immutable receipt and original-source proof now execute through the explicit manual Countess path. Replay strips admission; malformed/ordinary sources refuse. Regressions: src/stores/countessSource.test.ts, src/stores/countessReceipt.test.ts and src/engine/combat/countess-planner.test.ts.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.
