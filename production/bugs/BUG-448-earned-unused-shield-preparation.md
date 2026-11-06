# BUG-448 — Exercise unused owned shield before physical-burst tuning

Status: reproduced preparation coverage gap; frozen native-stat screen next.
Severity: Medium (QA policy limitation; no product defect inferred).
Build: b5a0898 plus local private-v1 work/BUG440, WSL Node24.21.0 production
planner/factory/native combat, locale/viewport independent.
Affected systems: earned gear policy/canonical merc ownership; root sole writer.

1. Reproduce cold-evolution native L24 LostCity ordinal307/runSeed3902248427.
2. Hero currently dual-wields two rare scimitars; native W4dies from physical
   burst. Backpack/stash contain no shields because diagnostic selection never
   considers canonical equipment of the unused ActI Rogue.
3. Rogue owns eligible rare kite shield it-xwcq-2ku: base16defense plus12flat,
   +4%physical dodge, +28mana, +14cold/+16poison resistance. Native hero current
   offhand it-lfvp-27j contributes14attack/+5%crit/+16%critdamage/+21mana/+28life.

Expected: evaluate legal unequip from inactive merc and hero equip before
changing monster tiers or stats. No new item or currency is required.
Actual: caster preparation sees only backpack candidates and never recycles
benched merc equipment. Both proposed enemy-copy budgets fail a declared
both-input robustness criterion, so neither has been adopted.

Evidence: genuine pre-fourth-admission cold-evolution export, canonical
mercEquipment[mercs/act1-rogue-inner-sight].offhand, both actual4wave journals,
BUG447 screens. All native source/quest/point/save/economy audits pass.
Next: pure eligibility and native deriveEquippedPlayerStats screen of this exact
owned shield; preserve actual rank/resource/cooldown/team inputs and enemies.
Native follow-through must perform actual merc unequip/hero equip and audit
complete ownership/payload movement, no cloned item, healing or sink exception.

Owned-shield screen technical PASS10.417s/8exact controls/132rows. Native
composition verifies defense175→203, physDodge.19→.23, cold43→57,
poison42→58 and manaMax328→335; lifeMax739→711, attack96→82,
crit.15→.10/critDamage2.32→2.16; speed125/MR24 unchanged. Original first input
wins380HP/34.500s but second still loses5.774s. Grid17/32,2/32 vs15/32,1/32;
declared criterion not met. No native transfer/adoption or monster change.

Next small factorial screen compares native, shield only, authored-four-body
core only and shield+authored-core together across both exact inherited states.
Keep all8native controls and original+32grid per arm:264rows. Same actual owned
shield/native stat loss/clamped resources and same19-body/four-elite projection;
no new coefficients or additional tuning axis. Both original+≥26/32each required
for any combined candidate. Distinguish legal player preparation from a proposed
runtime clone-budget change; neither is full-area/campaign acceptance. Current
separate-arm failures remain. Exact source/input/process/cache checks as before.
