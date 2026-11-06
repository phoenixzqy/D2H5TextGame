# P15 — Native checkpoint role-plan coverage

2026-11-05. BUG777 is fixed locally, uncommitted. The native checkpoint adapter
retains the installed plan, and population report v2 distinguishes absent roles
from roles blocked by defeat. The previous goal turn was status-only/no progress;
this continuation closes documentation, retained-output readback and cleanup.
Full private v1 remains unfinished.

## Root fix and report contract

Immediately after native entry, before playback or settlement, the adapter
checks active-run seed, area and wave count and clones its full `WavePlan` into
`attempt.plan`. Source encounters, spawns, levels, tiers, affixes, loot and idle
presentation metadata survive even when the first wave defeats the hero.
No gameplay, RNG, save, source data or production UI changes occur.

The reporter accepts optional original plans, validates area/mode/seed, complete
length, all planned roles and complete observed-prefix presentations. It never
reconstructs missing historical plans. The population report version changes
from 1 to 2; the outer checkpoint CLI report and fixture stay v3.

| Field | Meaning |
| --- | --- |
| trial `plannedTargetWaveIndices` | Target occurrences in the known plan; `null` if unknown |
| trial `unreachedTargetWaveIndices` | Planned occurrences beyond the observed prefix; `null` if unknown |
| target `reachedSeeds` | At least one target wave observed |
| target `notObservedSeeds` | No target wave observed; the old v1 `unreachedSeeds` meaning |
| target `plannedSeeds` / `absentSeeds` | Known plan includes / excludes the target role |
| target `unreachedSeeds` | Known plan includes the role, but no occurrence was reached |
| target `planUnavailableSeeds` | Original plan unavailable, regardless of observed role |
| target `plannedWaveCount` / `unreachedWaveCount` | Occurrence totals from **known plans only** |

Later unplayed occurrences remain counted when an earlier occurrence was
reached. Reach rates retain all started seed trials in their denominators;
area failures, actual reward ledgers and correlated-wave treatment are unchanged.
`scope.balanceAcceptance` stays false. These fields describe diagnostic coverage,
not role win-rate acceptance or an exhaustive encounter population.

## Validation and finite budgets

Three initial causal reporter failures cover absent/unplayed/unknown plans,
repeated roles and malformed plan/prefix data. During source self-review, missing
header identity checks were found; three further area/mode/seed cases fail before
their repair. Final reporter output has six new plus sixteen existing cases:
**22 passed**. Four pure runs total 19.326 seconds, within the prospective four-run
and 120-second limits. Filtered cases in RED runs are skipped; Vitest's JSON
aggregate counts are not used in place of assertion statuses.

Exactly two new constructed native controls pass: initial sorceress manual,
and idle with initial pity 11. Both lose the first of three planned waves,
leaving two unplayed. Manual roles are trash/elite/elite; idle roles are
elite/elite/elite with first-wave hard-pity promotion and reset metadata.
Source/spawn identity, observed prefix, levels/tiers, affix retention and caller
restoration are asserted. Five older adapter cases are filtered out, not rerun.
This consumes the one native run/two-attempt budget in 11.453 seconds.

There are **24 distinct passing cases**. Final scoped strict TypeScript roots
cover the four changed TS files plus Vite declarations, importing 928 files with
zero diagnostics. Explicit changed-file ESLint passes with zero warnings.
Initial/final type and lint checks total 41.504 seconds within 120 seconds.
All causal failures and intermediate outputs remain retained. No broad suite,
campaign replay, earned attempt, population sample, holdout read or browser run
occurs. All test-run/attempt budgets are spent and stay closed.

## Evidence custody and cleanup

Root retains this required packet through full-v1 acceptance, then removes it
after its consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-role-coverage-woptphej`.

`plan.json` records prospective scope, security pass, ready plan self-review,
eight preimages and finite budgets. RED/GREEN/identity/final reporter JSON/logs,
native JSON/logs, both native control summaries and initial/final type/lint
outputs retain exact results. The native summaries omit aggregate reward deltas;
they must not be presented as complete population attempt inputs.

`readback.py` and `readback.json` separately check retained assertion statuses,
budget totals, native headers, plan/prefix/source/spawn joins and 3/1/2 counts.
This reader performs no game import or gameplay and is root self-review, not
independent final acceptance. `review.diff`, `inventory.json` and `cleanup.json`
retain the preimage comparison, source/artifact hashes and process/path checks.

All five test child PIDs (336284, 336484, 336861, 337425, 337511) and their tool
handles are terminal; exact PID absence is checked at closeout. Type/lint
subprocesses returned exit 0. No server, browser, task cache, configuration or
disposable directory was created. The required packet remains below 8 MiB;
there are no remaining disposable paths or cleanup failures. Shared caches and
inherited worktree changes are preserved. The claimed worktree remains in use.

## Next required work

Use the [exact retained-power baseline](p15-retained-power-baseline.md) while
defining ordinal/prefix, manual/idle RNG and pity populations and legal contiguous
three-attempt adaptation. This change does not freeze those policies or establish
recommended power, acquisition, economy or 30–50 active-hour pacing. Historical
14/14 intended Normal completions, 210 source contexts and formal balance 0/210
remain unchanged. No exhausted campaign/sample/retry budget is renewed.
Difficulty/endgame and integrated mobile/PWA/a11y/performance/soak acceptance,
independent review and later owner playtest remain open. Browser works; CI is
excluded; no pending user decision or external blocker exists.
