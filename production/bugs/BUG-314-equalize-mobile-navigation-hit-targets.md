# BUG-314 — Equalize mobile navigation hit targets

Status: Open — actual production reproduction before layout change.
Severity: Medium — navigation works but violates required44px touch width.
Build: e7aeafccea70b1d17bd711e6fab4c20fed4d0d35.
Environment: Chromium mobile360×640, en; new disposable Sorceress in Settings.
No engine RNG dependency; no seed needed.

## Reproduction

1. Create a character, select English and inspect bottom navigation at360×640.
2. Read each native anchor's bounding rectangle.
3. Observe one or more41.3125px-wide targets despite a360px row with eight links.

Expected: all eight links fit onscreen and have at least44×44px hit areas.
Actual: flex items retain content-derived automatic minimum widths, so longer
labels take space from short labels. `flex-1` alone does not distribute equal
widths. The SVG correction exposes this pre-existing layout risk; no icon-shape
assertion failed.
Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-nav-icons-xgw7t06k/browser-report.json`
and `nav-browser.json`; failure screenshot individually viewed at
`browser-output/navigation-icons-360x640-r-3f578-igation-survives-offline-en-navigation-icons/test-failed-1.png`.
The exploratory matrix was deliberately stopped with SIGINT to the verified
task-owned Playwright PID after this failure: one failed/two interrupted/seven
not run, exit130,42.894s. This is not a completed matrix. All1942tracked task
source/config inputs and HEAD remain exact. Original artifacts remain retained.

Affected systems: frontend/UX/accessibility/QA; root sole executor.
Root cause: `BottomNav` list items have flex growth but no zero minimum width.
Workaround: use native keyboard links; existing visible labels remain available.

## Planned correction

Allow the existing flex children to shrink uniformly with `min-w-0`, retaining
eight equal45px targets at360px and the unchanged desktop rail. Re-run the exact
44px assertions, foreground/viewport bounds, keyboard and emulated touch routes,
both locales/five sizes and actual offline continuation. Preserve any remaining
text truncation as an explicit limitation, not whole-app acceptance.

The browser spec also guessed Save Now/立即保存 instead of the actual Save/保存.
Correct those literal selectors before the next run; no source translation
change or timeout increase. This harness mistake is distinct from the observed
41.3125px product failure. Security check: pass; scoped first-party CSS/tests,
no permissions, networking, data or dependencies. Author plan review ready.
