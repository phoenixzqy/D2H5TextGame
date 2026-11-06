# BUG-720 — Avoid off-page name formatting for an empty crafting search

Status: Locally resolved in the retained working tree; no new commit.
Severity: Medium. Owner: root / frontend performance.
Affected systems: crafting equipment search, pagination and large inventories.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree. Node 24.21.0 / WSL, Vitest 1.6.1,
jsdom; en and zh-CN. No combat or RNG seed applies.

1. Mount the real `CraftingTargets` with 301 equipment entries and an empty query.
2. Observe twelve rendered equipment checkboxes.
3. Count actual item-name translation work during that render.

Expected: an empty or whitespace-only query preserves the input ordering and
formats the visible page only; names outside that page are unnecessary.
Actual: 313 base-name translations (301 filtering + 12 displayed), despite
only twelve visible entries. Nonblank queries legitimately inspect the complete
list. The retained earned save has 27,633 backpack items, amplifying this work.

## Cause and evidence

`CraftingTargets.tsx` formats every entry before applying `includes('')`.
An empty normalized search matches every entry, so the filtering/localization
pass serves no purpose. Preserve nonblank localized-name/ID/origin matching.

Regressions: `src/features/inventory/CraftingTargets.test.tsx`.
Corrected RED run: two workload failures, eight existing-behavior checks pass.
Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-empty-search-u8uw5wli`.
Root retains it through umbrella acceptance, then owns exact cleanup.
Initial test-label mistakes, preflight and Chinese-selector failures remain
retained. [Final evidence](../../docs/plans/evidence/p16-empty-crafting-search-performance.md):
336→32 ms median in a bounded development-browser comparison, 30 affected cases,
final types/lint and four bilingual layouts pass. Supplemental full-save equality
passes. Source fix is one line; production/device acceptance remains open.

Workaround: use small inventories; no item deletion is required or recommended.
