# Martial Act II target-entry refinement and Bow power review

Status: CONCERNS. One additional role has complete conditional 100-seed
exploration. This does not accept a build/act cell, final balance or private v1.

## Martial source selection

The original catalog's Martial Act II source is level 19/ordinal 246, whereas
its nearest trash context is level 18. The newest earlier level-18 checkpoint,
`p15-martial-act2-route-native-v4.json`, is natively planned at its own ordinal
244. Seed 1 selects Dry Hills zero-based wave 2, all enemies level 18. Two
whole-area trials, seeds 1/8, both win; native preceding-wave XP raises the
hero to 19 before the target. Exclude both from matched-level coverage despite
their victories. Retain the records; no larger cohort uses that source.

The next newest eligible checkpoint is
`p15-martial-act2-route-native-v3.json`, SHA256
`48c8edc6c05f3808581406935f6070867f26c8900f6434077d13d6394f30b5dd`.
It has hero 18/XP 90320/ordinal 242 and the prior Act I Claim. Current production
decoding, restoration and native planning at 242 select the same area/role/wave
without looking at outcomes. Preserve this checkpoint's original gear, points,
merc equipment and Tail/Fire/Cobra/Talon/Tiger priority. Source selection changes
because of actual entry-level mismatch, not because of victory or defeat.

Seeds 1/8 now retain hero 18/enemies 18 at target entry. Freeze the same fixture
for remaining seeds 2–7/9–100; reuse the first two trials. Every trial restores
the complete source, attempts the whole area and retains native preceding-wave
XP, resources, statuses, drops and quest settlement. Only owned stash transfers
prepare backpack capacity. No gear/point/reset changes, currency/material spend,
farming or authoritative earned-state advancement. Projected income is discarded.

All 100 areas/500 waves clear. All 100 targets are reached, retain the intended
trash role and match hero/enemy level 18. No target death/draw/unreached target
or observed zero mana. Conditional Wilson 95% win interval is 96.30–100%.

| Target | Wins | Victorious p50 | Victorious p95 | Minimum target MP |
| --- | ---: | ---: | ---: | ---: |
| Dry Hills wave 2 trash | 100/100 | 5.795 s | 8.828 s | 192 |

These observations fit the proposed trash timing/win bands, conditional on one
earned source and ordinal. Intended gear power, original advertised build
identity, acquisition fairness and final disjoint tuning/holdout acceptance
remain open. Combat-only whole-area XP is 2.623M/h; menu/decision/acquisition
costs are absent, so this is not campaign pacing acceptance.

The frozen conservative budget scales the entire 8.208-second two-area process
cost, including startup, with 25% contingency: 502.745 seconds for 98 areas,
within the 900-second budget. Actual remaining execution is 36.459 seconds.
Total matched 100-run execution is 44.667 seconds; the two excluded trials take
7.959 seconds. No completed trial or prior campaign is replayed. Holdouts remain
untouched. Independent raw readers audit all 102 new areas/510 waves, source and
equipment custody, target-entry levels, combat events, stream derivation,
resources and settlement.

`p15-build-act-native-catalog-refinement-v1.json` is a role-only overlay on the
immutable original catalog. It replaces only Martial Act II trash with the
new source/context. Recipe counts become 55 matched / 81 unmatched / 68 boss
contexts requiring power review / 6 missing-source roles, totaling 210. The
other Martial elite/boss selections and 68/70 decoded cells stay as recorded.
These are recipe dispositions; accepted balance cells remain zero.

## Bow power decomposition

Reuse the existing Bow Act III 200-area cohort without new combat. Current
production gear/passive composition and the registered Multiple Shot effect
give these exact stat projections from its earned level-31 save:

| Quantity | Original gear | Empty gear arithmetic |
| --- | ---: | ---: |
| Sheet Attack | 160 | 142 |
| Combat Attack after passives | 214.4 | 190.28 |
| Life maximum | 548 | 440 |
| Mana maximum | 369 | 192 |
| Defense | 286 | 110 |
| Physical dodge after passives | 49% | 35% |
| Physical resistance | 47% | 0% |

Dexterity is 145. Penetrate/Pierce multiply Attack by 1.34. Multiple Shot rank
20 supplies 268–288 flat damage plus 760% of Attack, producing 1897.44–1917.44
before multipliers, crit and mitigation. Attack supplies 85.43% of mean raw
damage. The actual level-3 training bow adds 18 sheet Attack; its contribution
is 9.61% of total mean raw damage. Weapon-only and full-gear Attack agree:
nonweapon equipment primarily supplies defense/resources in this snapshot.
Empty/weapon-only/remove-one views are arithmetic comparisons, not played
loadouts or evidence of survival without gear.

Existing target events confirm the same 214.4 Attack and original ranks/order
in all 200 trials. Median hero share of logged direct outgoing damage is 93.26%
for trash and 92.64% for elites. Logged amounts can include overkill and omit
periodic source attribution; they are not actual HP-loss shares. Direct incoming
trash hits reach only 1 point, while elite direct hits reach 65; these figures
exclude periodic incoming damage and do not certify damage safety.

Keep the elite 100/100 balance concern. This review identifies strong rank/core
offense and defensive acquisition as separate contributors; it does not justify
changing the global provisional curve before comparing additional earned
build/act/boss sources. No gameplay tuning occurs in this increment.

## Verification and continuation

External drivers pass scoped strict types and focused lint. An initial optional
rank-property typing failure is corrected with a type-only assertion; emitted
JavaScript equality proves the executed stat/plan report can be reused. Failed
check evidence remains retained. Reuse unchanged 210 BUG552 and 112 BUG553
checks. All 2091 production inputs remain unchanged. No broad suite, install,
agent, commit, push or publication.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Key reports: `p15-fixture-power-refinement-v1.json`,
`p15-martial-act2-exploration-aggregate-v1.json`,
`p15-build-act-native-catalog-refinement-v1.json`,
`p15-bow-act3-power-events-v1.json`. Exact closure:
`p15-fixture-power-refinement-artifacts-v1.json`. Root retains the required
packet and live human2 claim for umbrella acceptance; disposable configs are
archived/removed, own caches absent and owned processes terminal.

Next refine the remaining encounter contexts and intended gear/build power,
then freeze boss retry/adaptation costs and further eligible exploration.
Historical 14/14 main routes, 22 missing historical area cells, full 213-skill
acceptance, acquisition/economy/fairness/30–50 active-hour pacing and integrated
release checks remain open. Browser works; CI excluded; no pending answer or
external blocker. The full goal remains active.
