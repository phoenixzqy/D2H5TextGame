# BUG-472 — First prepared diagnostic launch omits declared Act I recovery

- Severity: P3 (measurement launch configuration).
- Status: fixed; focused checks and corrected native launch verified.
- Repro: `p15-maintained-nova-act2-prepared-v1` uses the correct Nova execution
  but omits `CAMPAIGN_RECOVERY=act1-training-v1` from the previously proven prefix.
- Actual: native Dark Wood wave5 defeat at level12, admission107. No Act II
  preparation runs; all technical/source/economy/quest/opening audits pass.
- Expected: the same declared Act I recovery option as the earlier maintained
  Act II baseline. Native default `none` must remain available.
- Evidence: both exact wrapper environment receipts and campaign process JSONs
  (`p15-gear-preparation-order-act2-v1` versus new prepared-v1).
- Fix: relaunch a fresh case with explicit recovery and inventory selectors.
  Retain the original nonwin; no gameplay or default-policy change.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
