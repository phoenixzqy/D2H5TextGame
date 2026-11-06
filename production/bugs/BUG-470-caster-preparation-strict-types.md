# BUG-470 — Caster preparation copies untyped resistance iteration

- Severity: P2 (maintained diagnostic type correctness).
- Status: fixed; focused checks and corrected native launch verified.
- Repro: scoped `tsconfig-nova-act2-preparation-v1.json` no-emit check.
- Actual: four TypeScript errors: string iteration cannot index `Resistances`;
  an assertion already narrows a refused reset quote to `never` before the
  subsequent refusal branch reads `kind`.
- Expected: use the explicit authored resistance-key union and one quote
  narrowing; retain strict mode and refusal handling.
- Evidence: `p15-act2-nova-types-v1.log`; controller's eight runtime checks pass.
- Root fix: typed resistance arrays and remove the redundant assertion before
  the reset quote's explicit guard. No gameplay formula change.

- Verification: `p15-nova-stash-access-green-v1` passes60checks; later
  `p15-nova-cold-training-green-v1` passes58controller/caster/route checks.
  Scoped strict types and explicit no-ignore lint pass. Corrected recovery
  configuration in cold-earned-v1 reaches actual Lost City/Arcane clears;
  native export and all source/economy/quest/preparation/recovery audits pass.
  Original failed measurements remain retained; no full campaign acceptance.
