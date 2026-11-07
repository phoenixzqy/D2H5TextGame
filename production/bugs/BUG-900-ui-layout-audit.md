# BUG-900 — Restore readable collection and item layouts

Severity: Medium
Status: Fixed in this change
Owner: frontend-dev

Reproduction: Chromium, 360×640 and desktop, en/zh-CN, commit 87e027f3.
1. Open a populated inventory and inspect a rare item.
2. Open equipment comparison, skills, mercenaries and character screens.

Expected: compact complete information, reachable controls, scrolling on constrained screens.
Actual: item stats hidden behind nested tabs/pages; labels wrap mid-word; finite collections and skill trees fragmented; character portrait stretches into spare space. Nested bounded panels lack a reliable scroll fallback.

Evidence: static source audit of ItemDetailPanel, StatSheet, PagedList and viewport.css; Chromium reproduction measured the item tab body at only 45px high on 360×640. No gameplay or save changes are involved.

Fix: replace viewport-measured tiny pages with bounded scrolling collections; render complete item stats and comparisons; retain adjacent desktop inventory details and mobile dialogs; use a shared focus-managed equipment dialog; keep skill trees connected; compact character and mercenary layouts; bound long tooltips while retaining click-through behavior so hints cannot block navigation; complete item information remains in scrollable detail dialogs. Reset detail and candidate scroll positions when selection/pages change.

Validation:
- Static Chromium fixture using real screens/components, without gameplay or persistence bootstrap. Audited all tabs of inventory, character, character creation, skills, mercenaries, map, town, quests, gacha and settings at 360×640, 412×915, 800×360, 1280×800 and 1920×1080. No collapsed list/tab viewports or horizontal overflow found. Completed resumed sweep reported no page errors.
- Inspected item details and equipment picker in English on phone and Chinese on desktop. Complete information scrolls; actions remain reachable; candidate viewport stays bounded. Mobile screenshots reviewed for label wrapping and comparison readability. Item, equipment and skill dialogs also pass bounds checks at 800×360, with no page errors; tooltip click-through verified.
- Focused StatSheet (10) and ItemDetailPanel (8) tests pass. EquipPicker's 15 other checks passed on the first run; the two dismissal checks passed after updating them for the shared Modal.
- Source-only TypeScript and scoped ESLint pass. Inventory and non-inventory reviewers approve.
- Full gameplay, campaign, balance, and broad regression suites intentionally not run per user direction. Temporary browser fixtures and captures removed after inspection.
