# BUG-394 — Preserve Cow native outcome authority

- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
Severity: High. Owner: root / engine-dev; independently reproduced by qa-engineer.

## Reproduction

- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus unpublished batch changes.
- Environment: WSL, installed Vitest UI project; browser/viewport/locale not involved.
- Seed: 7.
1. Arrange a legal opened Cow portal and a level1 hero with life1 and attack1.
2. Start the actual manual Normal three-member Cow encounter; confirm the real
   native outcome is enemy victory and the original hero is dead.
3. After playback, mutate the published outcome in place to player victory,
   original hero life1 and the original three enemies life0.
4. Call the real advanceWaveOrFinish settlement.

Expected: defeat, no XP/items/currencies or Cow victory receipt; portal retryable.
Actual: victory; the mutable outcome supplies income/proof authority.

## Evidence and cause

Retained packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
Actual native RED: cow-native-outcome-integrity-review-red-v1.log and its source-bound
exit receipt. Regression: src/stores/cow-native-independent-review.test.ts.
Original Cow bodies are bound from private input, but settlement has no private
native-result witness captured before callbacks/public playback.

## Resolution

Captured and bound the actual native result before callbacks, required its
unchanged qualification before Cow native income/proof, and retained exact
original-body qualification. Cow focused settlement/staging/receipt checks pass.
Independent review cow-native-witness-independent-review-v2.json approves the
fix with5actual controls including callbacks and mid-settlement compensation.
No commit/publication has been made.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
