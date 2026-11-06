# BUG-468 — Nova controller fixture violates native character-name length

- Severity: P3 (constructed QA fixture).
- Status: fixed; focused checks and corrected native launch verified.
- Environment: WSL, Node24.21.0, maintained human worktree2.
- Repro: `nova-act2-preparation.regression.test.ts` beforeEach creates
  `Act II controller QA` and asserts `ok`.
- Expected: a valid short name lets controller assertions run.
- Actual: native creation refuses the overlong name; all eight checks stop in
  setup. Other helper/route checks pass (35 passes).
- Evidence: `p15-act2-nova-controller-green-v1.log` and terminal wrapper receipt.
- Root fix: use a valid short QA name; preserve native creation validation.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
