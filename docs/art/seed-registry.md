# Seed Registry

> Owned by the **art-director** agent. Every canonical subject in the game
> gets a stable `subjectId`, which combines with the category seed-base and
> a `variant` integer (see `style-guide.md` §5) to produce the final
> image-gen seed.
>
> Rules:
> - Never reuse a `subjectId` within the same category.
> - Re-rolls bump `variant` and are recorded as a new row.
> - The "accepted variant" column tracks which variant is the canonical one
>   committed to the asset folder.

## class-portrait (seed-base 100000)

| subjectId | id                  | subject      | accepted variant | notes |
|----------:|---------------------|--------------|------------------|-------|
| 1         | classes.amazon      | Amazon       | 0                |       |
| 2         | classes.assassin    | Assassin     | 0                |       |
| 3         | classes.barbarian   | Barbarian    | 0                |       |
| 4         | classes.druid       | Druid        | 0                |       |
| 5         | classes.necromancer | Necromancer  | 0                |       |
| 6         | classes.paladin     | Paladin      | 0                |       |
| 7         | classes.sorceress   | Sorceress    | 0                |       |
| 50        | npcs.act1.akara     | Akara, elder priestess of the Sightless Eye | 0 | NPC bust (reuses class-portrait preset) |
| 51        | npcs.act1.charsi    | Charsi, Rogue blacksmith | 0           | NPC bust |
| 52        | npcs.act1.gheed     | Gheed, traveling merchant | 0          | NPC bust |
| 53        | npcs.act1.kashya    | Kashya, captain of the Rogues | 0      | NPC bust |

## monster (seed-base 200000)

| subjectId | id                          | subject                     | accepted variant | notes |
|----------:|-----------------------------|-----------------------------|------------------|-------|
| 1         | monsters.act1.fallen        | Fallen                      | 0                |       |
| 2         | monsters.act1.fallen-shaman | Fallen Shaman (Carver)      | 0                |       |
| 3         | monsters.act1.quill-rat     | Quill Rat                   | 0                |       |
| 4         | monsters.act1.zombie        | Zombie                      | 0                |       |
| 5         | monsters.act1.bone-warrior  | Skeleton Warrior            | 0                |       |
| 6         | monsters.act1.dark-stalker  | Corrupt Rogue (Dark Stalker)| 0                |       |
| 7         | monsters.act1.skeleton-warrior-summon | Skeleton Warrior (Necromancer summon, ALLY) | 0 | Friendly summon variant. Glowing pale ice-blue eye sockets + blue necrotic wisp trailing skull mark it as allied vs the hostile `bone-warrior` (sid 5). Upright guardian pose intentionally contrasts the hostile version's hunched menace. |
| 20        | monsters.act2.sand-raider   | Sand Raider                 | 0                |       |
| 21        | monsters.act2.mummy         | Greater Mummy               | 0                |       |
| 22        | monsters.act2.beetle        | Sand Beetle                 | 0                |       |
| 30        | monsters.act3.flayer        | Flayer (jungle pygmy)       | 0                |       |
| 31        | monsters.act3.zakarum-zealot| Zakarum Zealot              | 0                |       |
| 32        | monsters.act3.thorned-hulk  | Thorned Hulk                | 0                |       |
| 40        | monsters.act4.doom-knight   | Doom Knight                 | 0                |       |
| 41        | monsters.act4.venom-lord    | Venom Lord                  | 0                |       |
| 50        | monsters.act5.death-mauler  | Death Mauler                | 0                |       |
| 51        | monsters.act5.frenzytaur    | Frenzytaur (Minotaur)       | 0                |       |
| 100       | bosses.act1.andariel        | Andariel, Maiden of Anguish | 0                |       |
| 101       | bosses.act1.blood-raven     | Blood Raven, fallen Rogue captain | 0          |       |
| 200       | bosses.act2.duriel          | Duriel, Lord of Pain        | 0                |       |
| 300       | bosses.act3.mephisto        | Mephisto, Lord of Hatred    | 1                | v0 had a faint signature/text leak in lower-right corner (failed "no watermark" check). v1 reworded prompt, dropped "skeletal" lore word that was pulling generic skeletons, kept ribcage cue + Durance ambiance. Accepted. |
| 400       | bosses.act4.diablo          | Diablo, Lord of Terror      | 0                |       |
| 500       | bosses.act5.baal            | Baal, Lord of Destruction   | 0                | v0 captures atmosphere and dark-fantasy demon-lord look but lore-specific cues (twin tentacle-arms from back, spectral cleaver) did not render. Accepted as a "horned arch-demon" placeholder; revisit when boss-portrait preset is tightened. |

