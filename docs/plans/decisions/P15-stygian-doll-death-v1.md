# P15 — Stygian Doll death explosion

Bounded private-v1 mechanic/catalog repair; BUG417/BUG087. Existing user
authorization applies. CI excluded, browser launch resolved. No publication,
dependencies, save migration or player Corpse Explosion changes.

## Contract

The original living, unowned enemy Stygian Doll binds once after starting ID
registration settles. Its native marker (canonical or authored alias) authorizes
one explosion on its first primary hostile death. Initially dead, duplicate-ID
overwritten, later entrants, other archetypes, owned/summon, orphan-only and
genuinely converted-at-death units cannot acquire this power. Appended elite
skills are allowed. Fabricated Conversion status alone cannot change allegiance.

Use explicit on-death trigger, zero cooldown/MP/corpse cost, authored 35–60 total
budget split equally physical/fire. Share one spell hit/base/crit decision per
target; mitigate, absorb and floor each component separately (roll35 →17+17).
No Ignite or Attack scaling. Preserve native damage modifiers and spell dodge.
Ordinary Attack35.2/+5.5, melee, base AS120→1540ms; remove WeakMelee only.
Update only the monster skill descriptions in both locales.

Capture authentic hostile allegiance before lethal HP writes; periodic uses
the existing final-interval convention, including Conversion expiry equality.
Close/mark/emit the entire primary/orphan death set before bursts. Use private
synchronous frozen-source authority in the real damage pipeline while the real
source stays dead. No action/cast, resurrection, projectile/armor disguise or
public dead-source flag. Target current living effective opponents; temporary
victory cannot skip bursts. Hero death stays sticky, reward bodies stay present.

Queue each batch's ordinary-effects/corpse-publication tail before dispatching
bursts; nested deaths close immediately and enqueue their own tails. Outermost
owner drains FIFO only after all bursts return, clearing transaction in finally.
No eligible burst and no transaction retains the immediate existing path.
Burst neither consumes nor duplicates shared corpse supply.

## Validation and limits

Pin living cadence/no active cast (both selectors and replacement aliases),
direct/periodic/reflection and simultaneous deaths, last-enemy hero defeat,
eligibility, Conversion/expiry, shared mixed rolls/odd flooring/shields, corpse
ownership, immutable/plain/recorded/A-B-A replay and actual City Damned W6
seed7/ordinal0: 13 L53 Dolls (rare leader +12 rare minions), source retained.
Run bounded before/after diagnostics with unchanged no-Doll recording controls;
report adverse changes without treating this as earned balance acceptance.
Strict types, scoped lint and affected native regressions close this increment.

Plan/root-cause review: death trigger replaces the active stub at its source;
private authority and nested-tail transaction avoid revival and recovery races.
Read-only design adviser confirms FIFO closure/drain contract. Security check:
local engine/data/tests only, no credentials/network/permissions/dependencies.

## 2026-11-05 current-source fixture correction

The thirteen-Doll result above is historical. Current City Damned W6 is an
authored single L53 rare treasure Doll (Attack482); treasure encounters preserve
their authored roster. BUG787 also corrects the converted-victim fixture's
lowest-life setup while retaining every death-tail assertion. Both failures
reproduce against exact pre-Fire-Enchanted source; both corrected cases pass.
See [current evidence](../evidence/p15-fire-enchanted.md) and BUG787. Historical results are not rewritten or
credited as current balance acceptance.
