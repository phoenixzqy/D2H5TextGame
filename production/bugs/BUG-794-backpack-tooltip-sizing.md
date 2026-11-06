# BUG-794 — Keep filled backpack cards sized to their slots

- Severity: Medium
- Status: Fixed on `feat/ui-remaster`.
- Owner: frontend-dev
- Build: `3dd5e715` plus uncommitted remaster styles.
- Environment: Chromium headless shell 145; 360×640 through 1920×1080;
  en and zh-CN. Static server-rendered populated UI; no gameplay executed.
- Seed: Not applicable; presentation only.

## Reproduction

1. Render InventoryScreen with a populated backpack.
2. Inspect the filled cells of BackpackGrid.
3. Measure the GameCard button inside each tooltip reference span.

Expected: Filled cards occupy their square slots, matching empty cells and
remaining at least 44×44 px interactive targets.

Actual: The inline-block reference span shrink-wraps a fluid child sized with
percentage width and height. It has no usable intrinsic width, leaving a
4×4 px card.

Evidence: The populated visual matrix recorded 4×4 px item buttons at all five
viewport sizes. Final before/after dimensions and captures are retained in
`docs/art/ui-remaster-evidence/validation.md`.

Root cause: Tooltip's reference wrapper does not inherit the fixed slot size.
Fix: Provide an optional reference wrapper class and explicitly fill the slot
from BackpackGrid. Preserve the floating tooltip's sizing and behavior.

Verification: The final 220-check static browser matrix passed. Filled cards
measure at least 64.5×64.5 px across both locales and all five viewports, with
144 card measurements at each width. See the
[retained measurements and captures](../../docs/art/ui-remaster-evidence/validation.md).
No gameplay was executed.
