# Act 1 & Act 2 Monster Canon Mapping

This document maps each monster archetype in `src/data/monsters/act1.json` and
`act2.json` to its canonical Diablo II: Lord of Destruction counterpart, the
notable in-game abilities the original possesses, and the skill IDs we map
those abilities onto in our text-engine (drawn from
`src/data/skills/monsters.json`).

Convention:

- **Type**: `archetype` = a regular spawn family that can roll champion/elite;
  `super-unique` = a named D2 super-unique encounter (single spawn, stronger
  stats, `canBeBoss: true`, no elite affixes); `act-boss` = quest boss
  (Andariel, Duriel).
- Skill IDs all reference real entries in `src/data/skills/monsters.json` —
  no invented IDs. Where a D2 ability has no direct analogue (e.g. Fallen
  Shaman *Resurrect*) we either fall back to the closest match or rely on the
  generic `monster-summon-adds` skill.

## Act 1

| ID | Canonical D2 Name | Type | Notable D2 abilities | Mapped skill IDs |
|----|-------------------|------|----------------------|------------------|
| `monsters/act1.fallen` | Fallen | archetype | Weak melee, flee on death of shaman | `monster-weak-melee`, `monster-panic-flee` |
| `monsters/act1.zombie` | Zombie | archetype | Slow melee | `monster-weak-melee` |
| `monsters/act1.corpsefire` | Corpsefire (Den of Evil) | super-unique | Fire enchanted, fire breath aura | `monster-strong-melee`, `monster-fire-breath` |
| `monsters/act1.quill-rat` | Quill Rat | archetype | Throws spikes (ranged) | `monster-weak-melee`, `monster-weak-ranged` |
| `monsters/act1.spike-fiend` | Spike Fiend | archetype | Faster Quill Rat variant | `monster-weak-melee`, `monster-weak-ranged` |
| `monsters/act1.dark-one` | Dark One (Carver tribe) | archetype | Weak melee, flee | `monster-weak-melee`, `monster-panic-flee` |
| `monsters/act1.carver` | Carver | archetype | Weak melee | `monster-weak-melee` |
| `monsters/act1.misshapen` | Misshapen | archetype | Stronger melee | `monster-strong-melee` |
| `monsters/act1.disfigured` | Disfigured | archetype | Strong melee | `monster-strong-melee`, `monster-rend` |
| `monsters/act1.devilkin` | Devilkin | archetype | Weak melee, flee | `monster-weak-melee`, `monster-panic-flee` |
| `monsters/act1.fallen-shaman` | Fallen Shaman | archetype | Fire bolt, resurrect Fallen | `monster-fire-bolt`, `monster-resurrect-fallen` |
| `monsters/act1.carver-shaman` | Carver Shaman | archetype | Fire bolt, resurrect | `monster-fire-bolt`, `monster-resurrect-fallen` |
| `monsters/act1.devilkin-shaman` | Devilkin Shaman | archetype | Fire bolt, resurrect | `monster-fire-bolt`, `monster-resurrect-fallen` |
| `monsters/act1.bishibosh` | Bishibosh (Cold Plains) | super-unique | Fire enchanted shaman, fire ball, resurrect | `monster-fire-bolt`, `monster-fire-ball`, `monster-resurrect-fallen` |
| `monsters/act1.rakanishu` | Rakanishu (Stony Field) | super-unique | Lightning enchanted Fallen, charge | `monster-strong-melee`, `monster-lightning-bolt`, `monster-charge` |
| `monsters/act1.tainted` | Tainted | archetype | Weak melee, poison spit | `monster-weak-melee`, `monster-poison-spit` |
| `monsters/act1.afflicted` | Afflicted | archetype | Stronger melee, poison spit | `monster-strong-melee`, `monster-poison-spit` |
| `monsters/act1.hungry-dead` | Hungry Dead | archetype | Slow undead melee | `monster-weak-melee` |
| `monsters/act1.ghoul` | Ghoul | archetype | Strong undead melee | `monster-strong-melee` |
| `monsters/act1.ghost` | Ghost | archetype | Drain mana, mana burn | `monster-weak-melee`, `monster-curse` |
| `monsters/act1.wraith` | Wraith | archetype | Mana drain, ethereal | `monster-strong-melee`, `monster-mana-rift` |
| `monsters/act1.dark-archer` | Dark Archer (Corrupt Rogue) | archetype | Bow attack | `monster-weak-ranged` |
| `monsters/act1.dark-ranger` | Dark Ranger | archetype | Fire arrow, bow | `monster-weak-ranged`, `monster-fire-arrow` |
| `monsters/act1.vile-hunter` | Vile Hunter | archetype | Charge / spear | `monster-strong-melee`, `monster-charge` |
| `monsters/act1.dark-stalker` | Dark Stalker | archetype | Charge spearwoman | `monster-strong-melee`, `monster-charge` |
| `monsters/act1.coldcrow` | Coldcrow (Cold Plains Cave) | super-unique | Cold-enchanted Rogue, cold arrows | `monster-weak-ranged`, `monster-frost-bolt`, `monster-frost-nova` |
| `monsters/act1.brute` | Brute | archetype | Strong melee, charge | `monster-strong-melee`, `monster-charge` |
| `monsters/act1.yeti` | Yeti | archetype | Strong melee, knockback | `monster-strong-melee`, `monster-rend` |
| `monsters/act1.crusher` | Crusher | archetype | Heavy slam, leap | `monster-strong-melee`, `monster-leap-attack`, `monster-rend` |
| `monsters/act1.treehead-woodfist` | Treehead Woodfist | super-unique | Extra-strong Brute, knockback | `monster-strong-melee`, `monster-leap-attack`, `monster-enrage` |
| `monsters/act1.pitspawn-fouldog` | Pitspawn Fouldog | super-unique | Cursed/poison hellhound | `monster-strong-melee`, `monster-poison-spit`, `monster-rend` |
| `monsters/act1.returned` | Returned | archetype | Stronger skeleton melee | `monster-strong-melee` |
| `monsters/act1.bone-warrior` | Bone Warrior | archetype | Skeleton melee | `monster-strong-melee` |
| `monsters/act1.returned-archer` | Returned Archer | archetype | Skeleton bow | `monster-weak-ranged` |
| `monsters/act1.burning-dead-mage` | Burning Dead Mage | archetype | Fire bolt, occasional bone spirit | `monster-fire-bolt`, `monster-bone-spirit` |
| `monsters/act1.bone-ash` | Bone Ash (Cathedral) | super-unique | Cold-enchanted skeleton mage, bone spirit, summon | `monster-bone-spirit`, `monster-bone-prison`, `monster-summon-adds` |
| `monsters/act1.the-countess` | The Countess (Forgotten Tower) | super-unique | Fire ball, summon, rune drops | `monster-strong-melee`, `monster-fire-bolt`, `monster-fire-ball` |
| `monsters/act1.griswold` | Griswold (Tristram) | super-unique | Smith melee, charge | `monster-strong-melee`, `monster-charge`, `monster-rend` |
| `monsters/act1.the-smith` | The Smith (Barracks) | super-unique | Heavy slam, knockback | `monster-strong-melee`, `monster-leap-attack`, `monster-enrage` |
| `monsters/act1.blood-raven` | Blood Raven (Burial Grounds) | super-unique | Fire arrow, summons skeletons | `monster-fire-arrow`, `monster-summon-adds` |
| `monsters/act1.andariel` | Andariel, Maiden of Anguish | act-boss | Poison spray, poison cloud, melee | `monster-strong-melee`, `monster-poison-spit`, `monster-poison-cloud`, `monster-charge` |

