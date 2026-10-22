# D04 v1f / P08a01 — production Fire Bolt fire-status family

Status: accepted bounded P08a01 slice11eb6b3 (worker ca66d0a), root/producer
plan/source/final review APPROVE, evidence ADEQUATE. BUG029 records RED/checks.
Combined head11eb6b3:1332unit/522engine pass, typecheck/lint/build pass;
34.49s full/7.17s engine exceed budgets. No full skill/C1 acceptance.
Source investigation by design
agent at7e5dcf8. This accepts a bounded mechanism, not fullD04/P08/C1/skills.

## Problem, sources and controlling behavior

Sorceress Fire Bolt JSON declares fire30–45,+4/rank,cost8,CD1s,burn and
dotPctOfDamage0.1. Production JSON registration overwrites legacy builders.
status.ts only configures ignite3s/max5; unknown burn gets1s/max1, and combo
recognition queries ignite only. D04 v1b already controls periodic integration
and aggregate refresh. Preserve authored Fire Bolt damage/rank/cost/CD and
current spell-base independence from weapon attack.

Treat burn and ignite as one family. New applications canonicalize to ignite;
configuration, lookup, getStacks, refresh and removal accept either name.
Legacy burn records remain readable without mutating snapshots/saves, changing
their stored rate/start/expiry or inventing rates for rate-less records. Refresh
finds the same family and follows accepted aggregate policy: original potency,
source/start, capped aggregate stacks5, max absolute finite expiry, existing
indefinite expiry stays indefinite. New Fire Bolt hits must not create separate
burn/ignite buckets. Preexisting duplicate family records are not globally
repaired or silently dropped; retain existing first-match read/refresh semantics
and test that alias handling introduces no additional record. All existing
periodic, control, death, boss and cross-wave invariants remain authoritative.
Fresh/replaced records use ignite; active legacy refresh retains its original
id/payload except accepted stack/expiry changes. Explicit removal matches the
family; it is not automatic deduplication or migration. A preexisting mixed
burn+ignite fixture must retain the other record/inputs and first-match policy.

A successful hit establishes max(1,floor(finalHitDamage*0.1)) damage/second per
stack, as current combat.ts does. No status on miss. DoT uses accepted overlap,
fractional carry and simultaneous death rules, without second resistance/crit/
combo. Engine emits actual HP changes; log/event presence alone is insufficient.
Burn/ignite both support existing physical×1.25/poison×1.15 combos (boss scaling
unchanged) without a new multiplier or damage-source abstraction.

Do not add implicit DoT rates to every fire skill. Firestorm's missing authored
rate, Amplify Damage, recovery, weapon/gear scaling/MR/rounding, multiple effects
and passive/auras are separate children. No data/locales/save/schema changes.

## Implementation and verification card

Design/engine worker owns only combat/status.ts, existing status.test.ts,
skill-resolution.test.ts, combo.test.ts and periodic-timing.test.ts. If source
requires another module, stop before expanding and give evidence for root review.
Root owns this control/ledger; worker additionally owns required BUG029 report.
Independent root/producer contract/source/evidence review precedes integration.
Worker uses own separately claimed human-pool worktree and preserves others'
edits; no original-checkout mutations or shared-claim substitution.

Three outcomes:

1. Actual registry-loaded Fire Bolt deals ranked hit plus3s burn. Freeze literal
   seeded expected HP/timing for rank1/max20 and main-RNG-independent comparisons;
   no synthetic replacement spell or deriving every expected value from output.
2. Alias lookup/application/stack cap/refresh/combo/removal work for new and
   legacy records. Mixed applications create one bucket, clocks/rates unchanged
   under accepted refresh, inputs immutable, replay results identical.
3. Mana failure, CD fallback, dodged hit, exact expiry/final interval and weapon
   attack independence behave correctly; test relevant rank/cost/CD boundaries.

Before runtime edits, genuine production spell/alias behavioral RED and BUG029
with exact environment/source/expected/actual. Run focused then engine/related,
full units/typecheck/lint/build and changed-module coverage. Record exact counts,
command exits, timing misses and warnings. This engine slice has no new browser
acceptance claim; ordinary learn/upgrade/effects/boss UI remains C1 work.
Track/remove exact owned dist/.vite/coverage/scratch outputs after reviewers;
preserve small durable decisive evidence, source/history and shared tool caches.

## Forward qualification — rate-less active records

The [accepted D06 Poison Explosion contract](D06-poison-explosion-v1.md) specifies a shared
active-refresh promotion rule. A Burn/Ignite marker lacking finite positive
potency may adopt a valid incoming rate/source and supplied optional type.
Preserve its stored alias, first-match behavior, capped aggregate stack increase,
original start, normal expiry and fractional carry. Valid-rate retention remains
unchanged. The old rate-less-refresh expectations are intentionally superseded
only at that boundary upon implementation; independent GD/TD/QA contract approval
is recorded in execution-ledger v1cc. No implicit rate
is added to a marker without a valid incoming payload. Historical acceptance
above remains a record of its original behavior, not proof of the new rule.
