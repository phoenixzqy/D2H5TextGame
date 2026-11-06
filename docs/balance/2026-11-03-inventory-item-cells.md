# Unchanged inventory item cells

2026-11-03. Local performance fix retained; BUG592 and independent umbrella
acceptance remain open. Private v1 is incomplete.

Stable item keys preserved mounted cards but still rebuilt every occupied
Tooltip/card subtree after unrelated transfers. A private React.memo ItemCell
now receives the current item, selected/upgrade booleans and callback. Its
default complete props comparison skips unchanged cells; its own translation
subscription keeps locale changes live. No custom comparator, game-data,
validation, action-boundary, persistence or public API change is introduced.

Two before-fix regressions reproduce redundant tooltip rendering after removal
and reordering. All 23 affected grid/pagination assertions pass, checking focus,
selection, latest item/callback/upgrade flags, locale and capacity access.
Final scoped strict TypeScript and explicit lint pass. The initial lint warning
for a new fixture's non-null assertion is corrected with a fixture guard; only
that affected case is repeated, adding no distinct passing test. Filtered RED
and fixture cases are excluded from pass counts. No engine or earlier-act suite
is run. Production formatting after the full GREEN run changes whitespace only.

| Profiled transfer | Retained baseline ms | Item cells ms |
| --- | ---: | ---: |
| Desktop/en, one observation | 171.059 | 125.432 |
| Mobile/zh, observation 1 | 413.433 | 352.934 |
| Mobile/zh, observation 2 | 433.043 | 320.470 |
| Mobile/zh, observation 3 | 445.222 | 337.195 |
| Mobile median | 433.043 | 337.195 |

The fixed single-run selection rule passes: mobile median improves 22.134%,
desktop improves 26.673%. Chromium 147.0.7727.15 uses actual tooltips,
1280×800/en/1× CPU and 360×640/zh-CN/4× CPU, CPU profiling, and the same
click-to-two-frames boundary. The original authenticated baseline is reused
without replay. These development localhost observations on a shared host do
not establish production or representative-device budgets.

Every independent browser context imports the complete earned
8,540-backpack/499-stash save through ordinary controls, then transfers its
first item. Full public exports and native IndexedDB saves equal independently
modeled single-transfer successors. Surviving card DOM identity and access to
the last item remain intact; no page/console errors or horizontal overflow occur.
The two retained final-page screenshots are inspected.

First-mobile inclusive Tooltip samples fall from 49.213 to 6.924 ms. This is
sampled attribution, not exhaustive rendering accounting. Mobile longest tasks
are 188/171/181 ms, versus 277/284/297 ms previously; BUG592 stays open. The
interaction boundary does not include every later debounced save.

All 2,147 baseline production inputs authenticate; exactly the grid source and
test differ afterward. Gameplay data is unchanged. Check/browser processes are
terminal; both exact owned cache paths are verified absent. The browser run
costs 82,386.572413 wall ms and zero admissions/combat; it neither consumes nor
renews the closed CE comparison-family allowance.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-item-cells-v1-closure.json`
SHA256 `4c4d45d7259c63b60f4cf5eb1b76f3504675d126562af8371b57d8b63596fc5a`.
It indexes exact snapshots/configs/driver, failures, focused checks, four CPU
profiles, complete-save browser results and screenshots. Root retains this
required packet and human2 through umbrella review and owns eventual cleanup
and release. Self-review does not replace independent signoff.

The preceding status-only goal turn was no progress; this increment completes
a measured source correction. Act V remains 13/19; formal balance remains
0/210. BUG611, remaining Act V, 14-build populations/holdouts, economy/Hell,
retry/manual-idle, 30–50 active-hour pacing and integrated G0–G7/soak/review stay
open. Browser works, CI stays excluded, and no user answer is pending.
