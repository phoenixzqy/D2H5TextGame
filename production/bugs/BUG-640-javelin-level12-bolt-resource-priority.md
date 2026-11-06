# BUG-640 — Preserve Javelin's pack and physical alternatives at level 12

Status: Fixed/verified in working tree (uncommitted); intended campaign rotation
corrected. No production engine/data defect established or coefficient changed.
Severity: High (intended build progression); owner: root / game-designer.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production
hash `12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
Native Node campaign, no browser/viewport/locale dependency. Timestamp1793469600000.

1. Run intended `amazon-javelin-intended-v1`, Act I, existing bounded Den
   acquisition and `act1-training-v1` recovery; preserve native seed schedule.
2. Acquisition earns12; route104–106 clears Moor, Cold Plains, Burial Grounds.
3. Dark Wood107 (runSeed68958195) loses wave index3; recovery Cold Plains108
   (runSeed1568488346) loses index2. Per-wave seed is native runSeed XOR
   `(index+1)*0x9e3779b1`, converted to uint32.

Expected: investigate whether learned Poison Javelin/Impale can provide a viable
early bridge without changing intended later lightning identity or granting power.
Actual:109admissions/309waves/305wins/four defeats; stops12without boss entry.
Dark Wood opens with13Bolt actions,178→60Mana; failed wave starts14Mana.
Cold Plains opens15Bolt actions,178→75Mana; failed wave starts1Mana.
Bolt1's1sCD is shorter than the hero's approximately1164ms action period, so
the first-eligible order repeatedly selects it ahead of Poison4/Impale1.

## Evidence and bounds

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-javelin-current-policy-v1-{plan,source,readback}.json`, frozen reader and
`p15-javelin-current-native-v1/amazon-javelin-intended-v1.json.journal.jsonl.gz`.
Full journal/save/custody/economy/clock/seeds/native allocation/bounded recovery
readback passes. It does not recompute damage/drop laws or prove population
balance. Earlier defense/Jab-order trials remain rejected; do not repeat them.

## Correction and verification

Move Poison Javelin and Impale before Lightning Bolt in
`tests/campaign/intended-growth-v1.json`, preserving later Charged/Lightning
Strike priority and every rank/stat/gear/training rule. The conditional retained
prefix comparison reproduces seven original controls and wins seven alternative
waves. Two genuine native order RED cases precede the correction; eight affected
growth/cast cases, scoped strict types and explicit lint pass.

One fresh earned Act I route clears at14:132admissions/406waves/402wins/four
retained defeats. Full independent journal/save/economy/custody/clock/payment/
bounded recovery readback passes. Its original status-equality failure and
document-only amendment remain recorded; no combat replay or bound extension.
Regression: `tests/campaign/intended-growth.regression.test.ts`.
[Full result and successor](../../docs/balance/2026-11-03-javelin-pack-bridge.md).
No population, later-act or full balance acceptance follows; BUG611 stays open.