## Act 2

| ID | Canonical D2 Name | Type | Notable D2 abilities | Mapped skill IDs |
|----|-------------------|------|----------------------|------------------|
| `monsters/act2.sand-raider` | Sand Raider | archetype | Demonic melee | `monster-weak-melee` |
| `monsters/act2.marauder` | Marauder | archetype | Stronger raider, charge | `monster-strong-melee`, `monster-charge` |
| `monsters/act2.invader` | Invader | archetype | Strong melee, knockback | `monster-strong-melee`, `monster-rend` |
| `monsters/act2.infidel` | Infidel | archetype | Heavy melee, charge | `monster-strong-melee`, `monster-charge`, `monster-enrage` |
| `monsters/act2.fire-eye` | Fire Eye (Stony Tomb) | super-unique | Fire-enchanted Sand Raider, fire breath | `monster-strong-melee`, `monster-fire-breath`, `monster-charge` |
| `monsters/act2.sand-maggot` | Sand Maggot | archetype | Spits, lays eggs | `monster-weak-melee`, `monster-weak-ranged` |
| `monsters/act2.sand-maggot-young` | Sand Maggot Young | archetype | Hatchling melee (no elite roll) | `monster-weak-melee` |
| `monsters/act2.rock-worm` | Rock Worm | archetype | Poison spit | `monster-weak-melee`, `monster-poison-spit` |
| `monsters/act2.devourer` | Devourer | archetype | Stronger maggot, poison | `monster-strong-melee`, `monster-poison-spit` |
| `monsters/act2.coldworm-the-burrower` | Coldworm the Burrower | super-unique | Maggot Lord, lays eggs, poison cloud | `monster-strong-melee`, `monster-poison-cloud`, `monster-summon-adds` |
| `monsters/act2.dune-beast` | Dune Beast | archetype | Beastly melee | `monster-strong-melee`, `monster-rend` |
| `monsters/act2.saber-cat` | Saber Cat (Huntress / Slinger) | archetype | Leap, throws weapons | `monster-weak-melee`, `monster-leap-attack`, `monster-weak-ranged` |
| `monsters/act2.bloodhawk` | Bloodhawk | archetype | Swarm dive | `monster-weak-melee`, `monster-charge` |
| `monsters/act2.claw-viper` | Claw Viper | archetype | Poison bite, fast | `monster-weak-melee`, `monster-poison-spit` |
| `monsters/act2.salamander` | Salamander | archetype | Fire-enchanted viper | `monster-strong-melee`, `monster-fire-bolt` |
| `monsters/act2.pit-viper` | Pit Viper | archetype | Lightning-enchanted viper | `monster-strong-melee`, `monster-poison-spit`, `monster-charge` |
| `monsters/act2.fangskin` | Fangskin (Claw Viper Temple) | super-unique | Lightning-enchanted Claw Viper | `monster-strong-melee`, `monster-lightning-bolt`, `monster-charge` |
| `monsters/act2.mummy` | Mummy | archetype | Slow melee, undead | `monster-strong-melee` |
| `monsters/act2.greater-mummy` | Greater Mummy (Hollow One) | archetype | Curse, fire breath, raise dead | `monster-strong-melee`, `monster-fire-breath`, `monster-curse` |
| `monsters/act2.burning-dead-archer` | Burning Dead Archer | archetype | Fire arrow | `monster-weak-ranged`, `monster-fire-arrow` |
| `monsters/act2.horadrim-ancient` | Horadrim Ancient | archetype | Curse, fire breath | `monster-strong-melee`, `monster-fire-breath`, `monster-curse` |
| `monsters/act2.ancient-kaa` | Ancient Kaa the Soulless | super-unique | Cursed mummy lord | `monster-strong-melee`, `monster-curse`, `monster-bone-spirit` |
| `monsters/act2.radament` | Radament (Sewers) | super-unique | Poison cloud, raise dead, fire breath | `monster-strong-melee`, `monster-poison-cloud`, `monster-summon-adds`, `monster-fire-breath` |
| `monsters/act2.horror-mage` | Horror Mage | archetype | Lightning / cold bolts | `monster-lightning-bolt`, `monster-frost-bolt` |
| `monsters/act2.cantor` | Cantor | archetype | Tri-element bolts, heal | `monster-fire-bolt`, `monster-frost-bolt`, `monster-lightning-bolt`, `monster-heal` |
| `monsters/act2.dark-elder` | Dark Elder (Halls of the Dead) | super-unique | Tri-element + curse | `monster-fire-bolt`, `monster-frost-bolt`, `monster-lightning-bolt`, `monster-heal`, `monster-curse` |
| `monsters/act2.scarab` | Scarab | archetype | Charged melee | `monster-weak-melee` |
| `monsters/act2.steel-scarab` | Steel Scarab | archetype | Lightning-charged | `monster-weak-melee`, `monster-lightning-bolt` |
| `monsters/act2.plague-bug` | Plague Bug | archetype | Poison cloud trail | `monster-weak-melee`, `monster-poison-spit` |
| `monsters/act2.death-beetle` | Death Beetle | archetype | Lightning shock | `monster-strong-melee`, `monster-lightning-bolt` |
| `monsters/act2.beetleburst` | Beetleburst (Far Oasis) | super-unique | Lightning aura, thunder storm | `monster-strong-melee`, `monster-thunder-storm`, `monster-lightning` |
| `monsters/act2.sand-leaper` | Sand Leaper | archetype | Pounces | `monster-weak-melee`, `monster-leap-attack` |
| `monsters/act2.cave-leaper` | Cave Leaper | archetype | Strong leap | `monster-strong-melee`, `monster-leap-attack`, `monster-rend` |
| `monsters/act2.vulture-demon` | Vulture Demon | archetype | Dive attack | `monster-strong-melee`, `monster-charge` |
| `monsters/act2.undead-scavenger` | Undead Scavenger | archetype | Strong undead vulture | `monster-strong-melee`, `monster-charge`, `monster-rend` |
| `monsters/act2.undead-flayer` | Undead Flayer | archetype | Skeleton fetish melee (carryover) | `monster-strong-melee` |
| `monsters/act2.the-summoner` | The Summoner (Arcane Sanctuary) | super-unique | Fire ball, frost nova, lightning, teleport | `monster-fire-ball`, `monster-frost-nova`, `monster-lightning`, `monster-teleport`, `monster-summon-adds` |
| `monsters/act2.duriel` | Duriel, Lord of Pain | act-boss | Charge, frost aura, hold-in-place | `monster-strong-melee`, `monster-charge`, `monster-frost-aura` |

