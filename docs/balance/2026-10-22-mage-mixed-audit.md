# Mage mixed-army audit — 2026-10-22

BALANCE-CHECK: CONCERNS

This fixed unearned L26 army lost all 1,000 battles in each engine domain. Mean Mage effective damage rose 10.192→122.994 and mean effective DPS .688778→8.322449; hero, Skeleton and enemy means and outcome counts stayed unchanged. This scenario supplies no successful TTK observations and does not establish campaign viability. No balance or production behavior changed for this audit.

## Frozen scenario

Exactly **2,000 fresh battles / 1,000 physical→elemental pairs**, combat seeds 0–999 in each domain. Diagnostics and determinism probes are separate from those counts. There are no derived controls, condition matrix, forced targets/hits/victories, or outcome-driven recipe changes.

Source is the accepted unearned M1 snapshot from `buildMageMasteryFixture(1)`. Five legal point allocations raise Skeleton1→6; Mage6 and Mastery1 remain. Slots are Skeleton then Mage. Allocation is 13 skill points spent / 14 unspent / 125 stat points unspent. The changed-only inventory contains Skeleton rank, slot order, spent points, and unspent points. Every other source snapshot field, including initial seed0, ordinary recovery, passive projection, and enemy order, remains unchanged.

The unarmed, unequipped hero has core15/25/15/25, 330HP, 187MP, Attack72, Defense95, AS125 and 5MP/s recovery. There are no mercenaries, preloaded summons or imposed statuses. The original Act2 Arcane Sanctuary manual first wave uses plan7/enemy991: six L24 Undead Flayers and two interleaved Horror Mages, 2,970 total HP, Attack147, Defense65, MR23, AS110/100, authored resistances/dodges/skills/native controls. This is a composition-realistic but unearned and underallocated build.

## Preparation and independent damage oracles

Both batches occur at 0ms: two Skeletons then four Mages, exactly two payments **187→172→150MP**. No later retry, refund or duplicate payment occurs. Global IDs end in Skeleton1/2 and Mage3/4/5/6; F/C/L/P assignment uses the local Mage batch index. Registration positions are `(0,1), (1,0), (1,2), (2,1), (0,0), (0,2)`. Full initial stats, owner/template provenance and empty state are validated independently.

| Family | Mastery1 HP expression | Attack expression | Defense expression | Magic dodge |
| --- | --- | --- | --- | --- |
| Skeleton | `162*(1+.04)` = `168.48000000000002` | `35*(1+.02)` =35.7 | `19*(1+.01)` =19.19 | .05 |
| Mage | `123*(1+.04)` =127.92 | `45*(1+.02)` =45.9 | `10*(1+.01)` =10.1 | .09 |

These are JS binary floating-point results. Both families have AS70, zero MP/MR, crit .05×1.5 and physical dodge .05. Skeleton resistances are all zero; Mage elemental resistances are10, physical/arcane zero. Basic damage floors Attack to35/45. First action cannot precede1940ms; native player controls may delay or prevent it.

| Target | Mage physical | Fire | Cold | Lightning | Poison | Skeleton physical |
| --- | --- | --- | --- | --- | --- | --- |
| Flayer | 1/1 | 1/2 | 22/44 | 22/44 | 1/1 | 1/1 |
| Horror | 1/2 | 1/2 | 10/27 | 10/27 | 1/2 | 1/1 |

Cells are landed noncrit/crit with no target condition. Fire/poison use Defense65; cold/lightning use MR23. Physical uses physical dodge and elemental bolts use magical dodge. Hit threshold is exactly JS `0.7999999999999999`, crit .05, both strict `<`, covered below/at/above. Static Horror literals do not imply observed Horror exposure.

## Outcomes and source-separated effects

