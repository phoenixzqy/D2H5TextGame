# BUG-719 — Virtualize the retained combat log

Status: Resolved locally in retained uncommitted working tree. Severity: Medium. Owner: root / frontend.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree, 2026-11-04, WSL.
Browser: Chromium; desktop 1280×800 and mobile 360×640; en / zh-CN.
Seed: not applicable (display of existing log entries).

1. Supply 200 combat messages to the paused combat screen.
2. Inspect the log while following the newest entries.
3. Observe that every retained message has a mounted DOM row.

Expected: `Diablo2TextGame.md` §4 and P16/F21 require virtualized scrolling,
including wrapped bilingual messages, hover/touch pause and native keyboard use.
Only visible and overscan rows should mount; all retained history stays reachable.

Actual: `CombatScreen.tsx` maps every retained entry. The 200-entry retention cap
bounds memory but does not implement viewport virtualization. No measured
performance-budget breach is claimed from this requirement gap.

Evidence: existing `CombatScreen.log-scroll.test.tsx` explicitly expects 200
mounted children. Focused reproduction, checks and real browser evidence will be
retained at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-combat-log-virtual-5i3imfx1`.

## Implementation and verification

Extract the existing log presentation, preserving input/pause behavior; add a
measured viewport window with spacers and identity-based reader anchoring.
Invalidate row measurements on width changes. Announce newly received messages
independently of recycled visual rows. Verify cap, older-row retrieval, eviction,
wrapping/resize, keyboard and existing pointer/touch regressions. Use constructed
display fixtures only; no earned gameplay or balance evidence is inferred.

## Real-browser finding — native Home interrupted

The first real Chromium fixture run (360×640, en) fails native Home: it stops at
scrollTop 2658 instead of reaching 0, with no browser console errors. The jsdom
geometry tests use instantaneous scrolling and do not cover the browser's native
scroll animation. Retain `browser-home-red.json`, `failure-360-en.png` and the
assignment/scroll diagnostic under the packet above. Trace before changing code;
retain keyboard defaults and viewport anchoring rather than intercepting Home.

The assignment/scroll trace shows height corrections repeatedly restore an old
anchor while Home is still animating. Skipping reader-anchor correction for
native-scroll measurement passes resolves Home; its focused regression first
failed at 1367 vs 1007, then all 43 component cases passed. The next browser run
passes Home, eviction, announcements and resize but reproduces End stopping 3724px
short. The native End target was computed against estimated total height before
remeasuring reflowed rows (`browser-end-red.json`). End must resolve the measured
tail before completing, preserving hover/touch pause for subsequent appends.

A further 412×915 resize narrows a wrapped row from 117px to 97.5px while its old
within-row offset is 114.5px. Reusing that offset skips the reader's row entirely
(`browser-shrunk-anchor-red.json`). Clamp the saved offset to the last surviving
pixel of the same message when reflow makes that offset physically impossible;
otherwise preserve the exact offset. Add a shrinking-anchor regression before
repair, and apply the same bound in the browser's expected-position assertion.

The first clamp attempt passes the shrinking-row regression but exposes 27 failures
in the older interaction fixture, whose intentionally unmeasured one-row geometry
uses a synthetic 1000px scroll range. Bound only offsets of a row whose height
actually shrank; an unchanged/unmeasured row has no new lost pixel. The browser
observer also incorrectly excluded the first 8px of the scroll viewport as if
padding were a fixed occlusion: the restored row's last pixel was visible there.
Correct its first-visible-row readback to use the real clipping edge (top), retain
`browser-resize-observer-error.json`, and retain original exact-offset assertions
whenever reflow leaves that offset available.

## Resolution and bounded verification

`CombatScreen.tsx` now uses extracted `CombatLog.tsx` and
`useVirtualCombatLog.ts`. Visible rows plus six-row overscan mount between
measured spacers; all 200 retained messages remain reachable. Message identity
and partial offset survive head eviction and reflow; native Home/End reach the
physical boundaries. Hover/touch pause, native scrolling, release and pinning
are preserved. A separate polite region announces only newly received IDs,
so recycling visual rows does not reannounce history. The focusable log retains
its actual role through a per-file ESLint role allowance, with no rule disabled.

Final affected component result: **45/45** (35 interaction + 10 virtualization).
The final five-file lint and strict hook compilation pass. Full app compilation
passes in `final-typecheck.json` (141.8 seconds); the hook-only check additionally
covers the final shrinking-height condition. Its first temporary scoped config
omitted `src/vite-env.d.ts`; that failure and corrected config/result are retained.

Real WSL Chromium 147: both locales at 360×640 passed before the shrinking-height
refinement; the remaining eight locale/layout cases at 412×915, 640×360,
1280×800 and 1920×1080 passed afterward. Two final 360×640 mouse/actual-CDP-touch
flows pass, including stationary pause, wheel/swipe, reader retention, no blank
viewport and End. Console collections are clean. Mobile, landscape and desktop
captures were inspected. Constructed log display only: no campaign/balance or
whole-app performance acceptance is inferred. No broad test or build rerun.

`closure.json` in the named packet binds the six final source/config hashes and
verifies owned server PID4115184 absent, port45219 closed, and disposable Vite
cache/active scoped config removed. Root retains the exact evidence packet
through umbrella acceptance, then owns its cleanup. Independent final review,
runtime/device budgets and soak remain open; full private v1 is incomplete.
