# BUG-125 — Diagnose module-entry import timeouts under full validation load

Severity: Medium (test reliability)
Status: Suspected load-sensitive timeout; not a confirmed product initialization defect
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
