# ORMU-04 — Reserve the canonical hero charm slot

Status: implemented; focused acceptance approved; coherent checks pending. Type: Logic. Owner: root; independent design_contracts review.
Depends on ORMU-01/02/03. Producer approved next-card scope. See the approved
[design](../../../docs/design/ormus-charm.md) and
[ADR-014](../../../docs/decisions/ADR-014-first-charm-ownership.md).

## Acceptance criteria and QA

- Add `charm` EquipmentSlot and JSON base-schema admission.
- Shared hero eligibility accepts only exact `items/base/small-charm` with
  authored charm type and charm slot into the canonical hero charm slot.
- Reject noncharms in the reserved slot, other charm identities, a charm base in
  another slot, and misleading identity/type/slot combinations.
- Preserve ordinary weapon/offhand/ring compatibility and absent-base refusal.
- Demonstrate causal RED for schema admission and previously accepted impostors,
  then focused GREEN with existing equipment-validator controls.
- No live base/unique catalog entry, save bump, effect activation or UI yet.

## Exclusive writable source files

- `src/engine/types/items.ts`
- `src/data/schema/item-base.schema.json`
- `src/engine/inventory/equipValidator.ts`
- `src/engine/inventory/charm-slot.test.ts` (new)

Root owns all writes/tests in the registered human worktree. Retain raw RED/GREEN
and source receipts in `d2-ormus-urhb34ei`. No CI, commit, push or remote changes.

## Focused outcome

Independent design_contracts review: APPROVE. Focused controls passed 24 tests across 2 files. Raw RED/GREEN logs remain in the root-owned Ormus packet. Full current-source checks and feature acceptance remain pending.
