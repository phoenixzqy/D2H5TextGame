# BUG-436 — Ormus native-victory fixture retained a low explicit attack range

Status: fixed locally, uncommitted (owner excludes commits).
Severity: Medium (QA integration; no production defect established).
Build: HEAD b5a0898 plus local private-v1 work, WSL/Node 24.21.0,
Vitest 1.6.1 jsdom; browser/viewport/locale not involved.
Affected systems: store authority integration tests; root sole writer.

## Reproduction and diagnosis

Run `src/stores/ormusRunAuthority.test.ts`. The test `binds a real native
first-wave victory to its exact private input/recording` expects
`prepareOrmusAdvance(...).final` false, but receives undefined. The full run
reports 1 failed/34 passed. The hero is copied from an Act III Jungle Hunter;
raising scalar Attack to 1000000 leaves its explicit `[187,187]` range.
The paired native trace produces a draw. The authority correctly refuses it.

Expected: the intentionally overwhelming boundary fixture actually wins before
its authentic receipt is accepted. Actual: its intended scalar power is not
its ordinary damage because explicit range precedence is correct.

## Correction and evidence

Set both positive native-victory fixtures' explicit ranges to
`[1000000,1000000]`. Assert native player victory and all enemies dead before
authority preparation. The naming-tamper negative case now proves a real native
win before the mutation, removing a false-positive rejection. No authority,
forgery guard, factory, RNG, enemy or gameplay change.

Retained packet `d2-counted-source-z3jj3xa1`:
- `p15-ormus-native-range-diagnosis-v1`: paired inputs/recordings/replays,
  technical PASS 5.591s.
- `p15-ormus-authority-before-fix-v1.ts/.json`: exact original/hash.
- `p15-ormus-authority-green-v1`: 60 PASS/2 actual files, 23.874s.
- `p15-ormus-authority-types-v1`: PASS 22.693s.
- `p15-ormus-authority-lint-v1`: PASS 24.575s.

Regression paths: `src/stores/ormusRunAuthority.test.ts` and
`src/stores/ormus-native.test.ts` (see actual focused log for discovery).
The ordinary full sweep started before this correction and retains its failure;
it is not a clean current-source pass. All focused owned descendants exited.
Security check: pass; local test-only change, no network/credential/dependency/
permission/CI/publication changes. Root-cause review: correct the proven stale
fixture and establish actual victory before testing authority.
