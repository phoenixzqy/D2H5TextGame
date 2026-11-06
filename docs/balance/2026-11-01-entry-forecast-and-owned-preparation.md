# Entry-level forecast and owned Javelin preparation

Status: CONCERNS. Six additional contexts are verified with two native seeds
each. No final balance cell or private-v1 gate is accepted.

## Select before simulating

The previous turn recovered Martial Act II by checking native target-entry
levels. Extend that method across the remaining 81 unmatched roles without
loading the 373 full cumulative reports or replaying campaigns.

`p15-build-act-entry-forecast-v1.ts` consumes the authenticated checkpoint index,
immutable native catalog and prior role-only refinement. For every eligible
checkpoint, it plans the actual areas at seed 1 and the checkpoint's own normal
ordinal. Eligibility requires the previous act's final Claim, the current act
unclaimed, and no known later-act Claim/clear/location.

Before each wave, forecast the hero level conditional on winning preceding
waves. Use production `xpTotal`, `xpForKill` and `awardXp`: saved experience is
XP into the current level, not cumulative XP. This forecast assumes multiplier
1, the death of original spawns with a living hero, and no intervening Claim.
It does not simulate combat, publish XP, allocate points or generate rewards.
Select the latest eligible checkpoint with an exact forecast entry match,
then area ID and wave index, without observing outcomes.

The batch makes 1,452 native plans in 8.894 seconds and finds six candidates.
The other 75 have no match under these indexed-source/seed-1/unit-multiplier
assumptions. This is not proof that no other seed, preparation or source can
work. Do not prescribe farming from this forecast alone.

## Native screen

For all six candidates, authenticate the full file and exported-save hashes,
decode/restore current production state, verify native act access and multiplier
1, preserve original gear/points/merc/priority, and attempt the entire area with
seeds 1/8. Only owned stash transfers prepare backpack capacity. Preserve native
preceding-wave XP, resources, statuses, drops and quest settlement. Discard all
projected income and state; no authoritative save advances.

All 12 starts reach the target with matching hero/enemy levels and role. Seed-1
enemy composition matches its frozen native plan. All observed prefix entry
levels and victorious XP awards agree with the forecast. Source review confirms
prior/current Claim boundaries and no completed later-act objectives.

| Build / act | Source level / ordinal | Area, zero-based target wave | Target wins | Victorious target times, seeds 1 / 8 |
| --- | --- | --- | ---: | --- |
| Bow / I | 14 / 179 | Catacombs, 0 | 2/2 | 16.260 / 9.756 s |
| Bow / II | 24 / 636 | Arcane Sanctuary, 0 | 2/2 | 12.526 / 14.658 s |
| Holy Bolt / I | 12 / 108 | Dark Wood, 2 | 2/2 | 20.440 / 33.580 s |
| Fire Sorceress / II | 15 / 123 | Rocky Waste, 1 | 2/2 | 5.820 / 5.820 s |
| Javelin / IV | 46 / 1024 | Plains of Despair, 1 | 0/2 | No victorious target; deaths at 22.100 / 19.200 s |
| Martial / I | 12 / 108 | Dark Wood, 2 | 2/2 | 24.684 / 30.492 s |

This is 54 native waves. Holy Bolt and Martial have observed target medians
above the proposed 20-second trash limit. Javelin dies with minimum target mana
415, so mana acquisition is not the missing capability. Two seeds cannot
establish a population win rate. Area outcomes and target outcomes stay distinct.

`p15-build-act-native-catalog-refinement-v2.json` cumulatively overlays these six
role contexts plus the prior Martial Act II context. Recipe counts are now
61 matched / 75 unmatched / 68 boss contexts requiring power review / 6 missing
source roles, totaling 210. The original catalog, prior refinement, 68/70 decoded
cells and accepted balance count zero remain intact. Failure does not erase a
valid matched input; matching does not imply a strong enough build.

## Owned Javelin controls

