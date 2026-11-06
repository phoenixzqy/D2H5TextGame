# Inventory card identity and transfer response

2026-11-03. Local fix retained; independent umbrella review and BUG592's broader
performance acceptance remain open. Private v1 is incomplete.

Occupied backpack cells previously combined item ID and array position in their
React keys. Removing an earlier entry consequently unmounted retained item cards
and their tooltips. The fix keys occupied cells by their unique item ID, with a
prefix distinct from empty-slot keys. No memoization, prop freezing or quest/save
validation changes are involved.

Two regression cases fail on the original code and pass after the correction:
removing an earlier item and reordering items must preserve DOM identity/focus.
They also check rendered order, placeholder count and current selection/click
behavior. All 19 affected grid/pagination cases pass, with zero failed or skipped
cases; scoped strict TypeScript and explicit unignored lint pass. The RED JSON
aggregate incorrectly counts seven name-filter exclusions as passes; its actual
assertion records show two failures and seven exclusions. An earlier setup-only
launch found no tests until the existing workspace was supplied explicitly.

| Profiled transfer | Retained baseline ms | Corrected keys ms |
| --- | ---: | ---: |
| Desktop/en, one observation | 242.460 | 203.831 |
| Mobile/zh, observation 1 | 1126.659 | 962.281 |
| Mobile/zh, observation 2 | 1149.526 | 923.412 |
| Mobile/zh, observation 3 | 1126.142 | 937.327 |
| Mobile median | 1126.659 | 937.327 |

The observed mobile median improves 16.805%, satisfying the prospectively frozen
selection rule; desktop also improves in its one observation. The authenticated
baseline is reused without replay. Both variants use real tooltips, Chromium
147.0.7727.15, desktop 1280×800/en/1× CPU and mobile 360×640/zh-CN/4× CPU, with
the same CPU-profiled click-to-two-animation-frames boundary. These development
localhost samples on a shared host do not establish production/device budgets.

Each of four disposable copies imports the earned 8,540-item backpack/499-item
stash save, then transfers its first backpack item through ordinary UI controls.
Complete public exports and native IndexedDB payloads match the independently
modeled single transfer and the retained baseline's expected hashes. The surviving
second card remains the same connected DOM button in every candidate context.
Baseline browser DOM identity was not observed; the old defect is reproduced by
the regression tests. All remaining items stay accessible, with 39 on the final
page. No page/console errors or horizontal overflow occur. No combat, purchases,
item destruction, injected store writes or campaign advancement occur.

The first mobile profile attributes 92.940→51.100 ms inclusive to Tooltip.
Remaining costs include stringifySave 194.758→211.263 ms and QuestItemsPanel
139.984→147.196 ms inclusive; these overlapping samples must not be added.
Candidate mobile longest tasks remain 412/392/404 ms. BUG592 stays open.

All 2,147 baseline production inputs authenticate before edits; only
BackpackGrid.tsx and its regression test differ afterward, with gameplay data
unchanged. All check/browser processes are terminal and exact owned caches are
absent. Browser execution costs 83,235.254426 wall ms, zero admissions/combat; it
does not consume or renew the separate terminal CE comparison-family allowance.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-stable-cards-v1-closure.json`.
It indexes the fixed plan, source snapshots, driver, actual test assertions,
browser/save checks, four CPU profiles and two screenshots. Root retains these
and the claimed human2 worktree through umbrella review and owns eventual
cleanup/release. This local review is not independent release signoff.

The previous goal turn was status-only/no progress; this turn implements and
verifies a real correction. Act V remains 13/19 and formal balance 0/210. Next
trace remaining fresh quest projection/persistence cost using these retained
candidate measurements. Do not repeat rejected MaterialsPanel memo, scalar
serializer dispatch or per-validation catalog-sharing experiments, earlier acts,
completed training or passing checks. Browser works, CI stays excluded and no
owner answer is pending.
