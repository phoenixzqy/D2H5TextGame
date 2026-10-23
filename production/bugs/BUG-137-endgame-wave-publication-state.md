# BUG-137 — Reject foreign endgame ownership at every wave publication

Status: fixed in local unpublished native integration; final validation passed.
Severity: High — later-wave publication incorrectly admits changed authority.
Owner: engine-dev / root integrator; QA regression.

## Reproduction

Base52ad707 plus native endgame integration. Linux Node/Vitest, simulated DOM;
no browser viewport or locale behavior involved. Seed is the production-issued
endgame seed970523381 for fixture hero `native-endgame-hero`, Ashen, attempt0.

1. Run `src/stores/combatHelpers.endgame.test.ts` with Vitest.
2. Enter Ashen and accept actual first-wave victory through playback.
3. In second-wave publication, replace map.endgame with an equal-valued foreign
   object after publishing the captured combat payload.
4. Observe the exact-state authority assertion.

Expected: retain the foreign state, enter receipt conflict, and refuse publication.
Actual: `advanceWaveOrFinish` returns next-wave and promotes the receipt.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7/native-boundaries-red.log`:1failed/20passed.
Regression: `src/stores/combatHelpers.endgame.test.ts`, rejects foreign state at
next-wave publication before settlement can become payable.

Cause: the receipt observer classifies only new-run entry intents. Later waves
and replays have no entry intent and skip durable-state reference observation.
Affected systems: recorded wave receipt / native endgame publication.
Workaround: abandon transient combat and restore a validated saved state; never
overwrite an unknown reference or infer committed ownership from equal values.

Review also identifies predecessor rebinding before replay/awaiting-next-wave
staging. Equal foreign live state must not replace the committed predecessor
reference. Regressions exercise both helper paths and direct replay receipt
preparation. Preserve the predecessor reference in the sole receipt authority.

## Resolution and validation

Every endgame publication now observes its exact captured durable state. Replay and next-wave staging additionally require the predecessor receipt’s committed reference; direct receipt preparation enforces the same continuity.

The native regression file passes28/28; final complete suite11161/414files
passes with2existing skips. Typecheck/full lint/build/bridge scan pass.
See [native evidence](../../docs/plans/evidence/p18c-endgame-native.md).
Browser/UI and earned/balance acceptance are outside this correction.
