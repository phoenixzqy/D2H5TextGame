# BUG-491 — Nova times out against the Ancients after six carried wins

- Severity: Medium; earned Act V frontier.
- Status: locally resolved; original failures and current outcome retained below.
- Environment: human2 current source, WSL/Node24.21.0, native admission1406.
- Reproduction: resume earned55 with mixed-v4 gear and balanced native stats;
  clear Crystalline1405, Claim Prison/Read scroll, Start Rite, enter Ancients Way.
- Expected: defeat the three Ancient bosses within the ordinary60second battle
  using paid skills and earned resources; preserve native costs and failed state.
- Actual: W1–W6 win. W7 draws; the three bosses retain319/113/1184life.
  Their222MagicResist reduces most noncritical Frost Nova hits to1; the current
  Blizzard/Static/Nova order casts22Static/18Nova/13Blizzard. No Ancients Claim.
- Evidence: p15-nova-act5-crystalline-blizzard-retry-v1.json/raw journal/exit and
  exact p15-act5-ancients-w7-failure-input-v1.json in d2-counted-source-z3jj3xa1.
  Technical/export/economy/quest audits pass;61actions,1407cumulative admissions.
- Next: reproduce this exact wave, compare only paid boss orders, then one native
  next-admission attempt from this successor. No repeat training/earlier acts.

- Current outcome: Resolved locally: native1408 clears seven Ancients waves with mixed incoming protection and owned critical armor selection retaining resistance floors. Rite Claim is audited in the separate byte-identical reaudited successor. Baal1409 draw is BUG494; no final five-act acceptance yet.
