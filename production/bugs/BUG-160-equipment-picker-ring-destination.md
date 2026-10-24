# BUG-160 — Equip the ring in the slot shown by its comparison

Severity: High. Status: reproduced; fix in progress.

Build: `220de7a`; deterministic real-store/React reproduction, zh-CN. Browser
verification follows on production Chromium at 360×640 and desktop, both locales.
No combat RNG seed applies to this equipment transaction.

1. Equip distinct rings in both hero slots, leaving a third owned ring in the backpack.
2. Open the right-ring equipment picker and select the backpack ring.
3. Read the right-ring comparison and confirm Equip.

Expected: replace the selected right ring, return it to the backpack, retain the
left ring and apply exactly the compared derived stats. An explicitly selected
occupied ring should also be replaced when the other slot is empty.

Actual: Confirm calls `equipItem(selected)` without the selected destination.
The store automatically fills an empty ring slot, or replaces the left ring
when both are occupied. The previewed ring remains equipped and a different
ring is displaced. Three causal UI cases fail, with14 existing controls passing.

Evidence: `src/features/inventory/EquipPicker.test.tsx` new selected-slot cases;
raw RED output retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/ring-slot160/red-ui.log`.
Affected systems: frontend-dev / engine-dev (inventory store contract), G1/G4/G5.

Root cause: the preview receives a destination but the authoritative publication
API has no destination argument. Add an optional validated `EquipmentSlot` and
pass the picker's slot; callers omitting it retain the existing automatic rule.
Validate compatibility against the stored owned item, never a caller's base ID.
No persistent format or balance change is needed.

Workaround: unequip the intended ring before equipping its replacement.
The genuine next369 save is unchanged. The owned-damage369 diagnostic is
inconclusive for its proposed loadout because it also omitted the hero ring
destination; no diagnostic save or gear transfer is promoted.
