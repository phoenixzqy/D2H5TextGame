# BUG-122 — Preserve authenticated historical identity through v19 mirror reconstruction

Severity: High (campaign proof tooling)
Status: Fixed locally in `167aaba`; no push or release claimed.
Owner: qa-engineer / engine-dev

## Reproduction

- Base: `12607ee` plus the local connected v19 rollout.
- Environment: Node/Vitest sim-contracts; no browser/viewport/locale or RNG.
1. Run the continuation/economy contracts against the pinned native17 exports.
2. Decode the authenticated original through current v19 migration.
3. Compare it through `historicalV17Save`.

Expected: preserve immutable source-byte/save/earned-state hashes and independently
prove only empty v18/v19 additions and canonical actor mirror reconstruction.
Actual: the helper assumes current18. Changing only the version assertion cannot
recover original mirrors overwritten by current migration/serialization.

Evidence: task diagnostics `d2h5-v19-materials-rh7euwd2/runtime-full-attempt.log`,
20 failed historical lineage/current-snapshot contracts. Producer independently
identified that both authenticated original exports have empty actor mirrors.

## Correction contract

Retain a separate exact-hash authenticated original witness, restoring only Map
representations. Compare the complete decoded save with a declarative current
expectation before any historical projection. Reject meaningful new material,
action, quarantine, socket, ownership, payload, stat or resource state. Preserve
recordings, policies, hashes and stopped earned outcomes; do not rerun challenges.

Regression: `tests/sim/production/historical-v17.test.ts` and the existing
continuation/economy/material-delta/earned-state contracts.

## Local correction evidence

The correction and regression tests pass the integrated full run:
`crafting-full-unit.log`, 10825 passed / 389 files / 2 existing skips.
Final corrected source passes10843 tests across390 files (2existing skips),
with types/lint/build and corrected en/zh mobile crafting checks passing.
Fix committed at `167aaba`; see `docs/plans/evidence/d10-native19-crafting.md`.
Earned campaign and full D10 acceptance remain open.
