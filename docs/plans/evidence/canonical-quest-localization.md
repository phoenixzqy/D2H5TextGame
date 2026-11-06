# Canonical quest localization — native repair

Current follow-up2026-11-04: [development-browser verification](p16-quest-readability.md)
now covers all46 main/side cards in both languages across five target sizes,
with current native six-case regression passing. BUG358 remains open only for
the final production-bundle check; the historical native checkpoint below is
preserved with its original limits and failures.

Checked 2026-10-28 on base `36d54d677c79ff3f70684d19e1d622e6a9f0bc39`
plus the reviewed locale/test changes identified below. Node 24.21.0/npm 11.19.0; CI Node 20
was not run. BUG358 remains Open for browser/layout
completion; this checkpoint establishes resource and jsdom rendering behavior.

Both bundles lacked 59 fields across 19 canonical quests: two main and 17 side.
The real resolver returned authored English defaults, including Chinese cards.
The repair adds only those canonical entries: all 46 shipped quests now have
all 164 required names, descriptions and ordered objectives in each own resource.
Existing values, legacy aliases, IDs, gameplay/rewards and fallback policy are
preserved. English additions equal authored defaults. Chinese Seven Tombs now
names the actual 塔拉夏杖孔 interaction rather than an altar.

`QuestsScreen.localization.test.tsx` has six cases: own-resource completeness
and real main/side card rendering in each locale. Direct bundle checks cannot
be satisfied by fallback-language resources; independent visible examples cover
the two main ID mismatches and early/late missing side quests. All cards check
name/description and objective count/order. Only test language lifecycle changed
after the initial pair: both awaited changes now run inside async act. Assertions
were preserved; no warning filters, mocks, skips or settings changes were added.

| Native check | Exit | Result |
| --- | --- | --- |
| Final identical-test RED, baseline locales | 1 | six intended missing-field/English-heading failures |
| Final identical-test GREEN, reviewed locales | 0 | six passed; zero act warnings in both final runs |
| Initial unfiltered npm test | 1 | one player-first initialization test exceeded unchanged 5000ms deadline; preserved in full-final raw artifacts |
| Unchanged isolated 13-test diagnostic | 0 | all 13 pass; diagnostic only |
| Unchanged unfiltered npm test, no competing owned checks | 0 | 21,195 passed, 2 existing skips / 991 files |
| npm run typecheck | 0 | passed |
| npm run lint | 0 | passed, unchanged policy |
| Fresh npm run build -- --outDir task-owned-output | 0 | product built; existing large-chunk warning retained |

The original failed run is retained intact. The unchanged target file passes in
isolation; the subsequent clean unfiltered run uses the same source/config/input
snapshot. No timeout, worker, assertion, skip, configuration or production fix was
made for that failure. Its cause remains unresolved: scheduling/host contention
and eager import work are hypotheses, not established causes. The passing rerun
does not erase the first failure or establish flakiness. BUG359 records follow-up.

The clean full run has all 13 initialization-file assertions and all six new localization assertions passing; its only two skipped identities exactly match the prior passing checkpoint. No pending/todo assertions are accepted.

The clean full run includes 28 affected quest-screen/action/loader files
and 889 cases. Full native elapsed 928.579s.
Final GREEN/full/types/lint preserve 5342 inputs with no in-run
changes at `c710006d202df63fc9e5007934135c3a73c6a5198d9da6263b26d10f332e4098`. The earlier production build has identical
product inputs; its sole recorded input difference is the test lifecycle wrapper.
Build output 762 files were independently hash-verified, then removed with 10
directories; cleanup failures[] and output absence verified.

Final test SHA256 `f06b3550c5ee21660cc79a62f61fd231d13037d53def653496fe6e515baab0b7`.
English resource SHA256 `e695c6d124f6595b8f0a6e26eec1f9ff63c96f5ca6a54f127db773b9e6cfdefe`.
Chinese resource SHA256 `4cafc9b3b9a8a59ee6c207dcd91aae24e8414b369b5a6915ce06292c0fbc830b`.
Independent implementation review `dba9f4ac615d2d23af8d7ecebcf54591bb588d61cee0371e3f8576d88f679d78`.
Initial test RED/GREEN and the one corrected translation finding remain in the
raw packet; they are lineage, not additional acceptance credit. Exact baseline-matched skipped
case (file, name) identities and build-input comparison are in documentation-metrics.json.

Root retains resolver/native logs/results/input maps, translation context,
reviews/manifests and cleanup receipts under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-quest-locales-bu0ggpfk`
through unfinished goal consumers and owns eventual verified cleanup. The
reviewer verified 5,341 permitted current inputs; the protected archive was excluded
from reviewer current-byte reads while complete recorded maps were compared.
No protected-save modification or replay occurred.

No browser/360px overflow, whole-app locale, PWA/device/a11y/performance, earned
reward/balance/pacing, actual CI, human/soak or full-v1 acceptance is established.
H3 remains terminal failed-no-app; no retry/new browser card. Other open bugs
and 212 bounded/one unverified skill inventory remain unchanged. No publication,
merge or deployment; umbrella goal and claimed worktree stay active.
