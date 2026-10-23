# Earned level-24 preparation — Far Oasis stops at Radament draw

The authentic Rocky Waste save earned **142 full normal Catacombs victories** (852 waves), reached hero level24, then made its single declared Far Oasis attempt. W1–W4 won; W5 drew at60,000ms with Radament alive at **7,837/9,304HP**. The native run returned defeat for the draw and the harness stopped immediately. No retry, Claim, Book, Arcane or ordinary Return after defeat occurred. ActII progression and C2 remain unproven.

This is meaningful earned preparation: **1,597,390 farm XP**, followed by11,000XP from the four actual target wins. Hero finishesL24/current XP18,072, Vitality97, Ice Blast20, Glacial Spike1, existing Frost Nova2/Fire Bolt4/Ice Bolt1/Warmth1, SP0/stat0. Rogue finishesL23/current XP161,092. The source's actual two owned hero items were equipped, all earned stat points spent on Vitality, and skill/combo changes happened only after completed farming challenges. Blood Crescent and the actual rare Rogue head/earned amulet were preserved; no preowned offensive upgrade was found in the read-only audit.

## Frozen attempt and costs

Preparation/source commit: `7e9b8e783b558b03da675f1b9575aad09071642e`. The source was clean and beforeImport/before/after fingerprints agree. Source tree `8e2bd8f5b7d2789d80633ac62a6977cc87f2c541c394fb62464f1d65ab304c2b`; data hash `a1c9be78af566f3c9bd9fd8df22b25d81423fc1ab43e591c07fac3a794eee851`. The [frozen plan](native17-v2-catacombs24-frozen-plan.md) hash is `09d5484c84c913912ad411dc7ed37f34caf7248709910979f9b8618975a84e22`.

The single process consumed **12,837,429ms (3h33m57.429s)** of production-default1× playback active time:11,551,929ms presentation batches plus1,285,500ms settlement pauses. Farming used12,696,564ms; target140,865ms. Simulation terminal durations sum11,090,491.6335ms. Host route elapsed177.983s; driver2tests passed in188.03s. These are distinct clocks; menu/travel/decision latency and measured browser pacing are not included. The frozen200launch/1200wave/5h45farm+15mreserve limits were not exhausted.

The clock began at authentic T0=1792497600000, advanced only by each recorded production timestamp-batch delay before actual playback and1500ms before sole settlement, and stopped at1792510437429. No supplied seed/ordinal, rehydration/reset between runs, offline bonus, favorable-seed wait or extra time was used. Catacombs native ordinals109–250 were followed by target ordinal251, seed689468558. Persisted next normal ordinal252.

| Target wave | Native result | Simulation time | Playback+settlement | Hero XP | Items |
|---|---|---:|---:|---:|---:|
| W1 | player / next-wave | 9,240ms | 11,099ms | 2,160 | 5 |
| W2 | player / next-wave | 12,935.0769ms | 14,925ms | 2,600 | 3 |
| W3 | player / next-wave | 27,720ms | 30,315ms | 2,940 | 70 |
| W4 | player / next-wave | 20,328ms | 22,421ms | 3,300 | 29 |
| W5 | draw / defeat | 60,000ms | 62,105ms | 0 | 0 |

All857 attempted waves played and returned exactly one settlement. Actual totals: **1,608,390 heroXP,1,206,189 RogueXP,2,199 items,1,899,278 rune shards,523 gem shards,2,623 wishstones**. All3,481 authentic initial owned IDs remain, plus2,199 unique accounted additions=5,680 owned items. No initial item was removed. Every wave's exact added item payloads, currency/XP deltas, recordings, teams, before/after hashes, clock schedule and settlement status remain in the ledger.

## Actual Radament W5 diagnosis

This remains a damage shortfall, with ample life and mana. Hero opens559HP/295MP and ends550HP/279MP; Rogue opens349HP/235MP and ends345HP/235MP. Radament isL22,9,304HP,DEF242,MR63,physical resistance25%,cold0%,fire50%,poison75%. FourL22 mummies and one summoned minion die. The boss loses **1,467HP (15.77%)** in60seconds.

The hero's actual frozen combo is Frost Nova2 → Glacial Spike1 → Ice Blast20. It casts Glacial Spike15times (141bossdamage), Frost Nova14times (10), Ice Blast13times (727). The first Ice Blast occurs5680ms and subsequent casts every4260ms. Rogue deals589bossdamage across Pierce/Basic/generic attacks. All event-attributed amounts, dodge/critical flags, cast times and effective teams are in the [summary](native17-v2-catacombs24-summary.json); raw damage events have no skill IDs, so attribution joins each source to its latest prior recorded action. These observations establish no victory for another combo, rank, equipment choice or farm duration. Independent design review found the following source-consistent mechanism. Hero attack speed 135 gives a 1,420 ms action period (`src/engine/combat/combat.ts:81`). Availability and first-ready selection (`:746`, `:788`, `:1294`) spend each action on one eligible skill, producing one Ice Blast every 4,260 ms despite its authored one-second cooldown. Rank-20 Ice Blast has raw 121–141 cold damage; cold resistance zero followed by MR 63 gives 58–78 on ordinary landed hits. Rank-1 Glacial Spike has raw 55–80, giving 1–17; rank-2 Frost Nova has raw 28–38 and reaches the landed minimum one. Rank mapping and scaling are in `src/engine/skills/dataCatalog.ts:150` and `scaling.ts:42`; literal skill definitions are in `src/data/skills/sorceress.json:355`, `:427` and `:37` respectively.

