# P17 — Returning-player message

Verified locally on2026-11-04, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
Closes BUG675 and idle spec §5.2; full P17/private v1 remain open.

Startup publishes a transient hydration receipt after durable reconciliation,
locale loading and successful store installation. Absence uses the newer saved
timestamp/lastOnline rather than cumulative offlineTime. The receipt describes
the actual chosen bonus/window, including stronger/tied retained bonuses.
Sub-minute gaps and clock rollback produce no notice; successful exact
restore/import/delete clears stale feedback. Memoized startup and explicit
dismissal prevent remount reissue. The receipt is outside save/autosave state.

The bilingual globally mounted toast has a permanent polite live region,
44px keyboard close target, safe-area inset and responsive wrapping. Its
noninteractive surface ignores pointer events, preserving navigation. Historical
“On return” wording avoids claiming the bonus remains unchanged as time passes.
Two decimal percentage precision and minutes/seconds preserve small valid bonuses.

| Check | Result |
| --- | --- |
| Original lifecycle reproduction | Expected RED:12failed/58passed |
| Final affected persistence/UI suites |117/117passed,7.57s total |
| Scoped strict types and explicit lint | Passed |
| Production build with VITE_E2E unset | Passed, Vite19.72s |
| Production JS bridge scan | Ten chunks; zero forbidden symbols |
| Desktop/mobile × en/zh-CN production browser |4/4passed,29.1s; no skips/retries/errors |

Browser cases create/save through ordinary UI, really close the page, then reopen
after eight hours offline via the warmed production SW. They verify localized
50%/120-minute feedback, navigation/save controls while visible and exact whole
exported saves with only independently expected timestamp/idle changes. Five
viewport sizes (360×640,412×915,640×360,1280×800,1920×1080) have no horizontal
overflow, with close control visible and at least44×44. Enter/Space dismissal,
navigation without reissue, and actual same-clock second close/reopen without a
fresh receipt or bonus grant pass. No bridge, injected character or offline income.

Local five-axis source/test/control review found no material issue within scope.
Mobile Chinese home and desktop English focused-close captures were inspected.
No independent reviewer agent was used; umbrella review remains open.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-return-toast-v1`.
It retains original snapshots/RED, source hashes/task diff, unit/type/lint/build
logs, browser report/log, eight decoded captures, runner/type config evidence,
review and cleanup receipt. Source hashes matched before documentation closure.
All consumers terminal; preview4398closed; exact configs, verified766-file build
and disposable browser results removed/verified absent. No cleanup failures.
Root retains required evidence and human2 worktree through umbrella review and
owns eventual evidence cleanup/worktree release.

Security: local hydration/UI only; no credential/network/permission/save-format
or reward-formula change. Existing chunk-size and optional-art precache warnings
remain. No campaign replay, full suite, install, new agent, commit/push/publication
or renewed preparation/diagnostic budget. Counts stay14intended ActI/3Normal/
formal0of210. Actual attack-speed display, broader idle/MF/PWA, build viability,
economy/pacing and final review/soak remain. Browser works; CI excluded; no pending
question or external blocker.
