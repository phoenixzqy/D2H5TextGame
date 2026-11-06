# BUG-609 — Preserve the intended Act II safer-farm fallback

Status: locally fixed and verified; umbrella acceptance pending. Severity: Medium. Found: 2026-11-02.
Owner: root, campaign preparation controller and audit.
Environment: WSL/Linux native stores; branch `feat/playable-foundations`,
production authority77, campaign safe-training freeze v1. Browser/viewport and
locale are not involved; constructed settlement callbacks consume no combat RNG.

## Reproduction

1. Construct an earned-state controller fixture at level22 with Dark Wood and
   the first four Act II areas cleared; opt into `cleared-level-margin-v1`.
2. Run whole-challenge Act II preparation. Settle its first training admission
   in Dry Hills as a defeat, then settle subsequent admissions as victories.
3. Inspect the following training sources before the next route victory.

Expected: the existing declared Dark Wood fallback persists until a route
victory, while every admission still obeys prior-clear custody and the complete
challenge maximum <= entry level minus2. A route victory resumes ranked
selection. All original admission, XP, retry and nonwin limits remain in force.

Actual: the next loop replaces `farm = safeFarm` with the strongest eligible
source. It retries Dry Hills immediately. The audit repeats the same selection
and accepts a consistently relabeled non-fallback source. Three constructed
losses all retry Dry Hills instead of using Dark Wood for losses2–3.

## Evidence and cause

`tests/campaign/act2-area-preparation.regression.test.ts` contains three RED
reproductions: persistent fallback/reset, consistently forged source custody,
and the unchanged three-consecutive-loss stop. Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`
`p15-act2-training-fallback-red-v1.json` and corresponding log/exit receipt.

`runAreaPreparedActTwo` and `auditActTwoAreaPreparation` unconditionally apply
ranked selection under the intended policy, overwriting their existing fallback
state. The original requirement is in `docs/plans/p15-act2-area-preparation.md`.
The newer margin requirement constrains source eligibility; it does not justify
discarding the original loss recovery behavior.

Plan review: ready. Track fallback state until route victory in both controller
and independent reconciliation; restrict eligible prior clears to Dark Wood
while fallback is active, stopping before admission if it is ineligible.
Security check: pass; local authored test-controller change, no dependencies,
networking, credential handling, publication or privileged operations.

This finding does not establish a production combat defect or resolve BUG608.
No failed diagnostic history may be extended or its costs erased.

## Local correction and verification

Controller and auditor now retain explicit fallback state after a training
nonwin, restrict eligible prior clears to Dark Wood while active, and clear it
only on route victory. If Dark Wood fails the complete-challenge margin, stop
before admission. Historical policies and all retry/admission limits remain.
All40 affected cases, scoped strict types and explicit lint pass. Evidence:
p15-act2-training-fallback-green-v1.json, -types-v1-exit.json,
-lint-v1-exit.json and -policy-freeze-v1.json in the retained packet above.
Production authority77/2142 inputs unchanged; exactly two campaign files change.
This correction is separate from the open earned-survival finding BUG608.
