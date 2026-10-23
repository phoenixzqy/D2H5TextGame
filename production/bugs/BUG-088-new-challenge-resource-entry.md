# BUG-088 — Start new challenges with designed full resources

Status: fixed locally; independent QA ADEQUATE. Severity: High.
Owner: engine-dev; GD/TD contract interpretation, QA verification.

Environment: source `85537b1`, Vitest/jsdom production-store integration;
locale/viewport independent. Original earned production-service route at
`e3bf53a` also shows the hero repeatedly entering with persisted pools while
the mercenary enters full. Browser UI verification follows the fix.

Reproduction (runSeed7, challengeOrdinal0):
1. Create a Sorceress; use an integration L12/Vit50/Eng40 fixture and equip
   a real cap with +50HP/+35MP. Persist hero pools5HP/7MP.
2. Start Blood Moor through `startSubAreaRun`, manual or idle.
3. Inspect the actually published first-wave hero, before playback.

Expected: runtime338HP/189MP under combat-formulas §2.1/§10.1, with persistent
pools unchanged. Actual:5HP/7MP. Saved0 or negative pools also enter unchanged.

Evidence: `src/stores/combatHelpers.entry-resources.test.ts`; genuine5RED/
2controls in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-challenge-entry-r7znpyb5/red.log`.
Frozen test, hashes and receipt retained there; root owns retention through
progression/C1 and removes after consumers finish.

Cause: `startSubAreaRun` uses the depletion-preserving adapter without applying
the fresh challenge resource policy. Keep the adapter for configuration/replay
and wave carry; fill only the new entrant runtime pools. The accepted
[contract](../../docs/plans/decisions/D04-D07-challenge-entry-resources-v1.md)
preserves persistent resources, recovery, startup payments and settlement.

Verification:7entry regressions and full8543tests pass; typecheck/lint/build pass.
Production-browser4cases prove full entry and save/reload preservation. One
approved earned route still loses Catacombs W4; no Andariel/campaign acceptance.
[Evidence](../../docs/plans/evidence/p14a03-challenge-entry.md).
