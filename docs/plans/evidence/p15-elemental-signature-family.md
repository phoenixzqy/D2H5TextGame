# P15 — Elemental, poison and ranged signature family evidence

The20-row action/numeric adoption in [the bounded decision](../decisions/P15-elemental-signature-family-v1.md) is implemented. Functional validation passes; campaign and numerical balance remain unaccepted. Inventory:67authored/44pending; all111 numerical acceptances unaccepted. CI remains excluded/deleted; Chromium works in WSL. No save-format change, dependency install or publication.

## Implementation and native checks

Only20selected monster definitions change skills/Attack/AttackGrowth. Remove generic Weak/StrongMelee/WeakRanged entries, preserve signature order, and adopt the declared role curves. No production runtime, registry, schema, locale or skill-payload bytes change. Existing500ms projectile flight and native ranged delivery remain intact.

52new native cases pin literal lists, level/tier curves, cadence/actions, delivery, ordinary physical damage with existing Ignite amplification, unchanged nonattack stats/factory RNG, ManaBurn fallback, appended elite precedence and immutable replay/plain parity. A synthetic legacy definition loses authenticated delivery by design; the paired nonattack comparison excludes attackRange/basicAttackDelivery, while real bundled delivery and attackRange have independent literal assertions.

Native integration: Endugu has oneFetish+fiveFlayers L36boss; Council threeInfectors L43boss; Hephasto oneMegaDemon+threePitLords L56boss; Thresh oneDeathMauler+fourBloodLords L67boss. Adds inherit boss tier despite canBeBoss:false. Ashen has sixL90trashBloodLords overW2/3/4, absent fromGlacial. Throne quest projection preserves27eliteBaalMinions over seven original sources at75/75/76/76/76/76/77. These are native planner/action checks, not earned encounter viability.

Five base rows remain signature-covered: DarkRanger/BurningDeadArcher, Fetish, VenomLord and BaalMinion. PitViper/PitLord retain ordinary gaps. Elite skills and ManaBurn can alter exposure. Existing LightningBolt lacks Paralyze despite JSON. FireArrow/FireBolt/Inferno/PoisonCloud/PoisonDagger/PlagueSpit statuses omit positive DoT rates, but still enable combos, stacking, potency promotion/refresh and death spread; Spit/Breath already have positive rates. Payload repair and high-level signature scaling remain pending.

## Functional validation and corrections

**Final18files/753tests PASS** (`p15-elemental-affected-final-v2`,37.976s wrapper); strict types-final-v2 PASS9.538s; scoped lint-final-v2 PASS12.529s. Independent design and implementation-QA reviews APPROVE the bounded adoption; neither grants numerical balance acceptance.

Pre-mutation RED:42FAIL/5PASS across47cases,8.822s; five added native-context cases separately fail intended curves/actions after their roster/source checks pass. External staticv1 found a readonly status-array type; staticv2/v3 pass after correction and exact600control comparison hardening, before the baseline freeze.

Green-v1:66PASS/21FAIL of87. Twenty synthetic legacy comparisons incorrectly expected authenticated delivery on a modified definition and added an absent attackRange property. Correcting only those comparison fields preserves all other equality/RNG assertions. Inventory integrity also rejected the prior melee increment's unsupported Crusher `signature-covered` category; it now uses established `spell-covered` with explicit physical-signature scope. This was omitted from the earlier975-case run and is disclosed in BUG412/melee evidence. Lint-v1 found one optional-boolean expression; v2 passes. Green-v2 is87/87PASS. Types-v1/v2 PASS, including136.434s initial check.

After the frozen comparison, the old ActV fixture reproduces1FAIL/1PASS; BloodLord now expects ordinary/null at3240ms, while FrozenTerror retains StrongMelee. The first18-file affected run is749PASS/3FAIL: old Tainted control still expected Afflicted StrongMelee, and two sparse-mutation delivery tests tried to mutate newly frozen Rend arrays. Update Afflicted to Spit/ordinary/Spit at1740/3480/5220ms. Preserve sparse-mutation/reload/recovery assertions on mutable native WeakMelee, and add immutable Rend mutation rejection/delivery preservation. No production rules changed for these fixtures. All intermediate logs/receipts remain retained. One preflight file-list typo aborted before starting a wrapper/test; corrected to monster-physical-family.test.ts.

