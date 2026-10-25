# BUG-234 — Make paid fire fields and Thunder Storm recur

Severity: High. Status: Fixed in `b1cfe5e8`; locally verified.
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

Evidence: retained `red.log` and `red-corrected.log` members in the
[raw packet](../../docs/plans/evidence/fixtures/periodic-spells/packet.json).
Root cause: generic one-shot damage adapter and no paid recurring-spell
scheduler/state consumer. Workaround: ordinary recasts do damage, but cannot
deliver persistent effects while the caster is controlled.

Final validation: 176 new tests; focused730/14, engine8088/302, full16236/730
with two existing skips, types/lint/build/precache and12production browser cases
pass. [Delivery evidence](../../docs/plans/evidence/d04-sorceress-periodic-spells.md).
Independent design/QA and earned balance remain open; no full-v1 acceptance.
