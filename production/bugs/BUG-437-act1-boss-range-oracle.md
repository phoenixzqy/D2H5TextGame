# BUG-437 — Act I boss comparison omits the authored attack range

Status: fixed locally, uncommitted (owner excludes commits).
Severity: Medium (QA regression; runtime behavior agrees with its contract).
Build: HEAD b5a0898 plus local private-v1 work; Node 24.21.0/WSL,
Vitest 1.6.1 jsdom; browser/viewport/locale not involved.
Affected systems: store integration regression; root sole writer.

## Reproduction

1. Run `src/stores/combatHelpers.act1-boss-loot.test.ts` with ordinary Vitest.
2. Compare the current chapter-boss unit against its old hp/atk/def overrides
   at seeds 0, 1 and 4294967295.
3. All three equality assertions fail; the other 18 tests pass.

Expected: reversing the selected power fields restores the old unit, including
its attack range. Actual: the test restores scalar Attack to 150 but leaves
`attackRange: [90,90]`; the old unit correctly has `[150,150]`.

## Diagnosis and fix plan

The P14a02 shared contract explicitly makes an attack override control ordinary
damage as well as scalar consumers. `monster-factory.ts` resolves this to a
point range; `monster-attack.test.ts` already tests override precedence. This
failure is unrelated to Den companion tiers. The comparison test is stale:
restore the old range along with the old scalar attack, and separately assert
exact `[90,90]` and `[150,150]` ranges to preserve override coverage. Keep the
complete unit equality and all identity/guard/loot assertions. No gameplay edit.

Evidence: retained packet `d2-counted-source-z3jj3xa1`,
`p15-act1-boss-regression-red-v1.log` and wrapper receipt: 3 FAIL/18 PASS,
27.360s, no owned descendants alive. Full sweep also reproduced all three.
No workaround, skipped test or runtime authorization change.

Security check: pass; local test correction, no credential/network/dependency/
permission/CI/publication changes. Root-cause review: fix the proven stale
comparison, preserving the independently tested factory behavior.


Verification: `p15-act1-boss-regression-green-v1`88 PASS/3 files,23.997s;
strict types PASS14.239s. Scoped lint PASS24.205s (`p15-act1-boss-regression-lint-v1`).
No runtime bytes changed. Full ordinary attempt remains incomplete/failed.
