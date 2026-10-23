# BUG-125 — Diagnose module-entry import timeouts under full validation load

Severity: Medium (test reliability)
Status: Root worker-bound defect corrected and validated locally; timing budgets remain open
Owner: qa-engineer / performance-analyst

## Reproduction

Base `12607ee` plus the local native19/crafting integration; Node/Vitest1.6.1 on
Linux, jsdom. Browser, viewport, locale and combat seed do not apply.

1. Run the complete `npm test` suite while task-owned typecheck, lint, production
   build and browser validation also overlap.
2. Observe `playerStore.experience-equipment.test.ts`, the player-first and
   inventory-first cases that call `vi.resetModules()` then import the full store
   graph. Both exceed the unchanged default5000ms test timeout.

Expected: both entry orders initialize, equip an item and preserve stats without
an import-cycle failure. Actual: neither reports an assertion/import-cycle error;
both time out. Complete result:10841pass/2fail/2existing skips across390 files.
The earlier complete candidate passed the same13-test file in9197ms total.

## Evidence and reduction

Evidence root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-v19-materials-rh7euwd2`

- `crafting-full-unit-current.log`: two timeout failures,376.89s total.
- `crafting-import-order-isolated.log`: unchanged source,13/13 pass,2992ms test
  time and8.25s total. This rules out a consistently failing initialization cycle;
  it does not establish the exact cause of the full-run slowdown.

- `crafting-full-unit-quiet.log`: standard full command run alone passes
  all390 files /10843 tests /2existing skips in306.02s; terminal exit0.
  Both module-entry cases pass unchanged. Source/tests committed at `167aaba`.

The import graph is large and module resets recreate validated catalogs. Host
contention is suspected, not proven. No timeout, assertion, test discovery or
production source has been changed to suppress the result. No test is skipped or
quarantined. The quiet full rerun passes but does not establish the root cause.
Retain both outcomes; profile import cost and host contention if it recurs.
This timing diagnosis remains open.

2026-10-23 final active integration run before pool correction:407files,
11026pass/1fail/2existing skips in287.59s,exit1 (`full-final.log` in
`d2h5-runeword-actives-33rokgzu`). The remaining failure is the unchanged
player-first5000ms module-entry case. All compatibility corrections pass.

The installed Vitest1.6.1 `createThreadsPool(ctx)`
(`node_modules/vitest/dist/vendor/cli-api.OdDWuB7Y.js:8180–8209`) reads pool
sizes from root `ctx.config`, not project configuration. The existing UI
workspace's `poolOptions.threads.maxThreads:4` never bounded this shared pool;
the root had no bound. On the16CPU host, its default is15workers. The recorded
live process has26 total OS threads and approximately4GB RSS; runtime threads
are included, so26 is not a worker count. This establishes a configuration
defect and a plausible contention mechanism, not a complete per-timeout CPU
profile. `pool-timeout-diagnosis.json` retains the observation.

Correction moves the intended four-worker limit to root `vitest.config.ts`,
with explicit minThreads1/maxThreads4, and removes the ineffective project
setting. All projects share the bound. Isolation, test discovery, timeouts,
assertions, skips and coverage thresholds are unchanged. Technical-director
plan review READY. Security check PASS for this local runner correction:
no external publication, dependency, permission or validation bypass.
Verify actual worker concurrency and standard full validation before closure.

2026-10-23 recurrence during active-skill integration at2317d54 plus local
changes: standard full `npm test` run alone,466.56s,11004pass/23fail/2existing
skips. Nineteen failures are separately diagnosed stale expectations in
BUG132/133. Four unchanged tests time out: the same two player/inventory entry
orders at5000ms; the first deferred merc-equipment-stats import at5000ms; and
restored-mode measurement at30000ms. These additional symptoms do not prove
the same underlying cause. No other root test/build/browser command overlapped
that full run; concurrent load within the suite remains present.

Unchanged isolated reductions all pass: entry-order file13/13 in7.59s total
(2.78s tests), merc-equipment-stats24/24 in1.62s total (0.89s tests), and
mode-measure1/1 in9.99s total (9.06s tests). Logs `full-integrated.log`,
`import-order-isolated.log`, `merc-import-isolated.log`, `mode-isolated.log`
under root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-runeword-actives-33rokgzu`.
This rules out consistently failing initialization for these reductions; it
does not identify the full-run slowdown's cause. No timeout, assertion,
discovery, worker setting or production behavior was weakened. A final standard
full run remains required for the current integration.

2026-10-23 corrected-pool validation: the diagnostic Worker lifecycle observer
records maximum4online workers and final0 across5files/346tests (18.80s,exit0),
not an OS-thread estimate. Final standard `npm test` has no observer/preload and
passes407files/11027tests/2existing opt-in skips in340.55s,terminal exit0; the
unchanged13-test module-entry file passes in2932ms. Final corrected-config
typecheck/lint pass. Logs `pool-diagnostic.log`, `pool-worker-events.jsonl`,
`pool-worker-observation.json`, `full-bounded-final.log`,
`typecheck-pool-final.log`, `lint-pool-final.log` and `final-source-audit.json`
are retained under the active-skill evidence root. All1055source/config hashes
are unchanged through the final full run.

The ineffective root worker limit is fixed and verified. This single passing
full run does not establish that every historical timeout had the same cause,
that timing failures cannot recur, or that the15s full-test budget is met.
Retain failed runs and the observer source as diagnostic evidence; broader
import-cost/performance work remains open.
