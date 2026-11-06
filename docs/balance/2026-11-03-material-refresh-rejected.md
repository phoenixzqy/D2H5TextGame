# Inventory materials refresh comparison — rejected

2026-11-03. BUG592 remains open; private v1 remains incomplete.

The candidate memoized only MaterialsPanel inside InventoryScreen. It removed
unrelated materials rendering, but failed the prospective requirement to improve
mobile transfer median. All candidate source bytes were archived and restored;
no optimization is retained. QuestItemsPanel still receives its parent gear and
player refreshes because its recovery projection depends on those domains.

| Profiled transfer | Baseline ms | Candidate ms |
| --- | ---: | ---: |
| Desktop/en, one observation | 242.460 | 248.810 |
| Mobile/zh, observation 1 | 1126.659 | 1130.448 |
| Mobile/zh, observation 2 | 1149.526 | 1131.632 |
| Mobile/zh, observation 3 | 1126.142 | 1224.487 |
| Mobile median | 1126.659 | 1131.632 |

The observed median difference is +0.441%; these samples do not establish a
general slowdown. The fixed selection rule nevertheless fails. Do not repeat
this memo comparison or change its selection rule to chase timing noise.

Each variant used a genuine imported 8,540-item save, one desktop 1280×800/en/1×
and three mobile 360×640/zh-CN/4× CPU disposable copies. Each performed exactly
one ordinary backpack→stash transfer with stash initially 499/500. All eight
complete public exports and native IndexedDB payloads match independently
modeled transfers. Final backpack items remain reachable; no errors or horizontal
overflow were observed. No combat, purchases, item destruction, injected store
writes or campaign advancement occurred. Timings are development diagnostics,
not production runtime-budget acceptance.

The first baseline mobile profile attributes 48.161 ms inclusive/4.807 ms self
to MaterialsPanel, 139.984 ms inclusive to QuestItemsPanel, and 190.451 ms self
to stringifySave. Native IndexedDB put has 54.488 ms self. Inclusive times overlap
and must not be added. MaterialsPanel self samples fall from five total to zero.
Serialization and quest validation are the next investigation targets.

Existing affected pagination/materials tests: 18 passed, zero failed/skipped.
Scoped strict types and explicit unignored lint pass. All processes exited 0.
All 2,147 baseline production-source hashes were restored, and exact owned caches
are absent. Browser work cost 167,883.95832 wall ms, zero admissions/combat; it
neither consumes nor renews the separate terminal CE comparison-family allowance.

Authoritative evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-material-refresh-v1-closure.json`.
The closure indexes the fixed plan, driver, source snapshots, eight CPU profiles,
four screenshots, full reports and actual Vitest JSON. Root retains these and the
claimed human2 worktree through umbrella review and owns eventual cleanup/release.

Previous goal turn was status-only/no progress. This closure changes no campaign
or balance acceptance: Act V stays 13/19 for the intended Necromancer; formal
balance stays 0/210. Browser works, CI is excluded and no owner answer is pending.
