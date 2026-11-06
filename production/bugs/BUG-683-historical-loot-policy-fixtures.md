# BUG-683 — Separate historical loot fixtures from later reward policies

- **Status:** Resolved locally, uncommitted; original reproduction and intermediate failures retained.
- **Severity:** Medium; affected loot checks fail, no proven gameplay regression.
- **Owner / affected systems:** Root / loot engine test contracts.
- **Build:** `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained local boss-equipment work.
- **Environment:** WSL, Vitest 1.6.1 / Node; locale and viewport independent.
- **Seeds:** `0`, `3286157777`; campaign ceiling oracle uses `3286157777`.

## Reproduction

1. Run the affected loot tests with the new chapter-boss equipment policy.
2. In `campaign-level-eligibility.test.ts`, roll all five live chapter bosses at
   their Nightmare ceilings. The expected-base oracle contains the original TC
   and rarity-guarantee sources, but omits the new ordinary source projections.
3. In `hell-data-preservation.test.ts`, compare D08-only reconstructed tables
   against their predecessor over levels 1 through each historical maximum.
   Both pools spread current production policies into historical data.

**Expected:** Current boss items belong to the independently projected authored
source pools. D08-only comparisons preserve complete rewards and the next RNG
value without acquiring later reward policies.

**Actual:** Five ceiling assertions reject legitimate new source bases. Five
historical boss cases throw `No eligible chapter-boss equipment`; four historical
mini cases throw `No materializable guaranteed equipment`.

## Evidence and diagnosis plan

Original affected run: 391 passes / 14 failures in 9.46s, retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-boss-equipment-groups-v1/affected-loot-final.log`.
This filename predates diagnosis and does not indicate a successful final run.
The focused new behavior and actual inventory settlement checks already pass.

First isolate only the newly added chapter-boss policy in both historical pools.
If the mini failures remain, that proves the separate later guarantee-policy
inheritance defect. Then explicitly omit both post-D08 policies from this
component comparison, retaining all reward and following-RNG equality checks.
Correct the current-level oracle using source minima, offsets and finite terminal
caps independently of the production projection helper; never allow all bases.
No production behavior, retained predecessor JSON or historical hashes change.

Security check: **pass**. Local test-oracle/fixture corrections only; no secrets,
dependencies, network, permissions or publication. Verification must retain exact
assertions and independently prove that the setup is stale before changing it.

## Isolation result, before correction

`diagnostic-only-new-policy-omitted.log` retains the experiment that removes only
`chapterBossEquipment` from both historical comparators: 6 seeded cases pass,
9 fail (117 unrelated cases deselected). All nine now fail in the earlier
`equipmentGuarantees` policy, including all five boss cases and four mini cases.
Thus removing the latest policy alone cannot fix this fixture. Both post-D08
equipment policies must be explicitly absent from the D08 component comparison.
Their real production behavior remains covered by their dedicated tests.

Both corrected files then pass all164 tests in6.84s. Scoped strict types catch
the experimental explicit `undefined` values under exact optional properties;
use typed empty policy maps instead. Tighten the live oracle further to exclude
the replaced legacy boss TC, retaining only projected ordinary sources plus
actual guarantee sources. Retain the initial type log and verify these final
test-only adjustments without rebuilding unchanged production code.

## Local verification

Final30selected reward/eligibility cases pass; all164 cases in the two files
passed before the final test-only map/oracle tightening. Scoped strict types and
explicit lint pass. Complete reward equality and following-RNG equality remain
unchanged. [Equipment-group evidence](../../docs/plans/evidence/p17-boss-equipment-groups.md)
records the logs, production build and exact cleanup. Base SHA above identifies
the retained checkout; no new commit was created.

## Optional-unique component inheritance, 2026-11-04

`p17-boss-optional-uniques-v1/focused-before-fixture-isolation.log` retains
107passes/17failures. The35 optional-unique cases pass. Twelve ordinary-count
cases now include the separate successful optional reward; five guarantee-only
paired cases compare a baseline containing an optional unique against the
guarantee appended in that same position. Both component fixtures must explicitly
omit `chapterBossUniques`, keeping their exact counts and whole-item assertions.
Production pools and the new complete-policy integration tests retain the bonus.
Historical D08 comparators and the material-only synthetic table likewise exclude
this independent later policy; their source declarations cannot produce unique
equipment and their historical stream must remain pre-D09. No test assertion or
production behavior is weakened.

All341affected loot cases and22native settlement cases now pass. Closed-schema,
strict types, explicit lint and isolated production checks pass; exact cleanup
and source/build hashes are retained in the optional-unique evidence packet.
