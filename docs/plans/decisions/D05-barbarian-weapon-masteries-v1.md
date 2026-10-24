# D05 — Sword, Axe and Mace Mastery

Status: implemented and locally verified; independent review/QA and earned builds open.
Controlling sources: authored Barbarian JSON coefficients, canonical item-base
weapon metadata, D05 automatic-passive requirement. No numerical tuning change.

Each exact authored `skills-barbarian-<weapon>-mastery` and canonical
`barbarian.<weapon>_mastery` pair resolves the maximum valid positive integer
allocation once, capped by authored maxLevel20. Unlock is authored level1.
Sword/Axe/Mace each grants +3% direct physical damage and +0.5 percentage point
critical chance per rank, only to the Barbarian player with that weapon type
in the canonical weapon slot. Both handednesses qualify. Other learned
masteries do not stack; offhand, instance names/IDs and missing/unknown bases
cannot supply eligibility. Add exact weapon requirements to the authored rows.

Fresh-wave composition uses the existing `increasedDamagePct.physical` path,
additive with ordinary/runeword increases, rather than modifying Attack.
Critical chance adds to fresh equipment/quest stats and uses existing direct-hit
crit rules/caps, including nonphysical direct hits. Noncritical elemental
damage, base Attack, resources, statuses, recovery and RNG protocol are unchanged.
No passive casts, cost, combo slots, persisted derived stats or save migration.

Allocation and weapon swaps preserve current recordings; qualified next waves
and explicit replay recompose using current canonical equipment/allocations.
Removal/reset removes bonuses without healing, income or compounding. Native
allocation need not have the required weapon equipped; the effect requires it.
Both locales explain the weapon condition, damage/critical bonuses, rank/cap,
automatic behavior and next-wave timing, without claiming attack rating.

Acceptance: identity-specific ranks1/20; malformed/duplicate aliases; wrong
class/level/weapon; actual physical hits and critical outcomes; unchanged
noncritical arcane damage; ordinary allocation/equip/reset/replay/import;
bilingual desktop/mobile details and exact Save→close→Continue.
Constructed eligibility proves functionality, not earned progression/balance.
Polearm, Throwing and Spear Mastery remain separate required work; Spear has
no currently classified item base and must receive an obtainable weapon path.

Plan review: ready. Root self-review includes physical-only damage composition,
preserved runeword modifiers, weapon swaps, recording and resource boundaries.
Security check: pass; local typed data/runtime/UI, no dependencies, credentials,
network, CI, permissions or save-shape changes. Full C0–C4/G0–G7 scope remains.
