# BUG-694 — Restore readable item details and equipment comparisons

- Status: Fixed locally; umbrella acceptance remains open.
- Severity: Medium.
- Owner: frontend-dev / accessibility-specialist (root continuation).
- Affected systems: ItemDetailPanel, ItemComparePanel and shared StatSheet.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
- Environment: Chromium 147.0.7727.15, native Vite development mode with
  VITE_E2E unset; 360×640; zh-CN. No engine seed applies.

## Reproduction

1. Create a disposable Sorceress through New Game.
2. Import the unchanged retained Cold native export through Settings:
   `d2-counted-source-z3jj3xa1/p15-cold-direct-act5-suffix-v1.native-export.json`
   under the shared zai-temp evidence directory. SHA256:
   `4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a`.
3. Choose 简体中文, open Inventory, and select the first backpack item,
   Isenhart's Horns (`it-7gf2o-2qj`). Wait for the sheet entry animation.
4. Read requirements, sockets, set bonuses and the equipment comparison.

Expected: body/helper text at least 14px, normal-text contrast at least 4.5:1,
complete names/affixes and readable numeric comparisons without horizontal
overflow; actions remain reachable and keyboard dismissal retains focus.

Actual: 84 text nodes are 10–12px; 20 text nodes measure below 4.5:1, including
section labels (3.819:1), inactive set bonuses (3.325–3.330:1) and comparison
rarity badges (4.416:1). No overflow or clipped content occurs for this selected
item at the original font sizes. Other item names/affixes use truncation in
source; wider representative coverage is required after increasing text size.

Cause: explicit micro typography and low-opacity foregrounds on these three
presentation components; StatSheet also prevents numeric wrapping and truncates
names/affixes.

Workaround: browser zoom. This does not meet the intended mobile readability.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-item-readability-vl3d6whv`.
`red-browser.json`, `red-browser.log`, `red-zh-CN-360-detail.png`, `discover.cjs`
and `measure.cjs` preserve the native reproduction; zero page/console errors.
`before-*.tsx` and `baseline.json` retain original source and hashes. The first
observer measured during entry fade; its executable/output/capture remain in
`v1-*`, and `observer-animation-amendment.json` records waiting for finite
animations. No source edit preceded either reproduction.

## Resolution

Item details/comparisons now use at least 14px text, stronger inactive labels,
wrapping names/affixes and fixed table columns with deltas on separate lines.
All 84 layout cases across both locales and six viewport sizes pass with minimum
contrast 4.955760:1 and controls at least 44×44px. Two keyboard flows and two
native before/after export comparisons pass; gameplay state remains unchanged.
The 41 affected native tests, scoped strict types and ESLint pass. Final focus
coverage uses StrictMode; its eight rerun cases are included in those 41.

See [P16 evidence](../../docs/plans/evidence/p16-item-readability.md). Required
packet is retained; owned server/cache/config are removed. This development-
browser/local review does not close whole-app, production or independent gates.
