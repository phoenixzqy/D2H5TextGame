# BUG-731 — Reconcile Duriel challenge at the earned level-32 checkpoint

- Severity: Medium; measured balance concern, gameplay remains available.
- Status: Open; encounter corrections and provisional pressure tuning implemented,
  challenge/acquisition/pacing acceptance remains.
- Owner: root acting as game-designer/qa-engineer; no delegation.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current source tree
  `441be64f42573072076f7acb4ba5929c22609d80f0da407a893e67835aadb8e1`.
- Environment: Node native production entry points on WSL; browser, viewport
  and locale do not apply. This is diagnostic service evidence, not browser QA.
- Seeds: screening 1–100 inclusive, manual and idle independently; no holdouts.

## Reproduction

1. Use the exact earned Double Throw level-32 save and fixtures frozen by
   [P15 screening v1](../../docs/plans/decisions/P15-throw-act2-checkpoint-screen-v1.md).
2. Admit the entire native Tomb of Tal Rasha at saved-next ordinal 452, idle
   elite misses 0; carry native party resources/cooldowns through the prefix.
3. Inspect the retained 200 trial observations in
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-throw-act2-screen-qms4rpxa`.
   Reproduction uses existing results; do not renew the spent screening budget.

Expected: investigate against the chapter-boss goals of 60–90% first-attempt
wins and victorious median 20–50 seconds in
[playable-target](../../docs/plans/playable-target.md). Level 32 is the selected
initial Act II completion reference, not accepted typical acquisition.

Actual: all 100 trials in each mode reach and defeat the level-32 Duriel. Median
boss duration is 10.980 seconds in both modes. Each mode's unadjusted 95% Wilson
win interval is [0.9630065, 1], entirely above the desired upper win boundary.
There are no area defeats/draws or hero deaths. Prefixes resolve trash level 27
and elites through level 31; this is not an isolated full-health boss fixture.

Evidence: [screening report](../../docs/plans/evidence/p15-throw-act2-checkpoint-screen.md),
the packet's `native.json`, journal and passing separate `readback.json`.
The source is one earned gear/skill/Prayer state after 452 admissions. It does
not establish cross-build difficulty, first-clear acquisition or all ordinal/
pity populations. Do not select or weaken the source based on these outcomes.

The [cross-build baseline](../../docs/plans/evidence/p15-act2-earned-cohort-screen.md)
now retains 2,400 further attempts across twelve other earned level-32 builds,
manual/idle seeds 1–100: all 14,400 waves won, zero deaths/unreached bosses.
Boss medians span 6.9–27.3 seconds; mercenary contribution and acquisition
differences remain explicit. Bone's level-24/manual adaptation stays separate.

BUG-732 subsequently restores the chapter's discarded native Frost Aura and
passes focused verification. The baseline predates that correction and cannot
establish current-source acceptance. BUG-733 now restores Duriel's specified
[Freeze immunity](../../docs/plans/evidence/p15-duriel-freeze-immunity.md), with116
affected tests and desktop/mobile native playback passing. The baseline predates
both corrections. Continuous Aura cadence still needs reconciliation with the
Duriel design; preserve Frozen Terror's separately specified active wave. Wider
challenge root cause and tuning are unresolved; no formal balance signoff.

BUG-734 now reconciles the specified passive Aura with28focused tests, strict
types/lint and native desktop/mobile playback passing; see
[passive evidence](../../docs/plans/evidence/p15-duriel-passive-frost-aura.md).
The active restoration is superseded. The baseline predates all three fixes.
The [corrected paired diagnostic](../../docs/plans/evidence/p15-duriel-corrected-paired-screen.md)
now passes:24wins/144waves,zero deaths,all120prefix waves exactly paired.
Single-seed boss durations5.731–23.225s/hero incoming1–8remain diagnostic.
Do not renew spent24/2,400attempt budgets. BUG735adds a newly specified Attack
component for shared Charge. Representative first-clear acquisition/mitigation
and challenge tuning remain open;more HP alone does not fix the damage floor.


## Earned route-first melee diagnostic — 2026-11-05

[Three-source qualification and Swing evidence](../../docs/plans/evidence/p15-act2-earned-representatives.md)
adds one actual-power melee continuation. Hero15/Prayer17 defeat Duriel in32.550s;
hero minimum416.77/472.77HP(88.15%),69incoming offset by69skill healing, full
finish. Physical resistance57/defense170.98 are observed earned projections,
not injected power. Branch11admissions/7.22combat minutes/one Arcane defeat;
combined Acts I–II combat1.06146h. No population acceptance or boss-wide tuning
conclusion follows. Bow/Swing remain distinct lineages. Fire/Druid first-entry
sources qualify, but explicit manual-policy/cost mapping precedes their runs.
Challenge, acquisition/mitigation and active-hour pacing remain unresolved.

## Earned route-first caster/summoner diagnostic — 2026-11-05

[Completed continuation evidence](../../docs/plans/evidence/p15-act2-caster-summoner-route-first.md)
retains Fire's Dry Hills nonwin and Druid's full ActII clear. Druid15/Rogue18
defeat Duriel in33.840s; hero minimum466/526HP(88.59%),60incoming and26effective
orb healing. Summons absorb most incoming damage and provide most output.
Fire never reaches Duriel; cold/lightning pressure dominates its route defeats,
while minimum Mana stays298–323. Starter targets and a monotone gear policy
limit that result; actual resistance alternatives have speed/defense/other-
resistance costs. Neither branch proves a monster defect or accepts population
challenge. Next inspect native owned equipment/available-point adaptation
without combat. Do not renew spent attempt budgets or replay these histories.
BUG741/742fix diagnostic accounting only. Challenge and pacing remain open.

## Owned Fire adaptation inspection — 2026-11-05

The prospective zero-combat inspection is complete: six already-owned gear
choices improve the fixed mixed-threat score with explicit stat tradeoffs;
four available points raise Fire Ball8→12. Native captures, custody and outer
realm restoration pass, as do scoped strict types888files/zero diagnostics and
explicit lint. No combat is executed and Fire's exhausted three-attempt Dry
Hills sequence remains a nonwin. This proves legal adaptation exists, not that
it wins or that Duriel/route tuning is correct. Do not renew historical budgets.

## Provisional paired pressure tuning — 2026-11-05

[Pressure implementation](../../docs/plans/evidence/p15-duriel-pressure.md)
authors Tomb chapter Attack350(previously220) and Duriel critical damage1.25×
(previously default1.75×). The generic optional multiplier is validated before
RNG use and preserves defaults; ordinary Duriel/replays use the same authored
override. Six retained hero/mercenary entry projections explain why increasing
Attack alone is unsafe for two companions. They do not prove global safety or
accepted balance. No HP/global mitigation/Charge/loot/save retuning is included.

52distinct affected cases, strict scoped935files/zero diagnostics, changed-file
lint, strict38monster/six-sub-area validation and constructed Chromium native
schema/construction/Charge checks pass. The stale chapter numeric aura assertion
is repaired under the existing BUG767 follow-up; original failures are retained.
No earned attempt, screen or retry budget was renewed. All historical cohort
results predate this tuning and cannot accept current-source win probability,
duration, acquisition or human pacing. BUG731 remains open for that work;
historical14/14Normal/210sources/formal0/210 are unchanged. Root retains the exact
named packet and cleanup receipt linked above through full-v1 acceptance.
