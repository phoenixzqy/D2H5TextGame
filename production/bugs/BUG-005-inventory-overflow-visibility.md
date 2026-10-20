# BUG-005 — Keep legacy over-cap inventory items accessible

- Status: Fixed for P03b01 visibility; full P03b remains open.
- Severity: High (individual overflow items cannot be selected through the grid).
- Affected systems: `BackpackGrid`, backpack/stash inventory UI; frontend-dev.
- Build: `2458ee7`.
- Environment: Linux, Node 24, Vitest 1.6.1 / jsdom; Chromium
  147.0.7727.15 (Playwright revision 1217). Browser verification uses desktop
  1280×800 and mobile 360×640, in en and zh-CN.
- Seed: not applicable; explicit saved item arrays, no engine RNG.

## Reproduction

1. Render `BackpackGrid` with 101 saved items and capacity 100, or 501 saved
   items and capacity 500, preserving the item array supplied to the grid.
2. Locate the last saved item by its card test ID.
3. Observe only 100/500 cards; the final saved item has no selectable card.

Expected: Every saved item remains accessible. Capacity controls empty
placeholders; it must never hide or discard existing items. Reducing an over-cap
inventory below its nominal capacity restores empty slots.

Actual: `items.slice(0, capacity)` removes overflow entries from the rendered
cells. Save hydration retains those entries, so visible cards disagree with the
actual item count and the player cannot individually act on overflow items.

## Evidence before implementation

`npx vitest run --project ui src/features/inventory/BackpackGrid.test.tsx
--reporter=dot`: **3 failed / 4 passed**. The 101 and 501 cases render only
100 and 500 cards; the overflow-recovery test cannot locate item 101. Boundary
tests at 99/100 and 499/500 pass. The test uses real cards, tooltips and i18n.

## Scope and resolution

P03b01 covers legacy visibility only, under
`docs/plans/decisions/D09-inventory-overflow-visibility-v1.md`. Store limits,
award handling, crafting and atomic transfers remain pending under full P03b.
The grid now copies the complete item array, then pads only when it contains
fewer entries than its nominal capacity. No save migration or store mutation is
involved.

Validation:

- Focused RTL: **7 passed**, including all six boundary counts and recovery
  below capacity. Final tests retain real item cards and replace only tooltip
  positioning with a pass-through; browser tests use the complete UI.
- `E2E_PORT=4394 npx playwright test tests/e2e/inventory-overflow-recovery.spec.ts
  --project=chromium-desktop --project=mobile-portrait --reporter=line
  --output=playwright-report/inventory-overflow-recovery`: **4 passed**.
  Ordinary export/import/reload preserves all 101 backpack and 501 stash items.
  Both containers' last overflow entries can be selected, transferred and
  discarded with confirmation. The flow returns to 99 backpack / 500 stash,
  restores the empty backpack slot, saves/reloads, and verifies every surviving
  item ID through ordinary export. Last-item targets exceed 44px, there is no
  horizontal page overflow, and no browser page errors were observed.
- Full unit suite: **87 files passed; 814 passed / 1 skipped**.
- `npm run typecheck`, `npm run lint`, `npm run build`: **passed**.

The first browser run exposed an existing English startup locale issue: after
reload, English remains selected but labels render in zh-CN. Its final
`getByRole('button', { name: 'Save', exact: true })` timed out. The corrected
inventory proof explicitly reselects the requested language through Settings
after reload. This isolates inventory recovery and does not claim startup locale
restoration; the parent owns the separate BUG-007 report and fix.
