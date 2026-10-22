# P14a01 — Blood Raven and earned route continuation

2026-10-22; local branch `feat/playable-foundations`; parent `c020dba`;
implementation `06f3c88197ec24b04c9ffc409de91f4680eb6a11`.
[Contract](../decisions/P14a01-blood-raven-v1.md),
[BUG086](../../../production/bugs/BUG-086-blood-raven-encounter.md),
[machine summary](fixtures/p14a01-blood-raven.summary.json).
This accepts no C0–C4/G0–G7 gate or complete campaign/balance requirement.

## Behavior and validation

Blood Raven uses dedicated validated, independently frozen JSON actions:
scheduled Raise Dead3/CD25s/cap6 living real Zombies, Fire Arrow35–55/CD2s
with two ordinary Burn stacks, physical base arrow30–50 and sticky10%HP
double-speed enrage. Summon death does not reset Raise's cooldown; an unavailable
pure summon falls through before action/payment/RNG. Owner death closes its
Zombies without granting ordinary monster rewards. The three authored Bone
Warriors are explicitly ordinary guards; omitted tier flags elsewhere retain
legacy behavior. The selected HP/DEF package is deliberate miniboss tuning.

GD/TD contract APPROVE; producer source APPROVE/security PASS. Final independent
slice QA: ADEQUATE; no actionable gaps. Runtime RED has8genuine failures/1compatibility control.
Final focused22/2files, engine4065/102files, full8480/270files, typecheck, lint
and production build pass. Engine28.79s/full160.26s exceed repository budgets;
no timing/performance acceptance. Full unit initially had3failures from two
stale284-row catalog assertions; the reviewed addition of two skills requires286.
All-row loading, immutable inputs and bilingual name/alias assertions remain.

Earlier implementation failures are retained: missing damage breakdown metadata,
an incorrect guaranteed-hit fixture assumption, a schema-test syntax error,
a comparison including deliberately different input priority metadata, and
TypeScript tuple/event narrowing errors. No skips, suppressions or schema
weakening were used. The production build has VITE_E2E unset; all four JS chunks
pass the repository's bridge-token patterns. Existing chunk/Browserslist/art
manifest warnings remain.

Four production Chromium cases pass in1.3minutes, zero retries/skips/page errors:
English/Chinese ×360×640/1280×800. Ordinary Import Save retains full earned input
by export equality; normal map entry/skip/playback shows localized Raise Dead,
exactly three named Zombies and Fire Arrow, then victory. Save→page-close→new
page Continue preserves the complete export. No hidden store writes/window bridge.
Pretty1.26MB textarea fill timed out; compact equivalent JSON succeeds with exact
save equality. A second attempt overconstrained the wave-counter text by omitting
its area suffix; locale-specific prefix assertions retain wave correctness.
Both failed attempts/traces are retained. This is imported checkpoint rendering,
not fresh browser acquisition, touch-device or browser-process restart proof.

## Predeclared Blood Raven screen

[Exact measurement](fixtures/p14a01-blood-raven.measure.mjs) uses the same retained
Burial W4 allies and production planner/factories for seeds0–999, before/after.
No rewards, selected winning seed or input/source mutation; exact replay passes.

| Metric | Before | After |
| --- | ---: | ---: |
| Wins / draws |0 /862|992 /6|
| Hero deaths / merc deaths |138 /942|2 /42|
| Successful TTK p50 / p95 |unavailable|21336 /30480ms|
| Maximum lifetime summons created |1|9|

Nine lifetime creations are not nine simultaneously living Zombies; the live
cap6/partial-batch/cooldown rules have separate combat regressions. Exact retained
seed4233610418 changes from60s draw/3566remainingHP to18.288s victory/all dead.
This is one bounded cohort, not complete balance or holdout acceptance.

## Original earned L12 route

[Exact route](fixtures/p14a01-blood-raven.route.mjs) restores the unique original
L12 saveSHA `8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
Frozen clock1792497600000/seed2223645302/bonus1; complete initial save equality
passes. Same predeclared existing weapon `it-7is2r-10i` gives mercAttack43;
Frost Nova2/Ice Blast8 and Inner Sight/Pierce/Basic. No further farming, points,
respec, refill, retry or outcome-based gear search. Production playback and
exactly-once settlement retain/reconcile all items and earned awards.

| Area / ordinal | Total combat ms | Earned XP | Result |
| --- | ---: | ---: | --- |
| Blood Moor102 |28812|1460|Victory,3waves|
| Cold Plains103 |57048|3100|Victory,4waves|
| Burial Grounds104 |112296|3130|Victory,4waves|
| Dark Wood105 |127008|6600|Victory,5waves|

Final earned exportSHA
`c32f919de346b2230322630254e7d1e2c3e0cd0185398cc210064aa7ae22c3e0`.
This is a production-service continuation, not fresh browser acquisition proof.

## Qualified Catacombs comparison: fails before boss

[Exact comparison](fixtures/p14a01-catacombs.mjs): one complete service attempt
per old/reviewed Andariel package, identical full earned four-map input above,
seed2223645302/ordinal106. Old package is an explicit in-memory JSON transform
HPbase2200/ATK150/DEF200/no MR override; reviewed150/90/40/MR15. No repository
source mutation. Full guard waves, no preparation financed by failed-run loot.
Full input, every attempted wave/recording and awards compare exactly equal.

Both win W1–3 in15240/16500/35052ms, then lose W4 at7653.846153846154ms.
Andariel is never reached, so the boss tuning remains empirically untested.
W4 opens with hero122/262HP and Rogue181/252HP against13L17 enemies:
3champions/10trash. It records352incoming damage: Shaman physical240, their
Fire Bolts8, Bone Warriors104. There are no summons in that wave. Fire Bolt is
zero-mana in the actual registry; enemy mana starvation is not the cause.
Failed-wave XP/items/currencies/mercXP are zero. Earlier guard victories retain
their actual awards; no Catacombs clear is granted. Diagnostic failed exports
must not be used to finance a stronger retry. GD/TD diagnosis continues before
any next runtime change or campaign attempt.

## Retained evidence and cleanup

Raw evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-raven-m76yc8no`.
Contains raw failures/passing logs, exact scripts, cohort/route/Catacombs reports,
full earned/failed diagnostic saves and browser artifacts. Root owns this
evidence through the dependent progression/C1 work, then removes it after all
consumers release it. Disposable build/cache/reviewer snapshot cleanup has verified remaining[] and
failures[] in `cleanup.receipt.json`; the umbrella goal and worktree claim remain active. No push/PR/deploy.
