# BUG-492 — Preserving every rare prevents native earned gear upgrades

- Severity: Medium; sustained campaign inventory policy.
- Status: locally resolved; original failures and current outcome retained below.
- Environment: human2/WSL/Node24.21.0, earned Nova55 successor1407.
- Reproduction: continue the earned campaign with normal-only overflow salvage.
  Backpack8755 includes8665rares/55normals/35uniques; stash493/500.
- Expected: select useful owned upgrades and use native salvage for surplus gear
  without losing special items or hiding item/material costs.
- Actual: a better critical weapon is selected but cannot equip due to backpack
  capacity. Thousands of unused rares remain protected and repeatedly compared.
- Evidence: p15-act5-ancients-owned-critical-v1 result includes exact candidate
  it-5e8az-exn and capacity refusals; latest native save is
  p15-nova-act5-crystalline-blizzard-retry-v1.json in d2-counted-source-z3jj3xa1.
- Fix: opt-in caster overflow policy retains the best mixed/elemental survival
  and critical candidates per slot plus unique/set/runeword/socketed/equipped/
  reserved items. Native salvage consumes only surplus normal/magic/rare bag
  items; audit exact ownership and rarity/level-scaled scrap. Frozen default
  normal-only policy remains available. Keep stash ownership unchanged.
- Validation: focused retention/yield/committed-recorder-failure cases, then one
  native Ancients continuation. No replay of earlier acts or level55 farming.

- Current outcome: Resolved locally: opt-in native caster sink consumes8713 surplus bag items with exact rarity/level-scaled scrap and retains selected upgrades/special/socketed/reserved/current equipment and stash. Previously refused weapons equip. Two focused cases and native economy audits pass; original normal-only policy remains available.
