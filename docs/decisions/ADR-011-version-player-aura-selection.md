# ADR-011 — Version the complete player aura selection domain

Status: Accepted for local implementation; independent architecture/QA acceptance open.

## Context

[The private-v1 plan](../plans/work-plan.md) requires every advertised skill.
The authored Paladin catalog has twenty auras, while native saves through v21
permit only Might and Meditation. Widening Player alone would also widen the
historical v12–21 type through HistoricalPlayer, contrary to the existing
[save contract](../plans/decisions/D05-meditation-v1.md).

## Decision

Use one immutable twenty-ID canonical selection domain in `engine/types/auras.ts`.
Save v22 permits those exact IDs; absence still means None. Freeze HistoricalPlayer
and v21 to their original two-ID domain. Validate the complete v21 predecessor
before a version-only v21→22 migration. Retain every other field and native Map
without granting ranks, resources, free resets or rewards. Selection persistence
is independent of gameplay eligibility and does not claim an effect is implemented.
Runtime/UI expose an aura only after its actual effect path is available.

## Alternatives considered

- Widen v21 in place: rejected because a future selection could be accepted in
  a falsely labeled historical save and frozen historical types would drift.
- Persist arbitrary skill IDs or allocation-derived selection: rejected because
  it admits aliases/unknown skills or silently selects an aura on learning.
- Introduce a save version for each effect batch: rejected because the durable
  field/domain can cover the authored family once; transient effects do not
  require further persistence fields.

## Consequences

Current saves can preserve every canonical selection, including temporarily
ineligible selections. Old saves keep their original acceptance boundary.
The additional strict predecessor check has a decode cost. Older game builds
cannot open v22 saves. This ADR does not approve tuning or replace the ten
outstanding pulse/control/recovery contracts.

## Compliance

`aura-v22.test.ts` compares the domain to the authored twenty rows, checks frozen
v21/current types, exercises all twenty native/JSON round trips, rejects malformed
selections and future IDs in v21, and verifies exact version-only migration with
native Maps and spent counters. Historical fixture builders reject a current-only
selection instead of inventing an old representation.

References: [Ajv validation](https://ajv.js.org/guide/getting-started.html),
[TypeScript literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types).
