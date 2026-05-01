# Perf gate — `test-perf` CI job

**Status:** Phase 1 — **warn-only**. Active since Wave C / P12.
**Owners:** technical-director + performance-analyst (dual sign-off required for any change to thresholds or to the baseline file).

## 1. What it does

The `test-perf` CI job (in `.github/workflows/ci.yml`) runs after the unit
tests pass. For each OS in the matrix (`ubuntu-latest`, `windows-latest`)
it:

1. Runs `node scripts/bench-tests.mjs --suite unit-full --runs 3 --json bench-unit-full.json`
2. Runs `node scripts/bench-tests.mjs --suite unit-engine --runs 3 --json bench-unit-engine.json`
3. Calls `node scripts/check-bench-vs-baseline.mjs` for each, comparing
   the fresh medians against the OS-keyed row in
   `docs/perf/test-bench.baseline.json` (keyed `<os>::<suite>`).
4. Renders a markdown summary to `$GITHUB_STEP_SUMMARY` **and** echoes it
   to the job log.
5. Uploads the raw bench JSONs as artifacts (`bench-results-<os>`) so the
   baseline can be updated from any CI run on demand.

Only `unit-full` and `unit-engine` are gated.

## 2. Two-phase rollout

### Phase 1 — warn-only (current)

- Threshold: a suite "regresses" if its current median exceeds the
  baseline median by more than **+20 %**.
- A regression is surfaced as:
  - a `⚠️` row in the PR's job summary table,
  - a `::warning ::` GitHub annotation on the PR diff view, and
  - a console line in the job log.
- The check **never fails CI**. The `check-bench-vs-baseline.mjs` script
  always exits 0, and the workflow step also carries
  `continue-on-error: true` as belt-and-suspenders.
- Missing baseline rows (e.g. `ubuntu::*` is currently a stub) emit a
  `::notice ::` and are skipped — the brief calls this out as the
  expected "baseline file missing" failure mode.

### Phase 2 — hard-fail flip (future PR)

The flip to a fail-CI gate happens in a follow-up PR after we have:

- **≥ 10 successful CI runs** on `main` of the warn-only gate, on each
  OS, with no spurious >20 % warnings.
- A **populated `ubuntu::unit-full` and `ubuntu::unit-engine` baseline
  row** (today they are stubs).
- A documented variance band (p95 of `(deltaPct)` per suite per OS)
  showing the +20 % threshold sits comfortably outside normal noise.
- **All baseline rows reflect current reality.** No row may have a >10%
  gap vs current observed median (i.e. no rows inflated by historical
  failed runs). The pre-flip PR must re-capture `windows::unit-full`
  (currently 30050ms, real ~17654ms) and any other stale rows.
  Re-baseline procedure runs the same `bench-tests --runs 3` on a clean
  CI runner; commit only if all 3 runs are `ok:true`.
- Sign-off from both `performance-analyst` and `technical-director`.

The flip itself is a one-line change: drop `process.exit(0)` after a
regression in `check-bench-vs-baseline.mjs` in favour of `process.exit(1)`,
and remove `continue-on-error: true` from the workflow step.

## 3. E2E exclusion

E2E suites (`e2e-smoke`, the sharded chromium-desktop runs, mobile
shards, prod-bundle) are **deliberately excluded** from this gate.
Reasons:

- Runner-to-runner variance on shared GitHub-hosted runners is large
  enough that a +20 % budget would generate frequent false positives.
- E2E timing is dominated by browser cold-start, network/asset load, and
  retry behaviour — none of which are signal for engine/UI perf.
- We already have stricter, more meaningful budgets for the *runtime*
  (Lighthouse mobile ≥ 90, FCP ≤ 1.8 s on Moto G4) — those are the right
  place for E2E-shaped regressions.

If we later want to gate E2E timing, the right tool is a per-spec
`expect.poll` budget inside Playwright, not this wall-clock harness.

## 4. Manual baseline-update procedure

Updating `docs/perf/test-bench.baseline.json` is **PR-only** and requires
**dual sign-off** from `performance-analyst` and `technical-director`.

To propose an update:

1. Identify the source CI run. The PR description **must** link to the
   `test-perf` job run whose `bench-results-<os>` artifact is being
   promoted to baseline. One CI run = one row update at a time is
   preferred; bulk updates require explicit justification.
2. Download the artifact's `bench-unit-full.json` /
   `bench-unit-engine.json`. Each contains a single OS-keyed row.
3. Apply that row into the baseline file under the matching
   `<os>::<suite>` key. Preserve the other-OS rows unchanged.
4. Bump `updatedAt` to the artifact's timestamp.
5. Include in the PR body:
   - **Variance evidence** — links to the most recent ≥ 10 CI runs of
     the warn-only gate, with their current vs baseline deltas, showing
     that the new median sits inside the established band.
   - **Reason for the update** (e.g. legitimate engine refactor that
     shifted timings, runner image upgrade, suite re-organization).
   - **Risk assessment** — does this hide a regression? Why not?
6. Both `performance-analyst` and `technical-director` must approve. The
   `producer` runs `gate-check`; missing either approval blocks merge.

Baseline updates **never** auto-commit. The whole point of the gate is
that drift is visible in PR diffs.

## 5. Local validation

```pwsh
node scripts/bench-tests.mjs --suite unit-full --runs 3 --json bench-unit-full.json
node scripts/bench-tests.mjs --suite unit-engine --runs 3 --json bench-unit-engine.json
node scripts/check-bench-vs-baseline.mjs --bench bench-unit-full.json --baseline docs/perf/test-bench.baseline.json --os windows
node scripts/check-bench-vs-baseline.mjs --bench bench-unit-engine.json --baseline docs/perf/test-bench.baseline.json --os windows
```

Both commands print a markdown table and exit 0 regardless of outcome.

## 6. Known stale baselines

- **`windows::unit-full`** — baseline 30050ms vs current observed median
  ~17654ms. Inflated by historical failed runs. Must be re-captured
  before Phase 2 hard-fail flip.

## 7. Files

- `scripts/bench-tests.mjs` — measures wall-clock; PID-tracked; never
  broadly kills node (process-safety binding).
- `scripts/check-bench-vs-baseline.mjs` — the gate; warn-only; renders
  the summary; exits 0 always.
- `docs/perf/test-bench.baseline.json` — OS-keyed baselines.
- `docs/perf/test-bench.trend.csv` — append-only trend log written by
  `bench-tests.mjs` on every invocation (not used by the gate, but
  useful for offline analysis).
- `.github/workflows/ci.yml` — `test-perf` job.
