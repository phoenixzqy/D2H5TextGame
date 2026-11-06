BALANCE-CHECK: CONCERNS

# Impale single-target rank growth — 2026-11-01

BUG546 changes Impale growth7→150; rank1 remains75–110, rank8 becomes1125–1160
and rank20 becomes2925–2960. This supersedes only the +7 numeric curve in the
historical D04 Impale contract. Ordinary Defense bypass, resistance/dodge,
single-target selection,10MP/2s and captured10%/s three-second Bleed stay exact.
Lightning Strike75 and Poison Javelin15 do not change. No engine/schema/save
format change is required: the existing schema accepts this authored growth.

Same-source restored Durance controls isolate the need for a single-target
curve. Level28 Silks/three Nefs survives all five packs but capped Lightning
alone draws60s with17319 of33600 bossHP. Adding the existing Impale8 leaves18184HP;
a level40/Impale20 control still leaves19606HP. Mana/life and complete events are
retained. Extra levels cannot increase the already-capped fixed damage curve.

| Identical source/owned preparation | Before +7 | After +150 |
| --- | --- | --- |
| Projected28/Impale8 + Lightning20 | Draw60s;18184HP | Victory46.992s |
| Projected40/Impale20 + Lightning20 | Draw60s;19606HP | Victory30.660s |

For both controls, all five preboss initial teams/events/metrics and boss entry
teams are identical before/after. All diagnostic income/state is discarded.
The62existing affected registration/schema, native Defense/Bleed/lifecycle and
bilingual current/next/MAX checks first produce15causal failures, then pass.
The capped native lifecycle target is enlarged to keep the full nonlethal
Bleed observation; bypass/resistance/miss/resource/reflection controls remain.

Only Amazon JSON and three existing literal expectation files change. All2090
production inputs are rehashed and exactly those four paths differ. Source tree
b034079020d713da9d493913b91c3af6a4b6d5c12cf09108a6a19f0ea72eecb2;
data62e97d817e3014e834c32c1600f5ff0f4448b1543b6cca2c9f8717d08513fcaa.
The retained binding is p15-impale-growth-source-binding-v1.json; the causal
comparison is p15-impale-growth-transition-readback-v1.json in the counted packet.

This is bounded local evidence, not release sign-off. Equal-investment class/
tier damage, all difficulties,1000-seed distributions, disjoint holdouts,
acquisition/economy/pacing and final advertised build acceptance remain open.
A fresh actual-earned28 forecast and native Durance continuation are required;
the projected controls never stand in for earned progression. Root retains the
exact before source, failed controls and execution receipts through acceptance.
