# BUG-471 — Explicit campaign lint exposes redundant guards in new helpers

- Severity: P3 (diagnostic code quality).
- Status: fixed; focused checks and corrected native launch verified.
- Repro: `p15-act2-nova-lint-v2`, using `--no-ignore` and the scoped TypeScript
  project because default repository lint excludes campaign tests.
- Actual: 17 errors/7 warnings in new helper/tests: unnecessary optional checks
  on current-save fields, shorthand void expressions, and unchecked test fixture
  indexing. Strict no-emit types pass after BUG470.
- Expected: explicit lint really covers edited files and passes their strict
  rules. The earlier default-ignored lint is not validation of those files.
- Root fix: use required current-save fields, block void callbacks and assert
  fixture rows before mutation; do not weaken lint or gameplay validation.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
