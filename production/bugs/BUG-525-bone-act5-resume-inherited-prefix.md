# BUG-525 — Validate the inherited prefix without excluding earned Act V proofs

Status: Fixed in task-local helpers (uncommitted; implementation HEAD unchanged)
Severity: Medium (task-local resume assertion; no combat or rewards consumed)
Owner: root / QA campaign helper

## Reproduction

HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty claimed worktree; Node24.21.0 native-store harness. Browser/viewport/locale not applicable. Exact source: `p15-bone-act5-initial-continuation-v1.json`, level50/XP363511/normal next1290/48 successful actions. No seed was admitted in the failed resume. Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Start `p15-bone-act5-resume-v2.ts` with the qualified Frigid policy and the verified Shenk/Siege successor.
2. The driver calls `assertActFourComplete`, a live pre–Act V check that requires an exact Act III/IV receipt set.
3. The valid Shenk proof makes that assertion fail before the first admission. Final report retains zero waves, rewards and new actions.

## Expected / actual

Validate the historical successful Act IV action prefix and its claimed quests, owned proof receipts and consumed sources. Bind the independent source readback to exact report bytes. Later earned Act V proofs must remain present. Actual: `AssertionError` reports the additional `quests/act5-siege-on-harrogath#action:shenk-victory` receipt.

## Evidence and scope

`p15-bone-act5-frigid-control-continuation-v1.json`, its `.log` and `-exit.json` retain original exit1 and terminal cleanup. The independent reader refuses that failed technical report; its refusal remains in `p15-bone-act5-frigid-control-readback-v1.log`. The prior independently passed next1290 source remains authoritative. Correct the task-local boundary, preserve failed driver bytes, prove no admission/income was consumed, then use the same exact earned source once. Do not filter live stores, relax the shared pre–Act V assertion or replay Shenk/Siege.

## Verification

Pending: exact no-admission readback, scoped types/lint and qualified native Frigid continuation. Full v1 remains incomplete.

## Fixed verification

`bug525-no-admission-readback-v1.json` proves the failed attempt is an exact no-op. Native v3 checks historical action/claimed-quest/proof/consumed-source prefix plus exact source/readback hash; shared pre–ActV assertion remains unchanged and no live graph is filtered. Current types-v4/lint-v4 pass. Native `p15-bone-act5-frigid-control-continuation-v2` reproduces the entire six-wave qualification, performs10new actions and stops at Crystalline defeat. Independent resumed readback-v2 passes all accounting/custody/quest/clock checks. Original exit1 and failed lint bytes retained.