| Metric | Physical | Elemental |
| --- | --- | --- |
| count | 1,000 | 1,000 |
| heroDeaths | 1,000 | 1,000 |
| registeredSummons | 6,000 | 6,000 |
| nonActingSummons | 65 | 65 |
| summonDeathEvents | 6,000 | 6,000 |
| absentWithoutDeath | 0 | 0 |
| victory / defeat / draw | 0 / 1,000 / 0 | 0 / 1,000 / 0 |
| mean defeat/draw/victory duration ms | 14,945.94 | 14,945.94 |
| successful TTK count / p50 / p95 | 0 / null / null | 0 / null / null |

Loss/draw duration is battle exposure, not clear speed. Successful TTK uses nearest-rank p50/p95 and censors defeats/draws. Paired-success count is 0; mean/p50/p95 relative TTK changes are null / null / null.

Damage and DPS below are means over battles. DPS is the mean of each battle’s damage/duration, rather than pooled damage divided by pooled duration. Logged damage includes overkill; effective HP removed clamps overkill in one shared-target replay with heals, HP orbs, deaths and owner-orphan transactions. Source totals include the resulting changes in the whole battle; hero/Skeleton/enemy deltas are observed feedback and are not attributed entirely to Mage damage.

| Source | Metric | Physical mean | Elemental mean | Δ | Δ% |
| --- | --- | --- | --- | --- | --- |
| hero | loggedDamage | 20.683 | 20.683 | 0 | 0 |
| hero | effectiveHpRemoved | 20.683 | 20.683 | 0 | 0 |
| hero | loggedDps | 1.384188 | 1.384188 | 0 | 0 |
| hero | effectiveDps | 1.384188 | 1.384188 | 0 | 0 |
| skeletons | loggedDamage | 6.478 | 6.478 | 0 | 0 |
| skeletons | effectiveHpRemoved | 6.478 | 6.478 | 0 | 0 |
| skeletons | loggedDps | 0.437715 | 0.437715 | 0 | 0 |
| skeletons | effectiveDps | 0.437715 | 0.437715 | 0 | 0 |
| mages | loggedDamage | 10.192 | 122.994 | 112.802 | 1,106.770016 |
| mages | effectiveHpRemoved | 10.192 | 122.994 | 112.802 | 1,106.770016 |
| mages | loggedDps | 0.688778 | 8.322449 | 7.633671 | 1,108.292021 |
| mages | effectiveDps | 0.688778 | 8.322449 | 7.633671 | 1,108.292021 |
| player | loggedDamage | 37.353 | 150.155 | 112.802 | 301.989131 |
| player | effectiveHpRemoved | 37.353 | 150.155 | 112.802 | 301.989131 |
| player | loggedDps | 2.510681 | 10.144351 | 7.633671 | 304.047857 |
| player | effectiveDps | 2.510681 | 10.144351 | 7.633671 | 304.047857 |
| enemy | loggedDamage | 1,324.154 | 1,324.154 | 0 | 0 |
| enemy | effectiveHpRemoved | 1,178.30632 | 1,178.30632 | 0 | 0 |
| enemy | loggedDps | 89.889049 | 89.889049 | 0 | 0 |
| enemy | effectiveDps | 80.066792 | 80.066792 | 0 | 0 |

Percent changes have a null zero baseline. No signature status, automatic DoT, or control-source attribution is inferred. Source-less DoT and unsupported enemy conditions reject.

| Domain | Source | Attempts | Crits / landed | Crit% | Dodges / attempts | Dodge% |
| --- | --- | --- | --- | --- | --- | --- |
| Physical | hero | 8,808 | 326/6,991 | 4.663138 | 1,817/8,808 | 20.628974 |
| Physical | skeletons | 8,091 | 329/6,478 | 5.078728 | 1,613/8,091 | 19.935731 |
| Physical | mages | 12,683 | 497/10,192 | 4.876374 | 2,491/12,683 | 19.640464 |
| Physical | player | 29,582 | 1,152/23,661 | 4.868771 | 5,921/29,582 | 20.01555 |
| Physical | enemy | 69,781 | 2,663/54,517 | 4.884715 | 15,264/69,781 | 21.874149 |
| Elemental | hero | 8,808 | 326/6,991 | 4.663138 | 1,817/8,808 | 20.628974 |
| Elemental | skeletons | 8,091 | 329/6,478 | 5.078728 | 1,613/8,091 | 19.935731 |
| Elemental | mages | 12,683 | 497/10,192 | 4.876374 | 2,491/12,683 | 19.640464 |
| Elemental | player | 29,582 | 1,152/23,661 | 4.868771 | 5,921/29,582 | 20.01555 |
| Elemental | enemy | 69,781 | 2,663/54,517 | 4.884715 | 15,264/69,781 | 21.874149 |

