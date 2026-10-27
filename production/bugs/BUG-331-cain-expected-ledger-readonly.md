# BUG-331 — Keep Cain expected-ledger updates compatible with readonly types

Status: Fixed locally; final combined full suite passed.
Severity: Low — test-only typecheck failure, no observed runtime failure.
Build: 40bb9c35408c24fd25ea5d8dde69df6f6f37b184 plus uncommitted Cain card.
Environment: Node/TypeScript local typecheck; browser/viewport/locale/seed not applicable.
Owner: Root; QA/frontend test fixture.

## Reproduction

1. Run `npm run typecheck` on the Cain static input snapshot.
2. Observe TS2542 at `src/features/quests/cainClaim.test.ts:140`.

Expected: The observer-write test can construct its expected ledger without
mutating a readonly record.
Actual: `structuredClone` preserves the readonly `QuestItemLedger` type, then
the test assigns an unrelated observer source through that readonly index.
The runtime test passes, but TypeScript correctly rejects the assignment.

Evidence: Task `d2h5-cain-1sjuc_zy/types-static.log` and original receipt
exit2. The simultaneous original full-static run was explicitly superseded,
with exact owned process IDs recorded in `full-static-superseded.json`.

Root cause: Expected-value construction introduced during lint repair retained
the source ledger's readonly index signature. Build the expected record with
an object spread containing the observer entry; keep all assertions intact.

Validation at reproduction: fresh typecheck, focused test/lint and full suite were pending; final results follow.

## Local correction and current validation

The expected ledger uses an object spread with the unrelated observer entry. Runtime assertions remain intact; final whole typecheck/lint pass.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
