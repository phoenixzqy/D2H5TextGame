# Inventory upgrade comparison ownership

2026-11-03. Local BUG592 correction retained; private v1 and independent
umbrella acceptance remain incomplete.

The retained item-cell mobile0 profile attributes 56.775 ms inclusive to
`compareBackpackItem`. The backpack tab recalculates every visible badge when
its page array changes, before memoized cells can skip unchanged items.
It now supplies a stable canonical comparison callback, and each cell memoizes
its badge against that callback and its immutable item. Complete player,
equipment and quest inputs still invalidate the callback. Selection and locale
changes retain their existing behavior. The internal grid/layout props migrate
together; comparison math, eligibility, native actions and save validation stay
unchanged. No custom equality or persistent result cache is added.

Two before-fix regressions demonstrate 100 comparisons after a native transfer
instead of the one newly visible item, in en and zh-CN. All 28 affected UI cases
pass: grid14 and pagination14. They cover actual transfers/ownership, new and
replaced items, removal/reorder, equipment, player level/core/derived stats,
all three quest inputs, ineligibility, absent player, locale, selection and
focus. Scoped strict TypeScript and explicit four-file lint pass. Only these
affected checks run; RED-filtered cases add no passing count.

| Profiled transfer | Retained item-cell baseline ms | Cell comparisons ms |
| --- | ---: | ---: |
| Desktop/en, one observation | 125.432 | 116.473 |
| Mobile/zh, observation 1 | 352.934 | 295.064 |
| Mobile/zh, observation 2 | 320.470 | 265.389 |
| Mobile/zh, observation 3 | 337.195 | 291.562 |
| Mobile median | 337.195 | 291.562 |

The frozen single-candidate selection rule passes: mobile median improves
13.533%, desktop 7.142%. The existing baseline is reused without replay or
timing retries. Chromium147.0.7727.15, actual tooltips, 1280×800/en/1× CPU
and 360×640/zh-CN/4× CPU, CPU profiling and click-to-two-frames boundaries
match the baseline. First-mobile inclusive comparison samples fall
56.775→2.218 ms; this is sampled attribution, not exhaustive accounting.

Four independent contexts import the complete earned 8,540-backpack/499-stash
save through ordinary controls and transfer one item. Full public exports and
native IndexedDB saves exactly match modeled successors. Surviving card DOM
identity and last-item access pass, with zero page/console errors and horizontal
overflow. Both retained final-page screenshots are inspected. Mobile longest
tasks remain 136/125/129 ms, so BUG592 stays open. These development/shared-host
measurements do not prove release or representative-device budgets; the timed
interaction does not include every later debounced save.

All 2,147 baseline production inputs authenticate; exactly the four declared
source/test paths differ. Gameplay data is exact. Browser execution costs
82,590.942 wall ms and zero admissions/combat. All owned processes are terminal;
both exact disposable cache paths are verified absent. Root retains the required
worktree/evidence through umbrella review and owns eventual cleanup/release.

Evidence closure:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/bug592-cell-comparison-v1-closure.json`
SHA256 `1f00ba175103a5e16f86bf58bfce635fe8a97b98cd8571c3597e3558986c4268`.
It indexes exact before/after sources, plan/configs/driver, RED/GREEN/check logs,
four CPU profiles, complete-save browser results and screenshots. Self-review
does not replace independent signoff.

The preceding status-only turn made no implementation progress. This increment
implements and measures the next retained-profile correction. Act V remains
13/19; formal balance remains0/210. BUG611, remaining Act V, 14-build populations
and holdouts, economy/Hell, earned adaptation/manual-idle, 30–50 active-hour
pacing and integrated G0–G7/soak/review remain required. The separate historical
browser defeat/retry evidence already passes. Closed combat comparison budgets
remain closed. Browser works; CI stays excluded; no user answer is pending.
