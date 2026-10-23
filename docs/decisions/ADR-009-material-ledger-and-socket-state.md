# ADR-009 — Versioned material ownership and ordered socket state

Status, 2026-10-23: the v18 ledger and native reward transaction boundary are
accepted for implementation by root, with independent QA READY for the plan.
The v19 socket/action schema and mechanic defaults remain proposed for TD/GD/QA
review. Scope: existing D10/P12b, not an independent feature or runtime acceptance
declaration. The concrete mechanic values, first-slice order and verification are in
[D10 v1](../plans/decisions/D10-material-economy-v1.md).

## Context

Earned rune/gem counts currently lose concrete identity between TC selection,
reward materialization and currency publication. Old rune-shard mixes ordinary
per-kill shards with anonymous rune counts. Old gem-shard similarly has no type
or quality. No migration can recover those identities. Equipment sockets already
have a strict v17 per-instance socketCapacity and canonical rune-array contract;
extending it silently would weaken validated native saves.

## Decision

### v18: one typed material ledger

Add required `inventory.materials: Record<MaterialId,number>` to native v18,
serialized as a closed catalog-keyed JSON object. Its IDs are exactly the33
`runes/<name>`,35 `gems/<type>/<quality>` and `materials/scrap`. Amounts are
positive safe integers; absent means zero and zero entries are omitted. Refuse
unknown IDs, inherited/prototype keys, negative/fractional/nonfinite/unsafe
amounts. Validate parsed own keys at the established save parse boundary; this
does not claim that object validation can recover duplicate raw JSON keys
already discarded by parsing. Duplicate IDs in definition catalogs refuse. Plain
own-key lookup and safe accumulation are required. Counts are bounded by
Number.MAX_SAFE_INTEGER; addition beyond it refuses the whole transaction.
Material definitions are schema-validated, duplicate-free and finite. This is
not an open arbitrary currency namespace and has no gear-capacity coupling.

Freeze the existing v17 inventory/save validator. Validate a source save under
its actual frozen schema before migration. A pure v17→v18 migration adds exactly
empty materials and preserves every other domain, including all original
currencies keys/values and existing Item.runes. It never consults completed
quests or anonymous aggregate amounts to mint typed holdings. Older save
versions containing the new reserved materials field refuse rather than
laundering current malformed data through a legacy path. Native v18 requires
the field; only a trusted save builder may default an absent legacy input, and
must reject present undefined/malformed values. Unknown historical currency
balances remain legacy balances; only the new material namespace is closed.

Every new reward has required materials. Numeric runes/gems are descriptive
summaries, computed from actual stacks, never independent spendable state.
Shared grant planning maps actual runeShards→rune-shard,
wishstones→wishstone and materials→materials; it never also credits rune/gem
counts into shard currencies. Exact TC IDs survive unchanged; generic outcomes
use the reviewed deterministic pools. All affected grant, quest/cache, summary,
save, worker and measurement callers must move together before rollout.

v18 ships a functional earned-acquisition/storage/UI/Save-Continue slice. It
retains old rune socket fields and claims no socket/craft behavior. No Dexie
table upgrade is needed if the existing whole-save record remains unchanged;
native payload version/migrations still change. Older runtimes cannot read v18.

### v19: one canonical ordered socket representation

Only when socket/gem behavior ships, add required ordered entries for inserted
contents under Item.socketContents, each a closed `{kind,id}` union with kind
rune or gem and exact catalog membership. v18→v19 migration converts every
explicit Item.runes ID to `{kind:'rune',id}` in identical order, retains exact
socketCapacity/runeword ID/payload and removes the old field. It does not create
contents for empty sockets or infer contents from any ledger/currency. Current
v19 rejects the obsolete field, both representations together, unknown IDs/kinds,
contents beyond capacity and a runeword inconsistent with the exact all-rune
sequence/base constraints. Historical version validators remain frozen.

An empty absent socketContents means no inserted materials; zero-capacity and
non-gear items cannot carry nonempty contents. Item IDs/base rolls/affix Maps,
personalization and unrelated save domains are unchanged. All ownership sites
(backpack, stash, hero, mercs, quarantines and any persisted selected-item
snapshots) receive the same conversion or their explicitly frozen historical
validation. No migration may silently discard an unknown inserted rune.

