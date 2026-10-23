# BUG-136 — Update current-save fixtures for the separate endgame root

Status: fixed locally; regression verified.
Severity: Medium — current validation is blocked; no production data-loss defect observed.
Owner: qa-engineer / root integrator.

## Reproduction

Base `e4a89b8665723b554824a35c13bbd7579d75661c` with the uncommitted
ADR-010/save20 prerequisite. Linux Node/Vitest; browser, viewport, locale and
combat seed do not apply to these serialization fixtures.

1. Run `npm test` from the claimed worktree.
2. Observe two failures in `src/stores/persistence.receipt.test.ts` and eight
   in `tests/sim/production/earned-state.test.ts`.
3. The former compares the exact root keys to the version19 list. The latter's
   `currentSave()` passes `observeEarnedState().map` directly into `buildSave`.

Expected: current fixtures explicitly map live `map.endgame` to root `endgame`
and require exactly the complete version20 key set. Existing receipt, clone,
item-sequence and refusal assertions continue to run without weakening.

Actual: the exact-key assertion rejects the required root field; all eight
reconstruction cases stop at `Invalid save: reserved endgame shadow` before
reaching their intended assertions.

## Evidence and cause

Retained root-owned log:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-native-sapkemp7/full-final.log`.
Terminal result: 2 failed/411 passed files; 10 failed/11123 passed/2 existing
skipped tests; 418.25 seconds. Source remained frozen throughout this run.

ADR-010 deliberately separates the live map-owned field from the serialized
root. Production `persistence.snapshotStores` already performs the explicit
mapping. The reconstruction test helper and receipt root-key expectation still
encode the older shape. Preserve the strict shadow rejection and all existing
assertions; correct only these stale test boundaries.

Affected systems: persistence receipt QA and isolated earned-save QA.
Workaround: no fixture bypass; correct mapping before relying on either test.

## Correction and verification

The earned reconstruction explicitly moves live map.endgame to the save root.
Both receipt expectations and the native Skeletal Mage exact-root allowlist
include the required endgame field. No assertion or shadow guard was weakened.
Focused reconstruction/receipt tests pass49/49. The corrected complete suite
passes11133/413files with2 existing skips in710.72s; source freeze1182files has
zero drift and unchanged HEAD. Typecheck, full lint and production build pass.
The Skeletal Mage native browser spec was not run for this fixture correction.
