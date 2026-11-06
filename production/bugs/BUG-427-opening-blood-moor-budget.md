# BUG-427 — Fresh builds cannot clear the opening Blood Moor challenge

Status: first-success correction verified locally; full opening progression remains open. Severity: high (earned progression/onboarding).
Build: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce + uncommitted private-v1 work.
Environment: WSL/Linux, Node24.21.0 production-store campaign runner; no browser/viewport dependency; zh-CN save, both locales affected.
Seed: native fresh creation at fixed Date1793304000000; challenge ordinal0, runSeed2601641432. No supplied/selected RNG seed.

## Reproduction

1. Run existing tests/campaign/run.mjs with CAMPAIGN_PHASE=intro, CAMPAIGN_RECOVERY=none and the14 core profile IDs.
2. Create each class through createCharacter, hire the free native Inner Sight Rogue, spend only the one actual starting skill point under the frozen profile policy.
3. Start Blood Moor through native admission. Settle each wave once; stop on first nonwin.

Expected: every class can obtain its first victorious encounter and earned upgrade opportunity; the opening challenge supports earned progression. Acceptance contract requires first success within5minutes, without injected power.
Actual:9/14 profiles lose W1;5 win W1 then lose W2. No profile clears the3-wave introductory challenge. W1 has8 L2 enemies (6Fallen/2QuillRats); L1 Sorceress has120HP,Attack22,Defense20. Fallen has37Attack/12Defense/34–50HP. The early-game32/+5 attack recommendation was justified against solo/3-pack examples, not current8–20-body waves. Starter level-ineligible grants are an additional observed concern, not yet the proved sole cause.

Evidence: docs/plans/evidence/p15-current-payloads-intro.md; external packet p15-current-payloads-intro-v1 contains14 exact reports and compressed journals, execution.json and wrapper exit receipt. All14 technical checks completed, source/data/campaign manifests unchanged. Amazon-javelin dirty Git inventory alone gained the prior BonePrison evidence document during the run; runtime manifests remained exact.
Affected systems: game-designer/level-designer/content-designer/engine-dev/qa-engineer. Root owns diagnosis/fix in retained worktree; no other writer.
Workaround:5 profiles can farm W1 then flee, but that does not establish an affordable route for the other9 and is not acceptance.
Next: isolate pack attack/armor budgets using original first-wave inputs and fixed diagnostic seed grid, then record a coherent numeric contract before production edits. Preserve all nonwins. No full balance/pacing acceptance from this single-seed14-profile screen.

## Local first-success outcome

Fallen20/QuillRat17/Zombie18 base Attack preserves all growth/other fields. Genuine native9FAIL/5PASS →14PASS; final539consumer cases/types/lint/build and two fresh public production-browser checks pass. All14fresh cases now earn first-wave160XP/L2, but all still lose W2. One real cold route wins40first-wave farms, reachesL6 through earned progress, wins DenW1/W2 and loses DenW3. The hero enters W3at49/180HP and dies to physical16 plus Arcane38; not OOM. Full evidence/failed attempts/cleanup: docs/plans/evidence/p15-opening-monster-budget.md. No all-class/full-map/balance/pacing acceptance; continue earned elite/attrition diagnosis.