## item-icon (seed-base 300000)

| subjectId | id                       | subject        | accepted variant | notes |
|----------:|--------------------------|----------------|------------------|-------|
| 1         | items.unique.shako       | Shako (Harlequin Crest)             | 0                | generated 2026-04-28 |
| 2         | items.unique.enigma      | Enigma                              | 0                |       |
| 3         | items.unique.stone-of-jordan | Stone of Jordan                 | 0                |       |
| 4         | items.unique.windforce   | Windforce (hydra bow)               | 0                |       |
| 5         | items.unique.buriza-do-kyanon | Buriza-Do Kyanon (crossbow)    | 0                |       |
| 6         | items.unique.lightsabre  | Lightsabre (phase blade)            | 0                |       |
| 7         | items.unique.grandfather | The Grandfather (colossus blade)    | 1                | v0 leaked a wielder figure (full warrior holding sword); v1 clean weapon-only shot, accepted |
| 8         | items.unique.wizardspike | Wizardspike (fanged knife)          | 3                | v0 reaper figure holding dagger; v1 two crossed daggers (multi-item); v2 wraith arm holding dagger; v3 clean single dagger on black, accepted. Lore-association ("bone knife" / "wizard") repeatedly pulled flux toward a wielder — for future jeweled-knife icons, drop the "bone" and "spike" descriptors and frame as "museum still life". |
| 9         | items.unique.andariels-visage | Andariel's Visage (demonhead) | 0                |       |
| 10        | items.unique.arreats-face | Arreat's Face (slayer guard)       | 0                |       |
| 11        | items.unique.deaths-touch | Death's Touch (war sword, set piece)| 0                |       |
| 12        | items.unique.tal-rasha-helm | Tal Rasha's Horadric Crest (death mask) | 0          |       |
| 13        | items.unique.herald-of-zakarum | Herald of Zakarum (gilded shield) | 0           |       |
| 500       | items.base.sword         | Generic sword (base type icon)      | 0                |       |
| 501       | items.base.axe           | Generic axe (base type icon)        | 0                |       |
| 502       | items.base.mace          | Generic mace (base type icon)       | 0                |       |
| 503       | items.base.bow           | Generic bow (base type icon)        | 0                |       |
| 504       | items.base.staff         | Generic staff (base type icon)      | 0                |       |
| 505       | items.base.dagger        | Generic dagger (base type icon)     | 0                |       |
| 506       | items.base.shield        | Generic shield (base type icon)     | 0                |       |
| 507       | items.base.helm          | Generic helm (base type icon)       | 0                |       |
| 508       | items.base.armor         | Generic body armor (base type icon) | 0                |       |
| 509       | items.base.gloves        | Generic gauntlets (base type icon)  | 0                |       |
| 510       | items.base.belt          | Generic belt (base type icon)       | 0                |       |
| 511       | items.base.boots         | Generic boots (base type icon)      | 0                |       |
| 512       | items.base.ring          | Generic ring (base type icon)       | 0                |       |
| 513       | items.base.amulet        | Generic amulet (base type icon)     | 0                |       |
| 514       | items.base.potion-health | Health potion (red)                 | 0                |       |
| 515       | items.base.potion-mana   | Mana potion (blue)                  | 0                |       |
| 516       | items.base.rune          | Generic rune stone                  | 0                |       |
| 517       | items.base.gem           | Generic gem                         | 0                |       |
| 518       | items.base.scroll        | Generic scroll                      | 0                |       |
| 100       | items.rune.el            | El Rune                             | 0                |       |
| 200       | items.gem.topaz-flawless | Flawless Topaz                      | 0                |       |

## ui-background (seed-base 400000)

| subjectId | id                  | subject                | accepted variant | notes |
|----------:|---------------------|------------------------|------------------|-------|
| 1         | ui.title-screen     | Main title backdrop    | 0                |       |
| 2         | ui.character-select | Character select bg    | 0                |       |
| 3         | ui.inventory        | Inventory backdrop     | 0                |       |

## zone-art (seed-base 500000)

| subjectId | id                              | subject              | accepted variant | notes |
|----------:|---------------------------------|----------------------|------------------|-------|
| 1         | zones.act1.rogue-encampment     | Rogue Encampment     | 0                |       |
| 2         | zones.act1.blood-moor           | Blood Moor           | 0                |       |
| 100       | zones.act2.lut-gholein          | Lut Gholein          | 0                |       |
| 200       | zones.act3.kurast-docks         | Kurast Docks         | 0                |       |
| 300       | zones.act4.pandemonium-fortress | Pandemonium Fortress | 0                |       |
| 400       | zones.act5.harrogath            | Harrogath            | 0                |       |
