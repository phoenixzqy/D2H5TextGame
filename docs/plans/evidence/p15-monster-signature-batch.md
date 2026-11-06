# P15 — Eight native monster signature corrections

Eight existing two-skill lists now put the signature before generic melee;
no other production bytes changed in this slice. See
[role contract](../decisions/P15-monster-signature-batch-v1.md). Native numerical
skills/delivery/targeting/status/projectile behavior remains unchanged.
The101outstanding numerical authoring rows remain101.

The32case regression genuinely failed before changes. After changes, eight
focused files/407tests pass, including292loader cases and reviewed Tainted,
Stalker and Act5controls. Test-source strict types, zero-warning focused lint
and external harness static checks pass. Independent native-mechanics review
found no fixture issue; its formatting/inference findings were corrected.

V1baseline completed4000fights. The attempted mutation then failed before any
write because Act3/4list formatting differs. Root incorrectly launched candidate
and checks afterward: candidate stopped at0fights on unchanged baseline order,
and the prematureGREENlabelled check still failed32cases. Both are retained.
Its inventory also observed a transient Vitest config module from concurrent
verification; all3055source inputs matched baseline again at rest. V2preserves
the original spawn namespace/population, corrects whitespace-preserving list
comparison/mutation, and runs measurement without concurrent Vitest/builds.
One static preflight catches TS7022; explicit local types fix it before v2freeze.

V2baseline/candidate each complete4000measured fights:250fixed seeds0–249in
16cells(eight actual-encounter levels × native starting-statBarbarianbasic or
SorceressFireBolt1). Stats stay unspent; no gear/merc/summons; caster buys only
FireBolt1. Caps60s/1000actions. Each arm makes4048native calls including replay
and plain/recorded parity controls. Every paired roster/resource/factoryRNG hash
matches after neutralizing only the order for comparison, never simulation.
Full3055-input inventories stay stable; comparator verifies exact eight-list
string reversals inact2/3/4and all other source bytes identical. Full raw
results/metrics and complete paired transitions remain retained.

| Monster/probe | Baseline W/D/draw | Corrected W/D/draw | Enemy effective median DPS before→after |
| --- | --- | --- | --- |
| monsters/act2.claw-viper:barbarian | 250/0/0 | 250/0/0 | 0.450→3.734 |
| monsters/act2.claw-viper:sorceress | 250/0/0 | 196/54/0 | 0.463→4.784 |
| monsters/act2.vulture-demon:barbarian | 5/0/245 | 4/36/210 | 0.517→3.233 |
| monsters/act2.vulture-demon:sorceress | 121/0/129 | 103/50/97 | 0.509→3.283 |
| monsters/act3.jungle-hunter:barbarian | 192/0/58 | 192/0/58 | 0.461→0.461 |
| monsters/act3.jungle-hunter:sorceress | 0/0/250 | 0/0/250 | 0.467→0.467 |
| monsters/act3.spider:barbarian | 231/0/19 | 212/25/13 | 0.440→5.306 |
| monsters/act3.spider:sorceress | 0/0/250 | 1/132/117 | 0.433→5.522 |
| monsters/act3.swamp-dweller:barbarian | 99/0/151 | 104/0/146 | 0.417→0.433 |
| monsters/act3.swamp-dweller:sorceress | 0/0/250 | 0/0/250 | 0.417→0.433 |
| monsters/act3.doom-ape:barbarian | 0/0/250 | 0/0/250 | 0.467→0.500 |
| monsters/act3.doom-ape:sorceress | 0/0/250 | 0/0/250 | 0.467→0.483 |
| monsters/act4.abyss-knight:barbarian | 0/0/250 | 0/0/250 | 0.467→0.467 |
| monsters/act4.abyss-knight:sorceress | 0/0/250 | 0/0/250 | 0.467→0.467 |
| monsters/act4.oblivion-knight:barbarian | 0/0/250 | 0/249/1 | 0.450→12.677 |
| monsters/act4.oblivion-knight:sorceress | 0/0/250 | 0/249/1 | 0.433→11.919 |

Every candidate fight exposes its signature. Poison/projectile and Charge
restorations can materially increase threat; several high-level physical
probes still mitigate to1and draw. This is diagnostic evidence, not earned
campaign balance. Do not compare victory-onlyTTK without its changing/empty
denominator; paired both-winTTKdeltas and p50/p95are retained. Crit/dodge raw
numerators/denominators are retained. Drops are unmeasured/null. The design
adviser was explicitly notified of>15%threat shifts; no outcome tuning followed.

Retained by root through umbrella acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-signatures-cohort-plan-v2.md`, harness/launcher/owned scripts, full source
inventories, `p15-signatures-cohort-v2.{baseline,candidate}.raw.jsonl.gz`,
matching manifests and `p15-signatures-cohort-v2.paired.{jsonl.gz,summary.json}`.
V1failures/methods remain separately retained. Both v2arms/comparison exit0;
no timeouts/errors/live owned descendants. Exact per-mode caches are removed
and absence verified. The source freeze is released after terminal comparison.
Earned campaign/retry, fourteen builds, pacing and finalv1remain incomplete.
