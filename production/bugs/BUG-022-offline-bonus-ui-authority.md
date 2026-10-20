# BUG-022 — Offline-bonus UI ignores the persisted current bonus

Severity: High (returning/imported bonuses are hidden or independently invented).

## Reproduction and actual RED

At dependency head `308806a` (including `50bee46` shared projection), mount the
real banner/chip with persisted multiplier 1.32, remaining 4800 seconds, online
anchor T, and null lastClosedAt. At T+600 seconds the UI must display current
+28% and 70 minutes. It renders nothing because useOfflineBonus derives a
separate award from transient lastClosedAt. A stale closure timestamp conversely
invents a bonus when the authoritative tuple is inactive.

Before any runtime edit, replaced the four old helper-only UI accrual tests with
10 mounted hook/component/exact-import cases. Command:
`npx vitest run --project ui src/features/idle/useOfflineBonus.test.ts --reporter=dot`.
Actual result: **10 failed / 10**, 3.42 seconds (4.57 seconds command wall time).
First failure: missing offline-bonus-banner for the aged persisted active tuple;
others include stale-close false activity, mounted replacements, actual exact
import, remounts, timers, tiny active bonus, and zh-CN rendering. The real store,
projection, import orchestration and UI are exercised; only the IndexedDB
boundary is an in-memory fake.

The approved visible-return extension was also tested before runtime edits:
11/11 failed, 6.44 seconds (8.38 seconds wall time).

## Review-discovered rollback timer RED

Producer source review found a one-shot scheduling defect in the first patch:
a timeout effect keyed only by active/remaining duration does not rearm when
clock rollback clamps elapsed to zero and leaves the projected duration
unchanged. Before correcting the runtime, added a real hook regression:
anchor T, wall clock T−60s, deliver the first 30s timeout; the tuple correctly
stays 1.32/4800, but there must still be one scheduled timeout. Actual result:
**1 failed / 11 passed**, 3.60 seconds (4.81 seconds wall), received timer
count 0 instead of 1. No store, parent or visibility event rescues this test.
It also requires later automatic decay/expiry and no domain publication.

## Approved correction and scope

Read meta.readIdleBonus at actual render time, subscribe to raw tuple and online
anchor, and wake at min(30 seconds, remaining duration). UI reads must never
publish/reanchor/store a tuple. Show current percentage and remaining duration;
v7 has no original peak/window, so remove the obsolete UI peakPct/windowSeconds
and deriveBonusFromLastClosed APIs. The four old UI helper tests explicitly
encoded the superseded transient authority; engine accrual/cap tests remain.
Localize the visible compact chip unit as well as its accessible label.

P17a04 changes UI authority only. App/meta obsolete close APIs, reward
integration, hidden interval ownership, periodic/close writes, true-away browser
and production PWA acceptance remain open. Imported browser bonuses demonstrate
wiring, not earned progression. Full P17 and v1 are not accepted by this child.

## Validation

- Final focused: 12/12 passed, 3.45 seconds (4.64 seconds command wall time).
- Related hook/banner consumers before the additional rollback regression:
  22 files, 231 tests passed, 13.60 seconds; final full suite also covers it.
- Final full unit suite: 109 files, 1227 passed / 1 existing skipped,
  37.89 seconds. The first patch also passed 1226 tests in 28.37 seconds.
- Typecheck, complete repository lint, and forced ESLint of all four changed TS
  files including the normally ignored new browser spec passed.
- Final production build passed in 13.27 seconds. Existing large-chunk, stale
  Browserslist-data and optional generated-art-manifest precache warnings remain.
- Ordinary browser: en/zh-CN × 1280×800/360×640, 4/4 passed in 10.5 seconds.
  Expanded final browser source also checks the active home banner on a second
  same-clock document reload and a return to Settings: 4/4 passed in 12.2 seconds.
  After the rollback fix the same final browser source passed 4/4 in
  24.3 seconds alongside full unit/build/lint. No failed browser attempts.
  The test uses normal character creation,
  language selection, downloaded export, import dialog, Save, navigation and
  reload. Controlled time proves +32%/80min → +28%/70min after 600 online
  seconds → identical export after Save/reload → +24%/60min after another
  600 seconds → expiry. A still-mounted short replacement displays immediately
  and disappears at its 20-second expiry. Complete exported save equality
  preserves unrelated player/inventory/map/metadata fields. No game bridge,
  direct game-store/storage writes or forced pointer actions.
- Hook tests also prove aged mount/remount, actual between-tick render time,
  anchor-only replacement, real exact-import active/inactive replacement,
  metadata changes, tiny positive activity despite rounded 0%, short expiry,
  no publication/source mutation and StrictMode timer/listener cleanup. A
  visibility return after undelivered timer time reprojects immediately.

Root source review approved the runtime. Its test-only request supersedes
the initial stale-close regression with an inactive historical authoritative
tuple/anchor regression, removing the future lifecycle dependency on markClosed.
This still asserts no invented accrual and no timer; the other ten authority
cases are retained, alongside the added rollback regression. Root and producer
both returned final [P17a04-SOURCE-REVIEW]: APPROVE after reviewing the wake-counter
correction and tests. Complete typecheck/lint/forced-four-file-lint/build/full-unit
and ordinary browser checks above passed for the final runtime.

## Cleanup

After all task-owned validation processes finished, removed and verified absent:
- worktree4/dist
- worktree4/node_modules/.vite
- /tmp/d2h5-p17a04-browser-1
- /tmp/d2h5-p17a04-browser-2
- /tmp/d2h5-p17a04-browser-3

Here worktree4 is
/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-4.
Installed node_modules and source/history/evidence remain. No cleanup failures
or disposable task artifacts remain.