## Frozen matched diagnostic

30specs×2unequipped starting-stat heroes×100seeds0–99=60cells/6000fights per arm. BasicBarbarian/FireBolt1Sorceress have unspent points.20trash rows use synthetic act levels12/20/30/45/60; six isolated components use actual native challenge levels36/43/56/56/67/77; BloodLord has an L90trash probe. Three unchanged L12Tainted/DarkArcher/Disfigured controls provide600pairs. Component duels do not represent whole encounters. Native60s/1000actions,600swall/256MiBcompressed caps. No tuning/retry/favorable seed/reward/pacing/earned acceptance.

Each arm made6180native calls including180A/B/A/plain-recorded checks. Both arms and compare exit0/sourceStable:true/sourceCount3069; no timeout/live owned descendants. Exact owned Vite caches removed. Comparator verifies full raw hashes/metrics, exact20row structural delta, all other runtime/payload bytes, frozen driver/recipe, input immutability and normalized roster/resources/factory RNG parity. Only skillOrder/Attack/attackRange normalize matching; normalized objects are never simulated. All600unchanged control inputHash/recordingHash/metrics are identical.

| Arm | Victory | Defeat | Draw | Generic | Signature | Ordinary |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 1024 | 431 | 4545 | 161586 | 21728 | 3307 |
| candidate | 576 | 4304 | 1120 | 0 | 72252 | 20982 |

Paired transitions: victory->defeat=452, victory->victory=548, draw->victory=26, victory->draw=24, draw->draw=1096, draw->defeat=3423, defeat->defeat=429, defeat->victory=2. This is a material threat increase against unearned diagnostic heroes; no accepted balance is implied. Candidate has zero generic actions, including unchanged controls.

Candidate canonical action counts: monster.poison_spit=13886, ordinary=20982, monster.fire_arrow=13013, monster.fire_bolt=963, monster.charge=1745, monster.lightning_bolt=1587, monster.poison_dagger=13309, monster.poison_cloud=8615, monster.plague_spit=2026, monster.inferno=4702, monster.fire_breath=11092, monster.rend=1314.

baseline: native 27.134s/wrapper 28.139s; 25,746,850 compressed bytes; rawSHA256 `f9e7b9150107938d1ee3ff048e8c84043de440bbae77eee8335240d4bade458d`.
baseline: 34183hero status snapshots, 47936periodic events/113713logged periodic damage. These are events/snapshots, not unique applications or single-skill attribution.
candidate: native 22.255s/wrapper 23.349s; 20,665,929 compressed bytes; rawSHA256 `0b7826d5689b00024bb62fbaab8325f59a7ace918712e7cb5a88cf17f0b645f7`.
candidate: 82201hero status snapshots, 80109periodic events/219779logged periodic damage. These are events/snapshots, not unique applications or single-skill attribution.

Net terminal HP depletion differs from cumulative effective HP removed; both remain in raw/paired records. Mixed periodic damage is not attributed to one skill. The frozen generic attribution string mentions Rend; it is a copied exclusion warning, not elemental attribution. Successful-only TTK is censored to victories and denominators are shown; no overall TTK is inferred from defeats/draws.

## All60cells

Each cell n=100. Outcomes=win/loss/draw. DPS=enemy effective median HP/s. TTK=p50/p95ms among victories, with n. Candidate ordinary/signature counts include any unchanged control signatures. Full paired-success delta quantiles and all raw events remain in the paired summary/recordings.