Every counter reconciles player=hero+Skeletons+Mages, family=sum of registered units, and summon totals=sum of unit×species rows. Crit denominators are landed attempts; dodge denominators are all attempts.

## Unit activity, death events and target exposure

Death events include owner-orphan cleanup; they do not distinguish direct killing blows. Absence and nonaction remain explicit. First-action distributions use only acting units and preserve fractional simulation clocks.

| Domain | Unit | Type | Registered | Nonacting | Death events | Absent | First ms: count/min/p50/p95/max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Physical | skeleton-1 | physical | 1,000 | 4 | 1,000 | 0 | 996 / 1,940 / 1,940 / 1,940 / 1,940 |
| Physical | skeleton-2 | physical | 1,000 | 2 | 1,000 | 0 | 998 / 1,940 / 1,940 / 1,940 / 1,940 |
| Physical | skeletal_mage-3 | physical | 1,000 | 15 | 1,000 | 0 | 985 / 1,940 / 1,940 / 1,940 / 1,940 |
| Physical | skeletal_mage-4 | physical | 1,000 | 11 | 1,000 | 0 | 989 / 1,940 / 1,940 / 1,940 / 1,940 |
| Physical | skeletal_mage-5 | physical | 1,000 | 14 | 1,000 | 0 | 986 / 1,940 / 1,940 / 1,940 / 1,940 |
| Physical | skeletal_mage-6 | physical | 1,000 | 19 | 1,000 | 0 | 981 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeleton-1 | physical | 1,000 | 4 | 1,000 | 0 | 996 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeleton-2 | physical | 1,000 | 2 | 1,000 | 0 | 998 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeletal_mage-3 | fire | 1,000 | 15 | 1,000 | 0 | 985 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeletal_mage-4 | cold | 1,000 | 11 | 1,000 | 0 | 989 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeletal_mage-5 | lightning | 1,000 | 14 | 1,000 | 0 | 986 / 1,940 / 1,940 / 1,940 / 1,940 |
| Elemental | skeletal_mage-6 | poison | 1,000 | 19 | 1,000 | 0 | 981 / 1,940 / 1,940 / 1,940 / 1,940 |

All twelve unit×species rows are retained per domain, including zero attempts. Damage histograms count landed hits only, with crit/noncrit separated; dodges remain outside them.

