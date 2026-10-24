# BUG-142 — Restore Blood Lord and Frozen Terror elemental actions

Status: corrected locally after ff47a50; causal regression and complete local integration checks pass; balance remains open.
Severity: High — both endgame modifiers omit their promised elemental interaction.
Owner: root integrator / content-designer / engine-dev; QA regression.

Environment: local production build after ff47a50 plus uncommitted Claim/title UI;
headless Chromium, English, 360×640. Native engine regression uses factory and
battle seed142, level90 trash, default registry and a constructed passive tank.

1. Import the explicitly constructed endgame input recorded in the evidence root.
2. Enter Ashen Trial and Glacial Trial; complete four native waves using Skip.
3. Inspect Blood Lord and Frozen Terror actions in the actual combat logs.
4. Reduce to the canonical monster factory and recorded native battle at seed142.

Expected: Blood Lords use Fire Breath/fire/Ignite and Frozen Terrors use
Frost Aura/cold/Chill. Both use Strong Melee while their elemental skill cools down.
Actual: every recorded action is Strong Melee; neither elemental skill casts.

Cause: both canonical skill arrays put zero-cost, one-second-CD Strong Melee
first. Attack speed110 produces a1620ms action period, so melee is eligible at
every selection and starves the later three-second elemental skill.

Evidence: `claim-ui-screen2-results.json`, `claim-ui-screen2.log` and
`claim-ui-browser-screen2-evidence/en-360x640.json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7`.
Regression: `src/engine/combat/act5-elemental-priority.test.ts`.

Correction: prioritize the existing elemental skill in exactly these two rows.
No change to AI, stats, cooldowns, memberships, skill implementations or the
endgame factory. This also changes their canonical Act V appearances. Earlier
melee-only browser evidence cannot prove the promised modifier mechanics or
updated Act V pacing. No balance certification follows.

Workaround: none through ordinary player actions.

Validation: `elemental-priority-red.log` records both native cases failing with
only melee at1620/3240/4860ms. After the two canonical list reversals,
`elemental-priority-green.log` passes2/2, including real damage, Ignite/Chill,
melee during cooldown, deterministic replay and input immutability. The final
typed focused rerun2/2, complete engine5449/161, types/lint/build and corrected
production browser10/10 pass. All ten bilingual/viewport cases require actual
elemental casts/statuses. Final standalone full unit11203/419 plus two existing skips passes
(`claim-ui-layout-full.log`); independent bounded matrix evidence review ADEQUATE.
