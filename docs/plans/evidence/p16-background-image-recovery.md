# P16/P17 — Home and town background image recovery

2026-11-04; locally verified, full private v1 remains incomplete.
Working tree: `feat/playable-foundations` at `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Root is the sole writer; previous goal turn only reported
status and made no implementation progress.

## Change and reproduction

[BUG721](../../../production/bugs/BUG-721-background-image-recovery.md) reproduced
independently in Home and Town: interrupt the actual resolved zone-art request,
restore it, cycle Chromium offline/online, and observe one request total with
permanent `display:none`. Both screens bypassed the existing recovery component.

The two screen callers now use `GameImage` with empty decorative fallback and
transparent, square, borderless wrappers. Home retains its absolute container;
Town retains its existing layer/overlay. Computed opacity remains 0.15/0.2 and
fitting remains `cover`. Shared `GameImage`/`useRecoverableImage` source is exact.
No new recovery loop, timer, cache-busting URL, schema, save or gameplay change.

Security check: pass; local UI component reuse and loopback verification only.
The large artwork provenance manifest has no observed runtime caller; its
Workbox size warning alone did not establish an offline gameplay defect, so no
PWA cache configuration change was made.

## Verification

- 19 existing affected cases pass: GameImage 6, HomeScreen 1, TownScreen 12.
  The shared cases cover failed/healthy reconnections and source changes; the
  town cases include bilingual act changes. No new repository tests were needed.
- Strict TypeScript with the two screen roots/dependencies and explicit two-file
  ESLint pass. Scoped diff whitespace check passes. No broad suite or build.
- Eight qualified browser cases: Home/Town × en/zh-CN × 360×640/1280×800,
  Chromium 147.0.7727.15 in development. Each failure retries the same URL once,
  loads real artwork, retains controls/healthy NPC nodes and their positions,
  and adds no image replacement/request on a later healthy reconnection.
  All layouts have no horizontal overflow; decorative semantics are retained.
- Four selected final screenshots were visually inspected across screens,
  locales and sizes. These checks do not establish production PWA, real-device,
  accessibility, performance or soak acceptance.

Initial failures remain retained. The first town selector also matched the
decorative HUD portrait; the corrected run repeated Town only. The first full
run labeled four cases English even though reloading reset them to Chinese.
Those labels are invalid: accept only its four explicitly Chinese cases.
Supplemental `after-en-browser.json` asserts document language and supplies all
four English cases without the reload. Initial mislabeled screenshots are
preserved under `initial-mislabeled-*`. An optional contact sheet failed because
Pillow is absent; the original screenshots were inspected directly.

An independent before/after preference-cache and visible-label reproduction
confirms [BUG722](../../../production/bugs/BUG-722-pre-character-locale-reset.md).
It remains open; no character save was loaded to qualify this UI slice.

## Retained evidence and cleanup

Exact required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-background-recovery-ud6mbopw`.
It contains original/final source bytes/hashes, `change.patch`, driver revisions,
before/final reports, screenshots, test/type/lint receipts, `validation.json`
and `cleanup.json`. All eight tool handles are terminal. Five exact browser/server
PIDs are absent and port 5173 is closed. Four exact task Vite caches are removed;
the active scoped type configuration is archived as `tsconfig.evidence.json`.
Cleanup verifies no failures. Root retains the evidence through unfinished
umbrella acceptance, then owns exact cleanup; the claimed worktree remains in use.

Counts stay **14/14 Act I; 12/14 intended Normal; formal 0/210**. Zeal, qualifying
earned Double Swing, economy/30–50 active-hour pacing, higher difficulties,
broader app/PWA/a11y/performance, soak and independent acceptance remain open.
Closed campaign/preparation/diagnostic budgets and earned successors are unchanged.
