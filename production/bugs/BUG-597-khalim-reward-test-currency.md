# BUG-597 — Khalim source test omits the authored currency reward

Status: Fixed locally; no commit created. Baseline failure retained.
Severity: Low. Owner: root / QA; affected system: content tests.

## Reproduction

On branch `feat/playable-foundations`, authority45 production/data inputs, run
`src/data/loaders/khalim-source.test.ts` in the engine Vitest project under
Node24.21.0. No browser, viewport, locale or RNG seed applies to this literal
authored-data assertion.

The first test expects Khalim's Will rewards to equal `{ xp: 8000 }`. Current
`src/data/quests/main.json` also grants `wishstones: 20`; the other16 cases pass.
The same assertion fails with all ten retained original loader implementations
and the original schema registry substituted in memory.

## Expected and actual

The test should pin both current authored rewards without changing quest data.
Its source/receipt graph assertions remain intact. The mismatch predates the
validator-precompilation extension; no runtime reward regression is established.

## Evidence

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug592-leaf-green-v2.{json,log}`, `bug592-leaf-baseline-v1.{json,log}` and
`bug592-leaf-baseline.workspace.mjs`. Baseline has16passes/onefailure; the candidate
adds20passing reset/class cases. Root retains these through umbrella review.

## Local resolution — 2026-11-02

The literal reward assertion now expects `{ xp: 8000, wishstones: 20 }`.
`bug597-green-v1.{json,log}` records17/17passing cases; source graph assertions
and all production/data bytes are unchanged by this correction. Scoped strict
types pass with the corrected test included; its explicit lint check also passes.
