# BUG-473 — Prepared route installs Prayer/Static after their training opportunity

- Severity: P2 (maintained earned preparation method).
- Status: fixed; preparation-order and training-boundary regressions pass.
- Repro: fresh `p15-maintained-nova-act2-prepared-v2` with explicit established
  Act I recovery/default salvage. Act I succeeds; Rocky Waste loses wave4 on
  all three attempts at levels14/15/16, despite two earned retry levels.
- Expected: install native Prayer and Static policy after Act I, before earned
  level14 training, as in the proven preparation method. Inspect/equip training
  loot after each admission before next capacity housekeeping.
- Actual: Prayer is hired after training, enters Rocky at its native level12,
  and misses training XP/gear. Static loses the level14 point to Nova.
  `trainCampaignBuild` grows after each admission but `prepareCampaignStage`
  equips only after the entire interval, so normal upgrades can be salvaged
  before equipment selection.
- Evidence: native wave135 opening vs historical actual pre-Rocky export;
  report retains 515waves/510wins/5losses, two recoveries, 17 within-act farms,
  and all source/export/point/economy/quest/recovery audits pass.
- Root fix: prepare Prayer/Static before stage training and supply a settled
  post-growth equipment boundary to stage training. Preserve costs, all losses,
  finite budgets, and native level/equipment gates. No monster tuning.

- Verification: `p15-nova-stash-access-green-v1` — 60 focused checks pass;
  `p15-nova-stash-types-v1` and `p15-nova-stash-lint-v1` pass.
  Fresh `p15-maintained-nova-act2-owned-stash-v1` completes its technical
  checks with native export and source/economy/quest/preparation/recovery
  audits intact. It clears Rocky/Dry/Oasis and retains Lost City losses at
  levels21/22/23; this is a preparation fix, not full campaign acceptance.
