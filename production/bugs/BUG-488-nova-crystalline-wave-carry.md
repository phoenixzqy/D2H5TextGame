# BUG-488 — Nova loses Crystalline Passage W3 after severe life attrition

- Severity: Medium; earned Act V campaign frontier.
- Status: locally resolved; original failures and current outcome retained below.
- Environment: current human2 source, WSL/Node24.21.0; native challenge1399.
  Browser, viewport and locale do not affect this engine outcome.
- Reproduction: continue the earned Nova level55 save after Siege and Rescue,
  perform native Prison Inspect/Potion/Thaw, then admit Crystalline Passage.
- Expected: survive the full carried-resource area with earned gear/skills;
  preserve every loss and source-bound Prison action on retry.
- Actual: W1/W2 win but W3 starts at160/1005life and304mana. Eighteen level69
  Succubi defeat the hero in2394ms, with292mana left. This is life attrition,
  not mana starvation. No Prison Claim, scroll Read, Rite or Eve credit yet.
- Evidence: p15-nova-act5-earned-suffix-v2 report/journal/exit and exact
  p15-act5-crystalline-failure-input-v1.json in d2-counted-source-z3jj3xa1.
- Preparation:359 Foothills attempts/351 full wins/eight nonwins earn55;
  every training/export/economy/quest audit passes. Cumulative1400 admissions
  and28.459893 combat hours; do not repeat farming or the58 prior quest actions.
- Next: one earned next-admission retry using owned Frost Nova first for crowd
  control. Keep actual entry/carry/resources/gear and all prior defeats.

- Retry evidence: actual1400 FrostNova/Blizzard/Static order defeats W1 in7753ms
  from full1005life/519mana; no starvation and no repeat training/actions. Latest
  audited successor is p15-nova-act5-crystalline-retry-v1.json. Ordering alone
  is rejected as a sufficient recovery. Equipped physical resistance is26;
  casterGearScore considers only cold/lightning/arcane, so inspect owned-gear
  physical survivability next. Keep all22 cumulative losses.

- Current outcome: Resolved locally: native1405 clears all six Crystalline waves with mixed-v4 gear, conserved balanced core points and Blizzard/Static/Nova. Prison Claim/Read are audited. No repeated training, enemy/stat overrides or new free reset. Evidence: p15-nova-act5-crystalline-blizzard-retry-v1. Ancients/Baal were tracked separately.
