# D05 / P07b01 — paid player Frozen Armor

Status: GD/TD, producer and QA approve the bounded contract and Stage A tests.
Stage A adds representation only. Runtime and native-boundary acceptance await B/C.
This does not close full private v1, C0–C4 or G0–G7.

The exact authored `skills-sorceress-frozen-armor` / canonical
`sorceress.frozen_armor` pair is an active self buff. Learning it, importing its
combo entry or supplying a bare marker grants no power. The distinct mercenary
variant supplies neither player potency nor a melee restriction. CombatUnit has
no class field; exact identity means this skill pair, without new class/kind gates.

JSON retains unlock1, ranks1–20, mana7, cooldown4s, mana/rank−0.1,
cooldown/rank−0.05 and defense fraction0.03 per rank. Rank1 grants3%, rank20
grants60%; the defense coefficient multiplies rank, not rank minus one.
These are current tuning controls, not schema constants. Schema requires a
finite nonnegative coefficient, positive integer cap, active/self identity,
positive cooldown, mana cost and exact marker. It excludes passive/aura/summon,
offensive damage and unrelated passive stat modifiers, without an invented
upper balance ceiling. Existing JSON needs no tuning edit.

## Allocation, snapshot and defense

One shared resolver accepts only finite positive integer allocations under the
two exact aliases, takes the maximum valid value, then clamps to the authored
cap. Missing, zero, negative, fractional and nonfinite values allocate nothing.
The same resolved rank drives eligibility, mana/cooldown scaling and capture.
An independently copied frozen definition owns potency; mutable catalog or
registry edits must not change its copied coefficient/cap.

An actual eligible paid cast grants optional immutable combat-only
`frozenArmor: { rank, defensePct }`. No save field, migration, authoritative
stat mutation or generic buff framework is added. No stacking or active recast.
A bare marker without a valid paid snapshot neither grants effects nor blocks
the first legitimate paid cast. Positive allocation changes and combo removal
retain the captured potency. Fresh equipment changes the base defense only.

Shared pre-hit ordinary defense is
`max(0, baseDefense * (1 + capturedBonus) * meltFactor * innerSightFactor)`.
Retain fractions until the existing final damage floor. Magic resistance,
periodic rates, HP/MP and authoritative stats are unchanged.

## Retaliation and native lifetime

Each landed direct positive-damage hit chills its still-living attacker once,
using pre-hit armor eligibility. All direct damage types, including direct
thorns, qualify. Misses, zero damage, periodic ticks and future reflection
callbacks do not. A lethal hit on the wearer still retaliates. Order is direct
damage, existing offensive statuses, Armor Chill, ordinary death closure.
Retaliation deals no damage and consumes no additional RNG draw. Reuse canonical
Chill duration2s, speed reduction50%, half-open activity, refresh/source and
boss/scheduling policy exactly once; do not duplicate status tuning.

Potency lasts indefinitely within a native run and carries across qualified
waves. At each existing playWave configuration boundary, including replay,
zero/unlearned allocation strips snapshot and exact markers from the new input
only. Preserve the stored replay baseline/recording. New run, repeat, stop,
flee, death and reload grant no carried armor into another run. Resource pools
are never replenished by configuration changes.

## Ordered implementation and evidence

Root owns all writes/execution in the claimed umbrella worktree. Independent
agents review read-only. At most five writable repository files per increment.

1. A: exact skill schema, independent definition, frozen schema/definition/rank
   tests, optional CombatUnit shape and this decision. No runtime activation.
2. Separate two-file prerequisite: existing combat/non-recast and Warmth alias
   positive fixtures receive explicit rank1; retain every original assertion.
3. B: effects metadata, exact catalog adapter, coherent cast/projection/Chill
   engine path, registry tests and dedicated combat tests.
4. C: native boundary invalidation and dedicated integration proof, with any
   ordinary browser route separately reviewed. Full P07b01 requires C.

Schema-only tests are frozen and run without a missing-module import first.
Preserve genuine schema RED, then separately freeze/append definition tests and
record the missing-module capability failure. Behavioral RED and a structured
BUG precede runtime changes. Preserve an entire unaffected prepatch recording
as a frozen regression control. No weakened assertions or unreviewed oracle
corrections. Validate focused/engine/full unit/types/lint/clean production
bridge/build under existing bounds; record timing misses and limits honestly.
Retain failed evidence, archive and independently review before exact task-owned
cleanup. No seed search, recipe tuning, campaign/balance or new coverage claim.

Security check: PASS. Local deterministic combat state; no credential, network,
permission, dependency, save-format or validation-bypass changes.
