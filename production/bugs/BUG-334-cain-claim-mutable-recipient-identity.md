# BUG-334 — Restore the immutable Cain reward recipient

- **Severity:** High
- **Status:** Fixed locally; final combined full suite passed.
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus uncommitted Cain card.
- **Environment:** Vitest 1.6.1 / jsdom; no viewport/locale dependency, RNG or genuine gameplay.
- **Affected systems:** frontend-dev / Cain Claim and mercenary reward transaction.

## Reproduction

1. Construct validated Cain completion and field the native Inner Sight rogue.
2. Subscribe to hero XP, merc XP, or claimed-flag publication.
3. Rename the captured original recipient object and throw. Also test renaming it to an unrelated owned merc's ID, and reintroducing the detached original after merc XP.
4. Claim the main Cain reward and inspect the participating stores and retry.

## Expected

Return `grant-failed` after exact scoped restoration: one original recipient, original XP, unchanged unrelated merc, no duplicate actor, and a safe retry.

## Actual

All four regressions throw `Cain Claim restoration failed`. After merc XP, the original actor has been replaced by a grown actor. Rollback filters the renamed original's mutable ID, leaves the grown actor under the original ID, inserts another original-ID actor, and uses the wrong progress key. Renaming to an unrelated merc's ID can remove that unrelated merc. Earlier failure can restore values but falsely fail verification against the mutated ID.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-1sjuc_zy/recipient-identity-red.log` and original receipt: 18 tests, 14 existing controls pass, all four new causal regressions fail. The scratch service is the unchanged production implementation with only its relative publication-helper import mapped to the same production module. No source was changed during the live full run.

## Root correction

Capture the immutable recipient ID and track original and privately prepared published actor references. Apply the already preflighted native growth/progress result through a publication whose actual actor reference is known before observers run. Verify identity/reference uniqueness on success, restore only known recipient copies and the original progress key, and preserve unrelated mercs even when an observer assigns their ID to the target.

The existing silent-merc-XP failure test should keep its exact refusal and whole-state assertions, injecting failure at the new store publication boundary instead of the no-longer-used action call. This preserves the same behavioral proof.

## Local correction and current validation

Immutable recipient ID and original/prepared-published references now govern publication and restoration. All8 expanded causal regressions fail against the original and pass with14 prior controls (22 total). Prepared XP growth matches native calculation; final typecheck/lint and independent source review pass.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
