# BUG-340 — Keep Countess source contracts valid under strict checks

Status: Locally resolved; expanded full suite and independent bounded gate PASS.
Severity: High — strict type/lint gates prevent building the new contract slice.
Owner: root quest integrator / engine-dev.
Affected systems: optional source planner, Act V source matching and Countess test fixtures.

## Reproduction

Base `b7bf3595912f7c461ad825382c989baaa91b8adc` plus the uncommitted
Countess pure contracts; Node/Vitest1.6.1, TypeScript strict with
exactOptionalPropertyTypes, repository ESLint. Browser/locale and RNG not
applicable to static checking (actor fixtures use deterministic seed7).

1. Run npm run typecheck against the frozen 1,844-input contract slice.
2. Run npm run lint against the same unchanged input manifest.

Expected: all finite WaveSource branches are narrowed correctly, optional
fixture properties model absence correctly, and runtime validation preserves
known element types.
Actual: typecheck exits2: Act V sameSource treats every remaining source as a
wave and accesses wave-only properties; two test fixtures explicitly assign
undefined to optional properties. Lint exits1 with29 errors: readonly-array
runtime narrowing loses planner element types, the same Act V accesses remain
invalid, and three literal-typed identity comparisons are reported redundant.

## Evidence and cause

`contracts-types.log`/receipt (exit2) and `contracts-lint.log`/receipt (exit1)
are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo/`.
Original engine run passed10,238 tests/390 files. All1,844 original inputs
rehash unchanged before correction. Root retains and cleans exact task-owned
evidence after dependent consumers finish.

Correct discriminant narrowing, preserve the declared readonly element type
before Array.isArray validation, model fixture property absence via omission,
and retain explicit runtime source identity checking through string inputs.
Do not widen save types, suppress diagnostics, or weaken assertions.

## Corrected-slice follow-up

The original corrected whole typecheck/build and10,242engine/391files plus
460focused/6files pass. Whole lint69587 terminal1 was consumed and retains
one remaining diagnostic: sub-area-run.ts:142 uses an optional chain on the
required monsters field of a present encounter. All1,845 corrected inputs
rehash unchanged before the next correction. Remove that redundant optional
chain without weakening the explicit composition checks.
# Follow-up: proof-domain fixture typing

Whole-project `proof-domain-types` (exit 2) found four readonly writes in the new constructed save tests and two existing promoted source-test casts that include `undefined` in a present optional `source`. These are fixture typing errors, not failing runtime assertions: the save/data run passes668tests and the engine run passes10,254tests. Correct fixtures with immutable save patches and a finite `as const` source, retaining all negative assertions. Evidence: Countess task `proof-domain-types.log`.

## Follow-up: native settlement lint

`native-focused-lint` exits1 with10 diagnostics: unbound rollback method,
unsafe Object.values callback inference, object-valued logical eligibility,
three array syntax errors, a nested void shorthand, and three unused copied
merc fixture declarations. The contemporaneous native/source/Claim run passes
356tests/11files. Correct lint without suppressions or assertion changes;
retain `native-focused-lint.log` and its receipt in the same task evidence.

## Follow-up: request parser narrowing

`countess-integrated-types` exits2 at combat/navigation.ts:14. The existing
endgame parser models none/invalid in one object union, so ternary elimination
cannot return it as the new stricter discriminated request. Return explicit none
and invalid branches; do not cast or widen the new parser. Integrated lint and
production build otherwise pass. Evidence retained in the Countess task root.

## Final correction

Finite discriminants, readonly fixture construction, planner narrowing, explicit parser branches and the reported native lint issues are corrected without suppressions. Final whole typecheck, lint and production build pass; original failure logs remain retained.

Final whole types/lint/build and production browser8/8 pass; independent backend/UI
reviews APPROVE. Original full9837 terminated1 solely on the stale Sun recipient spy; exact expectation correction passes11focused tests/scoped lint and independent review. Corrected full35945 terminated1:20,422passed/two BUG180 import-order timeouts/two existing skips across967files (1835.35s Vitest). All1833 frozen inputs and the protected genuine fixture rehash unchanged. The unchanged native13-case file passes alone (player-first2903ms/inventory-first2441ms, unchanged5000ms bound); scratch profiling reports no initialization exception or functional defect, with substantial AJV compilation samples. BUG180 remains unresolved. A reversible local checkpoint is explicitly full-gate-pending; acceptance and cleanup require the later successful exact integrated Countess/Malus/helper gate and fresh checks. This is local constructed
functional evidence, not earned progression, balance or full-v1 acceptance.

Final combined gate:20,514tests/972files PASS with two existing skips;1840inputs and protected save unchanged. Independent source/artifact/final reviews APPROVE. See [retained final evidence](../../docs/plans/evidence/d11-countess-source-cache.md#final-combined-checkpoint--2026-10-27). Prior failed full attempts remain retained; BUG180 and broader acceptance remain open.
