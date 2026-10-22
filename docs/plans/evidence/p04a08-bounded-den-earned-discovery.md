# P04a08 — Bounded-elite earned Den discovery

Status: failed bounded progression screen, 2026-10-22. Parent `2f7df8a`.
This preserves an actual defeat; C0–C4/G0–G7/private v1 remain unaccepted.

## Declared recipe and exact sources

One fresh Sorceress, exactly40ordinary Blood MoorW1wins through native UI,
then byte-identical prior earned upgrades: L6hero Fire4/Frost2/Warmth1,
10Energy/15Vitality, ATK49/DEF51, HP120/190 MP102/137; L9InnerSight Rogue,
HP196/196 with earned cap/gloves/boots. No extra grind, import, store/storage
writes, refill, alternate gear/build or retry. Ordinal40 and fixedDate
2026-10-20T12:00Z; timers remain native. Production bridge absent.

[Exact failed spec](fixtures/p04a08-bounded-den-earned-discovery.spec.ts.txt)
SHA612c5348a770e48140733b670cbf873d7108cac8443eb4a48f34fd5f7c8d396c;
[exact config](fixtures/p04a08-bounded-den-earned-discovery.config.ts.txt)
SHAf9da21e7198b675ee0f7beb9a8a93256ea0f81f5308053482e1b6d714b257f3e.
[Machine evidence](fixtures/p04a08-bounded-den-earned-discovery.json) retains all40
prep result summaries, full tracked earned state, native openings/terminals,
actual W1award, source planned/factory W2, original failure and command receipts.
The runnable failing candidates are removed; these are immutable evidence.

## Checks and observed outcome

Typecheck PASS25.384s; no-ignore focused ESLint PASS7.204s; listing PASS1.981s,
exactly1test/1file. Fresh external VITE_E2E-absent production build and all4JS
chunk bridge scan PASS12.076s. Same parent production source remained unchanged.
Producer and QA approved exact-source readiness. Browser Chromium desktop,
1280×800, en; Playwright1.59.1. One worker, retries0/maxFailures1/test240s,
server30s/outer295s+5s hard cap. Actual attempt exit1/not timeout181.285s wrapper,
154.583s test,179.913s report; onefailed, zero skipped/flaky, retry0. Additional
maxFailures-stop diagnostic is not a second browser attempt. Native browser
errors/warnings[]; existing Node FORCE_COLOR/NO_COLOR warnings retained.

| Stage | Native result | Actual awards / state |
| --- | --- | --- |
|40prep wins + unchanged earned upgrades|Passed every assertion|11080heroXP; bag337/shards5157; tracked Den before entry|
|DenW1,9trash|Victory, zero live enemies; hero+merc alive|+270hero/+202mercXP,4items/+133shards; bag341/shards5290; quest still inProgress|
|DenW2,3champions+7trash|Defeat on hero death;9enemies dead,1champion Shaman alive|No award snapshot/clear/claim/save follows|

W2opening contains exactly the same10monsterIDs as the source factory snapshot.
Observed hero HPbar58.95%, merc96.94%, MP114 match the W1terminal display. Exact
original ally identity checks passed. These snapshots are diagnostics, not proof
of exact numeric resource carry (native t0casts can precede Pause).

W2terminal: original hero dead, merc alive81.63%, one champion Fallen ShamanA
alive12.12%, MP131/137. Hero Lightning hits40/57/46 and a merc dodge appear in the
retained200line native log tail. That capped tail is not a complete damage ledger
and does not establish sole cause. Hero death intentionally ends this run even
when merc survives. This is a real recipe failure, not proof that all builds or
routes are impossible or that mitigation/carry is defective.

DenW3/W4, full clear, Akara talk, explicit500XP/+1skill claim, repeat claim,
manual Save/new-page Continue and mobile were never reached. Do not infer those
acceptances from this screen or from prior synthetic tests.

## Follow-up and retention

Next is one source-backed elite-affix skill-authority diagnosis before further
balance or native replay. Runtime Lightning stub conflicts with authored skill
and older affix semantics; no authority choice or numeric fix is implied by this
report. Resolve the narrow intended behavior and inspect the real cast/damage/
mitigation/carry sequence. Do not tune pack size or add acquisition to hide it.

Raw report/log/trace/screenshot/context and source/static/build receipts remain
at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/den-attempt`
under root ownership through bug/fix review; root removes them after umbrella
consumers finish. Trace SHAe5356e6512865d64ae087d2c8a0ce44e6b336b6b6fe1c8b45bc3235a8e613924.
Disposable build/tmp cleanup follows release of all readers. No remote action.