| Cell | Outcomes before→after | DPS before→after | TTK before→after (n) | Ordinary/signature after |
| --- | --- | ---: | --- | ---: |
| act1.afflicted:L12:trash:barbarian | 100/0/0→11/89/0 | 0.44→11.40 | 33880/47740 (100)→21560/30800 (11) | 581/601 |
| act1.afflicted:L12:trash:sorceress | 100/0/0→5/95/0 | 0.46→10.70 | 34600/49500 (100)→13500/19900 (5) | 535/559 |
| act1.dark-ranger:L12:trash:barbarian | 73/0/27→76/0/24 | 0.46→0.48 | 44660/55440 (73)→43120/56980 (76) | 0/2804 |
| act1.dark-ranger:L12:trash:sorceress | 93/0/7→91/0/9 | 0.46→0.47 | 44600/58000 (93)→45000/57000 (91) | 0/2809 |
| act2.rock-worm:L20:trash:barbarian | 1/0/99→0/100/0 | 0.42→11.39 | 55440/55440 (1)→—/— (0) | 750/774 |
| act2.rock-worm:L20:trash:sorceress | 9/0/91→0/100/0 | 0.42→10.91 | 57900/60000 (9)→—/— (0) | 701/737 |
| act2.devourer:L20:trash:barbarian | 0/0/100→0/100/0 | 0.43→14.46 | —/— (0)→—/— (0) | 597/609 |
| act2.devourer:L20:trash:sorceress | 0/0/100→0/100/0 | 0.42→13.08 | —/— (0)→—/— (0) | 548/575 |
| act2.claw-viper:L20:trash:barbarian | 100/0/0→38/62/0 | 3.90→18.64 | 20020/26180 (100)→15400/20020 (38) | 445/475 |
| act2.claw-viper:L20:trash:sorceress | 71/29/0→2/98/0 | 4.97→16.79 | 42300/56300 (71)→11767/15334 (2) | 480/493 |
| act2.salamander:L20:trash:barbarian | 1/0/99→0/100/0 | 0.47→18.64 | 58520/58520 (1)→—/— (0) | 518/518 |
| act2.salamander:L20:trash:sorceress | 0/0/100→0/100/0 | 0.47→20.99 | —/— (0)→—/— (0) | 445/445 |
| act2.pit-viper:L20:trash:barbarian | 0/0/100→0/100/0 | 0.48→12.26 | —/— (0)→—/— (0) | 375/1194 |
| act2.pit-viper:L20:trash:sorceress | 0/0/100→0/100/0 | 0.48→11.47 | —/— (0)→—/— (0) | 356/1144 |
| act2.burning-dead-archer:L20:trash:barbarian | 0/0/100→0/0/100 | 0.47→0.48 | —/— (0)→—/— (0) | 0/3700 |
| act2.burning-dead-archer:L20:trash:sorceress | 0/0/100→0/0/100 | 0.45→0.48 | —/— (0)→—/— (0) | 0/3700 |
| act2.steel-scarab:L20:trash:barbarian | 0/0/100→0/100/0 | 0.42→17.89 | —/— (0)→—/— (0) | 404/465 |
| act2.steel-scarab:L20:trash:sorceress | 0/0/100→0/100/0 | 0.40→20.54 | —/— (0)→—/— (0) | 353/423 |
| act2.plague-bug:L20:trash:barbarian | 0/0/100→0/100/0 | 0.42→11.39 | —/— (0)→—/— (0) | 750/774 |
| act2.plague-bug:L20:trash:sorceress | 0/0/100→0/100/0 | 0.42→10.91 | —/— (0)→—/— (0) | 701/737 |
| act2.death-beetle:L20:trash:barbarian | 0/0/100→0/100/0 | 0.42→28.28 | —/— (0)→—/— (0) | 308/358 |
| act2.death-beetle:L20:trash:sorceress | 0/0/100→0/100/0 | 0.42→25.47 | —/— (0)→—/— (0) | 294/341 |
| act3.fetish:L30:trash:barbarian | 99/0/1→100/0/0 | 0.47→0.51 | 36960/50820 (99)→35420/52360 (100) | 0/2209 |
| act3.fetish:L30:trash:sorceress | 0/0/100→0/0/100 | 0.47→0.50 | —/— (0)→—/— (0) | 0/3700 |
| act3.spider:L30:trash:barbarian | 91/5/4→11/89/0 | 5.47→14.04 | 41580/55440 (91)→27720/33880 (11) | 773/783 |
| act3.spider:L30:trash:sorceress | 0/38/62→0/100/0 | 5.45→14.79 | —/— (0)→—/— (0) | 718/738 |
| act3.swamp-dweller:L30:trash:barbarian | 45/0/55→1/99/0 | 0.43→13.41 | 52360/58520 (45)→27720/27720 (1) | 772/773 |
| act3.swamp-dweller:L30:trash:sorceress | 0/0/100→0/100/0 | 0.43→16.48 | —/— (0)→—/— (0) | 642/642 |
| act3.infector:L30:trash:barbarian | 0/0/100→0/100/0 | 0.43→15.68 | —/— (0)→—/— (0) | 772/772 |
| act3.infector:L30:trash:sorceress | 0/0/100→0/100/0 | 0.42→16.86 | —/— (0)→—/— (0) | 635/635 |
| act4.venom-lord:L45:trash:barbarian | 0/0/100→0/5/95 | 0.45→5.78 | —/— (0)→—/— (0) | 0/3585 |
| act4.venom-lord:L45:trash:sorceress | 0/0/100→0/8/92 | 0.45→5.47 | —/— (0)→—/— (0) | 0/3579 |
| act4.pit-lord:L45:trash:barbarian | 0/0/100→0/100/0 | 0.45→25.20 | —/— (0)→—/— (0) | 306/974 |
| act4.pit-lord:L45:trash:sorceress | 0/0/100→0/100/0 | 0.45→23.69 | —/— (0)→—/— (0) | 308/924 |
| act4.mega-demon:L45:trash:barbarian | 0/0/100→0/100/0 | 0.47→38.73 | —/— (0)→—/— (0) | 397/397 |
| act4.mega-demon:L45:trash:sorceress | 0/0/100→0/100/0 | 0.47→48.56 | —/— (0)→—/— (0) | 306/306 |
| act5.blood-lord:L60:trash:barbarian | 0/0/100→0/100/0 | 1.18→63.99 | —/— (0)→—/— (0) | 314/314 |
| act5.blood-lord:L60:trash:sorceress | 0/0/100→0/100/0 | 1.18→60.91 | —/— (0)→—/— (0) | 306/306 |
| act5.baal-minion:L60:trash:barbarian | 0/0/100→0/0/100 | 0.47→1.23 | —/— (0)→—/— (0) | 0/3700 |
| act5.baal-minion:L60:trash:sorceress | 0/0/100→0/0/100 | 0.47→1.23 | —/— (0)→—/— (0) | 0/3700 |
| act3.fetish:L36:boss:barbarian | 0/0/100→0/0/100 | 0.47→0.50 | —/— (0)→—/— (0) | 0/3700 |
| act3.fetish:L36:boss:sorceress | 0/0/100→0/0/100 | 0.47→0.50 | —/— (0)→—/— (0) | 0/3700 |
| act3.infector:L43:boss:barbarian | 0/0/100→0/100/0 | 0.43→38.33 | —/— (0)→—/— (0) | 333/361 |
| act3.infector:L43:boss:sorceress | 0/0/100→0/100/0 | 0.42→65.52 | —/— (0)→—/— (0) | 258/258 |
| act4.mega-demon:L56:boss:barbarian | 0/0/100→0/100/0 | 0.47→91.05 | —/— (0)→—/— (0) | 266/266 |
| act4.mega-demon:L56:boss:sorceress | 0/0/100→0/100/0 | 0.47→172.84 | —/— (0)→—/— (0) | 156/156 |
| act4.pit-lord:L56:boss:barbarian | 0/0/100→0/100/0 | 0.45→59.24 | —/— (0)→—/— (0) | 158/490 |
| act4.pit-lord:L56:boss:sorceress | 0/0/100→0/100/0 | 0.45→84.34 | —/— (0)→—/— (0) | 168/504 |
| act5.blood-lord:L67:boss:barbarian | 0/0/100→0/100/0 | 1.18→209.26 | —/— (0)→—/— (0) | 174/174 |
| act5.blood-lord:L67:boss:sorceress | 0/0/100→0/100/0 | 1.18→200.00 | —/— (0)→—/— (0) | 156/156 |
| act5.baal-minion:L77:elite:barbarian | 0/0/100→0/0/100 | 0.47→1.23 | —/— (0)→—/— (0) | 0/3700 |
| act5.baal-minion:L77:elite:sorceress | 0/0/100→0/0/100 | 0.47→1.23 | —/— (0)→—/— (0) | 0/3700 |
| act5.blood-lord:L90:trash:barbarian | 0/0/100→0/100/0 | 1.18→88.68 | —/— (0)→—/— (0) | 314/314 |
| act5.blood-lord:L90:trash:sorceress | 0/0/100→0/100/0 | 1.18→85.60 | —/— (0)→—/— (0) | 302/302 |
| act1.tainted:L12:trash:barbarian | 93/7/0→93/7/0 | 10.13→10.13 | 15400/20020 (93)→15400/20020 (93) | 360/399 |
| act1.tainted:L12:trash:sorceress | 58/42/0→58/42/0 | 10.10→10.10 | 16500/23500 (58)→16500/23500 (58) | 448/486 |
| act1.dark-archer:L12:trash:barbarian | 43/57/0→43/57/0 | 20.00→20.00 | 9240/13860 (43)→9240/13860 (43) | 592/0 |
| act1.dark-archer:L12:trash:sorceress | 15/85/0→15/85/0 | 20.39→20.39 | 10900/17125 (15)→10900/17125 (15) | 618/0 |
| act1.disfigured:L12:trash:barbarian | 23/77/0→23/77/0 | 9.77→9.77 | 21560/30800 (23)→21560/30800 (23) | 674/691 |
| act1.disfigured:L12:trash:sorceress | 9/91/0→9/91/0 | 9.96→9.96 | 28000/33800 (9)→28000/33800 (9) | 615/623 |

