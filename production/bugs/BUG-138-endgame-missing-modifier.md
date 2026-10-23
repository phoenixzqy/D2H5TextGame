# BUG-138 — Keep missing endgame modifiers out of area admission

Status: fixed in local unpublished native integration; final validation passed.
Severity: High — malformed dungeon entry can start an unintended campaign run.
Owner: engine-dev / root integrator; independent technical/QA review.

## Reproduction

Base52ad707 plus current native integration. Linux Node/Vitest simulated DOM;
browser viewport/locale not involved. This fails before intended endgame seed
issuance; erroneous ordinary fallback uses its area/time seed.

1. Run the missing-modifier regression in combatHelpers.endgame.test.ts.
2. Use a source-qualified campaign hero, Normal and canonical Blood Moor.
3. Invoke startEndgameRun with an undefined runtime argument.

Expected: reject Unknown endgame modifier before simulation, counter mutation
or run installation. Actual: undefined selects ordinary admission. With the
initial Nightmare/no-area fixture this raises the unrelated canonical-area
error; the strengthened Normal/Blood Moor regression detects actual admission.

Cause: optional string undefined doubles as both area-kind discriminator and
missing endgame input. Pass an explicit endgame request wrapper instead.
Affected systems: combat helper admission API.
Evidence: root-owned native-continuity-red.log and
native-continuity-red-exact.log under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Workaround: always choose an explicit approved modifier through the intended
UI; do not rely on the static TypeScript argument type for runtime admission.

## Resolution and validation

An explicit endgame request object separates the requested run kind from its modifier value. Undefined runtime input reaches endgame validation and refuses before any ordinary area admission or simulation.

The native regression file passes28/28; final complete suite11161/414files
passes with2existing skips. Typecheck/full lint/build/bridge scan pass.
See [native evidence](../../docs/plans/evidence/p18c-endgame-native.md).
Browser/UI and earned/balance acceptance are outside this correction.
