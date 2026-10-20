# ADR-003 — Version independent magic mitigation

## Status

Accepted, 2026-10-20. Technical/game design and producer approved P06d before
runtime implementation. Mechanics are controlled by
[D04](../plans/decisions/D04-independent-magic-mitigation-v1.md).

## Context

`DerivedStats` supplies both persisted entities and pure combat units. The
damage pipeline already distinguishes armor and MR, but the battle adapter
supplies defense for both. Separate MR needs an explicit total stat and a safe
upgrade path for existing saves. The v7 starter migration can recompose player
stats, so validating only after migration could hide corrupt old fields.

## Decision

Require finite nonnegative `DerivedStats.magicResist`. Move the save format to
v9 and add only missing MR to the hero and every owned merc in migration9.
Keep a historical validator for v7/v8's required fields and optional MR before
either starter recomposition or field addition. Reject malformed present MR;
preserve valid extensions. Validate current v9's required MR before hydration.
Use validated JSON for defaults, with no defense fallback or additional RNG.

## Alternatives considered

- Keep armor-as-MR: maintains compatibility but leaves an explicit design
  decision unresolved and makes armor determine all flat mitigation.
- Add an optional MR field without versioning: reduces fixture edits but
  conflicts with this repository's save-shape policy and allows ambiguous
  missing values throughout current combat code.
- Recompute all saved stats on load: changes unrelated legacy progression and
  risks resource refill or loss of grown merc baselines.

## Consequences

Engine inputs become explicit, item aggregation can express independent MR,
and old saves retain their other fields. Current typed fixtures need MR0 and
current-version assertions move to9. Historical fixtures must remain genuinely
missing MR. Incoming magic changes as well as player damage; campaign balance
must be measured again rather than inferred from this primitive.

## Compliance

Actual battle tests assert all damage routes with unequal armor/MR and both
directions. Factory tests cover every tier and final override. Migration tests
assert whole-state preservation, all owned mercs, corruption rejection before
recomposition, legacy extensions and current roundtrips. Schema tests use Ajv;
typechecking detects incomplete current stat constructors.
