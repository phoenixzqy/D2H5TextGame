# ADR-012 — Track projectile flight in the combat timeline

## Status
Proposed,2026-10-26. Author implementation proposal; independent technical,
design and QA signoff remain open.

## Context
[Slow Missiles](../plans/decisions/D04-slow-missiles-v1.md) promises real slower
projectiles. Current damage resolves synchronously in castSkill; a permanent
marker has no flight consumer. The engine is pure seedable TS with an explicit
simulation clock and no movement/range stats. Existing unrelated skill contracts
explicitly retain immediate text-combat abstractions.

## Decision
Add opt-in JSON normal-flight milliseconds for the explicitly listed hostile
missile skills and a private empty-per-battle queue of remaining flight work.
Split progress at existing status/periodic boundaries and new impact boundaries.
Eligible paid finite Slow Missiles changes progress rate without changing launch
cadence. Impact invokes existing damage/status/death settlement at that clock.
See the controlling mechanic contract for RNG, target, death, ties and caps.
No queue, paid binding or flight progress is persisted or accepted from input.

## Alternatives considered
- Dodge or attack-speed debuff: does not implement projectile flight.
- Fixed delay selected only at launch: cannot slow already-flying projectiles or
  restore normal speed after finite expiry.
- Spatial projectile/movement simulation: adds prohibited stats and unnecessary
  geometry/collision systems for text combat.

## Consequences
Positive: deterministic real flight and reversible mid-flight speed changes;
shared current mitigation/status/death authority; no save migration or UI timer.
Negative: explicitly opted-in enemy impacts shift by their authored baseline
flight even without Slow Missiles, so native regressions and campaign/build
balance need fresh acceptance. Impact-time offensive stats are deliberate;
offense snapshotting would be a separate contract change. Immediate unmarked
skills remain immediate; this is not generic player projectile simulation.

## Compliance
Literal timestamps/HP/status/payment/cadence/death/replay assertions, strict
Ajv schema/adapter tests, production browser/offline proof and engine purity.
Queue must be private to battle State; no serialized snapshot/result/save field.
Sources: repository [combat design](../design/combat-formulas.md),
[skills spec](../design/skills-spec.md),[target](../plans/playable-target.md),
and existing src/engine/combat/combat.ts timeline and damage pipeline.
