# BUG-316 — Avoid unused crafting target localization

Status: Implemented in6480ac15; scoped native/production checks pass, fresh whole integration and independent acceptance pending.
Severity: Medium — excess work delays inventory entry for retained large collections.
Build: 6c57da6309f7b4bded1a63786a2922b2ba19c315; immutable production source b508e864.
Environment: bundled headless Chromium, 360×640, en/zh-CN. Disposable freshly created Sorceress with constructed 100/24000-item imports; no genuine campaign/replay action. No engine RNG dependency.

## Reproduction

1. Create a disposable character, export its save and prepare an explicitly synthetic diagnostic import containing24000 valid, uniquely identified normal caps.
2. Import through Settings and open Inventory with the default Rune fusion action.
3. Record an actual browser CPU profile. `CraftingPanel` builds one equipment target per backpack item and translates the identical `crafting.backpack` label inside every mapping iteration, even though no equipment-target picker exists for this action.
4. In the retained bilingual focused reproductions,201backpack/101stash entries cause904unused origin translations across material-only operation changes and one collection update. Salvage/socket target modes also translate the same backpack origin201times instead of once.

Expected: material-only rune fusion, gem fusion and gem dismantling do not prepare equipment targets. When gear selection is needed, each unchanged source label is translated once; all items, exact selections, pages/search, recovery origins and locale updates remain correct.
Actual: invisible target preparation scales with the entire owned collection. In retained `24000-zh-CN-1.cpuprofile`, entries preparation accounts for283.62ms of285.99ms sampled CraftingPanel CPU;279.82ms is the backpack mapping/translation subtree. These are CPU diagnosis observations during concurrent full units, not device latency or controlled performance acceptance.

Evidence: root-owned task
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inventory-profile-gbqp4wuf`:
`cpu-summary.json`, original profiles/production reports, `profile-v1-limits.json`,
`inventory-target-work-red-resolved.json`/`.log` (six true failures,9.817s;
repository1942source/config inputs and HEAD unchanged), and exact test source.
An initial off-repository package-resolution failure ran no tests and is retained separately. The original pointerdown-frame metric occurred before mount and is invalid for completion latency; the corrected harness measures click-to-mounted-and-painted Inventory. Neither error is hidden or credited as acceptance.

Affected systems: frontend/performance/QA; root sole executor.
Root cause: `CraftingPanel` prepares every source entry regardless of `needsTarget` and localizes constant origins inside the per-item loop.
Workaround: reducing owned gear lowers the redundant cost; existing item paging does not bound this hidden work.

## Planned correction and author checks

Return no gear entries for material-only operations. Preserve quarantine's item-specific location labels; for ordinary target modes, compute the backpack/stash origin once outside each mapping loop. Preserve native service requests, exact inventories, capacity/save formats, selection/search/pages and live locale updates. Avoid function-argument spread for arbitrary retained over-cap stashes.

Six bilingual reproductions pass in an off-repository load-hook prototype; this is experimental evidence, not branch implementation or full acceptance. Validate the committed change with existing crafting/target/pagination regressions, strict types/lint, an ordinary production build and the same before/after constructed browser diagnostic. Complete full integration before handoff; whole-app/device performance and independent acceptance remain open.

Author plan review: ready; no unresolved behavior choice. Security check: pass for authorized first-party presentation work, no credentials/network/permissions/CI/dependencies/save-format change. Root author review only; no independent approval or remote publication.

## Implementation checkpoint

The committed prototype and permanent
`src/features/inventory/CraftingPanel.target-work.test.tsx` pass all six causal
cases; existing crafting/pagination give46PASS/threefiles. Scoped strict types,
explicit lint and ordinary production build pass. Identical constructed
24000-item360px contexts improve local median click-to-painted Inventory from
236→119ms(en) and349→131ms(zh-CN). The100-item English114→120ms variation remains
reported. Production comparison4/4preserves exact ownership/100-card bounds;
ten required locale/size cases additionally prove actual final-target selection.
All contexts have zero captured page warnings/errors.
See [bounded evidence](../../docs/plans/evidence/p16-inventory-crafting-localization.md).
Fresh whole integration/retention is pending; no device/whole-app performance or
independent acceptance is claimed.
