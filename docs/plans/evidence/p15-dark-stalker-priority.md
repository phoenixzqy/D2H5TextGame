# P15 Dark Stalker priority correction

Charge now precedes Strong Melee in Dark Stalker's existing two-skill list.
Only that order changes. Native actions at1540/3080/4620/6160ms are Charge,
Strong, Strong, Charge; Chill respects the exact native cooldown boundary.
There is no new movement/stun, ordinary attack growth or numeric authoring.
The101outstanding monster numerical reviews remain101.

Genuine RED4failed/2controls precedes the edit. Nine focused files/468tests then
pass, including six Stalker regressions,292loader and52resurrection cases.
Strict types and full cached lint pass. Independent native-mechanics review
APPROVE covers cadence, mitigation, physical dodge, control rows and replay.

The v1diagnostic harness failed before its first battle because it asserted an
authored attackRange on this legacy-scalar row. Its failure is retained, with
no balance measurement. Separately frozen v2uses the correct undefined range
and native scalar Attack57/92atL6/L13. Its version-namespaced spawn seeds and
method are disclosed. No outcome-driven retry or tuning followed.

Each v2arm completes4000measured duels: seeds0–999in four cells. Heroes have
native starting attributes, unspent stat points, no gear/mercenary/summons;
Sorceress allocates only FireBolt1. Caps60s/1000actions. Including recorded/plain
parity and A/B/A replay controls, each arm makes4012native calls. Full raw
results and4000paired inputs reconcile. All3054source inputs remain stable
within arms; comparison verifies the exact one-row byte reversal across arms.

| Probe | Baseline wins/deaths/draws | Corrected wins/deaths/draws | Enemy median effective DPS, before→after |
| --- | --- | --- | --- |
| L6 Barbarian basic |0/601/399|0/1000/0|3.335→9.491|
| L6 Sorceress FireBolt1 |349/612/39|0/1000/0|3.247→10.390|
| L13 Barbarian basic |0/0/1000|0/376/624|0.567→3.833|
| L13 Sorceress FireBolt1 |56/0/944|27/579/394|0.550→3.791|

All candidate fights naturally use Charge; all baseline fights suppress it.
Only27pairs win on both sides (L13caster); their winning TTK delta is0atp50/p95.
Other successful-TTK comparisons have changing/empty denominators. These probes
show a substantial threat increase, not earned viability, fourteen-build or
30–50hour pacing acceptance. Drops are unmeasured/null.

Evidence retained through umbrella acceptance by root under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-stalker-cohort-plan-v2.md`, harness/launcher, per-arm full inventories,
`p15-stalker-cohort-v2.{baseline,candidate}.raw.jsonl.gz`, matching manifests,
`p15-stalker-cohort-v2.paired.{jsonl.gz,summary.json}` and RED/GREEN/check receipts.
Both arms/comparison exit0; no timeouts/errors/live owned descendants. Exact
per-mode disposable Vite caches are removed and their absence verified.


Follow-on regression: BUG412's melee-family contract superseded the historical
StrongMelee filler/VileHunter control with authored ordinary Attack63atL6.
BUG420 updated five stale assertions without changing Charge60–90/CD4,
1540ms cadence, exact6000msChill boundary, dodge/mitigation or replay checks.
Complete6case file PASS15.659s; lint16.804s/types12.443s PASS. Historical frozen
v2arms remain unchanged and describe their original earlier catalog snapshot.
