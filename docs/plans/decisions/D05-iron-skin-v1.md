# D05 / P07a04A — authored player Iron Skin prerequisite

Status: GD/TD approve the narrow prerequisite contract. Exact draft and evidence
review precede commit. This increment supplies authored schema validation, an
independent immutable definition and allocation-only rank resolution. It activates
no runtime behavior and establishes no native, UI, browser or campaign acceptance.

## Controlling authored contract

Exact player `skills-barbarian-iron-skin`, with canonical allocation alias
`barbarian.iron_skin`, is passive/self/zero cooldown. Existing JSON defines
requiredLevel18, legacy minLevel1, maxLevel20 and defensePct0.04 per allocated
rank. Preserve that tuning; requiredLevel controls eligibility. This decision
explicitly supersedes the stale fixed +100% defense in skills-spec.md and both
locale descriptions. Correct their player-facing copy in a later increment.

The exact schema requires requiredLevel and closed scaling containing only a
closed passiveStatsPerLevel with defensePct. Unlock/cap are positive integers;
potency is finite and nonnegative. Alternative valid tuning, including zero,
is allowed without an invented balance ceiling. Optional passive is true,
aura and summon are false. Cost, damage, status, tag, synergy, heal, summon,
AoE and equipment-gate payloads are excluded. Other skill identities retain
their existing schema behavior.

## Independent definition and allocated rank

`resolveIronSkinDefinition(rows)` selects exactly one authored identity,
validates with strict Ajv2020 and copies/freezes only primitives:
`{requiredLevel, maxRank, defensePctPerRank}`. Retain no mutable input references;
never mutate or freeze caller data. Export IRON_SKIN_DEFINITION independently
of the mutable catalog and registry.

`resolveIronSkinRank(levels?, definition?)` accepts only the two exact aliases.
Take the maximum valid finite positive integer allocation once and clamp to
the copied cap. Invalid/missing allocations give0. Never sum aliases, infer
rank1 or use legacy skill/combo/marker/gear evidence as allocation. Class and
finite character-level eligibility remain outside this helper.

## Frozen later integration requirements

Only the player Barbarian at finite level at least the copied unlock receives
the passive from actual allocation. Apply a combat-only overlay once to freshly
equipment-derived defense without mutating authoritative player/save data:

`combatDefense = freshDerivedDefense * (1 + defensePctPerRank * eligibleRank)`.

Keep the existing base deriveStats floor; add no further floor. Then preserve
paid Frozen Armor, Melt and Inner Sight factors. Multiplicative Frozen Armor
composition is an explicit approved choice. A discriminator is fresh defense21,
rank1: defense21.84 makes incoming neutral100 deal78; premature defense21 would
deal79. Ordinary defense covers direct physical, fire, poison and thorns.
Cold/lightning/arcane retain magicResist. Dodge, resistances, outgoing damage,
speed, recovery and resources remain unchanged. Periodic formulas remain
unchanged; on-hit DoT potency may naturally follow its landed direct hit.

Ordinary allocation/equipment changes apply next wave. Explicit replay uses
current allocations/equipment over original resource pools and all three carry
baselines, with existing fresh clamps and no refill, drift or repeated multiply.
Introduce no action, cost, cooldown, marker or extra RNG for this passive.

Later UI/copy must state level18, +4% per allocated rank, cap20/+80% and accurate
current/next values. Display ranks must avoid legacy fallback and alias order.
These integration requirements are binding but are not implemented in Stage A.

## Scope and evidence

This increment owns exactly skill.schema.json, engine/skills/iron-skin.ts,
its test and this decision. No runtime/native/UI/copy/save/data tuning or
generalized passive framework belongs here.

Freeze and review schema-only oracles before execution. Preserve genuine schema
RED with production schema unchanged; distinguish already rejecting controls.
Apply the reviewed schema and record GREEN. Install the full reviewed test and
record missing-module collection failure separately from behavioral RED, then
implement the minimal helper. Run focused, engine, full unit, types, lint and
production bridge/build gates serially with the bounded runner. Retain failures,
corrections and fingerprints; independent review precedes commit. Passing these
gates grants no runtime or player-facing acceptance.

Security check: PASS. Local deterministic schema/JSON/typed allocation only;
no new network, credentials, dependencies, permissions, CI or save-format changes,
external publication or validation bypass. Exact-owned process/artifact cleanup
remains required. This decision authorizes no remote action.
