# BUG-325 — Validate P15 source identity before publishing completion

Status: Fixed locally; independent code-review finding in the uncommitted P15-S01 harness
at integration base `276101d4`.
Severity: Medium — an invalid measurement can retain a misleading success status.
Owner: root simulation integrator / reviewer.

## Reproduction

Environment: Node measurement driver; browser, locale and combat seed are not
relevant to publication ordering. No genuine save action.

1. Inspect the final source-state/publication sequence in
   `p15-build-screen-measure.test.ts`.
2. Change a collected source byte during measurement, causing the existing
   before/after source identity validation to fail.

Expected: preserve all original attempts/partial recordings and the source
failure in a report with `status: stopped` before propagating that failure.
Actual: the first driver writes `status: complete` and no failure, then calls
   `assertSourceStable`, which throws after the report is already published.

Evidence: independent P15 source review of publication ordering. No source
drift was observed or introduced in the retained original benchmark/screen.

Root cause: completion is decided before source verification. Workaround:
inspect source hashes and terminal runner status rather than the label alone.

Correction: extracted `finishP15ScreenReport` verifies source identity before
publishing completion, writes stopped observations before propagating failure,
and aggregates simultaneous execution/source failures. The measurement driver
also fsyncs each settled wave to an exclusive external journal. Regression:
`tests/sim/production/p15-build-screen-report.test.ts` reproduces source-only
and combined failures plus the unchanged-source success path. Causal RED is
retained; final focused11/11 pass. Independent bounded source re-review approves;
no independent runtime QA. Commit pending integration.
[Evidence](../../docs/plans/evidence/p15-act5-sorceress-screen.md).
