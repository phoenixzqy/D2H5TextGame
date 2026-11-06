# BUG-490 — Dexterity-only Nova allocation lacks carried Act V resources

- Severity: Medium; earned campaign frontier after owned-gear recovery.
- Status: locally resolved; original failures and current outcome retained below.
- Environment: human2 current source, Node24.21.0/WSL, Crystalline1402.
- Reproduction: earned55, mixed-v3 owned gear, paid mastery20/Blizzard20/Nova20,
  core Dexterity295/Vitality10/Energy35. Use Static/Blizzard/Nova through the area.
- Expected: retain enough paid life/mana and recovery for the full area; allocate
  only refunded native points and consume the real available reset.
- Actual: W1–W4 win; W5 defeats24232ms after starting446life/120mana. Current
  full life880/mana558; one unused free stat reset remains. Gear recovery clears
  Succubi but cannot supply a balanced character allocation by itself.
- Evidence: p15-nova-act5-crystalline-mixed-gear-v2 report/journal/exit in
  d2-counted-source-z3jj3xa1; exact58 quest actions, rewards and exports audit.
- Adaptation: one native stat reset, conserve270 refunded points, then allocate
  per5 points: Dexterity2/Vitality2/Energy1. Preserve all skills, gear ownership,
  quest actions and failures. This is an earned next-admission experiment;
  do not adopt or claim campaign success without its actual result.

- Native result: one free reset consumes the remaining stat reset, refunds270
  and conserves core-point total exactly. Core133Dex/118Vit/89Energy,1096life/
  639mana. W1–W5 win, with635mana at W6 entry. W6 defeats after237life carry;
  a217 physical critical plus earlier small hits kills. No second reset or
  training is needed to investigate that measured physical vulnerability.

- Current outcome: Resolved locally: prepareNovaActFiveResources consumes one actual remaining free reset and conserves270 refunded points. Native balanced133Dex/118Vit/89Energy plus mixed-v4 gear clears1405. Three resource checks pass; no free stat resets remain. Do not repeat this reset or training.
