# BUG-141 — Release completed encounter authority on explicit terminal exit

Status: corrected locally after ff47a50; focused and complete local integration checks pass; earned acceptance remains open.
Severity: High — returning from combat can start the wrong selected encounter.
Owner: root integrator / frontend-dev; QA regression.

Environment: Node/Vitest simulated DOM, locale en; no browser viewport claim.
The constructed high-power UI fixture completes real native recordings. The
failure depends on terminal receipt ownership, not a particular combat seed.

1. Complete the four-wave Glacial endgame trial.
2. Select Return to map or Return to town.
3. Mount ordinary `/combat` for the selected Blood Moor area.
4. Also exercise the reverse: complete ordinary campaign combat, return to map,
   then mount `/combat?endgame=ashen`.

Expected: explicit exit releases the completed run and receipt. Subsequent
entry admits the newly selected encounter and spends only its own ordinal.
Actual: the retained published receipt supplies the old origin. Dungeon exit
restarts the dungeon instead of campaign combat; campaign exit prevents the
explicit dungeon request from being selected.

Cause: terminal settlement clears the active run but retains its receipt for
terminal presentation/recovery. Return actions only clear combat presentation.
They omit the guarded explicit abandonment already used by Flee/Stop.

Evidence: `terminal-origin-red.log`, three causal failures and nine controls
passing, in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Regression: `src/features/combat/CombatScreen.endgame.test.tsx`.

Correction: both explicit Return destinations must abandon transient authority
before resetting playback and navigating. Refuse exit if abandonment is guarded.
New attempt must retain the captured modifier and publication Retry must retain
its exact receipt; neither operation is a terminal Return action.

Workaround: reload from the durable save before choosing the next encounter.
No earned-progression or browser acceptance follows from the constructed test.

Validation: causal RED3/12 precedes correction; combined combat/endgame/map
GREEN94/5 and scoped lint pass. Independent source rereview CLEAR. Final local unit11203/419 plus two existing skips, typecheck, lint and production
build pass. Constructed bilingual browser matrix10/10 passes with independent
bounded evidence review; earned campaign/endgame acceptance remains open.
