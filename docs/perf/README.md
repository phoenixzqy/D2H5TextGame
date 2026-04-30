# Test/Build Performance Benchmarks

This directory holds the benchmark harness output and trend history for the
test-perf workstream (`integration/test-perf-waveA`).

## Files

| File | Owner | Purpose |
| --- | --- | --- |
| `test-bench.baseline.json` | qa-engineer + technical-director | Per-(OS, suite) baseline numbers. Reviewed by performance-analyst. Manual updates require both reviewer hats. |
| `test-bench.trend.csv` | bench script (auto) | Append-only trend log. One row per `bench-tests.mjs` invocation. Useful for spotting regressions over time without rebaselining. |
| `README.md` | this doc | How to run, what suites mean, how baselines are updated. |

## Running the harness

```powershell
node scripts/bench-tests.mjs --suite <name> --runs <N> [--json <path>] [--verbose]
```

### Suites (P01 set)

| Suite | Underlying command | Notes |
| --- | --- | --- |
| `unit-full` | `vitest run --reporter=basic` | Whole vitest tree (currently 522 tests across 67 files). |
| `unit-engine` | `vitest run --reporter=basic src/engine` | Path-filtered slice. Will become a real project once P05 lands. |
| `unit-ui` | `vitest run --reporter=basic src/ui src/components` | Best-effort path filter; informational only until P05. |
| `e2e-smoke` | `playwright test tests/e2e/smoke.spec.ts` | File-path fallback until P04 introduces `@smoke` grep tags. |

### Examples

```powershell
# Local Windows baseline (default 3 runs)
node scripts/bench-tests.mjs --suite unit-full --runs 5 --json docs/perf/test-bench.baseline.json

# Engine-only slice, more runs for stable median
node scripts/bench-tests.mjs --suite unit-engine --runs 5 --json docs/perf/test-bench.baseline.json

# E2E smoke
$env:E2E_PORT = '4179'
node scripts/bench-tests.mjs --suite e2e-smoke --runs 3 --json docs/perf/test-bench.baseline.json
Remove-Item Env:E2E_PORT
```

The script will:
1. Spawn the suite N times, timing each with `performance.now()`.
2. Write/merge a per-(OS, suite) row into `--json` (preserving rows for the
   other OS, so Windows + Ubuntu can coexist).
3. Append one summary row to `test-bench.trend.csv`.
4. Exit non-zero if any run failed (still emits JSON + CSV for debugging).

## Process safety contract

The bench script tracks the PID of every child it `spawn()`s in a `Set<number>`
and only `process.kill(pid)` those PIDs on `SIGINT`/`SIGTERM`. It does **not**
broadly kill node, never calls `taskkill /IM node.exe`, `pkill node`, `killall
node`, `npx kill-port`, etc. — those would terminate the Copilot CLI agent
fleet and any concurrent dev servers.

If a port is busy during `e2e-smoke`, set `E2E_PORT=4179` (or any free port) to
work around it. Don't free ports by killing processes.

## Baseline update workflow

1. Run the harness on a quiet machine (no other heavy IO/CPU). 5+ runs gives a
   stabler median than 3 because vite's transform cache is cold on run 1.
2. Inspect `_notes` and updated row in `test-bench.baseline.json`.
3. Open a PR labelled `perf/baseline-update`. Required reviewers:
   - `performance-analyst` (interprets the delta vs. prior baseline)
   - `technical-director` (sign-off on policy / threshold changes)
4. CI populates the `ubuntu::*` rows automatically on
   `integration/test-perf-waveA`. Locally captured Ubuntu numbers should be
   marked `_stub: true` until CI replaces them.

## Reading the JSON schema (`d2h5-bench-tests/v1`)

```jsonc
{
  "schema": "d2h5-bench-tests/v1",
  "rows": {
    "<os>::<suite>": {
      "suite": "unit-full",
      "runs": [49296, 43491, 27943],         // raw wall-clock ms per attempt
      "runDetail": [{ "ms": 49296, "ok": true, "code": 0 }, ...],
      "median": 38619.5,                     // computed over OK runs only
      "min": 27943, "max": 49296, "mean": 38619.5, "stddev": 10676.5,
      "okCount": 2, "failCount": 1,
      "os": "windows", "osRelease": "10.0.26200", "arch": "x64",
      "nodeVersion": "v24.15.0",
      "gitSha": "<sha>",
      "timestamp": "<ISO-8601>"
    }
  }
}
```

`runDetail[].ok=false` means the underlying test command exited non-zero. The
bench harness still records the wall-clock so you can spot e.g. a regression
that *also* surfaces a flake. Stats (median/min/max/mean/stddev) are computed
**only over `ok=true` runs**; if every run failed, those fields are `null`.

## Known issues at P01 capture

- **Windows `unit-engine` flake.** The test
  `src/engine/combat/combat.test.ts > "multiple enemies of the same template
  get suffixes A/B/C"` does an `await import('../../stores/combatHelpers')`
  inside the test body. Under cold transform cache (which is the steady state
  for a path-filtered run that excludes the rest of the tree), this dynamic
  import can blow past the default 5000 ms `testTimeout` on Windows. Full-tree
  `unit-full` runs are unaffected because the module is already resolved by
  the time that test executes. **Fix tracked alongside P05** (engine project
  split) — moving combat tests into a project that doesn't reach into stores
  removes the dependency entirely.
- **High stddev on `unit-full`.** Run 1 is always significantly slower than
  runs 2+ because vite's transform cache is cold. For decision-grade numbers,
  prefer `--runs 5` and look at the median rather than the mean.

## Phases that consume this baseline

Per `plan.md`, P01 gates measurement of:
- **P05** vitest project split — compare `unit-engine` median before/after.
- **P08** test parallelism tune — compare `unit-full` median.
- **P09** `waitForTimeout` removal — compare `e2e-smoke` median.
- **P12** CI cache strategy — compare cold-cache run 1 of `unit-full` on CI.
