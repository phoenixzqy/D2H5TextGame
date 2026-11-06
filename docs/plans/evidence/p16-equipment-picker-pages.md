# P16 — Equipment picker has bounded candidate pages

2026-11-05. BUG772 is fixed and verified locally, uncommitted. Full private-v1
acceptance remains open. Contract: [candidate pages](../decisions/P16-equipment-picker-pages-v1.md).

The backpack's existing pagination did not bound the separate equipment picker.
In a constructed native fixture with2,001 distinct legal Short Swords, every
opening rendered2,001options. CandidateList now renders at most50options using
existing localized first/previous/page/next/last controls. Every candidate remains
reachable in its original order, and the selected instance determines the page.
Eligibility, comparison and the native equip boundary remain authoritative.

Arrow keys cross page boundaries; Home/End reach collection endpoints, with
focus applied after a new target mounts. Page controls retain normal focus.
Rows expose absolute position and collection size. Initial first-eligible
selection may open a later page; removed selections recover through the existing
first-eligible rule. Browsing does not mutate holdings or player state.

Verification is limited to the changed component and its consumers:

- Two selected causal RED cases fail before the change:103rows instead of50.
- All12new bilingual pagination cases and17existing picker cases pass. Coverage
  includes full reachability, keyboard focus/comparison, late first eligibility,
  disabled ineligible choices, exact off-first-page native equip with conserved
  IDs, shrink/reopen recovery, numeric control focus and live locale updates.
- Scoped strict TypeScript traverses980imported files with zero diagnostics;
  production component and new test pass ESLint.
- Chromium147.0.7727.15 passes both locales at360×640,412×915,640×360,
  1280×800and1920×1080. All10cases verify keyboard End/Up/Home, next/page41,
  absolute ARIA positions, unchanged holdings/player, no horizontal overflow and
  controls at least44px. Ten screenshots are retained. The landscape modal
  retains its existing scrollable body. No page errors/warnings/failed requests.

The baseline measures three openings each at English360×640and1280×800; after
measurements use three per locale/size combination:

| Constructed development measurement | Before | After |
| --- | ---: | ---: |
| Option rows on opening | 2,001 | 50 |
| Opening through two animation frames | 684.9–952ms | 79.9–174.1ms |
| Maximum individual React render commit | 380.6ms | 36.4ms |

These are component fixture measurements on one machine, with an intentionally
over-cap bag, not whole-app INP, earned acquisition, human pacing or population
acceptance. The baseline uses two English sizes; the after range includes all10
locale/size combinations. Historical BUG147's entire-inventory measurement is
not closed by this change. No campaign or exhausted sample/retry budget is renewed.

Five-axis self-review finds no required change: finite/clamped page input,
bounded mounted options, unchanged native equip/eligibility authority and store
identity while browsing, no new dependency, save change or external data flow.
This is self-review, not independent reviewer or owner signoff. No broad suite,
completed-act/campaign rerun, CI or owner playtest ran for this increment.

Root retains this exact packet through full-v1 acceptance and removes it after
all consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-equip-picker-paging-bvxyrzm7`.
It contains source preimages/incremental diff, RED/GREEN reports, browser driver,
before/after reports/screenshots, scoped types/lint, review and cleanup receipt.
Both driver handles are terminal, PIDs290947/296554absent, port5173unbound,
and the exact task-owned `vite-cache` removed with absence verified. The retained
packet is required evidence; no disposable task path or process remains.

Historical14/14Normal completions and210checkpoint sources remain historical;
formal balance acceptance remains0/210. Full privatev1 still needs progression,
challenge/acquisition/economy/pacing, difficulty/endgame integration, integrated
mobile/PWA/accessibility/performance/soak and independent acceptance. Browser
works; CI excluded; owner playtest follows implementation; no pending question.
