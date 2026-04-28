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
| 2         | monsters.act1.fallen-shaman | Fallen Shaman               | 0                |       |
| 100       | bosses.act1.andariel        | Andariel, Maiden of Anguish | 0                |       |
| 200       | bosses.act2.duriel          | Duriel, Lord of Pain        | 0                |       |
| 300       | bosses.act3.mephisto        | Mephisto, Lord of Hatred    | 0                |       |
| 400       | bosses.act4.diablo          | Diablo, Lord of Terror      | 0                |       |
| 500       | bosses.act5.baal            | Baal, Lord of Destruction   | 0                |       |

## item-icon (seed-base 300000)

| subjectId | id                       | subject        | accepted variant | notes |
|----------:|--------------------------|----------------|------------------|-------|
| 1         | items.unique.shako       | Shako          | 0                |       |
| 2         | items.unique.enigma      | Enigma         | 0                |       |
| 100       | items.rune.el            | El Rune        | 0                |       |
| 200       | items.gem.topaz-flawless | Flawless Topaz | 0                |       |

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
