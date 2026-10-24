# BUG-140 — Require saved-state recovery after unverifiable achievement rollback

Status: corrected locally after ff47a50; focused and complete local integration checks pass; earned acceptance remains open.
Severity: Critical — partial reward state can be saved or granted again.
Owner: root integrator / engine-dev; QA regression.

Environment: Node/Vitest simulated DOM, locale en; viewport and combat seed do
not affect this synchronous store transaction. Uses campaign-qualified two-modifier
achievement eligibility from the endgame test helper, without a browser run.

1. Save an eligible, unclaimed character with an empty material bag.
2. Publish the achievement materials and flag, then throw from the flag setter.
3. Refuse material restoration while allowing flag restoration.
4. Try Claim and Save again.

Expected: attempt both restorations, verify both original references and, if
restoration cannot be verified, block Claim and saving until a saved-state restore.
Actual: material gems stay live and the flag restores false; the transaction
throws but hydration remains ready and saving/repeated Claim remain enabled.
Silent refusal or equal replacement during either restoration is also unchecked.

Evidence: `claim-rollback-red.log` (5 failed / 8 passed) at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Regression: `src/stores/endgameActions.test.ts`, throwing restoration and four
silent-refusal/replacement cases across both participating slices.

Cause: rollback collects setter exceptions but neither verifies final identity
nor enters the existing recovery barrier before releasing material ownership.
Follow-up reproduction: a throwing save-status subscriber interrupts the shared
recovery helper before hydration enters error. `claim-recovery-observer-red.log`
records this independent remaining failure (1 failed / 14 passed). Both recovery
notifications must be attempted independently before errors are reported.
Workaround: restore the last saved state; do not retry against damaged runtime.

## Correction and validation

Keep material ownership through both restoration attempts and reference checks.
On any error or mismatch, call the existing `blockSavesForRecovery` barrier
before ownership release. Preserve the publication cause and restoration errors.
Verify the disk save stays intact, Claim stays refused, and a complete saved-state
restore permits exactly one successful Claim.

Both recovery notifications now run independently. Final focused validation
passes 53 tests in four files (Claim, material actions, persistence and current
campaign titles); scoped lint passes. Independent residual source review clear.
Causal failed attempts and final logs remain in the evidence directory above.
The surrounding EndgamePanel and combat/title UI are now implemented locally.
The combined combat/endgame/map controls pass94/5 after correcting BUG141.
Final local Claim/UI integration passes11203/419 unit tests plus two existing skips,
typecheck, lint and production build. Constructed bilingual browser matrix10/10
and independent bounded evidence review pass; earned acceptance remains open.
