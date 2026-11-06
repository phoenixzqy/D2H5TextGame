# BUG-695 — Restore the item card after closing mobile details

- **Status:** Fixed locally; umbrella acceptance remains open
- **Severity:** Medium
- **Owner / affected systems:** frontend-dev; InventoryScreen mobile sheet, keyboard navigation
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited working changes
- **Environment:** WSL Chromium 147.0.7727.15, native Vite development app with React StrictMode; 360×640; zh-CN
- **Seed:** Not applicable; read-only item navigation, no combat

## Reproduction

1. Import the retained native export `d2-counted-source-z3jj3xa1/p15-cold-direct-act5-suffix-v1.native-export.json` through Settings.
2. Open Inventory at 360×640 and focus backpack card `inv-item-it-7gf2o-2qj`.
3. Press Enter to open its item-detail sheet. Focus enters the dialog.
4. Press Escape to dismiss it.

**Expected:** Keyboard focus returns to the original item card.

**Actual:** The sheet closes but focus falls to `BODY`. No console or page errors occur. The same flow previously passed the native focus tests, which did not mount the production StrictMode boundary.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-item-readability-vl3d6whv`.
`focus-diagnostic.json` records button → dialog → BODY; `focus-diagnostic.log` and `focus-failed-green-browser.json/log` retain the browser failure. Import SHA256: `4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a`.

## Confirmed cause

`MobileBottomSheet` captured `document.activeElement` on each layout-effect setup.
StrictMode's mount replay replaced the original opener with the already-focused
dialog, which is disconnected on dismissal. Wrapping the existing native focus
scenarios in StrictMode reproduced six failures out of eight before the fix.

## Resolution

Capture the opener only while its ref is null, preserving the original card
through mount replay. All eight existing focus scenarios now pass under
StrictMode, including nested confirmation, close/backdrop and both locales.
Final browser checks also pass mobile focus trapping and card restoration.
`focus-red-tests.log`, `focus-green-tests.log` and final `green-browser.json`
retain the evidence. See [P16 evidence](../../docs/plans/evidence/p16-item-readability.md).
