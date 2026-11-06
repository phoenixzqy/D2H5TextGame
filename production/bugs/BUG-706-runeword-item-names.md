# BUG-706 — Show completed runeword names throughout item displays

Status: Resolved locally, uncommitted; independent acceptance pending
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes.
Environment: Vitest UI/jsdom, en and zh-CN; native browser confirmation pending.
No engine RNG involved.

## Reproduction

1. Supply an item with base `items/base/weapon-staff` and
   `runewordId: runewords/leaf` to the shared item-name/display helpers.
2. Resolve its inventory list name and detail/tooltip heading in each locale.

Expected: Leaf / 叶子, from the existing canonical runeword translation.
Actual: Staff / 法杖; stale generated affixes can also mask the word identity.
The separate completed-word line in crafting does not correct general item names.
Workaround: inspect ordered socket contents or the crafting confirmation.

Evidence: `red.json` and `red.log` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-runeword-names-p7jnenwr`.
The focused regression reproduces 72 failed naming cases across both locales;
plain socket/unknown-word fallback cases pass. The original six unrelated cases
are excluded by the name filter (the reporter's aggregate count includes them).

Cause: `src/ui/i18nKey.ts:tItemName` ignores `runewordId`, and
`src/ui/itemDisplay.ts:resolveItemDisplay` duplicates that incomplete naming rule.
All 35 canonical runeword translations already exist.
Affected systems: F05/P12b item identity and P16 localized equipment/crafting UI.
Scope: shared display names only; preserve unique/set metadata, base stats,
requirements, socket validation, skill grants, ownership and saves.

## Resolution and verification — 2026-11-04

`tItemName` resolves a known runeword's canonical name after unique/set identity
and before generated/base fallback. `resolveItemDisplay` now uses that same
helper. Unknown word IDs preserve the existing fallback.

All 143 affected cases pass across the naming, display, tooltip and detail-panel
test files; scoped strict types and three-file lint pass. The regression covers
all 35 words in both locales, Leaf overriding stale generated affixes, and plain
socket/unknown-word fallback. Native Chromium source-browser checks render an
unchanged earned Leaf through BackpackGrid, ItemDetailPanel and ItemTooltip in
en/zh-CN at 360×640 and 1280×800: all four cases pass with localized names,
matching accessible card names, no document overflow or page/console/HTTP errors.

The earned save contains two equal projections of the same merc weapon; the
fixture selector was corrected after initially expecting one occurrence. Neither
the source save nor the item was mutated. No crafting/combat/save lifecycle was
repeated. Evidence and exact cleanup are in the packet's `browser-verification.json`,
`fixture-provenance.json` and `closure.json`. This closes the local naming defect,
not broader P12/P16 or independent/full-v1 acceptance.
