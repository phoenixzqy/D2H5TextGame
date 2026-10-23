# Persist source-bound quest items and consumed receipts

## Status

Accepted, 2026-10-23. TD-ARCH-REVIEW APPROVE and producer APPROVE for the
architecture and ordered scopes. Runtime correctness remains subject to tests
and independent QA.

## Context

[D11](../plans/decisions/D11-radament-quest-v1.md) requires Radament's reward to
grant 5000 XP and an unread Book of Skill, then exactly one skill point when
Read consumes the book. A book must survive save/import/Continue independently
of equipment capacity. Historical claimed quests must never manufacture books
or retroactive points. The existing string item reward is refused as an
unsupported whole bundle; there is no quest-item storage.

## Decision

Use a separate `inventory.questItems` JSON object in save v12. Each key is the
canonical authored source `<questId>#reward:questItem`, with exactly
`{ itemId, state: 'owned' | 'consumed' }`. The consumed entry is the durable
receipt, so a source cannot simultaneously hold an unread book and a receipt.
Keep `items/book_of_skill` as the book identifier. JSON quest-item definitions
own the source quest, localization keys and numeric Read effect; the quest's
`questItem` reward must agree. Current saves require the ledger, exact canonical
source/item pairing and completed/claimed source progress. Unknown sources,
states, extra entry fields and contradictory identities are rejected.
Pairing uses own-key lookups. Definition validation depends on the quest loader
in one direction; the quest loader does not depend on quest-item definitions.
This source grammar covers quest rewards; later component acquisition sources
require their own definition-backed contract.

Freeze the existing inventory type for v2–v11 and add a required ledger only
to the v12 inventory. Validate frozen v11 (including its Might/Meditation rules)
before a pure v11→v12 migration adds an empty ledger, without consulting claimed
flags. The trusted save builder can accept a legacy inventory input and emits
an explicit empty ledger only when the field is absent; present malformed or
undefined fields are never defaulted. Untrusted current saves cannot omit one. Historical
saves containing the new reserved ledger field are rejected rather than silently
laundering malformed data into a valid current save.

Claim and Read share one synchronous reentrancy lock through rollback and every
restoration attempt. Both call the existing Iron Golem ownership guard before
reads. Claim snapshots every participating player, mercenary, inventory and
target-quest field; Read snapshots player and ledger. Preflight validates the
whole reward bundle, canonical entitlement, current hero/readiness and safe
integer arithmetic. Restoration failure remains an explicit AggregateError.
This does not promise observer-wide/crash atomicity or prevent restoring an
older whole-save export. Do not add broader combat or map-access restrictions.

## Alternatives considered

1. Represent books as equipment instances. Rejected because equipment capacity,
   equip/transfer/discard paths and item ID allocation would all require special
   exceptions for a bound entitlement that has no equipment stats.
2. Infer the book or consumed state from `rewardClaimed`. Rejected because old
   saves do not distinguish a prior point grant from an unread entitlement.
3. Maintain separate unread and consumed arrays. Rejected because duplicate and
   conflicting representations become possible; a source-keyed state owns both.

## Consequences

Book acquisition is capacity-independent and gear IDs remain unchanged. A
single source supports exactly one entitlement; repeated sources would require
an explicit future contract. Source validation couples definitions, quest
rewards and saved progress, so moving an authored source later requires a new
migration. A v12 save is intentionally unreadable by older runtimes. No Dexie
table or database schema change is needed for the existing whole-save record.

## Compliance

Tests reject malformed/missing current ledgers, wrong source/item/state and
unclaimed source progress; preserve unread/consumed JSON and native round trips;
and prove valid legacy claimed saves migrate empty without changing points or
gear IDs. Transaction tests cover duplicate/nested Claim and Read, full gear
containers, every mutate-then-throw write, restoration failure and retry.
Production browser proof must separately show unread and consumed
Save→close→Continue/import states. Constructed proof remains labelled and does
not establish earned C2 progression.

Definitions, codec/storage, transactions and UI are bounded implementation
children with one integrator. D11, C2–C4 and full private v1 remain open until
their own acceptance evidence passes.

## Sources

The local D11 contract above and `src/engine/types/save.ts`,
`src/engine/save/{serialize,validate}.ts`, `src/stores/persistence.ts` and
`src/features/quests/claimReward.ts` define the existing boundaries.
[JSON Schema object validation](https://json-schema.org/understanding-json-schema/reference/object)
describes required fields and closed entry objects used by the validator.
