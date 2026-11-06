# BUG-469 — Nova controller fixture omits earned-prefix point allocation

- Severity: P3 (constructed QA setup).
- Status: fixed; focused checks and corrected native launch verified.
- Repro: after shortening the QA name, the controller reaches native stat reset
  with all level14 points held; native quote correctly returns `no-allocations`.
- Expected: the constructed prefix allocates through the same build helper as
  the real Act I prefix before testing a refund.
- Evidence: `p15-act2-nova-controller-green-v2.log`, one pass/seven failures.
- Root fix: allocate the original Nova build during fixture setup. Keep native
  no-allocation refusal and the free-reset consumption policy unchanged.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
