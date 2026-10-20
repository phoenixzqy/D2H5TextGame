# BUG-024 — Quiet online sessions leave stale persisted bonus clocks

Severity: High (restart may count previously online time as away time).
Status: fixed in P17a06 (implementation commit in execution ledger).
Affected: persistence lifecycle, frontend/store ownership; base `308806a`.
Environment: Node24.21.0/Vitest1.6.1/jsdom, fixed clock, en/zh independent;
no viewport or RNG dependency. Browser termination durability remains unproven.

## Reproduction and evidence

1. Restore a valid v7 character at1792454400000 with1.32/4800seconds bonus.
2. Start autosave and spend600seconds online without changing a domain store.
3. Alternatively jump the clock600seconds and dispatch visibilitychange or
   pagehide through the actual document/window.
4. Expected: periodic30second or event checkpoint saves1.28/4200seconds,
   timestamp/lastOnline equal now; raw tuple/anchor remain unchanged.
5. Actual: no write occurs; persisted state remains1.32/4800 at the old clock.
   Restart therefore cannot distinguish that online interval from away time.

Genuine behavioral RED before runtime edits:12failed/4passed,16cases,2.89s
at06:19:36UTC,2026-10-20. Command:
`npx vitest run --project ui src/stores/persistence.lifecycle.test.ts --reporter=dot`.
The real stores/orchestration/adapter run; only Dexie IO is faked. Failures cover
periodic/events, hidden-return decay, retry, start/stop and delayed restoration.
Existing guard/no-character cases pass; absence of callbacks alone is not proof
that their new implementations respect those guards.

## Approved root fix and limits

Root/producer approved P17a06: startAutoSave owns one30second interval and
visibilitychange (hidden/visible)/pagehide listeners, using existing projected
flushSave with caught background rejection. stopAutoSave removes all owned
callbacks and debounce; start/stop/restart are idempotent. Guard suppression,
blocked recovery, absent character and queued replacements. Preserve cached
page-lifetime initialization and adapter ordering. Already submitted writes may
finish after stop, but stopped callbacks cannot initiate new writes.

An open hidden/BFCache page stays online: absolute-clock decay continues and
return grants no bonus. Startup alone reconciles persisted away time. After
P17a04 shared UI lands, remove App/meta obsolete lastClosedAt/markClosed ownership.
Do not add App effect cleanup that stops cached initialization without restart.

Pagehide IndexedDB writes are best effort; browser termination may interrupt
them. Periodic checkpoints bound ordinary staleness while callbacks execute.
Actual close/reopen, PWA acceptance and P11 background combat catchup are later
work. No schema, reward or bonus-formula change.

Security check PASS: local lifecycle checkpoint writes through existing validated
snapshot/serialized adapter, no external IO/credentials/permissions/CI changes.

Own persistence.ts, metaStore.ts, App.tsx, lifecycle tests, D12 and this report.

## Implementation evidence

First source attempt:15pass/1fail,2.89s at06:20:40. Delayed startup existence
check still allowed2writes from already active callbacks before suppression.
Moved suppression/debounce cancellation before that awaited check. GREEN16/16,
2.78s at06:21:00. Deliberately removing only the replacingSave flush guard makes
the queued raw-hydrate→import case fail (2writes instead of1),2.79s at06:21:40;
source restored exactly in finally. This proves the queued replacement guard
case fails when the defect is introduced, independent of missing listeners.
T/changed-file lint pass. Integrated reviewed P17a04 as2145535 after BUG023
as2fdf9e7, then removed obsolete App/meta close fields/actions/effect. Cached
initialization effect remains intact. Source references to those APIs are gone;
only the historical supersession comment remains in the UI test file.

Root/producer independently APPROVE final six-file source/test/control.
Four persistence suites67pass,9.59s under
concurrent validation. Final combined unit111files1256pass/1existing merc-XP
skip29.56s; T/L/B pass, build6.67s. Unit15s and related5s budgets remain unmet.
Existing React act/router, chunk-size/Browserslist and optional generated-art
manifest precache warnings remain. No source changed after these checks.

Ordinary final browser regression:14/14pass40.2s, en/zh-CN at1280×800/360×640,
save-management plus persisted-bonus authority. It covers full export/import/
reload equality, malformed import preservation, quota/export recovery, viewport
controls, active UI current decay/remount/short expiry. Command:
`E2E_PORT=4322 npx playwright test tests/e2e/save-management.spec.ts tests/e2e/offline-bonus-authority.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p17a06-browser`.
No browser failure. These dev-server cases do not establish true-close/away,
production offline/PWA, background combat catchup, earned progression or fullP17.

All consumers/processes finished. Deleted and verified absent exact task-owned
worktree2/dist, worktree2/node_modules/.vite and/tmp/d2h5-p17a06-browser, where
worktree2 is/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2.
No cleanup failures or disposable artifacts remain. Installed tools and all
source/history/evidence retained; root claim continues for the umbrella goal.
