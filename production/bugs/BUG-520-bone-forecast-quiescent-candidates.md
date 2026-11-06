# BUG-520 — Quiesce forecast combat stores before a second restored candidate

- Severity: Low; new external diagnostic driver only, no observed game UI defect.
- Status: Locally fixed and verified in external forecast v2/v3; no production code change.
- Owner: root, Bone campaign forecast orchestration.
- Environment: Node24.21.0/Vite SSR in WSL; HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local implementation.

## Reproduction

Run p15-bone-owned-area-forecast-v1.ts against the exact earned Bone12/next107
source with three candidates. The first candidate admits/simulates without
settlement. The next iteration aborts the lifecycle but leaves combatStore
inCombat true; restoreEarnedSave refuses with Earned restore requires quiescent
service stores. Wrapper p15-bone-dark-wood-owned-forecast-run-v1 exits1 in5.22s.
No native reward/clear/reset is applied. The final store restorers run.

## Expected and root cause

Between restored diagnostic candidates, abandon the run and call the existing
native Return-to-map cleanup before restoring the save. Run-lifecycle cleanup
alone does not quiesce the service stores. Retain the original failed driver/log;
new v2 uses the same already-reviewed cleanup order as the reusable Barbarian
forecast. Add per-candidate output so a later diagnostic failure retains results.

## Validation

Scoped strict types/lint pass for v2 and v3. Exact-source v2 completes all three candidates in6.51s; v3 completes both Diamond candidates in6.58s. Both reports have unchanged before/after source state and no native campaign rewards. Their gameplay losses are retained diagnostic results. All wrapper receipts are terminal, with no descendants or task Vite caches remaining. Original v1 driver, log and exit1 receipt remain retained. Evidence
under /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
No broad test, previous campaign, engine API or production behavior is affected.
