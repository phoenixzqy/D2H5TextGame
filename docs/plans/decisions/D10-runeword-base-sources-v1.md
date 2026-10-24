# D10 — Reachable normal bases for every shipped runeword

2026-10-24. Root implementation specification for BUG162/163; no independent
design/balance or earned acquisition sign-off is claimed. This completes the
existing D10 all35-word availability requirement without changing a recipe.

Add `items/base/wp2h-battle-scythe` (Battle Scythe / 战斗镰刀): weapon, weapon
slot, polearm, twoHanded, metal, affixes allowed, required level41, no required
core stats, physical damage32–62 (breakdown physical62), fixed/max sockets5.
The unworded damage budget equals the existing level35 Giant Thresher; the
additional socket is gated at Obedience's unchanged level41. Normal capacity
still rolls0–5; four sockets may form Insight/Infinity, five Obedience, while
wrong counts/order/types remain ineligible. Existing3/4-socket polearms stay
unchanged, including historical saves.

Add exactly one normal Battle Scythe pick to `loot/trash-act4`, weight120,
monster levels41–81. Add exactly one normal existing Thunder Maul pick to
`loot/trash-act5`, weight180, levels62–102; its base remains level62, damage
65–120 and ceiling6. Both weights match the respective existing two-handed
Colossus Blade picks. Existing entries, weights, level bands, noDrop/material
rules and rarity policy stay unchanged. Future eligible selection proportions
change by the two added weights; that is explicit content tuning, not a
measured economy/pacing result. Earlier areas are untouched. Existing art
metadata resolves the polearm through the established staff proxy.

Acceptance: genuine RED before data edits; all35 exact recipes have a matching
authored base and a normal pick at an actual campaign spawn level; actual
drop/materialization reaches0–5 sockets; only exact ordered insertion forms
Obedience; effects and level41 equip restriction are observed; full native
Save/Continue retains the crafted item/costs/equipment. Exercise both locales
at360×640 and desktop using an ordinary bridge-free production build.
Constructed browser inputs stay diagnostic and never replace the level31
earned save or consume nextNormal380. Acquisition balance, earned Obedience,
Diablo/C2, C3/C4 and full G0–G7 remain separate unfinished acceptance.
