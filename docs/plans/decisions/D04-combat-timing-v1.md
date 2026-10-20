# D04 v1a — Action cadence and inclusive combat deadline

Status: accepted scoped control, 2026-10-20; P06b only. Full D04 remains open.
Owners: game/technical design reviewer and engine integrator.
Sources: GDD §5.1 (attack-speed order and seeded ties), D04/P06 in the work
plan, and the existing `actionPeriodMs` / `MAX_SIM_MS` implementation.

## Controlling choice

Simulation milliseconds are authoritative. Content durations use seconds;
legacy five-second turn markers are presentation, not action counts or elapsed
seconds. Preserve the current action cadence for this correctness slice:

`periodMs = clamp(2500 - floor(attackSpeed) * 8, 400, 2000)`

The first action occurs after one period; subsequent actions are scheduled one
period after the preceding action. AS75/100/150 have periods 1900/1700/1300 ms.
This explicitly supersedes the proportional `1000 / attackSpeed` cadence and
its examples in combat-formulas §3.1. It is a compatibility choice, not a claim
that these numbers meet campaign balance targets; tuning requires later review.

The battle deadline is **60,000 ms inclusive**. Actions scheduled exactly at
that instant remain eligible. Continue through tied actors unless an actual
victory ends combat or the existing runaway-action safety cap intervenes.
Never advance to an action after the deadline. An unresolved contest times out
with an end timestamp of exactly 60,000 ms and `winner: null`; it is not victory
and does not authorize victory rewards. A victory before the deadline retains
its actual end timestamp. Existing result fields remain compatible.

The smallest upstream correction checks the next scheduled timestamp rather
than the previous clock. Merely clamping an overshooting event would still
execute an ineligible action; merely stopping before it would report an early
timeout. Changing only `<` to `<=` would still overshoot on the next iteration.

## Scope and deferred temporal rules

This child changes only the scheduler deadline. Existing insertion-order ties,
damage RNG, rewards, cooldowns and status handling are preserved. GDD seeded
ties remain required by a later child; this record does not approve the current
tie implementation as the final design.

The wider D04 temporal target is a later implementation contract: status
activity `[appliedAtMs, expiresAtMs)`, final-interval integration before expiry,
no damage before application, fractional damage carry, advancement of every
affected unit, scheduling at lethal/expiry boundaries, and simultaneous death
marking before rewards/healing/actions, with hero death taking defeat priority.
Effects through the deadline must eventually resolve before deadline actions.
Boss control multipliers must eventually apply in milliseconds. None of these
is implemented or accepted as verified by P06b; current actor-only DoT bugs
remain open. Moving expiry below damage alone cannot satisfy that contract.

Weapon/spell scaling, damage-source metadata, mitigation, damage-derived DoT
rates, status aliases, healing and leech remain separate D04/P08 dependencies.
No numeric damage or duration tuning, content rewrite, save change or result
API expansion belongs to this child.

## Verification

Fixed-seed durable-unit fixtures prove AS100 has 35 actions per actor through
59,500 ms, with end at 60,000 and no 61,200 ms event; AS263 has 150 actions per
actor including both deadline ties and no 60,400 ms event. Further cases prove
a lethal deadline action ends combat before a remaining tied action, an early
victory keeps its timestamp, and repeated recorded/normal runs agree without
mutating input. These tests do not certify periodic status integration.

Implementation/reproduction: `production/bugs/BUG-006-combat-deadline.md` and
`src/engine/combat/deadline.test.ts`. Review approval applies only to this
scoped deadline/cadence decision, not the unfinished D04/P06 workstreams.
