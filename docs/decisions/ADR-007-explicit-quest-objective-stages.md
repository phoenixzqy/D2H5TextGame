# ADR-007 — Express unordered quest objectives as ordered stages

Status: Accepted. Technical decision review: `/root/design_contracts`,
`TD-ARCH-REVIEW: APPROVE`, 2026-10-23. This signs off the data/ordering decision;
it does not accept Act III gameplay or its remaining item/action graph.

## Context

[The frozen Act III contract](../plans/decisions/D11-compact-act3-contract.md)
requires four Khalim components in any order, followed by assembly using real
components and the retained Act II Cube. Existing quest event, explicit action
and receipt-validation paths infer a serial chain from objective display order.
Relaxing only one caller would let action availability disagree with settlement
or save validation. [ADR-006](ADR-006-source-bound-quest-items.md) still governs
actual source-bound items and transactional consumption.

## Decision

Add optional JSON `objectiveStages`, an ordered array of nonempty objective-ID
groups forming a complete partition of a quest's objective IDs. Within a stage,
objectives are unordered; every objective in all earlier stages is a prerequisite.
Omission preserves the existing serial objective order. The loader validates
closed schema shape, unique objective identities, coverage, unknown references
and duplicates. A pure engine helper supplies the same own-true prerequisite
check to live actions, map events and ledger validation. Events evaluate the
pre-event flags, so one event cannot advance through successive stages. Receipt
validation additionally requires its own objective flag, legal progress status,
all objective flags for completed rows, and the existing exact real-item graph.

Freeze the v14 Book/Cube/Shaft/Amulet/Staff domain before future v15 migration.
Historical v13/v14 checks retain their literal serial objective IDs and do not
consult live stages or item definitions. Reject a present reserved
`map.questReceipts` on raw historical inputs before normalization/migration.
This foundation introduces no save field, version bump, migration grant or new
authored stage data. v15/action definitions and their admission remain separate
required work in the same Act III delivery.

## Alternatives considered

1. Remove predecessor checks for fetches. Rejected: it silently changes every
   fetch's sequencing and leaves other event/save callers inconsistent.
2. Add per-objective arbitrary prerequisite graphs. Rejected: the accepted
   component/assembly flow needs only finite stages; arbitrary edges add cycle
   handling and authoring complexity without a current requirement.
3. Encode order in per-quest store branches. Rejected: duplicates content rules
   across UI, events and persistence and prevents shared validation.

## Consequences

Objective display order remains independent of progression order when explicit
stages exist. Existing authored quests keep their current chains. Content authors
must specify every objective exactly once when choosing stages; a partial
override is invalid. Stages govern eligibility only: they do not supply actual
items, clear/proof prerequisites, hand-ins, rewards or combat authority. A later
need for a graph that stages cannot express requires another decision.

## Compliance

`src/engine/map/questStages.test.ts` checks serial fallback, prior-stage-only
requirements, own flags and unknown-objective refusal. Object-event tests cover
all 24 peer orders and prevent later-stage cascades. Loader tests reject malformed
partitions and duplicate objective identities. Map-store and real recovery/
assembly tests cover callers. Save tests demonstrate that live peer receipts
still require their own source and that future definitions/stages do not widen
frozen v14. Preserve literal frozen checks when v15 is introduced.

Schema vocabulary: [JSON Schema array validation](https://json-schema.org/understanding-json-schema/reference/array).
Runtime schema validation remains the established Ajv implementation; no stack
or dependency change is involved.
