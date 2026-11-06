# P15 — Martial retained damage attribution

2026-11-04. [BUG652](../../../production/bugs/BUG-652-martial-act4-throughput.md)
remains open. This investigation reads original failed observations only;
no combat, native preparation, browser, test or build is executed. No numerical
or selection change is adopted. The previous goal turn was status-only and
made no implementation progress.

## Damage and recovery

Original admissions 705–707 remain spent. Grouped native events distinguish
delayed Shock Web Lightning pulses from simultaneous ordinary actions. Tail
totals include its charge releases; the journal does not justify splitting
same-type strike and release damage.

| Original observation | 705 / Izual | 706 / Izual | 707 / preceding pack |
| --- | ---: | ---: | ---: |
| Hero actions | 53 | 53 | 55 |
| Cobra casts | 23 | 22 | 24 |
| Cobra casts at full Life | 21 | 21 | 9 |
| Minimum last-observed mana before Cobra debit | 495/500 | 495/500 | 495/500 |
| Actual Cobra mana recovery | 98 | 80 | 49 |
| Cobra direct boss damage | 20 | 13 | N/A |
| Fists direct boss damage | 4 | 4 | N/A |
| Web direct boss damage | 31 | 30 | N/A |
| Tail plus releases direct boss damage | 16,044 | 11,140 | N/A |
| Prayer Jab direct boss damage | 3,573 | 2,815 | N/A |
| Periodic boss damage | 6,820 | 4,016 | N/A |
| Remaining boss Life | 16,277 | 22,029 | N/A |

Every landed Cobra/Fists/Web boss hit is at the one-point mitigation floor,
including their critical hits. The hero's ordinary combat Attack is 274.7,
but the authored Martial skills above have scalar bases without an Attack
contribution. At the observed ranks, Cobra and Fists each roll 80–105;
rank-20 Tail rolls 2,350–2,380. Izual has Defense 363, Magic Resist 144,
50% Physical resistance and zero Fire/Lightning resistance. These facts
explain why increasing weapon Attack alone need not improve the core skills;
they do not independently establish a formula or priority implementation bug.

## Equipment lead rejected on current retained candidates

The recorded BUG664 preparation includes 124 weapon candidates, of which ten
are eligible and preserve claw affinity. Compare their existing native
equipment stats with a scalar cadence/critical score, removing the Attack
factor from the physical proxy and retaining native speed flooring/caps and
critical overflow. This is a relative equipment score, not measured skill DPS,
mitigation, rotation, survival or encounter acceptance.

The selected claw `it-3k9m-eh6` ties for the maximum scalar score with
`it-2k5ev-gax`. Both yield Attack Speed 178, Critical Chance .15 and Critical
Damage 2.46 before common mastery; the selected claw has LifeMax 1019 versus
999 for the tied alternative. Applying the common .005 mastery critical
bonus preserves the tie and ordering. No strictly better scalar candidate is
rejected. The proxy could behave differently for other inventories, but this
retained inventory supplies no demonstrated selection defect to fix.

## Verification, retention and remaining work

The original reader verifies every final HP value, hero mana and direct/periodic
metric total. Its first failure omitted HP-orb restoration; corrected accounting
uses the native floored, capacity-clamped formula and retains the failed reader
and error separately. A second root reader groups each unit's losses between
restoration boundaries and checks all 28 terminal unit HP values, all three
hero mana totals, action counts and boss damage conservation. It independently
reads the original journal and retained equipment decisions; it does not rerun
either controller or engine. Both successful reads exit zero in about 2.5 seconds
each. All eight original source/journal hashes and the retained equipment-report
hash remain exact. This is separate-method root verification, not independent QA.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-attribution-iwnwxnxl`.
Its 12 retained files include plans, successful and failed readers/executions,
attribution, ranking and separate readback. Manifest SHA256:
`c67e316fb3ab9299f845ad47a1944b18d571df48091a5680863bbd63422a73dd`.
Closure SHA256:
`535d13c1003d05f2fa27ed74e5afeb7c405ec7e46ab532b94ed2aa614de4325c`.
No task processes, servers, caches or disposable paths exist; cleanup failures
are empty. Root retains the exact packet and human2 through umbrella review
and owns eventual cleanup/release.

Do not reopen ordering trials, equip/preparation, training or attempts 705–707.
The rejected equipment lead shifts the next Martial work toward an explicit
balance/design decision about scalar builder and finisher throughput, grounded
in these damage/resource observations and D05's paid-charge identity. Preserve
current numbers and priority until that decision exists; no arbitrary buff or
silent selector change follows from this report. Other unfinished item/economy,
difficulty/endgame and app acceptance work remains available in parallel in the
backlog. Counts remain 14 intended Act I / 7 intended Normal / formal 0 of 210.
Full private v1 remains active and incomplete.
