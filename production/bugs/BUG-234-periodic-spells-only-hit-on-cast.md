# BUG-234 — Make paid fire fields and Thunder Storm recur

Severity: High. Status: reproduced at `1ffcc55c`; implementation pending.
Owners: engine/content/frontend; root sole writer and author reviewer.

Environment: deterministic Vitest/Node engine, no browser or locale dependency.
Seed19. Regression: `src/stores/periodic-spells.causal.test.ts`.

1. Create a native L30 Sorceress with legal rank1 Blaze, Fire Wall or Thunder
   Storm and all transitive prerequisites; select only that skill.
2. Supply declared synthetic100MP and a surviving hostile. Hero acts at900ms;
   a pending Stun prevents subsequent actions. Poison ends the battle at5000ms.
3. Record ordinary production combat and inspect source damage timestamps.

Expected: paid persistent fields/storm continue independently of later actions.
Provisional D04 contract specifies900/1900/2900ms for this fixture, one payment.
Actual: every legal spell produces only900ms damage; no recurring attempts.
All three corrected RED assertions fail. Original Thunder Storm fixture missed
Static Field (Nova prerequisite), so its first failure was an invalid setup;
the original report is retained separately from the corrected three-skill RED.

Evidence: task scratch `d2h5-periodic-spells-nk5fzu2y/red.log` and
`red-corrected.log`, to be retained with final evidence before scratch cleanup.
Root cause: generic one-shot damage adapter and no paid recurring-spell
scheduler/state consumer. Workaround: ordinary recasts do damage, but cannot
deliver persistent effects while the caster is controlled.