The selected source is `p15-javelin-act4-earned48-native-v2.json` (actual hero 46,
XP 794504, ordinal 1024), SHA256
`f68d3d45def279047057f45dd8e21d08024b1a988c13a270c1ab7837270273fe`.
Its priority is Lightning Strike only, despite already-paid Impale 8; it also
has 19 free skill points. Inspect the retained failures before any acquisition
or global tuning. Arcane/physical pressure and pack throughput matter, while
mana remains available.

Freeze two free order controls on the same source/seeds. Lightning/Impale is
the preferred candidate because it retains core AoE; Impale/Lightning is a
diagnostic. Each clears the target on seed 1 and dies on seed 8. Reuse the two
original Lightning-only failures; do not rerun them.

Next freeze a preparation using only the 19 earned points: Impale 8→20 costs 12,
Critical Strike 1→8 costs 7; retain Lightning 20 and Lightning/Impale priority.
Every allocation uses the native store action, returns `ok`, and is recorded.
No reset, new gear, stat allocation, material/currency spend, farming, level or
point grant. Exact source pools, merc equipment and original gear are retained.

| Policy | New skill-point cost | Target wins | Whole-area wins |
| --- | ---: | ---: | ---: |
| Original Lightning only, reused | 0 | 0/2 | 0/2 |
| Lightning / Impale | 0 | 1/2 | 1/2 |
| Impale / Lightning | 0 | 1/2 | 0/2 |
| Lightning / Impale 20, Critical 8 | 19 earned points | 2/2 | 1/2 |

The last policy's target times are 22.950/21.840 seconds, remaining HP 102/195
and minimum mana 401/390. It improves target survival, but observed timing and
the later area failure still prevent balance acceptance. A separate raw reader
proves exact equality of original prefix/target enemy teams within each seed
across all four policies, unchanged gear/stats/resets, and exact 12+7 point
debits. Native party carry and timing may change with the policy, as intended.
No surviving sample replaces a failed denominator.

The retained seed-1 area failure is later wave 4: Izual plus two Oblivion
Knights, all level 49 against hero 46. The hero enters at 229/791 HP and dies
after 22.5 seconds with minimum mana 395; logged direct incoming damage is
140 arcane, 85 cold and 2 physical. Preserve this distinction from the matched
level-46 trash target. Carry-life recovery and mitigation before that boss are
the next owned capabilities to review. Exact record:
`p15-javelin-act4-owned-late-failure-v1.json`.

The six extra preparation trials add 22 waves. Total new combat is 18 area
attempts / 76 waves; no 100-seed extension or holdout runs occur while these
power concerns remain. Native state and income are discarded throughout.

## Verification and next action

Scoped strict types/focused lint pass for the forecast and all new drivers.
An initial broad-string class typing error is corrected using the existing
campaign class union; emitted-JavaScript equality permits reuse of the executed
12-trial screen. Failed typing evidence remains. Reuse unchanged 210 BUG552 and
112 BUG553 checks. All 2091 production inputs remain unchanged. No broad suite,
campaign replay, agents, installs, commits, pushes or publication.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Key reports: `p15-build-act-entry-forecast-v1.json`,
`p15-build-act-entry-forecast-readback-v1.json`,
`p15-build-act-entry-screen-v1-readback-v1.json`,
`p15-build-act-native-catalog-refinement-v2.json`, and
`p15-javelin-act4-owned-preparation-readback-v1.json`. Exact closure:
`p15-build-act-entry-artifacts-v1.json`. Root retains these sources/methods and
the live human2 claim for umbrella acceptance. Root removes disposable evidence
after that acceptance and all consumers finish. Task configs are archived and
removed; own caches are absent and owned processes terminal.

The new failures make intended-power preparation the next action before larger
studies or boss retry certification. The late Javelin failure is reviewed;
compare complete owned recovery/mitigation/loadouts before acquisition or global
tuning; preserve all completed controls. Then freeze adequate fixtures and boss
adaptation/cost policies. Full 213-skill/identity acceptance, remaining build/act
coverage, 22 missing historical area cells, disjoint tuning/holdouts, acquisition/
economy/fairness/30–50 active-hour pacing and integrated release checks remain
open. Historical main-route completion stays 14/14. Browser works; CI excluded;
no pending answer or external blocker. The full goal remains active.
