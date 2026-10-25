# D04 — Cloak of Shadows paid Blind and personal defense

2026-10-25. Author contract for [BUG211](../../../production/bugs/BUG-211-cloak-of-shadows-missing-blind.md).
Root sole writer/reviewer; independent design/QA and earned balance remain open.
The complete C0–C4/G0–G7/seven-class/private-v1 objective is unchanged.

## Behavior and provisional tuning

Preserve unlock12/cap20/Psychic Hammer prerequisite, all-enemy targeting,
13MP base with -0.1MP/rank above one and CD3 with -0.05s/rank above one.
Use ordinary cost rounding (ranks1/2/20 cost13/13/11MP) and cooldown floors.
One action and payment apply a personal Cloak and Blind to all currently living
hostile recipients. There is no damage, healing, hit roll or guaranteed action
interruption. Later spawns do not inherit Blind. Effective allegiance continues
to govern recipient selection. The Cloak marker belongs to the caster, not foes.

The existing description promises Blind and defense but supplies neither a
duration nor Defense coefficient. Author provisional tuning explicitly in the
validated skill row: both effects last8000ms; personal Defense increases3% per
rank. Keep the existing0.5 percentage points/rank critical chance and magical
dodge as paid Cloak bonuses, never free allocation passives. These numerical
choices are new author tuning, not historical design facts or balance acceptance.
Defense stacks additively with other ordinary Defense increases and retains the
shared mitigation types (Physical/Fire/Poison/thorns). Critical overflow and dodge
floor stay shared. Base derived stats never change or accumulate.

Blind uses the existing shared20 percentage-point ordinary Physical/thorns hit
penalty and5% floor. Magical hit probability, damage mitigation and action
cadence are unaffected by Blind. Explicit8000ms overrides Raven's shorter default
without changing Raven tuning. Blind has no boss duration reduction, consistent
with the existing Blind contract. Reapplication refreshes one canonical marker.

## Authority and lifetime

Fresh actual Assassin allocation, level, exact authored/canonical aliases and
recursive prerequisites establish cast rank. Priority alone, wrong class,
malformed/out-of-cap ranks and contradictory registry definitions grant nothing.
Reject invalid definitions/resources/cooldowns before payment. Paid state is a
separate immutable source-bound finite payload, not Burst's statBuff payload.
Validate/copy carried payloads at registration; malformed, foreign, future or
expired payloads confer no power. Valid paid potency survives subsequent rank
changes/respec within the same run and rebases across waves without refreshing.
Reject recasts while a valid paid Cloak is active; after expiry allow normal
priority/resource/cooldown selection. Bare activeBuffIds cannot extend its life.
No paid status, timer, rank snapshot or bonus is added to persistent saves.

## Verification and presentation

Write native failing tests before repair. Prove actual Blind events and causal
Physical hit changes, unchanged magical behavior/cadence, paid Defense damage
reduction, critical and magical-dodge effects, expiry/recast and no prepayment
bonus. Include ranks1/2/20, aliases/class/prerequisites/resource refusal, immutable
seeded replay, carried state and exact playback. Preserve Burst/curses/Raven.
Pure unlearned/current/next/MAX display and both locales must describe the real
paid effects, durations, target scope and rank scaling. Public browser allocation,
priority, cast, Save-close-Continue at mobile/desktop precede inventory credit.
Run focused/engine/full/types/lint/build; retain failures and cleanup receipts.

Plan review: ready. The adapter must emit both self buff and hostile Blind;
generic multi-debuff forwarding alone would leave the defensive promise missing.
Security check: pass; first-party local gameplay/data, no credentials, dependency,
permissions/CI, genuine campaign action or remote publication. Reviews are by the
author; independent acceptance and earned balance remain open.
