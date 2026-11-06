# BUG-493 — Caster sink auditor treats formerly equipped armor as permanently protected

- Severity: Medium; diagnostic accounting, not a native item-loss bug.
- Status: locally resolved; original failures and current outcome retained below.
- Reproduction: begin successor1408 with two old equipped rares, select better
  owned armor, then invoke opt-in caster overflow salvage at the next boundary.
- Expected: audit explicit native salvage of currently unequipped surplus gear
  using its exact owned payload, custody and rarity-scaled material return.
- Actual: initial-equipment static set rejects it-93x6t-b8s and it-yga4-c16 even
  though both are now unequipped bag items consumed by the native salvage action.
- Evidence: p15-nova-act5-ancients-critical-retry-v1 report/journal/exit retains
  Ancients Claim, seven Throne wins and Baal draw; technical status failed.
- Fix: add exact consumed-item custody witnesses to opted-in caster receipts;
  independently compare source payloads and require unequipped/nonretained/
  unfilled sockets. Default normal-sink protection stays frozen. Reaudit the
  retained run into a separate successor; never overwrite its failure.
- Check: actual native unequip then salvage with exact reward conservation;
  current equipped/special/socketed/reserved gear remains protected.

- Current outcome: Resolved locally: caster receipts now carry exact consumed-item custody. Auditor binds source payloads and refuses currently equipped witnesses while accepting genuine previously unequipped bag gear. Three relevant fixture cases pass. Reaudit uses canonical native request preimages and reproduces134 removals/108070XP/136items and63quest actions; original failed report is unchanged.
