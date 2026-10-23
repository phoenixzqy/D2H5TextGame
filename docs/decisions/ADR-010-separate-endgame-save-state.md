# ADR-010 — Persist endgame progress separately from campaign entitlements

## Status

Accepted. Technical-director review `[TD-ADR010]: APPROVE`; producer approves
the dependency ordering. Native dungeon and achievement acceptance remain open.

## Context

[Worldstone Remnant](../design/worldstone-remnant.md) owns an attempt ordinal,
two completion counts and a once-only achievement claim. Campaign titles,
Nightmare history and quest receipts already have closed historical meanings.
[ADR-009](ADR-009-material-ledger-and-socket-state.md) requires preserved socket
ownership and material action receipts. New dungeon history cannot be inferred
from old quest flags, currencies or cleared areas.

## Decision

Save version 20 requires root `endgame`, backed by `mapStore.endgame` through
explicit snapshot/hydration mappings. Validate the complete frozen version 19
before adding only empty endgame defaults. Validate raw current state against
the actual Eve/Throne/Baal source graph before normalization. Reserve `endgame`
at root, map and inventory in predecessors; current saves reject map/inventory
shadows. Descriptor checks reject present undefined, hidden and inherited
values or accessors without evaluating getters. Trusted builders may default
only genuinely absent state. No Dexie table change is needed: the existing save
record stores the versioned document ([Dexie table.put](https://dexie.org/docs/Table/Table.put())).

Transient dungeon attempts and issued recording bindings are never serialized.
Admission and settlement will use existing shared guards and rollback. A reload
retains the committed attempt ordinal and previously settled ordinary rewards,
but no terminal cache or clear for an interrupted attempt. Achievement Claim
must atomically own both materials and the claim flag. Historical campaign title
types and validators remain unchanged; selection of the new title belongs to
the connected current title implementation.

## Alternatives considered

- Extend campaign quest/title maps: rejected because it changes frozen
  entitlement domains and confuses campaign completion with dungeon ownership.
- Persist a separate Dexie table/store: rejected because independent writes
  complicate atomic import, reset and rollback without providing needed value.
- Serialize active dungeon waves: rejected because issued native recording
  authority and partial battles are intentionally invalidated on restore.

## Consequences

Old inventories, recovery payloads, receipts and actor caches retain their
meaning. Existing map subscriptions cover durable dungeon mutations. Older
runtimes cannot read version 20; unfinished battles cannot resume. Integration
must explicitly route root state into the live store instead of spreading map.
Prepared fixtures prove compatibility and persistence, not earned unlock or
balance. P18/F17/F18 and full-v1 gates remain separate acceptance work.

## Compliance

Save boundary tests cover lossless 19→20, descriptor reservations before
normalization, campaign authority and native round trips. Persistence tests
cover snapshot/export/save/reset/hydrate/reimport and zero-write malformed
imports. Historical simulation adapters preserve pinned bytes/hashes and refuse
to discard nonempty endgame state. Native admission/settlement tests must prove
ordinal isolation, exact recordings, interrupted attempts and atomic rewards.
