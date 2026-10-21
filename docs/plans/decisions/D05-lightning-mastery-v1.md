# D05 / P07a03A — authored player Lightning Mastery prerequisite

Status: GD/TD approve this narrow prerequisite. It supplies exact authored
schema validation, an independent immutable definition and allocation-only
rank resolution. Runtime, native integration and player-facing acceptance
remain separate work; this prerequisite grants no combat effect by itself.

## Controlling authored contract

Exact player `skills-sorceress-lightning-mastery`, with canonical allocation
alias `sorceress.lightning_mastery`, is passive/self/zero cooldown. Existing
JSON defines requiredLevel30, legacy minLevel12, maxLevel20 and
lightningDamagePct0.04 per allocated rank. requiredLevel controls eligibility;
do not retune or rewrite the authored row.

The exact schema requires requiredLevel and a closed scaling object containing
only a closed passiveStatsPerLevel object with lightningDamagePct. Unlock/cap
are positive integers; potency is finite and nonnegative. Accept alternative
valid values without an invented balance ceiling. Optional passive is true,
aura and summon are false. Cost, damage, status, tag, synergy, heal, summon,
AoE and equipment-gate payloads are excluded. Other skill identities retain
their existing schema behavior.

## Independent definition and allocated rank

`resolveLightningMasteryDefinition(rows)` selects exactly one authored identity,
validates with strict Ajv2020 and copies/freezes only primitive values:
`{requiredLevel, maxRank, lightningDamagePctPerRank}`. Do not retain, mutate or
freeze caller data. Export LIGHTNING_MASTERY_DEFINITION independently of mutable
catalog and registry state.

`resolveLightningMasteryRank(levels?, definition?)` accepts only the two exact
aliases. Take the maximum valid finite positive integer allocation once and
clamp to the copied cap. Invalid/missing/wrong aliases give0. Never sum aliases,
infer rank1, or use skills/combo/registry/markers as allocation evidence.
Class, character level and runtime eligibility remain outside this resolver.

## Frozen later integration requirements

Only the player Sorceress at finite level at least the copied unlock receives
the passive from actual allocation. Compose its lightning increase additively
once, independently of Warmth and Fire Mastery, preserving fire and recovery.
Emit explicit lightning0 when removed or ineligible.

Boost direct lightning damage only: neutral fixed100 gives104/180 at ranks1/20.
Other damage types, Attack, resources, recovery and Paralyze behavior remain
unchanged. Introduce no passive action, payment, cooldown, marker or extra RNG.

Freeze ordinary wave inputs; allocation/respec applies next wave. Explicit
replay recomposes current configuration over immutable original resource/carry
baselines with existing fresh-input clamps, without refill or accumulation.

Later UI/copy must state level30, +4% per allocated rank, cap20/+80%, accurate
current/next values and unchanged Paralyze. Locale text alone does not establish
detail-panel correctness; display allocations must not use legacy fallback or
alias insertion order.

## Scope and evidence

This increment owns exactly skill.schema.json, engine/skills/lightning-mastery.ts,
its test and this decision. No runtime/native/UI/copy/save/data tuning or
generalized passive framework belongs here.

Review schema-only oracles before execution. Preserve genuine schema RED with
production schema unchanged, then review the schema fix and definition/rank
oracles. Record schema GREEN separately from missing-module capability failure.
Implement the minimal helper; run focused, engine, full unit, types, lint and
production bridge/build gates serially with the bounded runner. Preserve
failures, corrections and source freezes; independent review precedes commit.
Passing this prerequisite does not establish runtime or player-facing acceptance.

Security check: PASS. Local deterministic schema/JSON/typed allocation only;
no new network, credentials, dependencies, permissions, CI or save format changes,
external publication or validation bypass. Root retains exact-owned process and
artifact cleanup discipline. No remote action authorized by this decision.
