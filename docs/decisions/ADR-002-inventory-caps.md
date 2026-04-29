# ADR-002: Inventory Capacity (Backpack 100 / Stash 500)

- **Status:** Accepted
- **Date:** 2026-04-28
- **Wave:** UX polish wave 3 (Bug #13)

## Context

The early UI shipped with `MAX_BACKPACK = 40` / `MAX_STASH = 100` as
placeholders while loot drop rates and item churn were unknown
(`src/features/inventory/InventoryScreen.tsx:38-39`).

QA playtests on the act-1 → act-2 transition consistently hit the
backpack cap mid-run, forcing players to dump items before clearing a
sub-area. The current GDD draft (§6.3) targets **500 backpack / 2000
stash** at the late-game tier with horadric-cube/charm-grid expansions,
but those systems are not yet implemented.

## Decision

Bump the v1 caps to:

- **Backpack:** 100 slots
- **Stash:** 500 slots

These values:

1. Comfortably absorb a 4-wave sub-area run plus 1–2 farming loops at
   the current drop rates without forcing mid-run dumps.
2. Stay below the GDD §6.3 late-game targets so that the upcoming
   horadric-cube / charm-grid expansions (planned for content wave 4)
   still feel like meaningful upgrades.
3. Do **not** require any save migration — `InventorySaveData` is
   already an unbounded `readonly Item[]`; the cap is purely a UI/UX
   guardrail.

## Consequences

- **Positive:** Fewer "inventory full" pop-ups during normal play.
  Stash-tab roundtrips drop sharply.
- **Positive:** The GDD §6.3 expansion path is preserved — capacity
  upgrades remain a tangible reward.
- **Negative / risk:** Larger inventories increase the cost of the
  per-tick `O(n)` scans in inventory selectors. Profiling on 360×640
  shows the cost stays well under 1 ms for n=500, so this is
  acceptable for v1. If selectors get hotter we should memoize by
  item-id.
- **Negative / risk:** Hoarders may delay engaging with the upcoming
  charm-grid economy. Acceptable trade — engagement-by-pain is not a
  product principle.

## Alternatives considered

- **Keep 40/100.** Rejected — playtest evidence shows it actively
  blocks the core run loop.
- **Jump straight to GDD §6.3 (500/2000).** Rejected — too generous
  before the horadric-cube/charm systems exist; would devalue the
  upcoming expansion progression.

## Follow-ups

- Revisit when content wave 4 lands (horadric cube, charm grid).
  Expected next step: 250 backpack / 1500 stash with a paid expansion
  to GDD §6.3 final values.