Rune/RuneWord/Gem stat packages share ItemBonusStats and explicit units. Engine
composition, eligibility, tooltips and item-skill projection use the canonical
contents and catalog; no fallback to maxSockets, parallel denormalized bonus
cache or runtime percentage heuristic. Rarity/runeword ID is validated against
the actual completed recipe. Existing unique/set/item-skill behavior remains
in scope and must compose once, rather than being replaced by this path.

### Mutation and retry authority

Material awards and player actions use whole-bundle validated plans. Inputs are
looked up from current authoritative stores. Compute safe counts, exact item
replacement, requirements and output capacity before any publication; no
caller-supplied replacement item or aggregate counter establishes ownership.
Use a synchronous transaction/reentrancy guard and existing wave/Iron ownership
guard, held through rollback. Refusal publishes nothing and advances no RNG.

Combat/cache outputs retain their existing qualifying receipt and installed
reward identity. A publication error restores the complete prior participating
state; if restoration fails, retain explicit failure evidence and stop. Retry
uses that installed output and cannot replay a completed award. Do not re-roll
a reward or append an independent material grant after the native receipt.
Stage the complete native earned bag and safe destination arithmetic before XP
or merc XP publishes; strict material refusal after XP has already changed is
not an atomic award. Guarded snapshots/rollback cover player, merc, materials,
other currencies, equipment ingress, quest/clear progression and participating
receipt authority. Claim snapshots explicitly add materials to their existing
complete inventory capture. Reuse settlement/quest receipt ownership rather
than installing a competing secondary material transaction after rewards.

For random player crafting/socket actions, native v19 adds a per-character
monotone materialActionOrdinal and bounded last receipt `{ordinal,requestHash,
resultItemId}` committed with inputs/output. The request hash binds recipe,
ordered exact input IDs/quantities, target preimage and character. A repeated
same ordinal/hash returns its recorded result without mutation; stale mismatched
requests refuse. New input/capacity refusal leaves the ordinal unchanged. The
production-seeded output includes character ID, ordinal and request hash; persist
all random rolls in the item and never recompute on equip/import/reload. The
live client retains the prepared request through retry. Only the latest receipt
needs idempotent replay; older ordinals refuse. Migration initializes ordinal0
and no receipt without manufacturing a prior action. Deterministic fusion can
use the same boundary for consistent double-click semantics.

One store transaction owns input stacks, owned target and receipt. Derived hero
or merc recomposition occurs from the committed item exactly once and preserves
current resource pools; failure restoration includes those dependent domains.
This contract does not promise observer-wide/crash atomicity, security against
whole-save rollback, or a durable distributed transaction. Restore failures are
observable AggregateErrors and never reported as a successful/refused no-op.

## Alternatives and consequences

1. Put real rune/gem IDs into the open currencies dictionary. It avoids one
   field but conflates strict new stack identity with preserved arbitrary
   historical currencies and makes dual-payment errors easy. Rejected.
2. Convert historical shards into random runes/gems. It fabricates lost reward
   identity, changes old holdings and permits import rerolls. Rejected.
3. Ship sockets and materials in one v18. It couples first useful earned
   acquisition to all mixed-socket/recipe work. Chosen staged v18/v19 scopes
   permit independently complete acquisition, then complete mutation/effects.
4. Maintain Item.runes and Item.gems arrays. It loses mixed ordering/capacity
   truth and makes runeword qualification ambiguous. Rejected.

This introduces a bounded material catalog dependency into validation, grants
and item composition. Definitions/IDs cannot be renamed without migration.
Runtime schema and snapshot tools must account for the new ledger/ordinal.
The D10 acceptance matrix requires boundary RNG fixtures, exact conservation,
atomic exception/retry tests, old/native save round trips, actual earned UI
acquisition and bilingual mobile Save-Continue. Constructed state proves a
mechanic, not earned affordability, full P12b, C2 or campaign balance.

## v19 review amendment — 2026-10-23

GD/TD approve the proposed v19 architecture with the clarifications below;
independent QA sign-off on this amended contract is READY after the raw
predecessor and native action invariants below. These supersede
the conflicting proposed active-item retention and item-only receipt wording
above without changing accepted v18 behavior. The corresponding D10 amendment
defines exact mechanic defaults, base predicates and caster representation.