## Notes / skipped archetypes

- **Difficulty-tier renames (Burning Dead, Horror, Decayed, Returned-tier
  variants, Night Tiger, Black Vulture, etc.)** — D2 reskins the same
  archetype across Normal/Nightmare/Hell. Per the task brief we keep one
  entry per archetype. Where the *Normal-difficulty* entry uses a different
  display name (e.g. `Bone Warrior` for the Act 1 skeleton, `Burning Dead
  Archer` for the Act 2 skeleton archer), we use that.
- **Greater Hell Spawn / Cliff Lurker** — these are Nightmare/Hell
  re-skins of existing archetypes. Skipped.
- **Tomb Viper** — collapsed into `pit-viper` (same archetype family,
  Nightmare/Hell rename in canon).
- **Tomb Creeper** — collapsed into `cave-leaper` (tier rename).
- **Doom Ape** — Act 3 monster, not Act 2. Skipped.
- **Bloodwing** — alternate translation of Bloodhawk; one entry under
  `bloodhawk`.
- **Dark Hunter / Dark Spearwoman** — sub-tribes of Corrupt Rogues that
  share the `dark-stalker` / `vile-hunter` melee+charge profile in canon;
  represented by those two archetypes plus `dark-archer` / `dark-ranger`
  for the bow variants.
- **Resurrect** — D2 Fallen-Shaman *Resurrect Dead* maps cleanly to our
  existing `monster-resurrect-fallen` skill; no new skill needed.
- **No new monster skills were invented.** All `skills` arrays only
  reference IDs already present in `src/data/skills/monsters.json`.
