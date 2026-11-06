# D02 — Exact XP reference and bounded pacing analysis

Status: historical linear-reward baseline; exact level-cost reference remains valid.
Date:2026-11-03. Owner:root. Formal balance acceptance remains0/210.

The later [kill XP implementation](2026-11-03-d02-kill-xp-implementation.md)
supersedes this report's reward baseline for future settlements only. Retained
earned income, exports, source authorities and exhausted runs below are unchanged.
Its18.77h quotient describes recorded linear-reward throughput, not the new curve.

## Native calculation and implemented reward path

The retained `floor(100 * L^2.5)` per-level formula is unchanged. All90 native
costs and cumulative totals match independent integer arithmetic:
`floor(sqrt(10000 * L^5))`, summed after each integer cost. Native inverse
thresholds, values immediately below thresholds, upper level intervals and
the90 cap pass. The pure XP module is transpiled with installed TypeScript and
imported directly; no Vite build, dependency install, cache or combat is needed.
The calculation takes under1s. Full exact table is now in
[`progression-curve.md`](../design/progression-curve.md#2-exact-xp-table-l1--l90).

| Reached level | Exact cumulative XP | Prior document claim |
| ---: | ---: | ---: |
| 14 | 257,765 | 350,000 in pacing table |
| 26 | 2,390,989 | 1,700,000 in pacing table |
| 40 | 11,064,193 | 7,569,000 in XP table |
| 55 | 34,140,207 | 30,000,000 in pacing table |
| 56 | 36,383,607 | River evaluation target |
| 70 | 79,955,041 | about83,000,000 |
| 75 | 101,964,798 | about106,500,000 |
| 90 | 193,772,764 | about206,000,000 |

Winning-wave settlement uses `xpForKill(level) = max(5, round(10*level))`,
floored after multiplying each slain nonsummon's reward by the active idle
multiplier. It does not apply the old proposed tier/difficulty/item-XP factors
or the exported `xpScale` helper. Resolved enemy levels can incorporate
difficulty. Documenting that distinction is not a decision to implement the
old multipliers or the overlevel penalty.

## Earned River preparation income

The authenticated offensive report SHA256 remains
`0c348d2bd74b22155ba84ecdb23514c0594df13f4e55398eb155902dd2ccf62e`.
Read-only analysis joins retained River training attempts to their native wave
ordinals and reconciles each source's XP sum. It never simulates another wave.

| Source | Entries | XP | Combat hours | XP / combat-hour |
| --- | ---: | ---: | ---: | ---: |
| Durance | 109 | 3,381,390 | 4.667 | 724,579 |
| Plains | 21 | 607,350 | 0.946 | 642,188 |
| Dark Wood | 70 | 571,200 | 0.968 | 590,260 |

River preparation starts at22,786,490XP, requiring13,597,117 more XP for the
controller's level56 target. At the observed Durance rate, dividing that gap
by income yields18.77combat-hours, before the River/Chaos route and player
interaction. That quotient exposes the scale; it is not a promise of future
income or an instruction to run hundreds of additional entries. Levels, carry, draws
and source availability differ. The existing generous200-entry structural
bound already proves this exact preparation plan infeasible.

The owner starting checkpoint medians are cumulative5/12/22/30/40active hours,
so incremental chapter budgets are5/7/10/8/10hours. Simulated combat time,
actual player-active time and physical validation runtime are separate measures.
No conversion between them has been accepted. An18.77combat-hour preparation
estimate against the starting8active-hour ActIV budget is a design concern,
not an accepted population pacing measurement or a universal lower bound.

## Keep levels and rewards in the same decision

To illustrate the coupling, pair historical recommendation-boundary examples
14/26/40/55/75 with those five completion-time centers. These are **hypothetical
completion levels**, not selected targets or the latest earned levels:

| Completed act | Hypothetical level | Incremental XP | Incremental active hours | Implied net XP / active-hour |
| --- | ---: | ---: | ---: | ---: |
| I | 14 | 257,765 | 5 | 51,553 |
| II | 26 | 2,133,224 | 7 | 304,746 |
| III | 40 | 8,673,204 | 10 | 867,320 |
| IV | 55 | 23,076,014 | 8 | 2,884,502 |
| V | 75 | 67,824,591 | 10 | 6,782,459 |

Required income rises sharply with later level targets. Neither this arithmetic
nor one observed build selects a multiplier. Also, the earlier spec's ActV
entry55 and first-clear55 cannot serve as two independent progression targets.
The full challenge enemy maximum is a test policy, not a native hero entry gate.

D02's arithmetic/reference portion is now resolved. Its remaining correction
must choose chapter entry/completion bands, reward rates and source eligibility
together, against actual qualified combat and acquisition. Compare keeping
current rewards with lower justified hero-level bands, retaining higher level
bands with a coherent reward curve, and intermediate combinations. Judge each
by build viability, unlocked skill depth, earned equipment, total pacing and
economy; do not lower a target solely to obtain a passing campaign.

Before another bounded screen, publish the chosen prospective policy and its
source/rate/count feasibility check. Keep level costs unchanged unless a reviewed
curve change is justified. Never renew a spent budget or revive terminal1434/
original1235. New ranked fallback remains opt-in and does not by itself make
the old preparation target feasible. No new farming is authorized by this report.

## Reproduction and limits

Packet:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `d02-native-xp-reference-v1.mjs/.json` and exact table markdown: all90 native
  costs/totals and inverse boundaries independently verified; source hashes.
- `d02-earned-xp-pacing-screen-v2.py/.json`: original report hash, ordered
  source accounting and recorded rates;0admissions/0combat replay/0game mutations.
- Failed `d02-earned-xp-pacing-screen-v1.py` and its exit receipt remain. It
  incorrectly expected evidence phase `training`; native retained phase is
  `farm`. V2 corrects the reader's expectation and never relabels earned waves.
- BUG614 records the reference defect; BUG613 remains open for feasibility.

This changes documentation, not production XP or campaign results. It proves
neither earned ActIV/V completion, fourteen-build fairness nor30–50active-hour
pacing. No new certification cells. Browser works; CI excluded; no pending answer
or external blocker. Root retains the worktree and evidence through umbrella
review and owns eventual cleanup/release.
