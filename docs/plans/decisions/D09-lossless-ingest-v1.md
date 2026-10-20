# D09 v1a — Durable inventory ingress before guarded player actions

Status: accepted scoped P03b02 control, 2026-10-20; producer plan ready.
Controlling sources: ADR-002-inventory-caps and work-plan P03b/F05/F10.
The v1 regular-action capacities remain backpack100/stash500. Full enforcement
is a later child with shared constants, atomic net-displacement checks and
localized refusal/selection-preservation UI. This child does not implement it.

`inventoryStore.addItem` is durable earned/returned-item ingress. It retains
the complete item in the requested existing saved backpack/stash even if the
container exceeds its nominal capacity or old500/2000 limit. Existing arrays
are unbounded and all overflow entries remain selectable. No save migration,
parallel hidden queue, invented compensation currency or silent drop is needed.
Consumers that already removed gear or report an award cannot ignore a failure
because ingress no longer refuses due to length. Caller order and exact-once
award qualification remain separate contracts; this API does not deduplicate
items or repair merc transaction/equipped-flag semantics.

Tests assert exact contents/IDs at99/100/101 and499/500/501 plus old thresholds;
actual stock-TC/seed7 reward dispatcher materializes nonzero loot and every
reported ID arrives once; actual merc UI unequip/swap conserves all owned IDs;
public export/decode/import/reset/hydrate retains values, Maps and IDs with only
IndexedDB IO replaced. Existing ordinary overflow browser checks remain valid
until the later guarded transfer child deliberately revises their full-target
expectations. No item/currency is invented during restore.

## D09 v1b — Guarded manual transfers

Status: accepted P03b03 implementation control,2026-10-20; producer plan READY,
six-file exception for required control/bug evidence. Full D09 remains open.

Shared nominal capacities are backpack100/stash500. Player transfer actions
return `{ok:true}` or `{ok:false,reason:'not_found'|'backpack_full'|'stash_full'}`.
Resolve the source and destination from current authoritative store state;
missing source is checked first. Refusal publishes no Zustand update and leaves
both array references, equipped gear, currencies and player untouched. Successful
transfer removes the source item and appends that complete item exactly once in
one publication, retaining IDs/affix Maps/flags. Overflow sources remain legal
when destination has room. Durable award/return ingress remains unbounded.

The screen imports the same capacity constants, clears selection only after
success, and otherwise keeps the selected detail and announces the returned
reason in localized feedback. Existing over-cap entries remain visible. Ordinary
discard can make room, then retry succeeds; no automatic discard/compensation.

Store/RTL tests cover destination99/100/101 and499/500/501, missing sources,
publication counts, exact contents and unchanged references on refusal, both
locales and selected retry. Browser legacy101/501 first refuses both directions
with exact exported state unchanged; discard S500/S499 makes stash499, move B100
to stash yields B100/S500, discard B99 then return B100 to backpack yields
B100/S499. Only those three explicitly discarded items disappear; save/export/
reload preserves everything else. Equipment guards and whole P03b remain later.
