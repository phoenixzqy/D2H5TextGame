# BUG-474 — Nonwin campaign metadata keeps the pre-respec profile

- Severity: P2 (diagnostic evidence correctness).
- Status: fixed; interrupted-profile regression and native terminal metadata verified.
- Repro: prepared-v2 reaches the native Vitality reset and new growth policy,
  then throws a settled Rocky Waste nonwin. The outer runner assigns the
  returned profile only when the controller completes.
- Actual: terminal exported player reflects five-Vitality preparation, while
  top-level profile remains the earlier original/warmup policy.
- Expected: the active declared profile survives interrupted controller calls,
  without changing any actual earned player state.
- Evidence: prepared-v2 successor/point-reset journal versus top-level profile;
  controller source returns the changed local profile only on full completion.
- Root fix: retain active profile in the already retained preparation record;
  synchronize report metadata before final audits. Test interrupted training.

- Verification: `p15-nova-stash-access-green-v1` — 60 focused checks pass;
  `p15-nova-stash-types-v1` and `p15-nova-stash-lint-v1` pass.
  Fresh `p15-maintained-nova-act2-owned-stash-v1` completes its technical
  checks with native export and source/economy/quest/preparation/recovery
  audits intact. It clears Rocky/Dry/Oasis and retains Lost City losses at
  levels21/22/23; this is a preparation fix, not full campaign acceptance.