The default hit chance is 0.85 minus the boss's 0.05 dodge = 0.80 (`src/engine/combat/damage.ts:117`); resistance, flat mitigation and landed minimum are applied at `:153`, `:159`, `:169`. Attack is added only to effects with `attackDamagePct` (`combat.ts:440`), absent from these flat spells. Rogue Inner Sight reduces defense 25% (`src/data/skills/mercenary.json:220`, `combat.ts:434`, `:448`) and leaves MR unchanged (`:449`). Against boss DEF 242 and physical resistance 25%, ordinary arrows frequently reach the damage floor and critical hits supply much of the Rogue's 589 damage. All four mummies die by 4,620 ms and hero mana never falls below 273, so neither early adds nor mana starvation explains the remaining deficit.

The actual earned level-24 candidate therefore supports a source-backed **cadence, mitigation and progression-gate concern** after substantial lawful preparation. It does not establish that all builds fail, nor that an alternate combo, equipment choice or further farming wins. No additional candidate was run and no runtime tuning was made. A subsequent decision must address this observed deficit explicitly.

## Authentic native evidence

The live raw snapshot, exact production export string and independently decoded save were retained before caller cleanup. The economic capture contract passed: raw snapshot idle lastOnline remainsT0, export lastOnline equals1792510437429, while multiplier1/window0/offline0 and every field outside idle metadata agree. Raw snapshot hash `1c58287ae1390f29d2eca32408cdb97835b70dc545cb378d224dac0123ff2d3b`; decoded hash `aec6ab615c76a0a731a1bf3af008ce47f580713b13044d3fe91c449897ceb721`. Historical strict equality reports its expected idle-projection difference; it was not weakened. Capture before/after earned hash agrees at `cc68677491d38d1a59269ae885dcaffe1d4366d8a34bd4ebfdf7c40d09090bfe`.

The next authentic native input is [native export](native17-v2-catacombs24-native-export.json.gz): exact rawSHA256 `f11d60c1e05cc3d2f4f30603fd4667931eb720edba65ecada24c3ff407859978`, timestamp1792510437429, version17. Native saves omit transient HP/MP; future ordinary challenges construct their native resources. No browser, IndexedDB/public Save-Continue, offline protocol, full campaign or C2 acceptance is established.

| Retained artifact | Raw bytes | Gzip bytes |
|---|---:|---:|
| [Full ledger/report](native17-v2-catacombs24-attempt.json.gz) | 183,901,053 | 6,861,510 |
| [Native export](native17-v2-catacombs24-native-export.json.gz) | 2,452,888 | 69,357 |
| [Live capture envelope](native17-v2-catacombs24-native-capture.json.gz) | 8,825,859 | 307,377 |

Each gzip hasmtime0/no filename and exact raw roundtrip; complete raw/gzip hashes are in the summary. Execution, provenance, native publication and caller cleanup diagnostics are clear. Driver verified caller stores/methods, combat, hydration, Date.now and elite pity restored. The dedicated process exited. All previous experiments remain immutable.

## Validation and independent audits

Preparation had11 no-combat economic contracts plus the parser contract passing,8 existing save contracts and7 prior-continuation contracts passing, final typecheck/scoped ESLint/diffcheck passing, and concrete DESIGN READY plus QA READY. The actual opt-in run passed2tests with no execution/provenance/capture/publication/cleanup failure. Independent design and QA actual-evidence audits both returned **ADEQUATE**. Design independently checked raw/retained equality, formula attribution, the single target and zero W5 settlement. QA checked all 143 runs/857 waves, all production schedules/native seeds/ordinals/XP, 826 source manifest entries, exact item payload conservation, currencies, quest/staff custody, boundary actions, native projection and W5 action/resource attribution. The only initial payload changes were four equipment flags caused by the two declared swaps; no new loot was equipped. Both reviewers explicitly released the scratch evidence.

After all task processes exited and both readers finished, the four exact owned files (`report.json`, `report.json.native-export.json`, `report.json.native-capture.json`, `harvest.py`) and `/tmp/d2h5-native17-catacombs24.94GRDF` were removed with explicit portable file operations and verified absent. No scratch paths or cleanup failures remain. Requested compressed evidence, source/history and prior experiments are preserved. This result is ready for the parent to decide a source-backed next step; it authorizes no additional attempt.
