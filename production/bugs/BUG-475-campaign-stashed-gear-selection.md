# BUG-475 — Campaign preparation ignores eligible owned stash upgrades

- Severity: P2 (maintained campaign preparation).
- Status: fixed; native owned-stash run and full ownership/economy audits verified.
- Repro: actual fresh prepared-v3 terminal, level16 after three Rocky Waste
  mage-wave defeats. Inspect stash with pure native eligibility/comparison and
  merc equipped-stat derivation, without store publication.
- Expected: the explicit Nova preparation considers eligible owned gear in
  both bag and stash, retrieving selected items through native transfers.
- Actual: both selectors search only the backpack. Stash has four hero slots
  with strictly better caster scores; Prayer has eight eligible monotone
  amulets and five eligible silver rings for each empty ring slot.
- Evidence: `p15-nova-stash-score-v1.json` binds the actual input SHA256 and
  stable source/campaign manifests. Pure projection check passes. Prepared-v3
  records 174 stashed items, 515 waves/510 wins/5 losses; complete audits pass.
- Fix: optional owned-stash selection for mercs, explicit caster owned-stash
  selection, native retrieval and exact capacity-refusal conservation. Retry
  selection after ordinary capacity recovery before a new Nova admission;
  keep default salvage, native caps, full ownership/economy checks and losses.
- Plan review: ready. Default merc selection stays bag-only; Nova selection
  uses existing native transfers and checks again after housekeeping creates
  room. Full stash/full bag refusals remain actual refusals. No balance tuning,
  imported campaign saves, agents, installs, commits or publication.

- Verification: `p15-nova-stash-access-green-v1` — 60 focused checks pass;
  `p15-nova-stash-types-v1` and `p15-nova-stash-lint-v1` pass.
  Fresh `p15-maintained-nova-act2-owned-stash-v1` completes its technical
  checks with native export and source/economy/quest/preparation/recovery
  audits intact. It clears Rocky/Dry/Oasis and retains Lost City losses at
  levels21/22/23; this is a preparation fix, not full campaign acceptance.
