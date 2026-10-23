# BUG-116 — Reject future material state before predecessor normalization

Status: Fixed at the raw predecessor boundary; connected v19 acceptance remains open.
Severity: High (save-boundary prerequisite for v19 integration).
Owner: engine-dev.

## Reproduction

Environment: Node/Vitest engine project, 2026-10-23; no browser, locale or RNG.
Baseline: `40c5ee3` plus the current material/socket prerequisites.

1. Start with a valid native v18 save.
2. Add own `materialActionOrdinal`, `latestMaterialAction` or `socketQuarantine`
   to inventory, including explicitly undefined values.
3. Decode the save. The additional fields are accepted rather than reserved.
4. Put a `socketContents` accessor on gear in backpack, stash, hero/merc
   equipment, an actor mirror, legacy equipment Map/array, quarantine or a
   retained snapshot. Decode invokes that accessor during normalization.

Expected: reject every reserved v19 field on the original predecessor before
normalization or any chained migration. Never evaluate a reserved accessor or
let a migration erase a future field and then validate the normalized result.

Evidence: `src/engine/save/material-ledger.test.ts`, raw pre-v19 reservation
suite: 66 failing assertions /39 existing controls pass before implementation.
Three native inventory fields are wrongly accepted; eleven socket-accessor
locations evaluate the getter. The remaining assertions establish ordering
ahead of existing old-version rejection, including the quarantine tag.

Root cause: the decoder reserves v17/v18 additions but has no raw v19 boundary;
its permissive structural schemas and Map normalization precede future-field
checks. Implement a descriptor-based raw traversal, including legacy Maps,
before either operation. Current save version remains18 until full integration.

Independent QA found two corrections needed in the initial guard: overridden
Map/Set methods must not hide entries or invoke getters, and reserved field
names must not reject same-spelled keys in open historical currency maps.
Version admission must likewise read an own data descriptor before its value.
Added regression controls before these corrections.

Validation: raw reservation/material-ledger controls pass110/110, including
symbol descriptors, intrinsic Map/Set traversal, version accessors and open
historical currency names. The complete engine run passes5178/144. Independent
QA approves the corrected guard. Current native save version remains18.
