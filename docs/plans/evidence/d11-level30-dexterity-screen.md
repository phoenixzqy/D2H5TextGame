# D11 — Bounded level30 Dexterity preparation screen

2026-10-24; runtime `220de7a`, unchanged source `bee76a4`. Root diagnostic
execution/self-audit; no actual reset, allocation, transfer or attempt consumed.
C2–C4, independent acceptance and full G0–G7 remain open.

The input is the genuine [next369 save](fixtures/earned-act3-through368/retained-final.json.gz),
raw SHA256 `9deb0079f5288e7242c4c0e93211aca08d33b9321babc6eac4cb4efc80521b5e`.
Travincal368W5's original draw and its earned prefix remain authoritative.

## Fixed preparation and outcomes

The retained allocation is Strength10/Dexterity25/Vitality132/Energy63. Each
alternative uses the public Ormus stat reset and allocation APIs on isolated
copies, moving40/80/120 points from Vitality to Dexterity. All150 refunded
points are allocated; gear, original Rogue, skill ranks/order and starting
resources remain unchanged. No source tuning or supplied actual challenge seed
is used. Each full-area projection stops at its first native nonwin.

All four policies use the same32 independently derived diagnostic seeds in each
area, split16/16. These256 full-area projections are bounded preparation
screens, not campaign or final balance certification.

| Points moved | Travincal wins/32 | Durance wins/32 | Durance second-half wins/16 |
| --- | ---: | ---: | ---: |
|0 retained|14|0|0|
|40|31|2|2|
|80|19|24|10|
|120|28|24|11|

The frozen selection rule requires at least26/32 full clears in both areas and
at least12/16 second-half wins in both. No candidate qualifies. **No genuine
reset is spent.** Nonmonotonic results also caution against treating attack
speed alone as a guarantee: cooldown/action timing and survival still matter.
These results do not establish that every legal preparation fails.

## Equipment diagnostic limitation and next implementation

A separate owned-gear damage heuristic proposed both hero ring slots, then used
the older `equipItem(item)` API without transmitting those destinations. Its
native projections therefore cannot establish the reported proposed loadout.
The original script/results remain retained and explicitly inconclusive; no
candidate save or actual transfer is promoted. The investigation revealed
[BUG160](../../../production/bugs/BUG-160-equipment-picker-ring-destination.md):
the product picker also previews one ring slot and publishes to another.
The [selected-slot fix](p03-selected-equipment-slot.md) adds the missing
validated destination contract. Future preparation must pass each destination
and assert the complete actual equipment map before projecting combat.

## Retention and cleanup

The shared [archive manifest](fixtures/ring-slot-and-stat-preparation/manifest.json)
retains policies, original scripts/results, failures, exact source/build/served
records and cleanup. All902 source/config hashes match the previous validated
source before the subsequent selected-slot source edit. The diagnostic build's
760 hashes and four served bridge-free JS chunks are exact.

Screen19476 and gear screen90843 are terminal. Preview65872 exits130;4435 is
closed. Exact owned `dexterity-preparation369/dist` and two never-executed native
draft scripts are removed and absence verified. The genuine save remains L30,
next369, zero unspent points and stat3/skill0 free resets. No Mephisto, level31,
ActIV, pacing or complete campaign claim follows.

Root retains raw diagnostic evidence in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/dexterity-preparation369`
and sibling `owned-damage369` through campaign/full-v1 consumers, then removes
it. Source, history and versioned evidence remain deliverables. Local only.
