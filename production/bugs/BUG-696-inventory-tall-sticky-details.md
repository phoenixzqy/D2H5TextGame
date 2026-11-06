# BUG-696 — Keep tall item-detail actions reachable on tablets

- **Status:** Fixed locally; umbrella acceptance remains open
- **Severity:** Medium
- **Owner / affected systems:** frontend-dev; InventoryScreen desktop/tablet sidebar
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes and BUG-694 readability classes
- **Environment:** WSL Chromium 147.0.7727.15, native Vite development app; en; 768×1024
- **Seed:** Not applicable; read-only navigation

## Reproduction

1. Import the unchanged retained Cold native export through Settings (same fixture/hash as BUG-694).
2. Open Inventory at 768×1024 and select unique socketed item `it-7z7r8-2yt`.
3. Scroll the details and attempt to reach the final Discard action.

**Expected:** All actions can be scrolled into the visible viewport at readable text sizes.

**Actual:** After `scrollIntoViewIfNeeded`, the final 48px action remains at y1057–1105 outside the viewport bottom1024. The taller sidebar is sticky with an 80px top inset and cannot scroll internally.

## Evidence and cause

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-item-readability-vl3d6whv/sticky-and-tooltip-failed-green-browser.json` records `unique-sockets-actions`, en, 768×1024 and the exact bounding/clip values. The native browser has zero page or console errors. `InventoryScreen.tsx` applied `md:sticky md:top-20 h-fit` to the variable-height detail panel. Sticky positioning prevented the outer scroller from exposing the final part of a panel taller than its available viewport.

**Workaround:** Switch to mobile or a larger viewport. This does not meet the target tablet flow.

## Resolution

Remove the sidebar's sticky positioning so ordinary page scrolling exposes the
entire panel. No guessed header height or additional nested scrolling is needed.
Final browser checks pass action reachability in both locales at all six sizes,
including the original 768×1024 socketed-item case. All 84 layout records have
zero issues. See [P16 evidence](../../docs/plans/evidence/p16-item-readability.md).
