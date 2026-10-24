# BUG-160 — Equip the ring in the slot shown by its comparison

Severity: High. Status: fixed locally in `59f2590`.

Build: `220de7a`; deterministic real-store/React reproduction, zh-CN. Production Chromium verification passes at360×640 and1280×800 in both locales.
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

Historical workaround: with backpack room, unequip the intended ring before
equipping its replacement.
The genuine next369 save is unchanged. The owned-damage369 diagnostic is
inconclusive for its proposed loadout because it also omitted the hero ring
destination; no diagnostic save or gear transfer is promoted.

Validation:52 focused tests pass; full11670/451 pass with two existing skips;
typecheck/lint/production build pass. Four browser cases and12 exact durable
pairs pass. See [evidence](../../docs/plans/evidence/p03-selected-equipment-slot.md).

Follow-up: the blanket diagnostic limitation above was too broad. A later
explicit-slot preflight proves the final owned-damage proposal has only weapon,
amulet and left-ring swaps, with complete actual gear maps/derived stats matching
that final proposal. Original reports remain retained. The product bug and its
causal regressions remain valid; see the [correction and continuation](../../docs/plans/evidence/d11-earned-mephisto-and-act4-through375.md).
