# P15 — Earned Summon Druid Act V after beast-rank correction

2026-11-04. The preceding status turn made no implementation progress. This
closure uses retained outputs only; no combat, preparation or product check is
repeated. Full private v1 remains active and incomplete.

## Fixed route and actual successor

The prospective plan pins the genuine level49/next720 Act IV successor,
Grizzly20/Dire10/Spirit10/Raven4, Oak10/Heart1 and Prayer. Oak8 describes the
earlier Act IV entry, not this source. At most one admission per main Act V
area, conditional on preceding victory, stops at the first nonwin. No training,
retry, respec, gear experiment, earlier-act replay or renewed closed budget.

| Area | Ordinal | Outcome |
| --- | --- | --- |
| Bloody Foothills | 720 | Six victories; Siege Claim |
| Frigid Highlands | 721 | Six victories; Rescue Claim |
| Crystalline Passage | 722 | Six victories; Prison Claim and separate scroll Read |
| Ancients' Way | 723 | Six victories, then Ancients draw at 60 seconds |

Four admissions, 25 waves, 24 victories and one draw; no unplayed staged wave.
Throne was never entered. Actual successor is level50/next724, XP into level
915200, Raven6/Oak10/Heart1. Sixteen new ordered Act V actions end after Rite
Start. Rewards add 1664303 hero XP and 249 items; 235 items are salvaged with
reconciled materials. No socket insertion occurs.

Combat takes 447337.9153354381ms, driver 10346.14139ms and measured launcher
15546.487160027027ms. Cumulative costs, including the predecessor exactly once:
724 admissions, 16466434.85016471 combat ms, 496448.204456 driver ms and
637798.7110901005 reserved execution ms. The latter includes both advisory
feasibility launches once: failed V1 4726.928542135283ms and accepted V2
5055.959316901863ms. Advisors grant no admissions, combat time or earned XP;
their driver time is already contained in launcher reservation.

## Verification and diagnosis

Scoped helper types/lint/preflight, five negative controls and accepted readerV1
already pass. Reader reconciles ordered item custody, currency/material/hero XP/
points, party resources, action order/services, clocks/seeds/ordinals, predecessor
authentication, exact native export and unchanged 2209 production/134 campaign
inputs. Initial optional skillLevels type failure is retained, not hidden.

Supplemental retained-journal accounting independently sums Prayer's 1225721
wave XP plus 22500 quest XP: 1248221 total, progress 3580425→4828646, level31
unchanged. Inactive Rogue progress stays exact. The initial supplemental
assertion omitted quest XP; its corrected assertion includes both sources
without changing reports, reader or gameplay.

Ancients end with full hero 1245 life/643 mana; no resource starvation. One
Ancient dies at 50.740s; two retain 17374/22188 life. Level75 enemies have
467 Defense/50% physical resistance; Shout adds 30% Defense for five seconds
with five-second cooldown. Grizzly's ordinary hits are 431 without Shout/291
with it, 9293 direct damage total. Dire ordinary hits fall 83→1; Spirit ordinary
hits are 1. Prayer contributes 11456 direct damage. Independently summed damage
events match every allied direct-damage metric. These observations match authored
flat mitigation; no selector/engine defect or further tuning decision is proven.

Accepted read-only feasibility V2 estimates up to 548 training victories to75
then 114 to82, conditional on victories. This conservative 662 estimate exceeds
the existing 200-per-area/600-total envelope; it does not prove actual training
cannot fit and does not authorize farming or renewed budgets. Failed V1's
treasure-count assertion remains historical.

## Evidence custody and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-act5-b99gu3d4`.
Main stem `p15-druid-fixed-act5-v1` retains frozen inputs/plan, driver/reader,
checks including failures, journal, report, native export, summary and closure.
Source export SHA256:
`a76b76da02293fd7a070b771ec047929d5c33cd5cc95452cb7d8c0f56e5021c8`.
Successor SHA256:
`5308aca886f5a2ea41153babc9de258396472e66cf5c38e2589e6051fe56db7b`.
Report SHA256:
`dfa088ab22ddbc3d65df74668ec111b3e6fe495369156a185da38ad3442c7cfd`.
Accepted reader SHA256:
`0ec08ffea085456db9e7cdfdb41793de65fb94d46979c9b320a2095d4e4f9c35`.

All 20 recorded owner/child PIDs are absent. Exact active type config and launcher
cache are absent; no remaining disposable paths or cleanup failures. Root retains
this required packet and human2 through unfinished umbrella review, then owns
exact cleanup and worktree release. No installs, new agents, commits, pushes,
publication, broad suites or builds.

BUG708 stays open for remaining Normal progression. Counts remain14/14ActI,
8/14Normal and formal0/210. Six builds, acquisition/crafting/economy/pacing,
higher difficulties/endgame, PWA/a11y/performance and independent final acceptance
remain. Browser works; CI is excluded; no pending answer or external blocker.
Extended human playtesting follows implementation.
