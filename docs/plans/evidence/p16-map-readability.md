# P16 — World-map readability

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited
local changes. [BUG701](../../../production/bugs/BUG-701-map-readability.md) is
resolved locally. Full P16/private v1 and independent acceptance remain open.

## Change and original reproduction

`src/features/map/MapScreen.tsx` now shows full wrapping area names, wrapping
badges, 14px details/status text and readable existing colors. Cleared rows no
longer lower text/control opacity. The idle banner wraps, its Stop Idle button
declares a 44px minimum target, and row actions expose visible keyboard focus.
No handlers, game data, strings, ordering, gating or saved gameplay changed.

The before browser reproducer records 45 observations: 18 small enemy-detail
lines, 21 small badges and six clipped names across fresh uncleared, fresh
locked and genuine earned cleared states. Details are12px/badges10px; clipped
names include Ancient's Way and Throne of Destruction (Baal). Zero browser
errors/warnings. Exact source preimage SHA256:
`be215c83199d70e2294489f665f065c18ddc0fd537e44211d6204069d513cf99`.

## Focused verification

All12 existing MapScreen tests pass: uncleared/cleared idle gating, native
farming navigation, both-language names and displayed enemy levels across
difficulties. Explicit single-file ESLint passes. No new class-string test,
whole suite, build, whole typecheck or campaign replay was run.

Installed JavaScript Playwright drove native Chromium against the Vite source
app with `NODE_ENV=production` and no test bridge. `after-report-v3.json` passes
80 act-layout observations:

- Earned completed-Normal state: all29 areas, zh-CN/en, 360×640, 412×915,
  640×360, 1280×800, 1920×1080 and 1280×800 with200% root text sizing.
- Separate fresh character: all29 areas, zh-CN/en, 360×640 and the same200%
  text-sizing case, including uncleared/locked rows.

Minimum measured relevant text14px; minimum measured enabled-text contrast
6.4683058:1. No name clipping, row/document/main horizontal overflow, undersized
row/act targets or unreachable final-row controls. Two keyboard flows verify
Enter closes/Space opens Act V, `aria-expanded` and retained visible focus.
Three inspected captures show earned English mobile, fresh Chinese mobile and
earned Chinese200% text layouts. Text sizing is the root-font reflow check;
native browser page-zoom and whole-app accessibility are not established.

The genuine source is the [earned recipe-family successor](p12b-earned-recipe-families.md),
Fire Sorceress53/Normal next921/material ordinal908. Native Settings file import,
baseline export, all map interactions, final Save, new page and Continue preserve
all gameplay exactly. Only actual timestamp/lastOnline values change; the final
reload adds1694ms to informational offlineTime. No items, resources, bonus
multiplier/window, campaign state, roster or formation change. No combat,
farming, campaign admission, time acceleration or economic transaction occurs.

`source-audit-v3.mjs` compares the complete source AST to its exact preimage,
excluding JSX className attributes and the removed opacity class only. All other
source structure is identical. The earned save has no active idle target, so
the Stop Idle banner has static class/unchanged-handler verification only.
Final source SHA256:
`e9f1b9f3e497cf4e8a6fdc08562d0a584601adcf926ee827440056341c301ecf`.

## Observer corrections and retention

Original before observers remain: v1 selected the decorative image wrapper;
v2 attempted inline filling of a backup exceeding the native inline limit.
V3 selects row content and uses native file import. Original after v1 stopped
before layouts because reopening the old imported timestamp naturally accrued
offline bonus. Its exact gap838424ms/online0.629s arithmetic reconciles in
`observer-clock-amendment.json`; v2/v3 import the exact genuine backup before
baseline, without ignoring multiplier/window changes. After v2 stopped before
layouts on an immediate count during route loading; v3 waits for five act
buttons. Two AST observer failures concerned printer formatting/raw SourceFile
text, corrected by structural comparison. No source fix or gameplay replay was
needed for these observer errors; all executables/results are retained.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-map-readability-xrtuteyn`.
Retain preimage, observers/reports, native exports, screenshots, source audit and
check/cleanup receipts through umbrella review. This is local implementer
readback/source-browser evidence; production-bundle/PWA and independent
whole-app acceptance remain open.

Server session31034 exits0 with `SERVER_CLOSED`; exact PID3674364 and its port5173
are absent/closed. All browser observers are terminal. Exact task-owned
`browser-profile` and `vite-cache` were removed and verified absent;
`cleanup.json` records remaining disposables[] and failures[]. Root retains the
required packet and claimed human2 worktree through umbrella review, then owns
their eventual deletion/release. Counts remain14/14ActI,7/14five-act Normal,
formal balance0/210; full privatev1 stays active/incomplete.
