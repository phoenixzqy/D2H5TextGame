# P15: Versioned bow campaign combo policy

Status: implemented and locally verified; fresh route and earned preparation
exhaust their bounded Act II Arcane retries. Population acceptance remains open.

The original `amazon-bow` campaign profile retains Multiple Shot followed by
Magic Arrow. Its historical outcomes and frozen transport fingerprints remain
historical. The 100-stream retry exploration exposed mana spent on rank-one
Magic Arrow for one point of Arcane damage; the fixed-damage formula matches
the design. Changing that formula would conceal the preparation problem.

The new opt-in `amazon-bow-volley-v1` profile keeps the same skill investments,
stat allocation, bow restrictions and monotone fielded-merc equipment policy.
It uses Magic Arrow alone until Multiple Shot has a learned rank, then Multiple
Shot alone. The transition depends on native learned state, not just level.
Growth remains native and conserves earned points, items, currencies and resets.

A separate `comboPolicy` field controls this transition. `progressionPolicy`
already controls Javelin-specific gear slots and preparation; using it here
would unintentionally suppress ordinary armor upgrades. No default player
combo, engine formula, authored data or historical experiment is changed.

The [retained evidence](../../balance/2026-11-02-native-defeat-retry.md) includes
five matched priority-only sequences and one chronological farm/upgrade/retry
sequence. These justify a fresh-route diagnostic, not population acceptance.
The full v1 scope, 210 encounter cells, 14 fresh build routes, holdouts,
economy/fairness and pacing requirements remain unchanged.

Targeted validation covers registration, native consecutive allocation through
level 26, the learned-skill transition, repeated-growth conservation, ordinary
armor upgrades and preservation of historical policies. All 33 profile cases,
19 retained action cases, scoped strict types and explicit-file lint pass.

One fresh chronological run cleared Act I, earned level 14 through normal
preparation, completed the Staff prefix and lost Arcane Sanctuary wave 3.
It retained 461 wave victories, one defeat, 287,890 XP and 4,576 acquired items.
The independent readback reconciles the complete terminal native save, journal,
ownership/currencies/materials, advancing clock/seeds and all 2,141 production
and 104 campaign inputs without replay. The defeat earned no XP or loot.

The hero entered that wave with 232 life, took 243 lightning and 69 physical
direct damage against eleven level-26 enemies, and died with 139 mana. This
supports checking earned within-act preparation before changing combat formulas;
it does not establish a population success rate or accept a balance cell.
Retain every failed admission and all training, inventory and retry costs.

The exact earned continuation trained level14→18 in54 admissions (44 full-area
wins and10 losses), then stopped at its original nonwin limit. Native owned
survival selection equips two Coifs of Glory. Four already-earned Ort runes
fill their empty sockets through the actual material transaction API. Hero
displayed lightning resistance rises15→23→83; ordinary75 damage cap applies.
Both remaining Arcane admissions lose wave3 against level26 enemies. They are
attempts2/3, retaining the original defeat as attempt1. No more admissions or
training are permitted by that exhausted policy.

The last increment retains four wave wins/two defeats,12,480XP,20 acquired
items,12 normal salvage removals and62.426 combat seconds. Complete native
save and intrinsic item/socket/material conservation readbacks pass without
combat replay, ending at level18/Normal201. Physical incoming exceeds lightning
in both fatal waves; neither reaches zero mana. Review authored progression
and preparation selection next. This failed chronology accepts no balance cell.
