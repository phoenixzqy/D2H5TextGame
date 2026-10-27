# D04 — Amazon Inner Sight paid Defense reduction

Provisional author contract, 2026-10-26. Independent design/QA and earned
balance remain open. No source promotion while the preceding area checkpoint
is frozen. Original native seed7 rank1/20 diagnostic is RED: ally100Physical
versus50Defense hits50 with and without paid Inner Sight; mana95/96 proves
that the native skill paid. See the support task's canonical diagnostic receipt.

## Overview and player fantasy

A learned early support action opens a finite damage window for the Amazon,
mercenary and summons by lowering actual enemy Defense. Preserve the existing
active all-enemy identity; no passive damage bonus or accuracy bonus is added.
Current copy incorrectly implies Defense controls hit chance; the actual engine
subtracts ordinary Defense from direct Physical/Fire/Poison/Thorns damage.

## Detailed rules and formulas

Preserve unlock1, cap20, no equipment restriction, 5MP minus0.05/rank and CD3s
minus0.05/rank (rank20 actual rounded4MP/CD2s). Use authored25% ordinary Defense
reduction for8000ms, constant across ranks. This is a provisional author default
matching the existing Rogue effect; ranks improve existing payment/cooldown.
Remove the inert active passiveStatsPerLevel and unrelated amp-damage tag.

One eligible paid native action applies an immutable finite packet to every
original living hostile, all tiers, without damage/hit/dodge/proc RNG. Allies
and dead units excluded. Native ownership/level/prerequisite/rank/mana/CD/no-live-
target eligibility remains authoritative. Subsequent cooldown-eligible casts
replace this family's source, potency and interval; no stacks. Source death
does not cancel a paid effect. Active interval is [start,expiry); bare, future,
expired or malformed packets confer no reduction. Ordinary wave rebasing applies.
No spread, personal buff, cleansing-curse identity, extra damage or save field.

At the common pre-hit projection, use the larger of active Amazon and Rogue
Inner Sight reductions exactly once. With authored25% each, neither double-
reduces Defense. Existing Armor Melt and Battle Cry multiply independently.
Defense=max(0,baseDefense*(1+existingDefenseBonuses)*meltFactor*
(1-max(AmazonPct,RoguePct)/100)*battleCryFactor). Preserve fractions until the
existing final damage floor. Attack100/Defense50 yields62 (rather than50),
Defense21 yields84 (rather than79); cold/lightning/arcane remain on MagicResist.
Dodge, crit, resistance, cadence and existing periodic rates remain unchanged.
New hit-derived DoT naturally captures its ordinary final direct hit once.

## Edge cases and dependencies

Strict schema/types -> exact JSON row -> validated debuff adapter -> copied
paid status -> shared Defense consumer -> source-backed current/next/MAX
preview and en/zh-CN descriptions -> native and public production save/offline
proof. Reuse existing status clocks and data shape; no generic new subsystem.
Data metadata requires finite positive duration and Defense percent in(0,100].
Exact row excludes unrelated status fields, damage, tags and passive/aura/summon.

Test rank1/20 actual allocation/equipment/payment; living target tiers; no mana,
rank0, wrong class, level and CD; exact onset/expiry/recast/rebase/source death;
legacy bare marker and forged packet controls; Rogue composition and status
identity preservation; Armor Melt/Battle Cry; all seven direct types, no-status
control, fractional Defense/minimum damage; replay and input immutability.

## Tuning and acceptance

JSON owns25%/8000ms and existing MP/CD growth. Potency is a feel knob (0,100],
duration is a positive finite pacing knob; no measured balance acceptance yet.
SkillsScreen shows current/next/MAX duration, Defense reduction, MP/CD, and
explains actual supported damage types and strongest-with-Rogue behavior.
Production English/Chinese desktop/mobile must perform a paid cast and display
its hostile status via public controls, with exact save/online/offline pairs.
Native numerical/temporal checks establish damage; screenshots alone do not.
No whole-app mobile/a11y, full campaign/build viability or full-v1 closure claim.

## Implementation plan and author challenge

1. File native RED bug and this contract before source. Add <=5-path strict
   schema/data/definition/tests increment; focused tests then engine check.
2. Add <=5-path effect/status types/adapter/application/projection increment;
   promote focused native/consumer regressions, test before next increment.
3. Add source-backed preview/copy/UI and lifecycle/public proof in bounded
   increments. Run required combined checks once at final support checkpoint.
4. Retain decisive evidence; clean only exact task-owned paths; update only
   proven inventory credit. Keep current goal/worktree active.

Plan review:ready after adding explicit strongest-with-Rogue composition,
precision and truthful hit-chance copy; no material unresolved implementation
question. This is an author plan challenge, not independent review approval.
Security check:pass; local first-party gameplay/data/tests, unchanged dependency,
credential, CI, networking and save format; no genuine campaign/replay or remote
publication. Root is sole writer; independent acceptance remains open.


## Implementation checkpoint

Schema/data/definition30715967;paid native Defense consumer bcb809ed;composition/
localized chips e714e91d;actual en/zh preview e4fc315f.97new focused cases pass,
including pure rank model. The first seed7 tied ally hit precedes the cast and
correctly remains50;later landed5100/6800/8500ms hits62,and10200ms after expiry50.
Do not infer effect from the tied first-hit probe. Existing Melt1.25 Physical
combo composes normally(final111 vs107). Exact failure/oracle/config corrections
are retained in [evidence](../evidence/d04-amazon-inner-sight.md). Integrated engine/
full static,lifecycle/public acceptance and independent/earned balance remain
open. No skill-inventory credit yet.
