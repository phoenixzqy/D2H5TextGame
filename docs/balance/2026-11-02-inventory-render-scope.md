# Inventory paging render scope — retained, 2026-11-02

Paging and selection no longer rerender the global material, crafting, quest and
quarantine panels. Their existing subscriptions and gear-driven parent refreshes
remain live. Local state now belongs to internal `InventoryGear`; stable panel
children retain their identity. Broad memoization would risk stale quest readers,
which inspect current state beyond their direct subscriptions. No DOM/layout,
validation, ownership, transaction, storage, engine or authored-data change.

Two regression cases failed before the fix: paging increased counted-quest graph
validations from one to three in each locale. All 66 affected cases across four
inventory suites pass after the fix, including selection, gear-driven refresh,
material filters/updates and language switching. Scoped strict types, changed-file
lint and diff whitespace checks pass. No unrelated or campaign suites replayed.

Five warm alternating first/last-page pairs per browser profile:

| Profile / destination | Baseline median | Candidate median |
| --- | ---: | ---: |
| Desktop/en first page | 228.720 ms | 139.509 ms |
| Desktop/en last page | 156.533 ms | 108.143 ms |
| 360×640 zh-CN, 4×CPU first page | 666.362 ms | 463.375 ms |
| 360×640 zh-CN, 4×CPU last page | 515.525 ms | 296.089 ms |

Mobile median longest tasks fall 506→311 ms and 374→155 ms. Candidate paging
profiles contain none of `QuestItemsPanel`, `MaterialsPanel`, `CraftingPanel` or
`validateLiveCountedQuestGraphs`; baseline profiles contain these frames.

Public import/export and native persisted full-save equality pass before/after
paging with the genuine level72/Hell1043 save (8,540 backpack items). First and
last pages render 100/40 cards; the final real item is reachable. No page/console
errors or horizontal overflow. Intermediate pages were not individually visited.
The driver's `all8540ItemsAccessible` name covers collection preservation and
boundary reachability only. Canonical save SHA remains
`aa7f9ed5196513e1a0045c59624550c815876b745d5e48c4512129859ca8ed76`.

Retain the fix. Initial inventory opening remains about 2.1 seconds mobile;
BUG592 stays open. Warm localhost/dev and CPU emulation are diagnostic evidence,
not release-device percentiles or full performance acceptance. Accepted balance
cells remain 0/210; full v1 remains unfinished.

Authority54 independently verifies all 2,141 source entries; exactly
`InventoryScreen.tsx` and its pagination test differ from authority52. Authored
data remains exact. Authority53 retains the rejected CE experiment separately.

Evidence retained by root through full-v1 review under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`:

- `bug592-inventory-scope-baseline-v3.{mjs,json}` and candidate `-v1.{mjs,json}`;
  associated first-navigation/paging CPU profiles and boundary screenshots.
- `bug592-inventory-scope-{red,green,types,lint}-v1.log`.
- `bug592-inventory-scope-readback-v1.{py,json}`: separate source/profile reader.
- `bug592-inventory-scope-baseline-v1-abort.json`: failed old IDB-envelope reader
  and exact owned process/profile cleanup; baseline v2 port-collision failure is
  preserved. Successful drivers probe a nonzero ephemeral port.

Consumers are terminal; four exact task Vite caches and the aborted browser
profile are absent. Required source snapshots and diagnostic evidence remain;
root owns their eventual cleanup and worktree release after umbrella review.