| Domain | Unit | Type | Species | Attempts | Landed | Crit | Dodge | Logged | Effective | Noncrit value:count | Crit value:count |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Physical | skeleton-1 | physical | flayer | 4,032 | 3,205 | 170 | 827 | 3,205 | 3,205 | 1:3035 | 1:170 |
| Physical | skeleton-1 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Physical | skeleton-2 | physical | flayer | 4,059 | 3,273 | 159 | 786 | 3,273 | 3,273 | 1:3114 | 1:159 |
| Physical | skeleton-2 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Physical | skeletal_mage-3 | physical | flayer | 3,168 | 2,530 | 133 | 638 | 2,530 | 2,530 | 1:2397 | 1:133 |
| Physical | skeletal_mage-3 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Physical | skeletal_mage-4 | physical | flayer | 3,168 | 2,542 | 107 | 626 | 2,542 | 2,542 | 1:2435 | 1:107 |
| Physical | skeletal_mage-4 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Physical | skeletal_mage-5 | physical | flayer | 3,182 | 2,577 | 128 | 605 | 2,577 | 2,577 | 1:2449 | 1:128 |
| Physical | skeletal_mage-5 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Physical | skeletal_mage-6 | physical | flayer | 3,165 | 2,543 | 129 | 622 | 2,543 | 2,543 | 1:2414 | 1:129 |
| Physical | skeletal_mage-6 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeleton-1 | physical | flayer | 4,032 | 3,205 | 170 | 827 | 3,205 | 3,205 | 1:3035 | 1:170 |
| Elemental | skeleton-1 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeleton-2 | physical | flayer | 4,059 | 3,273 | 159 | 786 | 3,273 | 3,273 | 1:3114 | 1:159 |
| Elemental | skeleton-2 | physical | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeletal_mage-3 | fire | flayer | 3,168 | 2,530 | 133 | 638 | 2,663 | 2,663 | 1:2397 | 2:133 |
| Elemental | skeletal_mage-3 | fire | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeletal_mage-4 | cold | flayer | 3,168 | 2,542 | 107 | 626 | 58,278 | 58,278 | 22:2435 | 44:107 |
| Elemental | skeletal_mage-4 | cold | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeletal_mage-5 | lightning | flayer | 3,182 | 2,577 | 128 | 605 | 59,510 | 59,510 | 22:2449 | 44:128 |
| Elemental | skeletal_mage-5 | lightning | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |
| Elemental | skeletal_mage-6 | poison | flayer | 3,165 | 2,543 | 129 | 622 | 2,543 | 2,543 | 1:2414 | 1:129 |
| Elemental | skeletal_mage-6 | poison | horror-mage | 0 | 0 | 0 | 0 | 0 | 0 | ∅ | ∅ |

## Mana and native player controls

| Domain | Entry MP min/max | Minimum MP min/max | Final MP min/max | Status events | Stunned events |
| --- | --- | --- | --- | --- | --- |
| Physical | 187 / 187 | 150 / 150 | 187 / 187 | 6,259 | 0 |
| Elemental | 187 / 187 | 150 / 150 | 187 / 187 | 6,259 | 0 |

Final HP/MP reconcile against production. The **mana-starved action percentage is unknown**: the recording does not expose failed affordability decisions, and MP low-water alone does not provide that denominator. Native player status/stunned events retain target and simulation time; status carries its ID and stunned does not identify a source or status. No control attribution is guessed.

## Provenance and reproducibility

Both domains import the same six captured helpers: mixed fixture/runner, Mastery fixture, balance fixture/runner, generic fixture. The Mastery runner and other diagnostic family chains are excluded. Each domain captures 173 immutable non-test engine/data Git blobs; only combat.ts differs. Seven actual configs, Node executable/version, and 507 installed Vite/esbuild/Ajv tool files are bound separately. Distinct measurement process IDs and all loaded gameplay/helper module hashes are recorded. Vite uses no config discovery, watch, HMR or WebSocket server; all readers and SSR servers settle in finally blocks.

| Domain | Revision | Source hash |
| --- | --- | --- |
| physical | `cf19757dd5e50f122371e5eda7327f8a79095fbb` | `0354ae6fb9512dd9925e8640a9a9ca88724b2e6cdf2bcf421f12accdcbf29104` |
| elemental | `c1816b67a70624beeb732772f54eef6eb4ba621c` | `9fd6ef1467666b542a72401f77c9c4ca9e653c70935d412f8ab34b1a41095ce7` |

Shared data hash: `6d6a142888025418326f954f27583d883d20ce258c8334e63e80c15bc2a176ee`. Driver logical hash: `58aff459d48ef33d772dd8c54c8366ea16f024783e9c7d52241e452ade6e1450`. Tool logical hash: `91359ff2223eacdeb670e25111a23a510cd1ff3c422d21e6eb2f61d8ca4625a0`.

Retained M1 source logical hash `b9c2d4164de6da292d9b49062ef397a9a765b6f5c1401c07b252d949357b70bf`, 6,270 bytes SHA256 `a4264e6c7583ad35dcdc719131fb54ea8755aae5f5b9e39fd76bca8f76c684a5`. Mixed fixture logical hash `c956c7e0a7ac23d779ba83348a0c76c1767acc7c115446f599623c47e8cd38b6`, 6,735 bytes SHA256 `7e348dace3481ba5d0005dbaf01aaf58de1491daebfeaa9c6997e2b72a9ae3c8`. Fixture was generated and serialized once for both domains.

