# BUG-266 — Construct absent Wall authority fields using exact optional types

- Severity: Low; new regression-fixture compilation errors, not a runtime failure.
- Status: Corrected in `739b7253`; strict exact-optional fixtures verified.
- Owner: root. Independent acceptance remains open.
- Environment: strict TypeScript/exactOptionalPropertyTypes, native Linux Node;
  no browser/locale/RNG dependency for the compilation failure.
- Base: 5591aa6b. Full engine9361/351 passes at this source revision.

## Reproduction, cause and correction boundary

Run `npm run typecheck`. It reports five errors in the new Wall cast/pool tests:
the pool unit factory omits required `tier`; explicit `boneWallRank: undefined`
and `boneWall: undefined` violate exact optional properties; the latter also
breaks Vitest parameter inference and produces two downstream diagnostics.

Add the required trash tier to the synthetic unit. Construct missing learned
authority using a unit that never had that field. Test a bare marker by
destructuring away the payload, preserving the actual negative behavior as its
own test. Do not widen production types, cast away the errors, suppress checks,
or delete the negative cases. Original source copies and full131.904s/exit2 log
are retained in the active bone task. Recheck focused tests, typed lint and full
types; no functional credit follows a test-fixture correction.

## Integrated validation at bdc747b8

Full18359tests/845files/two existing opt-in skips, engine9382/352, strict types, lint, official build/bridge and756URLprecache pass. Regression: src/engine/combat/bone-wall-cast.test.ts and bone-wall-pool.test.ts. Original failures are preserved; details and immutable receipts are in docs/plans/evidence/d06-bone-defenses-core.md and its integrated packet. No new inventory credit or independent/earned/full-v1 acceptance.
