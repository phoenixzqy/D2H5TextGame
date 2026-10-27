# BUG-324 — Require native living-hero success in the P15 screen

Status: Fixed locally; independent code-review finding in the uncommitted P15-S01 harness
at integration base `276101d4`.
Severity: Medium — diagnostic results can overstate a win; gameplay is unchanged.
Owner: root simulation integrator / reviewer.

## Reproduction

Environment: Node production-service screen; browser, locale and combat seed
are not relevant to the outcome-classification branch. No genuine save action.

1. Inspect `p15-build-screen.ts`'s outcome/TTK and completeVictory predicates.
2. Supply the valid engine boundary `winner: 'player'` with the original hero
   dead and a surviving mercenary. Native settlement rejects it as defeat.

Expected: retain the engine winner, report native failure, omit victory-only
TTK and require final native `victory` plus living-hero wins for a full clear.
Actual: the first harness counts every engine team win as victory and can
   set completeVictory even when native settlement returns defeat.

Evidence: independent P15 source review; native guard in
`src/stores/combatHelpers.ts` around lines1006–1012. Original benchmark/screen
code and outputs are retained under the task-owned external evidence root.
No observed candidate hero death is asserted from this source finding.

Root cause: confusing engine team winner with the production campaign success
contract. Workaround: inspect original-hero life and native settlement manually.

Correction: `observeP15Wave` requires the original hero alive plus accepted native
settlement for a victory/TTK; `isP15CompleteVictory` additionally requires final
native `victory`. Regression: `tests/sim/production/p15-build-screen.test.ts`
covers surviving-mercenary/dead-hero and final-settlement rejection boundaries.
Causal RED is retained; final focused11/11 pass. Independent bounded source
re-review approves; no independent runtime QA. Commit pending integration.
[Evidence](../../docs/plans/evidence/p15-act5-sorceress-screen.md).
