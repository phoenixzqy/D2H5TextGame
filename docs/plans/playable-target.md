# Playable v1 acceptance contract

Status: owner selected full game through staged checkpoints and **30–50 active
online hours** for a fresh first five-act clear. Canonical scope/invariants are inherited;
new numeric bands are planning defaults to ratify in P01 before tuning.
They are not measured current performance. Adjustments need a recorded reason,
before/after evidence and design/QA review; do not lower a gate to pass a result.

## The player promise

A new player can choose any of seven classes, understand their first useful
skill, fight and lose fairly, find and equip real upgrades, develop a distinct
build, clear all five acts through ordinary controls, and continue farming a
meaningful endgame. Closing, reopening or importing a save preserves earned
progress. Mobile, both locales and offline return support the same loop.

Good: a buff changes a measured stat or rule, its description explains the
change, and expiry/reload cannot duplicate it. Bad: a cast message appears but
the advertised effect never changes the battle. Good loot offers identifiable
choices and has attainable sources. Bad loot is abundant but unusable, invisible,
ineligible at actual spawn levels, or irrelevant to skill damage.

## Non-negotiable inherited rules

Keep pure seedable TS combat, JSON-authored tuning, attack-speed action order,
one protagonist plus one fielded merc and allowed summons, no movement/range
stats, no potions, no gold economy, and no purchased healing. Skills have at
least one-second internal cooldown, skip invalid actions/resources, and do not
recast active buffs. Summons/combo behavior must reconcile GDD and current data.
Offline accrues a capped next-online XP/MF window, never direct items or XP.
No new multiplayer, cloud saves, app shells, monetization or public deployment.

## Acceptance gates

| Gate               | Pass condition                                                                                                                                       | Proof                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| G0 Evidence        | Every v1 feature has an owner, status and observable test; every enabled skill has a disposition record; current results carry SHA/config/seed       | Feature matrix, skill contracts, exact command results; no unexplained skips or conditional bypasses                                      |
| G1 Integrity       | No silent loss/duplication of items, rewards, currency or progress; full-inventory awards recoverable; save/import latest state exact                | Boundary/transaction regressions; old-v7 save; immediate import then autosave; failure visibility; browser round trips                    |
| G2 Combat          | Every advertised skill implements its stated damage, healing, control, aura, passive, summon or utility behavior at rank 1 and cap                   | State/timestamp/damage assertions, negative eligibility/resource cases; 213/213 current IDs reviewed, zero enabled stubs                  |
| G3 Progression     | All five bosses and act unlocks reachable with earned gear/points; no softlocks; XP formula/table/reward paths coherent                              | Fresh-state campaign runs; exact per-act XP/level/time/attempt data; quest claim exactly once                                             |
| G4 Loot/builds     | Every reachable reward context has legal eligible content; rarity/MF/quest/boss behavior correct; builds materially differ                           | Exhaustive spawn-level×TC validation, seeded live-engine samples, equip→combat comparison, crafting/gacha sources and sinks               |
| G5 Experience      | First useful skill/combat/equip flow understandable; correct art and readable logs; all essential controls accessible on mobile/desktop and zh-CN/en | Browser tasks and screenshots at 360×640, 412×915, landscape, 1280×800, 1920×1080; keyboard/focus/contrast/touch checks                   |
| G6 Persistence/PWA | Latest save survives close/reopen, imports hydrate immediately, offline bonus bounded, warmed production game reloads offline                        | Controlled-clock/restart tests; failed import/storage tests; production service-worker test with network disabled and persisted character |
| G7 Finish          | Full v1 matrix accepted; every class has two viable distinct builds; post-campaign loop and rewards work; no open S0/S1 defects                      | Independent reviewer/QA approval, current-head required CI, full gate report, playtest acceptance and bounded soak                        |

All gates are conjunctive. A failed/unknown required gate cannot be averaged
away by a quality score. Optional improvements remain tracked S2/S3 with impact
and owner. A data-only skill removal does not satisfy G2 or shrink v1 scope.

## Proposed feel and pacing bands

Use actual simulated seconds for combat and active online seconds for campaign
time; also record player actions/turns separately. Do not include accelerated
UI playback as faster progression. First clear excludes AFK/offline time,
debug items/levels, reload exploits and test-bridge unlocks.