## Source identity and retained artifacts

The baseline/candidate comparator allows exactly two test-source deltas:

- `src/engine/combat/monster-elemental-family.test.ts`: `1a20bdf75a955e2f30454b5a8a9b6f97ede678106480ba0da5cee7043d55b1ca` → `e20d73f7d3d1f55a09592ad0ce9cfad5682541dec7716dad575e79fd7b002c80`.

- `src/engine/combat/monster-signature-priority.test.ts`: `ef199a10e3d054aa16b0a79c059e0d570e0a5f1677419fc00d6e0bc681dcb8e1` → `259a2243b3bec446d8583ed2bc455947fcbd01a01c08a90b6e4ac45d4a7351e2`.

Three stale test fixtures were repaired only after comparison; no diagnostic rerun or runtime change followed:

- `src/engine/combat/act5-elemental-priority.test.ts`: measured `329d9803714b79c08f6850a08475dd96af4fd25fe82bf5ce89cc750de559c225` → final `88736648416cbdfde79cec8f8a5c1aadbbcff396e78ba82ce7e47b02c369a28a`.

- `src/engine/combat/tainted-action-source.test.ts`: measured `43c92b8042fd882e21c52a30dce853ef61aa05b612fc6815da2c1320d1d10230` → final `ae5ee836f6a889ff1e7d8ff5b2395f5baa83bc661aca9f7c60d351ea3dd57b7c`.

- `src/engine/combat/damage-delivery.test.ts`: measured `4e9f63a95fad90dff6fa3214d04669443c1ece8d11d517890d04aa517dce1ab4` → final `44b4cee62854e5f855523719e2c3f3781ec13ef908a0245e8c16da6a315a8b92`.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`; root retains raw/source/metrics/failures/receipts until umbrella acceptance. Exact family leaves: `p15-elemental-family-v1.{baseline,candidate}.{raw.jsonl.gz,manifest.json}`, `.paired.{jsonl.gz,summary.json}`; source-before/source-after/verification/exit receipts and logs; frozen specs/baseline-data/harness/launcher/owned-wrapper/static/plan. Complete source inventories, selected before/after source bytes, SHA256s and600control equalities are retained.

No disposable source-generation script was created for these final corrections. Baseline/candidate/compare caches are absent; all family verification receipts report no owned descendants alive. Established umbrella type cache, evidence packet and registered worktree claim stay retained through umbrella acceptance; root owns their eventual cleanup. Next: remaining44numeric rows, payload families and coherent earned campaign/balance milestones.
