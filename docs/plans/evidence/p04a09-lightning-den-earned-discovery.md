# P04a09 — Earned Den screen after authored Act I Lightning

Status: failed bounded progression screen, 2026-10-22. Parent `dbd0821`.
The prior W2 defeat is now a verified W2 victory; W3 draws. Den, C0–C4/G0–G7
and private v1 remain unaccepted.

## Recipe and exact evidence

One fresh Sorceress, exactly40earned Blood MoorW1wins, unchanged earned upgrades,
L6Fire4/Frost2/Ice1/Warmth1,10Energy/15Vitality, ATK49/DEF51, HP120/190 MP102/137;
L9InnerSight Rogue with earned cap/gloves/boots. No extra acquisition, imports,
store/storage mutation, refill, alternative build, seed sweep or retry. Native
UI and timers; fixedDate2026-10-20T12:00Z/challengeordinal40.

[Exact spec](fixtures/p04a09-lightning-den-earned-discovery.spec.ts.txt)
SHA588ea504f1add5543d0633df6f5a6bd6fe331e580552a497895171ec17a1ed0d;
[exact config](fixtures/p04a09-lightning-den-earned-discovery.config.ts.txt)
SHA88805f08e0d6c0f94d6db373e91f80bed347f097baed773109d4517eeb6815b7.
[Machine evidence](fixtures/p04a09-lightning-den-earned-discovery.json) binds all40
prep summaries, earned Den input/W2award state, native openings/terminals, exact
receipts, readiness, runtime reuse and raw trace/report hashes. Prior failed
fixtures are unchanged. Runnable candidates are removed after byte verification.

## Validation and actual result

Parent source final integrated8376/262serialPASS; typecheck/lint/productionbuild
and all4JS-chunk bridge scan passed as qualified in P01e05B. New candidate
typecheck41.662s/lint19.689s/list5.863sPASS, listing exactly1test/1file. Producer
and QA approved exact-source readiness. Reused prior17.032sproduction build:
VITE_E2Eabsent,1093source/config inputs and760artifact files independently
verified, then rechecked unchanged after native. This is byte-equivalent runtime
reuse, not a new build at parent head. Tailwind TS config is included.

Chromium desktop1280×800/en, Playwright1.59.1, workers1/retries0/maxFailures1,
test240s/server30s/outer295s+5s hard cap. Sole attempt exit1/no timeout191.493s
wrapper/164.524s test/189.475s report; onefailed/zero skipped/flaky/retry0. The
maxFailures-stop diagnostic is not another attempt. Native browsererrors[].
Existing Node FORCE_COLOR/NO_COLOR warnings retained.

| Stage | Observed outcome | Award or remaining state |
| --- | --- | --- |
|40prep wins and unchanged upgrades|All assertions passed|Hero11080totalXP; bag337/shards5157 before Den|
|DenW1,9trash|Victory|+270hero/+202mercXP,4items/+133shards|
|DenW2,3champions+7trash|Victory|+400hero/+300mercXP,18items/+379shards/+1wishstone; hero57/190(30%),merc168/196(85.71%),MP137|
|DenW3,11monsters|Draw; first nonwin stops|Heroalive9.47%,MP123; mercdead; twoDarkStalkers alive6.43%/80%|

W2 native log shows hero Lightning18/26/21 instead of the prior40/57/46.
The fixed affix is active in this actual progression witness, and the unchanged
recipe now clears the earlier failure. This is not a full damage ledger or
proof that the Lightning change alone is a general win guarantee.

W3 terminal capped200line log ends with Turn13, FireBolt1damage, Burn and
“The battle ends in a draw.” The tail alone cannot identify a timing, targeting,
mitigation, durability or tuning defect. Original surviving ally identity
checks passed; native t0casts may precede Pause, so resource-bar snapshots
do not prove exact numeric carry. No W3award, W4/fullclear/Akara/claim/Save/
newpageContinue/mobile/Andariel or campaign acceptance was reached.

## Follow-up and retention

Next is one source-backed W1→W3 production-service reconstruction bound to the
actual earned input and native outcomes. Reconcile full events/resource changes
and the actual draw boundary before deciding whether any behavior is wrong.
No numeric tuning, extra acquisition or native retry follows from the capped tail.
BUG-081 records the accepted scoped authored fix and W2 native result while
preserving its original discrepancy and broader limits.

Raw report/log/trace/screenshots/receipts and bindings remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/lightning-native`
through W3diagnosis and umbrella consumers. Root removes them after consumers
finish. Disposable candidate/tmp cleanup and borrowed lightning-fix/dist cleanup
follow release of all native/publication readers and processes. No remote action.