| Metric                      | Proposed target                                                                                                  | Measurement definition                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First success               | First useful skill + victorious introductory encounter within 5 minutes; first equip decision within 10 minutes  | Cold fresh-player task; count failed attempts and time reading menus                                                                                                         |
| Normal campaign first clear | Median 30–50 active hours; starting center 40 h                                                                  | Earned drops, explicit build/equip policy, ordinary UI; owner pacing supersedes the legacy 16 h first-clear target                                                           |
| Act checkpoints             | Starting cumulative medians: Act I 5 h, II 12 h, III 22 h, IV 30 h, V 40 h; each ±25%                            | Ratify with per-act level bands in P01; later acts' incremental durations are differences, not cumulative targets repeated                                                   |
| Build maturity              | After campaign, with a defined attainable build; daily-time target to reconcile                                  | Legacy two-week intent conflicts with 30–50 h at 60–90 min/day; P01 must publish a compatible daily-time assumption or revised maturity target and exact gear/skill criteria |
| Matched-level trash         | ≥95% win rate; p50 encounter duration 5–20 s, p95 <45 s                                                          | Each class/build/act fixture; no draw counted as victory                                                                                                                     |
| Matched-level elites        | 80–95% wins; p50 10–35 s                                                                                         | Appropriate earned gear; failures must be recoverable and explainable                                                                                                        |
| Chapter bosses              | 60–90% first-attempt fixture wins; ≥95% within three attempts with permitted adaptation; p50 20–50 s             | Reattempts include legal gear/skill changes, not a free random reset used as proof of strength; reconcile current 60 s cap in P01                                            |
| Damage safety               | No introductory trash single hit >30% starting HP; no untelegraphed unavoidable one-shot at recommended power    | Trace maximum hit and control chains, including elite modifiers                                                                                                              |
| Useful gear early           | Median first upgrade ≤10 min; then 1–3 equip-worthy decisions per active hour through Acts I–II                  | Compare to current equipped slots and declared build policy, not every drop; later acts target 0.5–2 decisions/h                                                             |
| Build diversity             | At least two mechanically distinct viable builds per class; no single build dominates all trash/elite/boss roles | A distinct build changes core skill/effect/gear choices, not only skill order; report each role and resource starvation                                                      |
| Class pacing fairness       | Median act clear time for each validated build within 0.75–1.35× cross-build median                              | Report outliers by class and act; do not hide weak classes in overall averages                                                                                               |
| UX feedback                 | Action acknowledgement ≤0.5 s; touch targets ≥44 px; no essential content clipped or horizontal page overflow    | Real browser at required viewports, keyboard/screen-reader and 200% zoom                                                                                                     |
| Soak                        | Two active hours including idle/farm/loot/save; zero crashes, unhandled errors or lost/duplicated rewards        | Record memory/log growth, inventory pressure, stop/restart and return; bound long-running logs/queues                                                                        |

Rarity percentages are deliberately not invented here. Derive them from upgrade
frequency, desired runeword/unique acquisition times, inventory pressure and
repeat farming targets in P01/P02. Final loot design must publish numeric
probabilities and time-to-acquire distributions for representative build goals.
No essential campaign unlock may depend on an unbounded rare random drop.

## Timing, retry and execution accounting

Encounter TTK percentiles describe **victorious clears only**, with victorious n
reported. Publish failed-attempt duration separately; a quick death cannot
improve a build's TTK. Win rate includes every started valid trial; draws and
timeouts are failures. Campaign throughput includes time spent on failed fights,
legal retries, recovery and farming, not only successful encounters.

Freeze the three-attempt adaptation policy in fixtures before evaluation: what
gear/skill changes are allowed, what they cost, how the player chooses them and
how RNG streams advance. Evaluate the entire sequence per seed; report both
first-attempt and within-three-attempt success, not three independent wins
cherry-picked from different fixtures.

Automated campaigns may advance a logical clock through production entry points
and shorten UI playback/idle waits. They must preserve actual action ordering,
combat durations, resource costs, earned drops, eligible idle cycles and rewards;
no XP multiplier, free gear/unlock, guaranteed victory or hidden state injection.
Prove clock-accelerated and ordinary-clock paths produce equivalent state on
short fixtures. This is a test transport, not a faster player progression mode.