### Frozen history and explicit recovery

Freeze v18's complete item validation, loose matcher and relevant catalogs
before editing live recipe restrictions. Validate the actual predecessor first.
Convert compatible items across all ownership locations with exact ordered
rune contents and unchanged payload. Stricter v19 base predicates can make a
previously valid item ineligible; preserve that exact source item in a closed,
version-tagged v18 quarantine entry with original ownership/location provenance.
Its active slot becomes empty and it contributes no effect. Keep existing v16
quarantine validation frozen and separate. Migration never silently strips,
discards, credits materials or recomposes an unsupported active word.

An explicit recovery action previews the same item ID/base/base rolls/capacity/
personalization restored as normal gear with empty socket contents and no
runeword identity, plus the exact explicit inserted rune counts returned to the
material ledger. Preserve unrelated payload. It consumes the quarantine entry
only after complete input/arithmetic/output-capacity preflight and commits the
replacement/refund/entry removal/receipt together. Faults roll back every
participant; overflow leaves the exact original entry available for later
recovery. This restores known explicit ownership rather than inventing lost
anonymous currency identities. Bilingual UI must expose the entry and preview.

### Closed action result and replay ordering

The per-character native materialActionOrdinal is a nonnegative safe integer;
migration sets0 with no last receipt. A new prepared request uses current+1.
Overflow refuses. The bounded latest receipt is
`{ordinal,requestHash,result:{itemId?,materials,currencies}}`: itemId identifies
the one transformed/recovered item when applicable, materials uses the closed
material catalog and currencies permits only rune-shard/gem-shard outputs.
Counts are positive safe integers with zeros omitted; no additional output
keys or parallel cached item payload. This covers actions whose only outputs
are materials/currency, including fusion, dismantling and bulk salvage.

Validate request structure/character/hash, then check exact latest receipt
replay before checking now-consumed inputs. Matching latest ordinal/hash returns
the stored result without a mutation or RNG draw. Older ordinals, mismatched
latest requests and gaps refuse. Only current+1 proceeds to complete current
ownership/eligibility/capacity/arithmetic preflight. Hold the synchronous lock
through publication and rollback; publish exact input costs, persisted output,
ordinal and receipt together. Failed preflight or complete rollback leaves
ordinal/output unchanged. A UI confirmation retains one canonical prepared
request through double-click/retry, rather than preparing a new ordinal for
each click. The hash binds character, recipe, ordered exact IDs/quantities and
target preimage. Random action output uses that same identity and all rolls
persist; equip/import/Continue never reroll. Latest-only replay still refuses
older completed actions without an unbounded receipt journal.

For craft/salvage level gates, own present ilvl is authoritative; only its
absence permits item.level. The chosen value must be a positive safe integer;
malformed present data never falls back. Preserve original stored fields. The
caster's reserved recipe-authored LegacyAffixRoll Map stores fixed energy+5/
mana+20 beside its legal modern prefix/suffix, never in a second bonus cache.
ItemBonusStats magicResist is flat mitigation; modern affix critical/dodge
point-to-ratio conversion remains separate from ratio-valued stat packages.

Compliance requires frozen historical acceptance, every source ownership site,
lossless explicit recovery, every output/result kind, exact latest replay before
spent-input validation, mismatch/gap/overflow refusals, rollback and JSON/native/
Continue round trips. Schema readiness alone cannot accept v19 or full P12b.

### Raw predecessor reservation and native action invariants

Before historical migration or normalization, reject all reserved v19 fields
on the raw predecessor: socketContents at every item/mirror/snapshot location,
materialActionOrdinal, the latest action receipt and the new quarantine
discriminator. A historical decoder dropping an unknown field must not launder
it into a valid v19 save. These checks also precede chained old-version imports.

Native ordinal0 holds if and only if no receipt exists. A positive ordinal
requires exactly one closed latest receipt whose ordinal equals
materialActionOrdinal, whose requestHash is a canonical 64-character lowercase
hex SHA256 value, and whose result includes both closed required maps
materials/currencies (empty maps allowed) and only the optional itemId above.
Reject missing, malformed, mismatched and extra receipt fields. Compliance
includes those native rejection controls and raw predecessor-field-laundering
tests at each ownership/mirror/snapshot location.
