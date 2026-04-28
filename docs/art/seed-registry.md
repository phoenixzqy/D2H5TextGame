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

## monster (seed-base 200000)

| subjectId | id                          | subject                     | accepted variant | notes |
|----------:|-----------------------------|-----------------------------|------------------|-------|
| 1         | monsters.act1.fallen        | Fallen                      | 0                |       |
| 2         | monsters.act1.fallen-shaman | Fallen Shaman (Carver)      | 0                |       |
| 3         | monsters.act1.quill-rat     | Quill Rat                   | 0                |       |
| 4         | monsters.act1.zombie        | Zombie                      | 0                |       |
| 5         | monsters.act1.bone-warrior  | Skeleton Warrior            | 0                |       |
| 6         | monsters.act1.dark-stalker  | Corrupt Rogue (Dark Stalker)| 0                |       |
| 100       | bosses.act1.andariel        | Andariel, Maiden of Anguish | 0                |       |
| 101       | bosses.act1.blood-raven     | Blood Raven, fallen Rogue captain | 0          |       |
| 200       | bosses.act2.duriel          | Duriel, Lord of Pain        | 0                |       |
| 300       | bosses.act3.mephisto        | Mephisto, Lord of Hatred    | 0                |       |
| 400       | bosses.act4.diablo          | Diablo, Lord of Terror      | 0                |       |
| 500       | bosses.act5.baal            | Baal, Lord of Destruction   | 0                |       |

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
