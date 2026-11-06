# Inventory counter batching

BUG592 now computes all five counted-quest inventory projections under one
complete live graph validation per read. Previously the panel loaded the five
definitions and then each single-family counter reloaded definitions and checked
the entire graph independently. No validation result is reused across reads.
Single-family callers and all action/transaction guards remain unchanged.

The regression first demonstrates five validations per panel render in both
locales. The new batch covers actual owned/consumed mixtures, inert source-free
legacy history, in-place corruption/repair, and item/progress/receipt accessors
without executing them. The scoped validation passes 69 distinct cases across
five affected suites: 51 counter/action/panel cases and 18 existing counted/Gheed
flows. Six batch cases are rerun after fixing test-only readonly fixture typing.
Scoped strict types and explicit lint pass. No campaign or unrelated suite runs.

The flow check also exposes BUG593: a legacy full-wallet expectation omitted the
already-authored 10 wishstones from each counted quest. Authority32 hash readback
confirms reward data, claimReward.ts and the old test predate this change. Ten
bilingual cases fail at that expectation; updating the exact delta makes all 18
flows pass. The full-wallet assertion remains strict. The final lint correction
changes only constant string property access to dot notation, with an exact
before/after readback; it does not justify another flow replay.

Browser evidence uses Chromium147 and the exact native earned level 70 / Hell961
save, with 7,413 backpack items. Desktop is 1280×800/en; mobile is 360×640/zh-CN
with 4×CPU throttling. File import is setup for the changed inventory path;
completed clipboard and combat baselines are not repeated.

| Diagnostic | Before | After |
| --- | ---: | ---: |
| Desktop first-page action to visible state | 615 ms | 524 ms |
| Mobile first-page action to visible state | 2,563 ms | 2,200 ms |
| Mobile longest task during first page | 732 ms | 282 ms |
| Mobile sampled inclusive quest-panel CPU | 707 ms | 274 ms |
| Mobile sampled inclusive counted projection CPU | 506 ms | 103 ms |

Before is the retained authority32 `bug592-browser-input-v1` capture. After is
`bug592-browser-counters-v1`. These are single-run development-server diagnostics
including automation/profiling overhead, not physical-device measurements or
acceptance percentiles. Inclusive CPU rows overlap and must not be added.
The last page remains reachable with its exact final item and 13 cards (100 on the
first page). Both public export and IndexedDB still exactly match the earned
save, apart from the declared desktop locale change. There are no page/console
errors or horizontal overflow. The earned save has no counted sources, so its
counter list correctly remains empty; owned/consumed display is covered by the
mixed-state and bilingual recovery/Claim flows, without adding fake sources to
the canonical earned save.

Inventory still takes 2.2 seconds on the throttled mobile view. Remaining sampled
work includes quest-item definition loading/assembly status and visible gear
comparison/rendering. Native import validation and cold reload also remain open.
This change does not complete G1/G5, the two-hour soak or full v1. Engine, schemas,
game data, reward balances and campaign helpers are unchanged; there are no new
earned admissions, grants or accepted balance cells.

All browser/server/test processes are terminal and the exact task Vite cache is
removed. No repository-local temporary config/build is created. Required source,
earned checkpoints, failures, focused checks, CPU profiles and screenshots remain
in `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
under `bug592-counter-*`, `bug592-browser-counters-v1*` and
`bug593-notation-readback-v1.json`. Root retains that packet and the active human2
worktree through full-v1/umbrella review and owns cleanup afterwards.
