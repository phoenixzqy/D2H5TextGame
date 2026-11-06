# Intended Cold Sorceress Act V partial checkpoint — 2026-11-03

Successor, 2026-11-04: [the first direct Ancients attempt](../plans/evidence/p15-cold-direct-act5-suffix.md)
consumes ordinal1224, wins four waves and draws on wave five. The authoritative
successor is now73/next1225; no new claim or Baal attempt. This checkpoint and
its exhausted preparation history remain retained. Statements below describe
the earlier checkpoint before that direct attempt.

The earned continuation advances from Act IV level61/next896 to level73/next1224.
Bloody Foothills, Frigid Highlands and Crystalline Passage clear on their first
route attempts; 16/19 main quest actions complete. Siege, Rescue and Prison are
claimed, Malah's potion and resistance scroll consumed, and Rite started.
Ancients and Throne/Baal have never been attempted. Act V remains incomplete.

## Accounting and stopping condition

328 admissions comprise325 training and3 route entries. All1825 settled waves
are accounted for:1824 victories and one draw, no staged unplayed wave.
XP47339727;19717 added items;19718 salvaged; no socket insertion.
Combat27385474.106408183ms, driver298403.23222199996ms and
launcher304225.59206793085ms. Cumulative1224 admissions,
96382241.17566428 combat ms,949420.831891 driver ms and
1001439.6154840943 execution ms, including the original60000ms reservation.

Ancients preparation exhausts its200-training-admission allowance at73,
below the declared75 target. A draw at1060 triggers the historical permanent
Dark Wood fallback; low XP exhausts the bound. Closed preparation/process limits
do not renew. No completed quest route is replayed.

## Verification and diagnosis

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix`p15-cold-earned-act5-v1`. ReaderV3 passes full native export equality,
ordered item custody, currency/material/XP/point accounting, quests, clocks,
seeds, ordinals, training controller and authored level projection. All2151
production and131campaign inputs are exact; combat was not replayed.

Original reader/plan and failures remain. V2 normalizes only zero currency
entries in reward comparison; V3 corrects its invalid every-wave Prayer
assumption. Prayer dies in admission1060 wave0 and is correctly absent for
the following3waves. Every fresh admission must field the exact Prayer merc;
later waves preserve ordered living non-summon ID/kind/life/mana/aura from the
previous final party. Eight helper probes cover valid carry/death and reject
missing, lost, revived, resource-altered or wrong-aura mercs.

The draw at1060/wave3 has16Static Field casts but only one Blizzard and one
Frost Nova. First-eligible skill priority and Static Field's nonlethal damage
suggest a profile rotation defect; no production damage/AI defect is established.
Both bounded priority comparisons are now rejected. Blizzard/Nova before Static
leaves12survivors; Blizzard/Static/Nova leaves2survivors (1121and75HP). Both
draw at60s. The exact original control reproduces; three diagnostic battles
cost13925.74501503259ms wall time in total. Neither order is adopted, no further
order tuning is authorized on this snapshot, and no global AI/damage defect
is established. Diagnostic artifacts use prefixes`p15-cold-finishing-order-v1`
and`p15-cold-supported-blizzard-v1`; closure is`p15-cold-earned-act5-v1-closure.json`.

Authoritative save:`p15-cold-earned-act5-v1.native-export.json`, SHA256
`ac686babe873063392f100ec9778357721274d45c8f65593db7eebf84b0dec71`.
Native/launcher/readback are terminal. Root retains the required packet and
claimed human2 worktree through umbrella review and owns eventual cleanup.

Formal balance remains0/210. This accounting does not independently derive
damage/drop laws, spawn planning or equipment scoring, establish population,
holdout or pacing acceptance, or convert an incomplete route into a clear.
All14 intended Act I clears, Cold Acts II–IV, main Corpse/Bone Normal completion
and Javelin Acts II–III remain valid. Full private v1 remains active/incomplete.
