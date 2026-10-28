# BUG-366 — Investigate the material-source report test timeout

Status: Open — earlier full-suite timeout did not recur in the sole reviewed full-workload capture; cause undetermined.
Severity: Low — validation timing failure; no gameplay or report assertion defect established.
Build: `79d58fae1e876b271c18e580449a8e62d40d6403` plus the Prayer repair, now retained as unaccepted source `af71980f69561a472fdf033088ceb7f0209bb465`.
Environment: Node 24.21.0 / npm 11.19.0, Vitest `sim-contracts`, Node environment.
Browser, viewport and locale: not applicable. The existing constructed test uses seed 42;
the timeout report does not establish whether execution reached that fixture.
Owners: qa-engineer / performance-analyst / engine-dev; root investigates, producer reviews.

## Reproduction

1. Run the existing unfiltered `npm test` with the default workspace, worker bounds,
   assertions and 5000ms test deadline on the frozen executable input map
   `680a938e050fcbec4617ee865e0083ea17d0bf3a6a8dd1a7998953bc5baeacf3` (2,045 files).
2. Observe `tests/sim/production/material-source-report.test.ts`, case
   `reconciles a native zero-material wave, duplicate early advance and positive constructed direct grant`.

Expected: the unchanged constructed source-report control completes its assertions
within the native test deadline, preserving its caller and making no earned acceptance claim.
Actual: the assertion result reports `Test timed out in 5000ms` with duration 5008ms.
The file reports 26 passed and one failed case. No report-value assertion mismatch
or import exception is reported; the timed phase remains unmeasured.

The complete unfiltered run exits 1 after 2280.441251s: 21,525 passed, three failed
and two existing skips across 1,007 files. The other failures are the two existing
BUG-180 module-entry timeouts. All 2,045 executable inputs remain unchanged.
The separate engine suite passes 10,959 cases / 409 files, and Prayer's focused
suite passes 246 cases / 12 files. These passes do not clear this full-suite failure.

## Evidence and investigation limits

Root retains `full-final.log`, `full-final.json`, before/after input maps,
`full-final-result.json` and `test-summary-final.json` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-prayer-9d0e935j`.
The summary SHA256 is `0b0c8bf51e20ec8ed21cc397b0b7e870cad9706c3840b0b5054cb60a0a670958`.

The case dynamically imports store/helper modules before its constructed control.
That source fact does not localize the timeout. A contemporaneous read-only
resource observation records CPU pressure, but establishes neither a causal host
condition nor a Prayer regression. No production fix is selected, and the test,
timeout, worker bounds, configuration and dependencies remain unchanged.

The separately reviewed13-case UI module-entry CPU diagnostic passes and captures
valid coordinator/worker stacks. It never executes this material case, identifies
no timed phase here and does not clear this failure or the failed full run.
No isolated gameplay/acquisition replacement experiment is authorized or run.
Browser/earned recruitment, economy, campaign, performance/PWA, actual CI and
full-v1 acceptance remain separate and unresolved.

## Sole full-workload follow-up — 2026-10-28

The separately pre-reviewed unfiltered default full-workspace capture on the
same 2,045 executable inputs completes native0:21,528passed/0failed/2same skips
across1,007files in1,619.476379s. This exact material-source case executes and
passes at reported4,866ms, with no report-value assertion mismatch or exception.
Its duration is not an exact import phase/timer window. Original native1/5,008ms
timeout evidence is unchanged; the new pass is nonreproduction, not a cause/fix.

Independent terminal review approves the narrow current-byte full-unit
prerequisite, security-pass/findings[]/readers released; SHA256
`aef63973046e2eced4252aad34a988a20f1b1707b98385d7b9e3da3977b0854d`.
The frozen analyzer remains inadequate because59profiles contain62negative
deltas; all1,009raw profiles remain retained. No phase/stack/cause conclusion or
production optimization is justified. See
[terminal evidence](../../docs/plans/evidence/full-workload-timeouts.md) for raw
packet paths, unchanged discovery, two exact Date-label reconciliations and
ownership. No isolated material replay, new experiment or extra full run follows.
BUG366 stays Open; recurrence stops source continuation for bounded diagnosis.
