# BUG-237 — Browser evidence run can exceed its60s limit after assertions

- Status: open; observed once, unchanged quiet rerun passes, cause unestablished.
- Severity: Medium — local verification can fail; no product failure established.
- Build: staged Telekinesis source after `d030f410`; final `source-frozen.json`
  and `build-frozen.json` identify exact inputs in the retained task packet.
- Environment: Node24.21.0, Playwright Chromium, mobile360×640, English.
- Seed: ordinary diagnostic run seed chosen by public map entry; no fixed seed
  or genuine campaign action. This is a browser harness timeout observation.
- Affected systems: QA browser evidence, tracing/fixture teardown and local budgets.

## Reproduction and observation

1. Run `tests/pwa/telekinesis.config.ts` against a production build, with the
   original60s timeout, one worker, retries0 and maxFailures1.
2. In the observed failing run, final TypeScript validation was still running;
   repository lint and a short focused test run also overlapped parts of the run.
3. Desktop English/Chinese pass. Mobile English emits the correct paid
   Telekinesis/Stun log, completes save/online/offline Continue assertions and
   the final empty-page-errors assertion, then receives a60s test timeout.
4. The failure stops the matrix; mobile Chinese does not run.

Expected: required assertions and fixture teardown finish within the configured
budget. Actual: the final assertion in `test.trace` ends at170216.160ms; timeout
context closure starts at179975.960ms, roughly9.76s later. No assertion error is
recorded. Exact origin of that interval is not established. Concurrent validation
and tracing overhead are possible contributors, not a proven root cause.

The earlier pre-type-guard four-case matrix passed, but is not final-source
acceptance. Keep this failed report, original trace ZIP and error context.
Do not increase the timeout, add retries, drop mobile/offline assertions or
replace the production build to manufacture acceptance. The exact unchanged
final-source matrix passes4/4 with the overlapping checks terminal; timeout60s,
retries0 and all assertions are unchanged. The later causal-comparator correction
changes only a Vitest test and is verified separately; product/build stay exact.
Independent/full performance acceptance remains open even if that run passes.
