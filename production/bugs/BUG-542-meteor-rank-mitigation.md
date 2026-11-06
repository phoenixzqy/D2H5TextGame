# BUG-542 — Restore Meteor rank throughput against ordinary mitigation

Severity: High. Status: fixed in working tree; affected checks pass. Owner: root (content/engine/QA).
Build: feat/playable-foundations base9e0ef64, source c17ddf016ce9f0b40366f7ed22a489a8cb6a2616072d92365c349fa00dc1b93d.
Environment: Node24.21 deterministic combat; locale and viewport independent.
Seed: 1585850399; Tomb admission319, wave index2.

1. Restore p15-sorceress-fire-act2-earned25-native-continuation-v1.json and its raw journal.
2. Replay the captured level25 hero / Meteor7 / Fire Ball20 input with unchanged enemies.
3. Observe rank7 Meteor100+6×10 through50% fire resistance and126 Defense:
   its initial noncritical damage clamps to1. Even rank20 minimum290 becomes19.
4. Native Tomb loses the hero at28100ms; owned gear, spell-order and free-stat-reset
   forecast controls also fail. All diagnostic income/preparation is discarded.

Expected: earned area-spell ranks penetrate ordinary Act II mitigation without a
boss exception, grant, changed target shape or removal of resistance/Defense.
Actual: primary area damage remains at/near the floor while mana is plentiful.
Evidence: retained native report/raw events/readback and tomb-owned-forecast-v2,
tomb-stat-forecast-v1 in packet d2-counted-source-z3jj3xa1. Arcane is earned complete.
Affected systems: authored Meteor scaling, registry/preview literal expectations,
combat rank regression. Root cause: +10 curve remains below ordinary defense after
resistance at its intended unlock. Workaround: none accepted; native save retained.

Resolution: Meteor damagePerLevel10→80, exact transition bound by
p15-meteor-growth-source-binding-v2.json. Regression:
src/engine/combat/meteor-growth.test.ts (genuine RED1>100, now passes).
32 paired frozen trials improve19→32 wins,13→0 deaths; all failures retained.
507 affected cases pass across focused runs; scoped final types/lint pass.
Native Tomb3206/6, Duriel9940ms, final Claim/Act III unlock independently verified.
No commit was requested; branch base stays9e0ef64. Broader balance remains open.
