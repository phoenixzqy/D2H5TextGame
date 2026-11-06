# ADR-018 — Store immutable JSON snapshots in IndexedDB

Status: Accepted for local implementation; independent umbrella review remains open.
Owner: root, technical-director responsibility. Extends ADR-017.

## Context

BUG592's complete earned 7,413-item save still causes mobile startup stalls.
After the validation/compiler changes, retained browser profiles identify
`structuredClone` in the write adapter and native `IDBObjectStore.put` as costly
steps. The latter is native structured serialization, not Dexie's live-query
cache. A bounded browser experiment with four-times CPU throttling reduced
median write time from 501.7 to 153.1 ms by storing JSON text; that experiment
retained the separate clone and is not an integrated performance result.

P03 requires exact save recovery, old-save compatibility, atomic failures and
protection against delayed autosaves overwriting newer progress. Current native
item affixes may contain Maps. Changing physical storage must preserve these
logical contracts and all domain validation.

## Decision

New records keep the existing database, table, key and indexed metadata, and add
the physical tag `encoding: 'json-v1'` with a string `data` payload. At invocation,
`saveSave` serializes the complete supplied save using the existing Map-to-entry
and Set-to-value representation. That immutable string is the queue snapshot;
later caller mutations cannot change it. The existing write/delete queue and
failure propagation remain. The shared `stringifySave` helper also implements
`toJsonSafe`, avoiding an unnecessary parse/stringify cycle for storage.

Untagged historical object records retain their existing read path. Tagged
records require the recognized encoding and a string payload; parsed input then
passes the ordinary full decoder and migrations. Invalid or future records are
never rewritten merely because reading failed. Diagnostic export remains raw
logical JSON, including the on-disk logical version, without migration.

The logical save version remains 33: no logical field or migration changes.
`json-v1` independently versions the physical envelope. IndexedDB's database
version remains 1 because table/index structure is unchanged.

## Alternatives considered

- Keep native object storage: preserves behavior but retains measured large
  snapshot/native serialization costs.
- Drop the immediate snapshot or encode only after waiting in the queue: loses
  caller-mutation isolation and can save a different state than requested.
- Change Dexie live-query caching: profiles locate this work in native put,
  outside that cache.
- Move persistence into a Worker: still transfers or serializes a large graph
  and introduces a new lifecycle/recovery boundary; not needed for this change.

## Consequences

New writes perform one synchronous JSON serialization instead of cloning an
object graph and submitting it for native structured serialization. Reads add
JSON parsing. Peak string allocation and remaining validation/rendering costs
still need measurement; this does not establish all runtime budgets.

Older application builds cannot decode the new physical envelope. Reverting the
adapter alone after a new write is therefore insufficient. Use this build's
ordinary JSON export before reverting, or retain the new reader. Exported
backups retain their existing portable logical format. No progress is deleted
to obtain a faster measurement.

## Compliance

Adapter tests cover legacy/current records, native affix Maps, raw exports,
snapshot isolation, write/delete ordering, serialization/quota failures and
rejected imports/encodings. Persistence tests observe physical JSON without
running repair or migration, preserving their logical state assertions.
Production browser comparison uses the unchanged complete earned save, ordinary
import/save/reload/export, retained authority48 assets, both locales/viewports,
CPU profiles and native readonly storage inspection. Final umbrella review and
performance acceptance remain separate. All344distinct affected unit cases
pass. The final targeted browser union has14passing save-management/offline
reopen cases; failed development startup and paused-display test timing were
repaired separately as BUG598/599. All four full7,413-item production roundtrips
remain exact. See [storage evidence](../balance/2026-11-02-json-save-storage.md)
for timings and limits; BUG592remains open.

Sources: [IndexedDB structured serialization](https://w3c.github.io/IndexedDB/#value),
[JSON serialization](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify),
[P03/P16/P19](../plans/work-plan.md),
[BUG592](../../production/bugs/BUG-592-large-save-browser-stalls.md).
