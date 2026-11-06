# P17 — Chapter-boss ordinary equipment groups

2026-11-04. Local implementation under BUG680 and
[D09](../decisions/D09-chapter-boss-equipment-groups-v1.md), base
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local changes.
Constructed loot and settlement evidence; no earned campaign, economy, pacing
or formal balance acceptance. Full private v1 remains incomplete.

The five live chapter bosses now replace their five mixed picks with exact
trash-source/jewelry-source counts: **4+2, 5+3, 6+3, 7+3, 8+4**. Trash minima
increase by five; jewelry minima stay unchanged. Only terminal equipment bands
extend to the finite boss caps59/72/87/101/122. Earlier bands expire normally.
Sources retain weights and ordinary MF/offline rarity, replacement sampling,
actual item levels and noDrop0. Shared raw treasure-class data is unchanged by
this slice. Rarity guarantees and exact material bundles still apply separately.

Missing/invalid/ineligible sources or wrong acts refuse the reward bag. Other
tiers, unconfigured tables and quest caches keep their existing paths. Real
Diablo settlement publishes10ordinary+3guaranteed items and the exact materials
together; a missing jewelry source leaves inventory untouched.

## Verification

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-boss-equipment-groups-v1`.
Counts below overlap; they must not be added as independent test populations.

| Check | Result / retained evidence |
| --- | --- |
| Original reproduction | All15 boss/difficulty cases failed; `original-failure.log` |
| Focused equipment checks |27pass in affected run; all bosses/difficulties/eight seeds, planned manual/idle levels, inclusive finite caps, determinism, source projection/schema/refusal, MF and quest/other-tier isolation |
| Initial affected checks |117pass/2fixture failures, diagnosed and corrected in BUG680 |
| Broader affected loot |391pass/14fail across13files; original preserved in `affected-loot-before-fixture-fixes.log` and original filename `affected-loot-final.log` (not a green final run) |
| Historical-policy isolation |6pass/9fail after removing only the latest policy; `diagnostic-only-new-policy-omitted.log` |
| Both corrected failing files |164pass in6.84s; `corrected-eligibility-and-preservation.log` |
| Final test-only adjustments |30selected cases pass in2.99s;134unrelated cases deselected by CLI; `final-selected-fixtures.log` |
| Native settlement |20pass in7.73s; `settlement.log` |
| Strict types | Expanded ten-file scope passes; `types-corrected.log`; original exact-optional-property failure retained in `types-final.log` |
| Explicit no-ignore lint |Ten files pass; the final two edited fixtures also pass; `lint-final.log`, `lint-corrected-fixtures.log` |
| Production build |Pass, VITE_E2E cleared; `production-build.log` |
| Actual Workbox precache |All required application chunks/PNG icons present; `precache.log` |
| Test bridge scan |Ten emitted application JS chunks pass all five existing forbidden patterns; `bridge-scan.json` |

[BUG683](../../../production/bugs/BUG-683-historical-loot-policy-fixtures.md)
documents the independent diagnosis before correction: live eligibility omitted
new source projections, while D08-only historical pools inherited both later
equipment policies. The corrected oracle independently applies offsets and
terminal caps, excluding replaced legacy boss picks. Historical comparisons use
empty post-D08 policy maps and retain complete reward/next-RNG equality; no
predecessor data, hashes or production behavior is changed to satisfy fixtures.

Self-review covers correctness, readability, architecture, security and bounded
work. No blocking finding remains in this slice. This is not independent final
umbrella approval. Production retains existing large-chunk and non-precached art
manifest warnings; no performance/device-installation acceptance is inferred.

## Integrity and cleanup

`source-sha256.json` verifies14final inputs; `production-sha256.json` verifies all
766build files. `build-input-sha256.json` preserves build-time inputs: only the
two subsequently rechecked test fixtures differ, so production inputs stayed
identical. Exact disposable `production/` and `types.config.json` were removed
and verified absent in `cleanup.json`. All task processes are terminal; no server
was started. Root retains the claimed human2 worktree and this required packet
through umbrella review and owns eventual packet cleanup/worktree release.

No full suite, campaign replay, new agent, install, commit, push, publication or
training-budget renewal. Counts remain14/14ActI,3/14five-act Normal, formal0/210.
BUG680 stays open for optional unique attempts and first-kill rewards.
