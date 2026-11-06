# P15 — Zeal completes earned five-act Normal

2026-11-04. Zeal wins all five Act V main routes on their first attempts,
claims all five main quests, earns the Baal title and unlocks Nightmare.
The verified successor is hero level 82 / Prayer level 80 / next Normal
ordinal 1168. **14/14 intended builds have now completed Normal; formal balance
acceptance remains 0/210 encounter cells.** Full private-v1 acceptance is open.

The run starts from the exact [qualified Act IV save](p15-zeal-earned-act4-completion.md).
It preserves the intended profile, earned gear and resources, native clock-derived
seeds, and all prior failures and spent allowances. The fresh Act V controller
uses previously cleared training sources and bounded retries. Earlier completed
main routes were not replayed. No production code or tuning changed.

| Observation | Result |
| --- | ---: |
| Admissions / training / route | 261 / 256 / 5 |
| Settled waves / victories / nonwins | 1,644 / 1,644 / 0 |
| Route ordinals, in authored order | 907, 932, 1034, 1088, 1167 |
| Combat ms | 25,093,672.78720447 |
| Hero XP / actual Prayer XP credited | 90,518,903 / 67,888,719 |
| Items awarded / salvaged / socket insertions | 16,739 / 16,623 / 6 |
| Native execution seconds / retained-output readback seconds | 237.611 / 39.904 |

Scoped strict TypeScript, launcher syntax and zero-gameplay preflight pass.
The prospective retained-output reader passes on its first execution. It
reconciles all waves and native seeds, ordered item custody, paid salvage and
socket inputs, currency/material balances, hero/mercenary XP, allocated and
unspent points, party resources, and the complete native snapshot/export.
It checks all 19 quest actions, five claims, consumed potion/resistance scroll,
inherited quest graph, Baal receipts, title and Nightmare unlock. The independently
reconstructed training/route totals match the driver's audit summary.
Production/campaign inputs and realm/clock restoration remain exact.

Before source freeze or gameplay, review added the explicit audit-summary
comparison and removed an unused Act IV filename variable. Original unlaunched
reader/plan/manifest/freeze files remain in the packet as `*.unlaunched-v1`.
No native output was edited or replayed. Root's separate accounting review is
local verification; it does not establish independent final QA, population
balance, first-attempt win rates or measured human active-time pacing.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-zeal-earned-act5-tu_qkug2`.
Root retains it through umbrella acceptance and owns eventual exact cleanup.

| Artifact | SHA256 |
| --- | --- |
| `plan.json` | `45e9a0ecad67fa89cb8d3f57568952bc63423e744ab2ab97b2b93ed9c0d6fbc9` |
| `reader.py` | `bb367f352788a96579357e3d08692978906578a442ad2587cab91bb9e7010ee9` |
| `report.json` | `b452d4eddf74bc2dd38766288b86a937e3c7bbd655fdc2064ffa413aba9f57b7` |
| `native.journal.jsonl.gz` | `f8ae86901186c4ebb43259862d13d2db90f132c26cebafe4fdbae72b223df83c` |
| `native-export.json` | `008bfa2e6074d1f0c3bc98f9ddb468b8ac3bc2f13cdaba6d9293a57bd8686b8a` |
| `readback.json` | `d3651b3fcbdb4164fb64a16e580ae28ce0372baaf6e844aac134331f549a1cd6` |

Cumulative lineage costs are 1,168 admissions / 72,123,712.83316697 combat ms /
1,112,890.374551 driver ms / 1,186,122.9853632394 execution ms, within the
original 1,800-admission / 216M-combat-ms / 1.5M-execution-ms envelope.
All eight recorded freeze/preflight/native/readback PIDs are absent. Task cache,
active compiler config and Python cache are absent; the executed compiler
config is archived. Packet size before closure is 67,451,611 bytes, below its
224 MiB cap. Cleanup failures: none.

Next work is broader balance/economy/pacing and integrated difficulty, endgame,
app/device/accessibility/performance/soak acceptance. This result completes the
remaining intended Normal campaign, not C3/C4 or the full objective. No browser,
CI or unanswered user question holds the work.
