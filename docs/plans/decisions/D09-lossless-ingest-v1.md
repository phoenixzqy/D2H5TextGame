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
