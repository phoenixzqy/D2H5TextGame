# BUG-698 — Fit character cards and show readable starting attributes

- **Status:** Fixed locally; uncommitted, umbrella acceptance remains open
- **Severity:** Medium
- **Owner / affected systems:** frontend-dev; character creation, F15/P16
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes
- **Environment:** WSL, installed Playwright Chromium, native Vite development app; zh-CN, 360×640
- **Seed:** Not applicable; fresh character-creation screen, no combat

## Reproduction

1. Open `/character/new` in a fresh browser context at 360×640.
2. Compare the first two class cards with their grid boundaries.
3. Inspect the starting-attribute labels on each card.

**Expected:** All seven classes remain individually selectable, cards fit their grid columns without overlap, and localized attributes are readable at at least 14px. Names and values remain visible.

**Actual:** Grid x30–330 is 300px wide. The first 160px card occupies x22–182; the second occupies x178–338. Cards overlap by 4px and extend 8px beyond the grid edges. Attribute labels are hardcoded STR/DEX/VIT/ENG at 10px. Document width still reports 360px because the outer screen hides overflow.

## Evidence and cause

Reproduction JSON and screenshot:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-character-create-2ksokkfc/reproduction.json`
and `before-360-zh-CN.png` in the same directory. No page errors.

`CharacterCreate.tsx` puts fixed 160px GameCards into two equal columns with a 12px gap. Its 672px maximum wrapper also cannot fit four 160px cards plus gaps and panel padding on desktop. Shared GameCard's compact four-column stats use 10px labels. Page-overflow checks alone miss the overlap.

**Workaround:** Use a wider viewport; this does not meet the required mobile flow.

## Intended resolution and checks

Use GameCard's existing fluid sizing with parent-owned row height and a maximum three-column grid in this screen. Locally arrange full translated attribute names and values in four readable rows, and allow class names to wrap. Preserve shared cards, all seven choices, portraits/error fallback, creation logic and save format.

Verify child geometry, text, contrast, hit targets and keyboard creation in both locales at required sizes; run only affected creation regressions and scoped lint. Full private-v1 and whole-app acceptance remain separate.

## Resolution

Applied the planned local layout/translation correction in `CharacterCreate.tsx`.
All14unique geometry cases and two keyboard creation/autosave/reload flows pass;
six affected creation tests and explicit two-file lint pass. The original preview
assertion now scopes its translated label to `dt`. Failed observer attempts remain
retained; no game/save source was changed for them. Exact server/cache cleanup
passes. See [P16 evidence](../../docs/plans/evidence/p16-character-creation-readability.md).
