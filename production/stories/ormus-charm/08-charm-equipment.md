# ORMU-07B — Live charm contribution and equipment transactions

Status: implemented and independently reviewed; integrated feature acceptance remains open. Root owns mutations; producer-approved five-file slice.
Depends on ORMU-07A. Approved Ormus design and ADR-014.

Scope: equipment-mods.ts, merc-equipment-stats.ts, inventoryStore.ts,
mercStore.ts and new stores/charm-equipment.test.ts.

Filter only current aggregateEquipmentMods: exact charm base contributes only
from the canonical hero charm key; noncharms there and charm copies elsewhere
are inert. Leave historical aggregation defaults unchanged. Merc projection
excludes the reserved key; merc actions reject charm equipment. Hero automatic
and explicit slot selection use the same canonical base predicate. Refuse
corrupted duplicate charm ownership before publication, including ingress.
Preserve ordinary keys and same-ID behavior. Tests inject future catalog entries
without activating authored data. Verify low/full/zero resource equip, replace,
remove, comparison and native player/merc snapshots; no heal/revive. Preserve
current inventory failure codes and merc incompatible_slot/not_found codes.
Focused RED/GREEN and coherent checks remain in the root-owned Ormus packet.
No CI, commit, remote publication or catalog activation in these slices.

## Outcome

Implemented; independent technical review APPROVE. charm-equipment-green.log:109 tests/8 files passed (including 15 charm cases).
Evidence is retained in the root-owned Ormus packet; quest/catalog/UI/browser acceptance remains open.
