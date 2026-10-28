# BUG-356 — Block saving after replay selector rollback failure

- Status: Open — selector recovery repair and required native H2 checks pass; producer approval of the exact H2 packet remains pending.
- Severity: High — failed restoration leaves saving/retry enabled without a
  verified recovered state.
- Found: 2026-10-27.
- Build: H1 runtime `4c2035b24495207e3a47191705ea5f53d27d3fc0`; documentation
  checkpoint `5fe49959`. Only reviewed candidate tests were added for reproduction.
- Owner: `frontend-dev` / `engine-dev`; producer coordinates persistence safety.
- Environment: Vitest1.6.1 UI project, jsdom, constructed Sorceress and
  source-complete Eve/Nightmare entitlement. No browser/viewport/locale or combat
  RNG seed applies to this synchronous selector/persistence fault injection.

## Reproduction

1. Reset stores/persistence, install a constructed hero, mark hydration ready,
   and supply the actual reciprocal claimed-Eve source graph with Nightmare
   entitlement. Save this valid Normal state through ordinary `flushSave`.
2. Subscribe to map changes. Throw one error when Nightmare is published and
   another when the attempted Normal restoration notifies observers.
3. Call `selectReplayProfile('nightmare')` and inspect the resulting
   `AggregateError`, transaction release and hydration/saving readiness.
4. Repeat with throwing save-status and hydration notification observers.

Bounded command:
`npm test -- src/features/map/replayProfile.test.ts --testNamePattern "blocks saving and retry after rollback failure"`

## Expected

Preserve the publication cause and restoration/notification errors. Block saves
and selector retry before releasing transaction ownership. Only real saved-state
recovery restores readiness; preserve unrelated observer writes.

## Actual

The original selector surfaces the two errors and releases ownership, but
hydration stays `ready`. All three cases fail at the required `error` status.
The later saving/retry/recovery assertions are not reached; this reproduction
does not claim those later operations were executed. Source inspection shows
the restoration catch throws without calling existing `blockSavesForRecovery`.

## Evidence and repair boundary

Regression: `src/features/map/replayProfile.test.ts`, parameterized
`blocks saving and retry after rollback failure despite ... notification observers`.
Original session31910 is terminal1/consumed; native8.407288312911987s wrapper,
3failed/22filtered skips/0passed, no input changes. The22filtered tests are not
passes despite the Vitest JSON aggregate `numPassedTests:22`.

Root retains raw log, JSON results, original runner summary, explicit count
interpretation and before/after manifests in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-h2-hell-b6de0n4x/causal/`,
all with prefix `selector-recovery-red`. Root owns verified retention/cleanup
after H2 integration and independent evidence consumers finish.

The integrated H2 selector verifies publication/restoration and uses existing
recovery blocking before transaction release when restoration cannot be
verified. The original full8 failures/6 stale test files and full-second BUG180
failure remain retained. Historical focused1669/66, types/lint and scope-limited
engine/build passes predate the later compile-only save change. Instrumented
full-v3 session8379 passed21,173 assertions/987files with2existing skips and
unchanged5332 inputs/Git state; it is diagnostic with no H2 acceptance credit.
The compile-only change was applied after actual regression-v3 RED19068 and
GREEN52325, and affected83753 passed1228 assertions/40files on unchanged5333
inputs. Pre-cleanup typecheck98175 and build76346 are consumed native0 on that freeze. Required native H2 checks now pass; final docs/inventory and independent
exact H2 packet review remain pending. [H2 evidence](../../docs/plans/evidence/hell-native-integration.md)
retains the original RED, failures and exact validation boundaries. Keep this
defect Open until producer approval of the final exact H2 packet; only then
may this source repair be locally resolved. No browser, earned-play, H3 or wider acceptance follows.

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
