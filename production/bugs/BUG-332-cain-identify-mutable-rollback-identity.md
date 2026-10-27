# BUG-332 — Restore Identify by immutable selected identity

- **Severity:** High
- **Status:** Fixed locally; final combined full suite passed.
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus uncommitted Cain prerequisite; Identify service is task-local scratch only.
- **Environment:** Vitest 1.6.1 / jsdom; no browser viewport or locale dependency; no RNG used.
- **Affected systems:** frontend-dev / inventory and Cain service transaction.

## Reproduction

1. Construct validated Cain completion and a claimed permanent entitlement.
2. Select an actual unidentified backpack weapon.
3. During inventory publication, an observer changes either the original selected object's ID or the published replacement object's ID and throws.
4. Invoke selected-item Identify and compare the complete participating stores with their pre-operation values.

## Expected

Return `grant-failed` after restoring the selected item exactly once with its original ID, preserving unrelated observer writes. Do not retain a renamed published copy.

## Actual

The published-ID case leaves an extra identified item under the renamed ID. The original-ID case leaves duplicate original IDs and throws an `AggregateError` because restoration verification cannot resolve the target.

## Evidence

Task root: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-identify-9029ruba`.
`renamed-target-red.log` and `renamed-target-red-receipt.json`: 25 tests, 23 passed, both identity-mutation regressions failed (exit 1). Tests: `cainIdentify.test.ts`, “restores a target whose published-id/original-id changes during publication without leaving a duplicate”.

## Root cause and planned correction

Rollback filters and verification reread mutable `item.id` and recognize only an ID. Capture the immutable preimage ID, also recognize the original and published object references across ownership locations, and verify that neither renamed target reference survives restoration. Never remove unrelated items merely because they share an observer-assigned new ID.

Independent review also found that a silent observer can rename the detached original and put it back in stash while the valid identified replacement remains in backpack. `silent-original-red.log` reproduces an incorrect `ok` result (26 pass / 1 fail). Verify both known references across all locations on the success path too; ownership by the original ID alone is insufficient.

## Local correction and current validation

Immutable preimage ID plus original/published references now govern success and scoped restoration across ownership locations. Renaming, collision and silent-original reinsertion regressions pass; final integrated browser8/8 and independent source/evidence review approve.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
