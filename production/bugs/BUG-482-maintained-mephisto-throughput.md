# BUG-482 — Clear Mephisto in the maintained fresh Nova route

- Severity: Medium / P2; current native campaign throughput frontier.
- Status: fixed in maintained checkpoint continuation; fresh integration pending.
- Environment: WSL/Node24.21.0, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
  plus source-manifest-bound human2 changes. Engine measurement; browser/viewport/
  locale do not apply. Root sole writer; no publication or CI.
- Reproduction:
  1. Native fresh Act III launcher, Nova diagnostic profile, existing Act I
     recovery, nova-act2-prepared-v1 and normal overflow salvage; no imported save.
  2. Complete actual Act II/SevenTombs Claim, then clear Great Marsh371, Flayer
     Jungle372, Kurast Bazaar373 and Travincal374, with all quests/services/costs.
  3. Enter Durance375/runSeed2103078363; win W1–W5 with actual native carry.
     W6 starts level26 hero357HP/485mana, crit25%/2.87, speed250, Blizzard20,
     FrostNova8, Static1 and IceBlast1; no Prayer survives into the boss.
- Expected: an owned bounded preparation clears the entire native Durance,
  Claims Guardian once and unlocks Act IV. Historical Mephisto wins grant no credit.
- Actual: W6 draws60s, Mephisto1508/33600HP remains; hero323HP/162mana survives.
  Mephisto is native level47, cold/lightning resistance50, flat MagicResist138,
  armor360. No Guardian Claim/Act IV unlock. Current cold mastery rank is0.
- Evidence: p15-maintained-nova-act3-owned-offense-v1 native report/journal and
  exact six-wave p15-nova-act3-durance-controls-v1.json. Independent
  p15-nova-act3-owned-offense-native-proof-v1.json verifies exact1606 prior Act I–II
  waves and unchanged engine/data/campaign code. Technical/source/economy/quest/
  point/export/preparation/recovery audits pass; gameplay remains a nonwin.
- Totals:376 admissions/1635waves/1626wins/nine nonwins,2619860XP/15800items.
- Affected systems: maintained native campaign preparation and balance QA; root.
- Suspected root cause: remaining owned order spends limited action windows
  inefficiently against flat mitigation/paralyze cooldown carry. Cold Mastery
  is level30-gated; current route remains26. First screen whole-Durance priorities
  with exact original controls/carry; do not infer that changing a rank or farming
  target is necessary until the owned orders are measured.
- Constraints: preserve every prior loss, native carried resources, earned point/
  gear/material ownership, current stage and all execution/training/retry bounds.
  No enemy/engine/XP tuning, grants or imported fresh state in this screen.

Continuation: six original/six joined controls and363 full-area trials pass;
all eleven current priorities fail the original and32 seeded areas. Native
checkpoint training then earns level30/mastery1 through63 Great Marsh victories,
1367680XP, no training nonwins. Full Durance W1–W5 win, Mephisto W6 draws with
273HP. Actual unit has authored cold reduction15. Independent native training,
economy and source audits pass. Next measure one free native skill reset moving
one unused FrostNova point to mastery2 (37 conserved paid points). No fresh
Guardian/Act IV credit is claimed for either diagnostic.

2026-10-31: the maintained level30/mastery6 plus Static/Blizzard/IceBlast policy
now clears the actual Act III route from the verified earned Act II checkpoint.
65 native Great Marsh training admissions earn1410500XP with no losses;37 paid
points are conserved. Durance440 clears all six waves; Mephisto dies at30.8s,
hero593HP/34mana. Actual Guardian Claim and Act IV unlock pass, as do native
save/export, economy, combined quest/point and training audits.70 new admissions,
354 victories, zero new nonwins. No engine/data changes or grants. Final fresh
five-act integration is still pending. Earlier diagnostic failures remain
retained. The owner's new strategy avoids replaying Acts I–II during development.
