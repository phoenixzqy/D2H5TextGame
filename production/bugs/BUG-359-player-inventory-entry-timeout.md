# BUG-359 — Investigate the player/inventory entry-order test timeout

Status: Open — one observed full-suite timeout; unchanged isolated and later full runs pass. Cause unresolved; no fix or flakiness claim. No forge label/status applied.
Severity: Low — Cannot-reproduce in the unchanged isolated diagnostic and subsequent full run; no application defect established.
Found: 2026-10-28.
Build: `36d54d677c79ff3f70684d19e1d622e6a9f0bc39` plus the reviewed BUG358 locale/test diff.
Inputs: 5,342 files at `c710006d202df63fc9e5007934135c3a73c6a5198d9da6263b26d10f332e4098`, stable before/after all three runs.
Environment: Node 24.21.0/npm 11.19.0, installed Vitest 1.6 workspace UI/jsdom, original worker settings and implicit 5,000ms test deadline. Browser/viewport and combat RNG seed do not apply. This initialization test does not select a locale; the existing i18n singleton and both shipped locale resources are eagerly loaded.
Owners: qa-engineer / technical-director; producer coordinates native verification.

## Reproduction and bounded diagnostic

1. At the recorded source snapshot, run unfiltered `npm test` with output-only default/JSON reporters. The original run overlaps task-owned typecheck/lint initially; its exact command/start/native result and maps are retained in `full-final-*` artifacts.
2. Observe the existing `src/stores/playerStore.experience-equipment.test.ts` case `supports player-first without an initialization cycle failure` exceed the unchanged five-second deadline: 5068ms. Inventory-first passes in 4235ms. The completed run has 21,194 passed, two skipped and this one failure across 991 files.
3. After all owned checks finish, run the unchanged entire 13-test file once under the same settings. Native exit 0: all 13 pass; player-first 1417ms and inventory-first 1193ms.
4. Run one unchanged unfiltered full suite without competing task-owned checks. Native exit 0, with player-first 1655ms and inventory-first 1482ms. The clean run does not erase the first failure or establish a cause.

## Expected and actual

Both module-entry orders complete under the existing deadline and verify the actual equip/XP/stat assertions. The first run instead times out during player-first, with no cycle exception or assertion mismatch reported. No phase trace identifies where its five seconds were spent.

The stores, target test, setup, lockfile and Vitest settings match the prior passing checkpoint. The two changed quest bundles are reachable through an existing eager import graph; cold import/transform cost, host scheduling and initial check overlap remain hypotheses. No causal conclusion follows from the later passes.

## Evidence and follow-up

[Canonical quest repair evidence](../../docs/plans/evidence/canonical-quest-localization.md) records the source boundary and outcomes. Root retains immutable raw native logs/results/maps plus `timeout-investigation.json`, `diagnostic-plan-review.json`, `full-solo-decision.json` and `terminal-diagnostic-review.json` under:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-quest-locales-bu0ggpfk`
through unfinished goal/review consumers; root owns eventual verified cleanup.

The existing entire 13-test regression remains enabled and unchanged. No timeout, worker, assertion, skip, configuration or production fix was made for this issue. If it recurs, preserve the native result and localize import-phase timing before proposing a fix. Keep this intake Open for monitoring; no quarantine or application workaround is asserted.