Report logical active/economic hours, AFK/offline hours and execution wall time
separately. Economic time includes combat/idle elapsed time and a fixed,
versioned menu/decision-time policy calibrated against ordinary first-session
playtests. Do not count zero-time automated inventory decisions as realistic
player speed. Publish raw combat-only and decision-adjusted pacing estimates;
only ordinary-clock human sessions establish observed player wall-clock pace.

The final 100 campaigns ×14 builds at a 40-hour center represent about 56,000
logical active hours, not a requirement to wait that long. Seven browser campaign
runs may accelerate waits under the same contract and must be labeled accordingly;
live first-session/final-act tests still assess usability. P02 first benchmarks
one scenario and one campaign, projects full CPU/storage cost, sets shard/time
budgets, and starts small screening batches. Preserve partial progress when a
batch budget ends; do not spin unlimited workers or claim partial samples passed.

Challenge content checks cover distinct spawn-level/count/loot contexts and
boundary ordinals with a documented equivalence argument over the full period.
The current planner period is 360,360; naïve 29-area enumeration creates
10,450,440 plans before seeds. Enumerate the 13 count residues for 8–20 where
applicable plus independent affix/tier/level/boss boundaries; counts alone are
not a proof that every reward context is covered. Validate the partition against
production planning and separately cover idle RNG/pity states.

## Measurement protocol

1. Freeze fixtures: seven classes × two builds × five acts = **70 build/act
   cells**, each with trash, elite and boss contexts = **210 encounter cells**.
   Use actual map levels/spawns, deterministic gear provenance, legal allocated
   points, merc policy, summon caps, player priorities and starting resources.
   Initial/tutorial fixtures are an additional boundary set, not replacements.
2. Use production combat, spawn, reward and idle entry points. A test proxy
   with fixed damage, guaranteed kills or a handpicked three-monster pack is
   not the balance harness. Test manual and idle paths against the same state.
3. Explore with 100 seeds per encounter cell. Accept with 1,000 fixed tuning
   seeds (1–1,000) plus 1,000 disjoint holdout seeds (10,001–11,000). Partition
   deterministic RNG streams and record the derivation, not only a base seed.
   Freeze fixtures before using holdout outcomes. Changing design starts a new
   versioned evaluation rather than cherry-picking seeds.
4. Report n, wins/deaths/draws/timeouts, p10/p50/p90/p95 durations, HP/mana,
   damage by source, XP/h, items/h by rarity, upgrades/h and per-boss eligible
   equipment. Provide 95% intervals for rates; a band crossing an acceptance
   boundary is inconclusive and triggers a predeclared larger sample.
5. Loot: ≥100,000 live reward rolls per act/tier/MF profile, with zero/typical/
   high MF; deterministic forced-rarity and eligibility checks remain exact.
   For a rare event, require enough draws for ≥100 expected hits or publish
   an exact probability/enumeration plus an uncertainty bound. Never infer
   zero probability just from zero observed drops.
6. Campaign: at least 30 seeded fresh runs per class/build for screening and
   100 per class/build using disjoint holdout seeds for acceptance. Track cumulative and incremental act
   times, farming loops, deaths, level, quest progress and gear provenance.
   Endgame-ready fixtures alone do not establish that a new save can get there.
7. Browser proof: deterministic encounter/transition checks for every class
   and act on desktop/mobile; one unseeded or reproducibly seeded fresh full
   campaign per class using earned state; representative full mobile run;
   both locales on critical tasks. Test-bridge snapshots may set checkpoints,
   but must be labeled and cannot replace the fresh campaign.
8. Human playtest: fresh-save first 30 minutes and final act/endgame with
   the owner or a fresh tester. Record confusion, progression stalls, whether
   loot/build choices matter, and observed fixes. Automated gates do not
   certify enjoyment. If unavailable, report **automated-ready, playtest pending**.

Sample sets are sharded/batched outside the inner development loop. The producer
records runtime and storage budgets before starting them; a partial/timeout
report stays partial. Existing fast test scripts remain the iteration path.
