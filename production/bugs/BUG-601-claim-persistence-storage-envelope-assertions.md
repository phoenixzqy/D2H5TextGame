# BUG-601 — Claim persistence assertions use the retired object envelope

- Status: fixed locally (uncommitted)
- Severity: medium (validation defect)
- Found: 2026-11-02, affected quest-recovery checks
- Environment: Node 24.21.0, Vitest 1.6.1, jsdom; real save adapter with mocked IndexedDB IO

## Reproduction

Run `node_modules/.bin/vitest run --project ui src/features/quests/claimReward.persistence.test.ts`.
All nine cases fail when comparing `SaveRecord.data` directly to a native save object.
Evidence: `bug592-recovery-batch-affected-v1.json` in the retained root evidence packet.

## Expected and actual

The current adapter writes `{ encoding: 'json-v1', data: <JSON text> }`, as specified
by ADR-018. Tests should verify the tag and compare the complete parsed payload to
the expected portable save, then retain their actual export/import/hydration and
once-only reward checks. Instead they compare the JSON string to a native object
and stop before exercising the later persistence boundaries.

## Root cause and fix

The claim integration assertions were not updated with the physical storage
envelope. The corrected helper asserts encoding json-v1 and compares the complete
parsed payload with toJsonSafe(expected). Adapter, reward behavior, logical save
format and expected reward amounts are unchanged. All nine cases now pass in
`bug601-claim-persistence-v1.json`; scoped strict types and ESLint exit0 in
`bug592-recovery-batch-types-v2.log` and `bug592-recovery-batch-lint-v2.log`.
The distinct affected union is165/165 passing assertions across nine files.
Earlier failures stay retained; no unrelated suites repeated. See
[recovery batching evidence](../../docs/balance/2026-11-02-inventory-recovery-batching.md).
