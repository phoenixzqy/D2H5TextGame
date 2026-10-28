# BUG-357 — Profile authority skips unselected endgame state

- Status: Open — shared endgame authority repair and required native H2 checks pass; producer approval of the exact H2 packet remains pending.
- Severity: High — selector admission accepts a contradictory durable graph.
- Found: 2026-10-27.
- Environment: Vitest UI project, jsdom; constructed claimed-Eve source graph.
- Owner: engine-dev / frontend-dev.

## Reproduction

Run `npm test -- src/features/map/ReplayProfileControls.test.tsx`. In
`reacts to source proofs, reciprocal items, service authority and the full endgame graph`,
keep the selected title null and set `achievementRewardClaimed: true` while both
clear counts and the attempt ordinal remain zero.

## Expected and actual

The Hell selector must become disabled because the endgame achievement cannot
be claimed without both modifier clears. It remains enabled. The shared
`hasReplayProfileAuthority` checks campaign/title authority, but the campaign
validator reads endgame state only when the achievement title is selected.

## Evidence and repair boundary

Original integrated session89445, terminal1 consumed: 587passed/43failed,
18files, unchanged5330inputs. The UI failure reaches line100 of the test; all
preceding reciprocal-item/service and source-proof assertions passed.
Raw evidence is retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x/validation/focused-first*`.
Root owns retention and verified cleanup after H2 review consumers release it.

The integrated shared profile-authority boundary calls `readEndgameState`
unconditionally before campaign admission, including title-null states. It
retains title-specific ownership checks, original failing UI regression and
malformed/unearned endgame negatives. Reviewed authority SHA-256:
`faf0c3cfc98e6c9756ccacf04d866513641df6a36384d429eac0053f092c9401`.
[H2 evidence](../../docs/plans/evidence/hell-native-integration.md) retains the
original full8 failures/6 files, exact reviewed test-only repairs, historical
focused1669/66/types/lint success and failed full-second BUG180 recurrence.
Instrumented full-v3 session8379 passed21,173 assertions/987files with2existing
skips and unchanged5332 inputs/Git state; it is diagnostic with no H2 acceptance
credit. The later independently reviewed compile-only save change reached
regression-v3 RED19068 then GREEN52325; affected83753 passed1228 assertions/
40files with unchanged5333 inputs. Pre-cleanup typecheck98175 and build76346 are
consumed native0 on that freeze. Required native H2 checks now pass; final docs/inventory and independent
exact H2 packet review remain pending. Prior engine/build receipts
remain historical after the runtime delta. Keep this defect Open until producer approval of the final exact H2 packet;
only then may this source repair be locally resolved. No H3 browser,
earned-play, acquisition or full-v1 acceptance is supplied.

Engine96409 passed10,735 assertions/401files before the exact reviewed type
cleanup; lint73517's three redundant-annotation errors remain retained.
After cleanup, typecheck40015, lint26336 and build2368 all passed native0.
Uninstrumented full27446 passed21,174 assertions/988files with2existing skips
in1280.293275s. All four final checks preserve unchanged5333 inputs on snapshot
`b63bcdfce5e051f2d3be206cdead07881cce853a9ed63efa21f6bc34465b3dc0`.
Earlier runtime outcomes retain their executed hashes and erasure-only mapping.
Required native H2 checks now pass; final applied docs/inventory and producer
approval of the exact H2 packet remain pending. No bug closure, browser/H3,
earned acquisition, CI or full-v1 acceptance is claimed.