| Stream | Rows | Raw bytes | Gzip bytes | Gzip SHA256 |
| --- | --- | --- | --- | --- |
| physical | 1,000 | 103,740,414 | 5,443,583 | `1a4bb48edf46544e7c54ffc9ff75b5f85ddf87111872a14dfe653b8dd8d25b57` |
| elemental | 1,000 | 103,679,070 | 5,516,245 | `3ac13548e12bed6a25205d75772c2132ec8b6b4e9b145c93e2c893b9e645865b` |
| pairs | 1,000 | 14,554,994 | 413,784 | `f69dfc10bb9511da1489494863324dac99e5aaa518c543e68f0da06147981799` |

Each complete raw recording is streamed before the next seed. Indexes bind compressed/uncompressed counts, bytes, hashes, expected provenance and seed order. Pair metadata is checked against the independently expected fixture/domain/input/preparation, including shared forgeries. Twenty-one integrity probes accept two valid cases and reject nineteen wrong-provenance, duplicate/missing/reordered/excess/truncated/trailing/invalid/incomplete/writer-failure cases.

Evidence is retained under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-golem-bc3r0les`. Exact manifests:

| Artifact | SHA256 |
| --- | --- |
| mage-army-source-manifest.json | `6d62e3665467d740755b0a1b2598fcd1f75163811ce2235b8a5ed081b82f5d72` |
| mage-army-tool.json | `b893d11aee5aeb9ee77c8410f7e1889f8c9461ffc60a70ff0014063412583346` |
| mage-army-fixture-manifest.json | `fa9df8a195ae75cbd4e43b0e936a976964a8b236b72a1b122ed97cfaf68b8a1b` |
| mage-army-integrity.json | `e0f43e93f6f0bcc531d023a8d665a6a24fc2eb20264852b8e445c2c58869c5ad` |
| mage-army-preflight-physical.json | `d41623b37fdb1177bc3bfa934bf15c7bc95be7c7d2afca2d87ceff3914e6494c` |
| mage-army-preflight-elemental.json | `f1468c6aa4428bf251c4f4aab9a5ca06752f985db593578ec0b2c316bcd7a20f` |
| mage-army-comparison.json | `4ac3912f8696abe0c70a46984bad2b57a7a8dbed4677e5d1425fc2e543a53964` |

The external `mage-army-domain.mjs` performs the fixed fixture, preflight, serial physical/elemental measurement and compare operations. `mage-army-check.py` independently reconstructs the source transform, preparation, every raw event’s HP/MP/counters/histograms/controls, all 2,000 run summaries and 1,000 pairs, aggregate effects, streams and source/tool/receipt identities. `mage-army-report.py --check` binds every report table to those checked aggregates. Final focused/type/lint/explicit-lint/full-unit/build/check receipts and frozen review/publication identities are recorded in the execution ledger.

## Bounded interpretation and remaining gates

This finite audit demonstrates mixed-batch preparation, globally unique IDs with local Mage element ordering, creation-only Mastery and measured source-separated elemental effects. All 12,683 Mage and 8,091 Skeleton attempts per domain target Flayers; Horror rows remain unexposed. Cold/lightning supply 95.77% of elemental Mage damage. Mean player damage removes 5.06% of the initial enemy HP. Paired durations remain identical (median15.3s, p95 18.7s); matching action counters and exposure show a local damage improvement without observed survival or victory benefit. No composition synergy, starvation or successful TTK improvement is established.

Earned progression, equipment/mercenary allocation, campaign viability, held-out/global balance, full signature statuses, experiential acceptance, D06/P09/P10/private-v1 and release gates remain open. The existing 15s full-unit budget breach and Browserslist/chunk-size/manifest-precache build warnings remain open; no gate or formula is weakened. Production engine/data/save/config/SaveCurrent11 are unchanged. No remote action, PR, merge or deployment is part of this increment.
