# Corpse and curses — earned Act V population screen

BALANCE-CHECK: CONCERNS

2026-11-03. Owner: root. The fixed exploration sample completed **100/100
whole-area victories**, including all eight original Throne/Baal waves per
seed. This establishes repeatable conditional viability of this earned input.
It also exposes excess strength against the first-attempt boss target. It does
not accept an encounter cell or private v1.

## Frozen input and execution

The input is the genuine level 75 pre-Throne export already authenticated in the
[native Act V completion report](2026-11-03-intended-corpse-act5-completion.md):
`p15-rite-handoff-native-v1.native-export.json`, SHA256
`b317ae7723621924b79a48270f428f074ad22fedf05c6d9cafdf5ec2f019dc0b`.
Each isolated trial restores its exact bytes before production build preparation.
Earned gear, paid sockets, mercenary, formation, points, and inventory overflow
remain intact. The existing area policy selects learned Amplify Damage followed
by Corpse Explosion. No equipment search, expenditure, grants, training,
adaptation, retry, or earlier-act replay occurs.

The plan and driver/launcher/initial-reader hashes were frozen before execution.
Exploration seeds are exactly 1–100; explicit challenge ordinals are 1657–1756.
Production resolves the seven original finite Throne packs and Baal. It retains
native resources, cooldowns, summon policy, XP, rewards, and quest proofs between
waves. Each seed is independent of other seeds' rewards. Native default ordinal
1657 stays unchanged inside each diagnostic realm. Holdouts 10001–11000 remain
untouched. This is a new conditional measurement, not a resumption or reset of
any terminal progression controller.

The run seed enters the production plan RNG. Enemy/combat wave seeds are
`(runSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0`; ordinary loot uses
`runSeed ^ 0x9e3779b1 ^ waveIndex`, retaining the native wishstone forks.
No replacement RNG or combat harness was introduced.

## Observed results

| Measure | Result |
| --- | --- |
| Whole-area starts / wins | 100 / 100 |
| Win-rate nominal 95% Wilson interval | 96.30–100% |
| Defeats / draws / hero deaths / mercenary deaths | 0 / 0 / 0 / 0 |
| Hero-death-rate nominal 95% upper bound | 3.70% |
| Baal reached / unreached failures | 100 / 0 |
| Whole-area victory time p10 / p50 / p90 / p95 | 93.32 / 99.91 / 105.78 / 107.34 s |
| Baal victory time p10 / p50 / p90 / p95 | 16.4 / 18.8 / 21.6 / 22.8 s |
| Settled original waves / verified carry transitions | 800 / 700 |
| Original hostile members checked / quest transitions checked | 3,700 / 200 |
| Native terminal exports fully reconstructed | 100 |
| Zero-mana waves | 0 / 800 |
| Minimum observed wave mana p10 / p50 | 604 / 604 |
| Hero actions: basic / Amplify Damage / Corpse Explosion | 17,723 / 3,121 / 2,734 |
| Observed XP / items across diagnostic realms | 24,430,200 / 6,737 |
| Items by rarity: normal / rare / set / unique | 6,413 / 285 / 20 / 19 |
| XP / items per logical combat hour | 8,811,817 / 2,430 |

Duration percentiles use nearest-rank victory-only observations. Every started
seed stays in the whole-area denominator; no boss was omitted because it was
unreached. All consumed combat time stays in yield/cost denominators. These
yields describe this mature manual checkpoint, without town/preparation time,
and cannot establish fresh-campaign pacing or acquisition fairness. Zero mana
is an observation, not a complete skill-starvation measure. Upgrades/hour and
cross-build relative power were not measured.

The 60–90% first-attempt boss win band and 20–50 s boss median from
[the playable target](../plans/playable-target.md) are not met by this input:
the win-rate interval lies above the upper target and the median is 18.8 s.
The checkpoint contains substantial earned preparation. This screen alone
cannot distinguish an overly strong mechanic from excessive fixture investment
or certify that this is typical affordable first-entry power. Do not select a
coefficient adjustment from these outcomes alone. The next balance step is to
freeze affordable first-entry power/acquisition policies for the intended role
fixtures before expanding tuning or touching holdouts.

## Evidence and bounds

Root retains the exact `p15-throne-population-screen-v1` artifacts in:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
They include the frozen plan, driver, memory-only launcher, result, gzip journal,
process receipt, original reader, retained reader-failure receipt, corrected
`-readback-v2.py`, and passing `-readback-v2.json`.

Plan SHA256:
`57a69352ff7d1825376f74e3d31179efdf7e630ab489fad5332818928f710a27`.
Result SHA256:
`a9ff0ceec9686ae851b9cede9fb8accc7e83490be2da554f99936d019dbc3b43`.
Passing reader SHA256:
`c9cff5b9c406e88f5172dca9d56e41657f62cc6680763828221979154d47b245`.

The separate reader reconstructs each whole native export from the common
input, recorded preparation, every settlement delta, and the authored quest
transitions. It verifies all original hostile memberships, living-hero wins,
HP/MP carry, ownership, rewards, clocks, and unchanged default ordinals. Native
drop bags and per-kill XP remain production input evidence; their probability
laws are not independently certified. This is root verification, not an
independent QA/reviewer sign-off.

One original reader failure is retained: it expected `seed` at the top level of
`trial-result`, while that record nests it under `trial`. The versioned correction
reads the actual schema. No combat or native action was repeated.

Frozen limits: 100 admissions, zero training/retries, eight waves/admission,
600,000 combat ms/admission, 60,000,000 total combat ms, 600,000 driver wall ms,
660,000 launcher wall ms, 90,000 reader wall ms, and 128 MiB each for journal and
result. Actual costs: 100 admissions, **9,980,770.608 logical combat ms**,
161,792.123 driver wall ms, 20,122,946 journal bytes, and 15,386.466 reader wall
ms. No staged combat was left unplayed. Launcher receipt confirms completion;
its PID is absent. No disposable build/cache was created.

Production source remains frozen at tree SHA256
`09d2a0005b017ecfccc908c907ae2dfcbd01edd196c3b72bc8f8fe8bd00d8f7d`:
2,149 production and 125 campaign/contract paths were reauthenticated. Existing
353 affected functional passes/types/lint remain valid; no source changed and
no unrelated tests ran. Documentation link checks are separate from gameplay.

## Continuation and remaining scope

Only genuine continuation authority remains
`p15-eve-claim-native-v1.native-export.json`, SHA256
`74d41e2b3a95172f244c2b34b50096b16835ba18190a6a4062b19240623f50c1`,
next ordinal **1658**, level 75, all 19/19 main quest actions claimed. The
diagnostic realms do not add their loot, XP, clocks, or admissions to that save.
Their costs above remain separately disclosed.

Formal balance remains **0/210**. BUG-611, BUG-592, intended-build fixtures and
populations, acquisition/fairness/pacing, adaptation/manual-idle/defeat-retry,
remaining Hell/endgame, and integrated private-v1 gates remain open. Browser
works; CI is excluded; owner playtest follows implementation. The preceding
status-only goal turn made no progress; this turn adds executed population and
readback evidence. Root retains the required packet and claimed human2 worktree
through umbrella review and owns eventual artifact cleanup/worktree release.
