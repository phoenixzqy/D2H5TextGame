# BUG-139 — Observe repeated endgame entry failures for screen Retry

Status: fixed in local unpublished native integration; final validation passed.
Severity: High — repeated recoverable entry failure escapes screen recovery.
Owner: engine-dev / root integrator; QA regression.

Base52ad707 plus native integration; Node/Vitest simulated DOM, no viewport or
locale behavior. Fixture hero native-endgame-hero, Ashen attempt0, seed970523381.

1. Use source-qualified endgame state.
2. Start through the screen adapter with an entry setter throwing before write.
3. Explicit Retry the same receipt with another throw-before-write error.

Expected: adapter returns false, exact pending entry stays retryable, first
durable diagnostic remains, and current-attempt error is classified correctly.
Actual: the second error escapes the adapter because entry observation retains
the first diagnostic without publishing a fresh receipt view.

Evidence: root-owned native-screen-retry-red.log (1failed/27pass), under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Regression: combatHelpers.endgame.test.ts, reports each entry recovery failure
through the screen adapter while retaining the first diagnostic.
Affected systems: recorded receipt observation / combat screen transition.
Cause: unlike selection/publication observation, entry observation emits no
new view when an older publicationFailure already exists. Always observe the
current failed attempt while retaining the first stored diagnostic.
Workaround: direct recovery remains possible; do not re-prepare or repay entry.

## Resolution and validation

Entry observation publishes a fresh failed-attempt view on every failure while retaining the first diagnostic. The screen adapter can classify each current retry error without resimulation or another payment.

The native regression file passes28/28; final complete suite11161/414files
passes with2existing skips. Typecheck/full lint/build/bridge scan pass.
See [native evidence](../../docs/plans/evidence/p18c-endgame-native.md).
Browser/UI and earned/balance acceptance are outside this correction.
