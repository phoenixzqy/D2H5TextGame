# Gear percentage units corrected; campaign and historical cache remain open

2026-10-23. BUG091/BUG093 source correction on `fd2c96e`:
modern critical chance/damage and physical/magic dodge rolls contribute
`rolledValue / 100` at projection. Raw saved rolls remain unchanged. Flat stats,
six integer resistances and legacy Map contributions retain their units.

The authored-data correction changes exactly 24 literal fields: 21 fields
across 20 unique IDs and three active set thresholds. Twelve existing fractional
values and every unrelated field remain unchanged. Canonical packages are not
divided globally; no magnitude heuristic or save-format migration is added.
Natalya retains its existing critical-damage key; the older deadly-strike
wording remains a separate semantics discrepancy.

Four new regression files add 54 cases. Genuine baseline: 39 failed assertions
and 15 passing controls. Tests cover the real earned amulet `it-7yy59-2n4`, all
24 data corrections, 12 fractional controls, active set thresholds, mixed
modern/legacy/canonical contributions, normal hero equipment recomputation,
starter Rogue and fresh combat projection. The earned rolls 2/5 produce +.02
dodge/+.05 critical damage; hero totals are .12 dodge and 2.05× critical damage.
Current HP/MP remain 53/47 in the hero test. Snapshot→JSON→decode preserves raw
rolls, and both locales format raw/effective percentages correctly.

| Validation | Actual result |
| --- | --- |
| Engine suite | 4170 tests / 107 files pass, 37.92s |
| Focused regressions + real data loader | 346 tests / 5 files pass, 23.97s |
| Final full suite | 8600 tests / 277 files pass, 173.14s |
| Typecheck | pass after correcting optional-affix test-helper typing |
| Lint | complete lint pass; changed helper also passes focused final lint |
| Production build | pass, VITE_E2E unset; four JS chunks pass all five bridge checks |

Engine and full-suite durations exceed the repository's 3s/15s budgets; those
performance requirements remain open. Existing build size/precache warnings
remain. Producer source review **APPROVE**, security **PASS**; independent
assertion/evidence review **ADEQUATE**. The only post-source-review change is
the test helper's `NonNullable` input typing.

This proves numeric projections, raw-save preservation and formatter behavior.
It does not prove rendered browser behavior or a new campaign victory.
[BUG094](../../../production/bugs/BUG-094-historical-equipment-rate-cache.md)
records the separate historical cache gap: old saves can still display stale
critical/dodge totals until normal recomputation. Full C1–C4/G0–G7 remain open.

Root retains the exact content allowlist, seven-file source hashes, decisive
RED/GREEN logs, final validation summary and cleanup receipt at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-affix-units`
through unit-fix/C1/full-v1 consumers, then removes the retained evidence.
All validation handles are terminal and independent readers released. Exact
task-owned drafts/tmp/cache/dist cleanup removed 861 files; remaining disposable
paths and failures are empty. Shared caches remain untouched. Local work only;
the umbrella goal and isolated worktree claim continue.
