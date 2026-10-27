# BUG-337 — Remove the unused React import from the promoted integration test

- **Severity:** Low (test-only static failure)
- **Status:** Fixed locally; final combined full suite passed.
- **Build:** `40bb9c35408c24fd25ea5d8dde69df6f6f37b184` plus combined Cain/Identify source.
- **Environment:** TypeScript strict / automatic JSX transform; no browser, viewport, locale or RNG dependency.
- **Affected systems:** QA / Identify Town integration fixture.

## Reproduction

1. Promote the actual Town integration test from the retained causal fixture.
2. Run `npm run typecheck`.

## Expected

The promoted test typechecks with the repository's automatic JSX transform and unused-import rule.

## Actual

TS6133 at `src/features/town/CainIdentify.integration.test.tsx:2`: the default `React` import is unused. It was not included in the scratch service/panel typecheck. All four actual integration runtime cases pass.

## Evidence

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-1sjuc_zy/combined-types.log` and original receipt, exit2. The combined focused suite passes 593 cases / 30 files.

## Correction

Remove only the unused import; preserve every integration step and assertion. Validate the final repository source, retaining this original failure.

## Local correction and current validation

Only the unused React import was removed from the promoted integration test. Final whole typecheck63276/lint17577 both terminate0; the593 focused runtime tests and production build/browser inputs are otherwise unchanged.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
