# D09 v1 — Legacy inventory visibility (P03b01)

Status: scoped implementation contract; full P03b remains unaccepted.
Date: 2026-10-20. Input: `2458ee7`.
Owners: producer and frontend/QA, following D09 and accepted ADR-002.

Every existing saved backpack/stash item must have a selectable grid card,
including items beyond the current UI's nominal 100/500 capacities. The grid's
`capacity` prop controls how many empty placeholders are shown when there are
fewer items. It never truncates the supplied item array. The rendered cell count
is the larger of the existing item count and the requested placeholder capacity.

Ordinary import, reload, selection, transfer and confirmed discard must allow a
player to recover an over-cap saved inventory without inaccessible entries or
automatic removal. Existing action semantics and save shapes are preserved.

This child deliberately does not change the store's current 500/2000 thresholds.
The complete 100/500 capacity contract still needs atomic award/transfer/craft
handling and safe overflow behavior. In particular, lowering thresholds while
`addItem` silently returns `void` on rejection would expose earned items and merc
equipment returns to loss. Visibility proof is not full capacity acceptance.

QA gates: real-component boundaries 99/100/101 and 499/500/501; last-item
selection and return below capacity; ordinary UI import/reload, transfer and
confirmed discard on desktop 1280×800 and mobile 360×640. Imported fixtures
establish save recovery, not earned campaign progression.
