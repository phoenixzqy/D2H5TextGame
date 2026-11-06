# BUG-718 — Align save and campaign test fixtures with current contracts

Status: Resolved locally in retained uncommitted working tree. Severity: Medium. Owner: root / QA.

## Reproduction

Source: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained
`feat/playable-foundations` working tree, 2026-11-04, WSL / Node CLI.
Browser, viewport, locale and combat seed: not applicable (compiler fixtures).

1. Run `node node_modules/typescript/bin/tsc --noEmit --pretty false`.
2. Observe the save-management malformed-record assignment and five constructed
   campaign playback mocks that no longer satisfy their required return type.

Expected: supported test fixtures compile while native wave inputs remain
required and malformed legacy storage remains rejected at runtime.

Actual: the malformed legacy record casts its payload to the union of both
physical encodings; that admits a string without its required encoding tag.
Five deliberately unrecorded campaign mocks omit the newly required native
`engineInput` field. The compiler correctly rejects both stale constructions.

Evidence: original diagnostics in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-crafting-readiness-1k5oazhx/typecheck.log`;
current reproduction and subsequent checks in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-type-contracts-7gpedk58`.
No gameplay failure is inferred from these compiler errors.

## Repair and validation plan

Keep the malformed record in the legacy object branch using its already imported
logical save type; rejection assertions stay intact. For constructed campaign
waves, provide a required accessor that throws on engine-input access and is
non-enumerable, so settlement's ordinary spread cannot invent recorded input.
A shared test-only factory keeps this rule consistent across all five mocks.
Test that accidental engine-input consumption fails explicitly. Do not fabricate
an input, make the native field optional, cast the whole wave, or relax checking.

Run the five affected constructed campaign files and the save-management file,
strict app/tooling compilation and changed-file lint. No earned campaign,
browser, broad unit suite, build, dependency or CI work is needed for this repair.

Plan review: ready after tracing the runner's settlement spread and mocked
observer. Security check: pass; local test fixtures/compiler only. Preserve all
inherited changes, closed diagnostic budgets and production contracts.

## Affected-suite finding — checkpoint fault injection

The first affected campaign run retained in `campaign-green.log` reproduces two
additional stale test setups (Act IV/V economy audit failures; 173/175 pass).
The one-shot economy exception is now consumed by `first-entry.ts`'s earlier
first-boss observation, which correctly retains its own error and continues.
The intended terminal-checkpoint audit therefore succeeds. Quest audit injection
is unaffected because that audit has no earlier call. No runner defect is shown.

Repair: arm either deliberate checkpoint exception only after the final native
Claim is recorded, before the runner enters its final audits. Assert exactly one
injected failure and intact earlier economy observations, retaining independent
audit/save/checkpoint and realm-restoration assertions. Recheck the two affected
files only; no earned gameplay actions or earlier-act suites.

## Resolution and bounded verification

At base `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus the retained working tree,
`src/stores/save-management.test.tsx` now uses `SaveCurrent` for its deliberately
malformed legacy payload. The five campaign mocks use
`tests/campaign/unrecorded-wave-fixture.ts`; its required non-enumerable accessor
throws if consumed, and the budget regression verifies both rejection and spread
behavior. Act IV/V checkpoint tests arm exceptions after their final native Claim,
assert exactly one injection and preserve earlier first-boss economy observations.
Production gameplay and the required native input contract are unchanged.

Verification in `d2-type-contracts-7gpedk58`: save-management 21/21; initial campaign
173/175, with the two stale injections reproduced; final affected Act IV/V rerun
119/119 (74 + 45). The other three affected campaign files were already green.
App and tooling strict compilers passed; save and all changed campaign-file lint
passed, including the final checkpoint files. Final app compilation also passed
in `d2-combat-log-virtual-5i3imfx1/app-typecheck.json` (143.0 seconds). No complete
campaign replay, earlier-act retest, broad suite, build, dependency or CI action.
Task-only active lint config and tooling build-info removed and absence verified;
root retains both named evidence packets through umbrella acceptance, then owns
exact cleanup. Full private v1 acceptance remains incomplete.
