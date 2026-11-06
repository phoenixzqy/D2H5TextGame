# BUG-467 — Prayer preparation audit rejects native empty equipment ownership

- Severity: P2 (diagnostic helper assertion; gameplay hire remains correct).
- Status: fixed; focused checks and corrected native launch verified.
- Environment: WSL, Node24.21.0, maintained human worktree2.
- Repro: `caster-preparation.regression.test.ts`, native Prayer hire after
  constructed level14/ActII access.
- Expected: old mercs and their equipment persist; newly hired Prayer has its
  own empty equipment map.
- Actual: helper incorrectly asserts the entire equipment map equals the old
  map and rejects the new native `mercs/act2-prayer: {}` entry.
- Evidence: external `p15-act2-caster-helpers-green-v1.log`, 5 passes/1 failure;
  wrapper receipt confirms no live owned descendants.
- Root fix: assert exact old map plus the new Prayer identity with empty slots.
  No gameplay or roster changes.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
