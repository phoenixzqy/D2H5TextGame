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

### item-icon — new uniques (subjectIds 1000+)

| subjectId | id | subject | accepted variant | notes |
|----------:|----|---------|------------------|-------|
| 1000 | items.unique.pelta-lunata | Pelta Lunata | 0 | auto-allocated |
| 1001 | items.unique.rixots-keen | Rixot's Keen | 0 | auto-allocated |
| 1002 | items.unique.biggin-bonnet | Biggin's Bonnet | 0 | auto-allocated |
| 1003 | items.unique.face-of-horror | The Face of Horror | 0 | auto-allocated |
| 1004 | items.unique.hotspur | Hotspur | 0 | auto-allocated |
| 1005 | items.unique.the-gnasher | The Gnasher | 0 | auto-allocated |
| 1006 | items.unique.hand-of-broc | The Hand of Broc | 0 | auto-allocated |
| 1007 | items.unique.torch-of-iros | Torch of Iro | 0 | auto-allocated |
| 1008 | items.unique.blood-crescent | Blood Crescent | 0 | auto-allocated |
| 1009 | items.unique.felloak | Felloak | 0 | auto-allocated |
| 1010 | items.unique.greyform | Greyform | 0 | auto-allocated |
| 1011 | items.unique.lenymo | Lenymo | 0 | auto-allocated |
| 1012 | items.unique.pluckeye | Pluckeye | 0 | auto-allocated |
| 1013 | items.unique.axe-of-fechmar | Axe of Fechmar | 0 | auto-allocated |
| 1014 | items.unique.coif-of-glory | Coif of Glory | 0 | auto-allocated |
| 1015 | items.unique.deathspade | Deathspade | 0 | auto-allocated |
| 1016 | items.unique.gorefoot | Gorefoot | 0 | auto-allocated |
| 1017 | items.unique.skewer-of-krintiz | Skewer of Krintiz | 0 | auto-allocated |
| 1018 | items.unique.nagelring | Nagelring | 0 | auto-allocated |
| 1019 | items.unique.stoutnail | Stoutnail | 0 | auto-allocated |
| 1020 | items.unique.blinkbat-form | Blinkbat's Form | 0 | auto-allocated |
| 1021 | items.unique.bloodfist | Bloodfist | 0 | auto-allocated |
| 1022 | items.unique.duskdeep | Duskdeep | 0 | auto-allocated |
| 1023 | items.unique.shadowfang | Shadowfang | 0 | auto-allocated |
| 1024 | items.unique.snakecord | Snakecord | 0 | auto-allocated |
| 1025 | items.unique.gleamscythe | Gleamscythe | 0 | auto-allocated |
| 1026 | items.unique.witherstring | Witherstring | 0 | auto-allocated |
| 1027 | items.unique.crushflange | Crushflange | 0 | auto-allocated |
| 1028 | items.unique.howltusk | Howltusk | 0 | auto-allocated |
| 1029 | items.unique.the-centurion | The Centurion | 0 | auto-allocated |
| 1030 | items.unique.umbral-disk | Umbral Disk | 0 | auto-allocated |
| 1031 | items.unique.bloodrise | Bloodrise | 0 | auto-allocated |
| 1032 | items.unique.chance-guards | Chance Guards | 0 | auto-allocated |
| 1033 | items.unique.griswold-edge | Griswold's Edge | 0 | auto-allocated |
| 1034 | items.unique.manald-heal | Manald Heal | 0 | auto-allocated |
| 1035 | items.unique.rasperose | Raven Claw | 0 | auto-allocated |
| 1036 | items.unique.tarnhelm | Tarnhelm | 0 | auto-allocated |
| 1037 | items.unique.eye-of-etlich | The Eye of Etlich | 0 | auto-allocated |
| 1038 | items.unique.treads-of-cthon | Treads of Cthon | 0 | auto-allocated |
| 1039 | items.unique.bloodrise-2 | Bloodrise (Mace) | 0 | auto-allocated |
| 1040 | items.unique.nokozan-relic | Nokozan Relic | 0 | auto-allocated |
| 1041 | items.unique.twitchthroe | Twitchthroe | 0 | auto-allocated |
| 1042 | items.unique.lance-guard | Lance Guard | 0 | auto-allocated |
| 1043 | items.unique.rusthandle-scepter | Rusty Scepter | 0 | auto-allocated |
| 1044 | items.unique.the-dragon-chang | The Dragon Chang | 0 | auto-allocated |
| 1045 | items.unique.doomslinger | Doomslinger | 0 | auto-allocated |
| 1046 | items.unique.maelstrom | Maelstrom | 0 | auto-allocated |
| 1047 | items.unique.hawkmail | Hawkmail | 0 | auto-allocated |
| 1048 | items.unique.darkglow | Darkglow | 0 | auto-allocated |
| 1049 | items.unique.nightsmoke | Nightsmoke | 0 | auto-allocated |
| 1050 | items.unique.rogue-bow | Rogue's Bow | 0 | auto-allocated |
| 1051 | items.unique.wall-of-eyeless | Wall of the Eyeless | 0 | auto-allocated |
| 1052 | items.unique.stormchaser | Stormchaser | 0 | auto-allocated |
| 1053 | items.unique.the-general-tan-do-li-ga | The General's Tan Do Li Ga | 0 | auto-allocated |
| 1054 | items.unique.the-general-mace | The Generals' Mace | 0 | auto-allocated |
| 1055 | items.unique.wormskull | Wormskull | 0 | auto-allocated |
| 1056 | items.unique.goblin-toe | Goblin Toe | 0 | auto-allocated |
| 1057 | items.unique.iceblink | Iceblink | 0 | auto-allocated |
| 1058 | items.unique.soulflay | Soulflay | 0 | auto-allocated |
| 1059 | items.unique.knell-striker-scepter | Striking Sigil | 0 | auto-allocated |
| 1060 | items.unique.magefist | Magefist | 0 | auto-allocated |
| 1061 | items.unique.magefist-gauntlet | Magefist Gauntlet | 0 | auto-allocated |
| 1062 | items.unique.sparking-mail | Sparking Mail | 0 | auto-allocated |
| 1063 | items.unique.stormguild | Stormguild | 0 | auto-allocated |
| 1064 | items.unique.jade-tan-do | The Jade Tan Do | 0 | auto-allocated |
| 1065 | items.unique.heavenly-garb | Heavenly Garb | 0 | auto-allocated |
| 1066 | items.unique.gravenspine | Gravenspine | 0 | auto-allocated |
| 1067 | items.unique.hellplague | Hellplague | 0 | auto-allocated |
| 1068 | items.unique.razor-stitch | Razortail Pike | 0 | auto-allocated |
| 1069 | items.unique.spectral-shard | Spectral Shard | 0 | auto-allocated |
| 1070 | items.unique.stormstrike | Stormstrike | 0 | auto-allocated |
| 1071 | items.unique.mahim-oak-curio | The Mahim-Oak Curio | 0 | auto-allocated |
| 1072 | items.unique.undead-crown | Undead Crown | 0 | auto-allocated |
| 1073 | items.unique.venom-ward | Venom Ward | 0 | auto-allocated |
| 1074 | items.unique.wizendraw | Wizendraw | 0 | auto-allocated |
| 1075 | items.unique.black-cleft | Black Cleft | 0 | auto-allocated |
| 1076 | items.unique.goldwrap | Goldwrap | 0 | auto-allocated |
| 1077 | items.unique.hellclap | Hellclap | 0 | auto-allocated |
| 1078 | items.unique.ichorsting | Ichorsting | 0 | auto-allocated |
| 1079 | items.unique.ring-of-the-leech | Ring of the Leech | 0 | auto-allocated |
| 1080 | items.unique.boneflesh | Boneflesh | 0 | auto-allocated |
| 1081 | items.unique.ironstone | Ironstone | 0 | auto-allocated |
| 1082 | items.unique.peasant-crown | Peasant Crown | 0 | auto-allocated |
| 1083 | items.unique.silks-of-the-victor | Silks of the Victor | 0 | auto-allocated |
| 1084 | items.unique.the-spirit-shroud | The Spirit Shroud | 0 | auto-allocated |
| 1085 | items.unique.visceratuant | Visceratuant | 0 | auto-allocated |
| 1086 | items.unique.frostburn | Frostburn | 0 | auto-allocated |
| 1087 | items.unique.rattlecage | Rattlecage | 0 | auto-allocated |
| 1088 | items.unique.skin-of-vipermagi | Skin of the Vipermagi | 0 | auto-allocated |
| 1089 | items.unique.string-of-ears | String of Ears | 0 | auto-allocated |
| 1090 | items.unique.tearhaunch | Tearhaunch | 0 | auto-allocated |
| 1091 | items.unique.the-fetid-sprinkler | The Fetid Sprinkler | 0 | auto-allocated |
| 1092 | items.unique.venom-grip | Venom Grip | 0 | auto-allocated |
| 1093 | items.unique.whistan-guard | Whitstan's Guard | 0 | auto-allocated |
| 1094 | items.unique.ume-lament | Ume's Lament | 0 | auto-allocated |
| 1095 | items.unique.culwens-point | Culwen's Point | 0 | auto-allocated |
| 1096 | items.unique.moser-circle | Moser's Blessed Circle | 0 | auto-allocated |
| 1097 | items.unique.ribcracker | Ribcracker | 0 | auto-allocated |
| 1098 | items.unique.riphook | Riphook | 0 | auto-allocated |
| 1099 | items.unique.rockfleece | Rockfleece | 0 | auto-allocated |
| 1100 | items.unique.rockstopper | Rockstopper | 0 | auto-allocated |
| 1101 | items.unique.skin-of-flayed-one | Skin of the Flayed One | 0 | auto-allocated |
| 1102 | items.unique.the-impaler | The Impaler | 0 | auto-allocated |
| 1103 | items.unique.dark-clan-crusher | Dark Clan Crusher | 0 | auto-allocated |
| 1104 | items.unique.kinemil-awl | Kinemil's Awl | 0 | auto-allocated |
| 1105 | items.unique.razortail | Razortail | 0 | auto-allocated |
| 1106 | items.unique.iron-pelt | Iron Pelt | 0 | auto-allocated |
| 1107 | items.unique.kelpie-snare | Kelpie Snare | 0 | auto-allocated |
| 1108 | items.unique.razor-tine | Razor's Tine | 0 | auto-allocated |
| 1109 | items.unique.the-nokozan | The Nokozan | 0 | auto-allocated |
| 1110 | items.unique.blacktongue | Blacktongue | 0 | auto-allocated |
| 1111 | items.unique.blade-of-ali-baba | Blade of Ali Baba | 0 | auto-allocated |
| 1112 | items.unique.blastbark | Blastbark | 0 | auto-allocated |
| 1113 | items.unique.greaves-of-march | Greaves of March | 0 | auto-allocated |
| 1114 | items.unique.langer-briser | Langer Briser | 0 | auto-allocated |
| 1115 | items.unique.skystrike | Skystrike | 0 | auto-allocated |
| 1116 | items.unique.stealskull | Stealskull | 0 | auto-allocated |
| 1117 | items.unique.the-diggler | The Diggler | 0 | auto-allocated |
| 1118 | items.unique.crow-caw | Crow Caw | 0 | auto-allocated |
| 1119 | items.unique.gloom-trap | Gloom's Trap | 0 | auto-allocated |
| 1120 | items.unique.goldskin | Goldskin | 0 | auto-allocated |
| 1121 | items.unique.knell-striker | Knell Striker | 0 | auto-allocated |
| 1122 | items.unique.ripsaw | Ripsaw | 0 | auto-allocated |
| 1123 | items.unique.the-meatscraper | The Meat Scraper | 0 | auto-allocated |
| 1124 | items.unique.coldkill | Coldkill | 0 | auto-allocated |
| 1125 | items.unique.hone-sundan | Hone Sundan | 0 | auto-allocated |
| 1126 | items.unique.saracen-chance | Saracen's Chance | 0 | auto-allocated |
| 1127 | items.unique.blackleach-staff | Blackleach (Staff) | 0 | auto-allocated |
| 1128 | items.unique.blackleach-blade | Blackleach Blade | 0 | auto-allocated |
| 1129 | items.unique.darksight-helm | Darksight Helm | 0 | auto-allocated |
| 1130 | items.unique.gravepalm | Gravepalm | 0 | auto-allocated |
| 1131 | items.unique.shaftstop | Shaftstop | 0 | auto-allocated |
| 1132 | items.unique.the-vile-husk | The Vile Husk | 0 | auto-allocated |
| 1133 | items.unique.bladebuckle | Bladebuckle | 0 | auto-allocated |
| 1134 | items.unique.butcher-pupil | Butcher's Pupil | 0 | auto-allocated |
| 1135 | items.unique.the-meat-scraper-2 | The Meat Scraper (Pole) | 0 | auto-allocated |
| 1136 | items.unique.the-patriarch | The Patriarch | 0 | auto-allocated |
| 1137 | items.unique.the-scalper | The Scalper | 0 | auto-allocated |
| 1138 | items.unique.spirit-ward | Spirit Ward | 0 | auto-allocated |
| 1139 | items.unique.the-atlantean | The Atlantean Sword | 0 | auto-allocated |
| 1140 | items.unique.blackhorn-face | Blackhorn's Face | 0 | auto-allocated |
| 1141 | items.unique.duriel-shell | Duriel's Shell | 0 | auto-allocated |
| 1142 | items.unique.lidless-wall | Lidless Wall | 0 | auto-allocated |
| 1143 | items.unique.rusthandle | Rusthandle | 0 | auto-allocated |
| 1144 | items.unique.spire-of-honor | Spire of Honor | 0 | auto-allocated |
| 1145 | items.unique.vampiregaze | Vampire Gaze | 0 | auto-allocated |
| 1146 | items.unique.arreat-face | Arreat's Face | 0 | auto-allocated |
| 1147 | items.unique.bartuc-cut-throat | Bartuc's Cut-Throat | 0 | auto-allocated |
| 1148 | items.unique.jalal-mane | Jalal's Mane | 0 | auto-allocated |
| 1149 | items.unique.lavagout | Lava Gout | 0 | auto-allocated |
| 1150 | items.unique.lycanders-aim | Lycander's Aim | 0 | auto-allocated |
| 1151 | items.unique.lycanders-flank | Lycander's Flank | 0 | auto-allocated |
| 1152 | items.unique.steelclash | Steelclash | 0 | auto-allocated |
| 1153 | items.unique.oculus | The Oculus | 0 | auto-allocated |
| 1154 | items.unique.the-oculus-orb | The Oculus (Orb) | 0 | auto-allocated |
| 1155 | items.unique.titan-revenge | Titan's Revenge | 0 | auto-allocated |
| 1156 | items.unique.war-traveler | War Traveler | 0 | auto-allocated |
| 1157 | items.unique.earth-shaker | Earth Shaker | 0 | auto-allocated |
| 1158 | items.unique.the-collector | The Collector | 0 | auto-allocated |
| 1159 | items.unique.gerke-sanctuary | Gerke's Sanctuary | 0 | auto-allocated |
| 1160 | items.unique.valkyrie-wing | Valkyrie Wing | 0 | auto-allocated |
| 1161 | items.unique.bverrit-keep | Bverrit Keep | 0 | auto-allocated |
| 1162 | items.unique.dwarf-star | Dwarf Star | 0 | auto-allocated |
| 1163 | items.unique.pus-spitter | Pus Spitter | 0 | auto-allocated |
| 1164 | items.unique.raven-frost | Raven Frost | 0 | auto-allocated |
| 1165 | items.unique.goldstrike-arch | Goldstrike Arch | 0 | auto-allocated |
| 1166 | items.unique.blackhand-key | Blackhand Key | 0 | auto-allocated |
| 1167 | items.unique.ghoulhide | Ghoulhide | 0 | auto-allocated |
| 1168 | items.unique.gore-riders | Gore Rider | 0 | auto-allocated |
| 1169 | items.unique.immortal-king-helm-uniq | Immortal King Cap (replica) | 0 | auto-allocated |
| 1170 | items.unique.kuko-shakaku | Kuko Shakaku | 0 | auto-allocated |
| 1171 | items.unique.thundergods-vigor | Thundergods Vigor | 0 | auto-allocated |
| 1172 | items.unique.soul-drainer | Soul Drainer | 0 | auto-allocated |
| 1173 | items.unique.crown-of-thieves | Crown of Thieves | 0 | auto-allocated |
| 1174 | items.unique.demon-machine | Demon Machine | 0 | auto-allocated |
| 1175 | items.unique.frostburn-gauntlet | Frostburn Gauntlet | 0 | auto-allocated |
| 1176 | items.unique.infernostride | Infernostride | 0 | auto-allocated |
| 1177 | items.unique.islestrike | Islestrike | 0 | auto-allocated |
| 1178 | items.unique.spirit-forge | Spirit Forge | 0 | auto-allocated |
| 1179 | items.unique.waterwalk | Waterwalk | 0 | auto-allocated |
| 1180 | items.unique.crainte-vomir | Crainte Vomir | 0 | auto-allocated |
| 1181 | items.unique.crescent-moon | Crescent Moon | 0 | auto-allocated |
| 1182 | items.unique.hellplague-greater | Hellplague (Greater) | 0 | auto-allocated |
| 1183 | items.unique.homunculus | Homunculus | 0 | auto-allocated |
| 1184 | items.unique.homunculus-helm | Homunculus (Head) | 0 | auto-allocated |
| 1185 | items.unique.pierre-tombale-couant | Pierre Tombale Couant | 0 | auto-allocated |
| 1186 | items.unique.silkweave | Silkweave | 0 | auto-allocated |
| 1187 | items.unique.stormeye | Stormeye | 0 | auto-allocated |
| 1188 | items.unique.atlantean | The Atlantean | 0 | auto-allocated |
| 1189 | items.unique.cat-eye | The Cat's Eye | 0 | auto-allocated |
| 1190 | items.unique.woestave | Woestave | 0 | auto-allocated |
| 1191 | items.unique.nosferatu-coil | Nosferatu's Coil | 0 | auto-allocated |
| 1192 | items.unique.que-hegan-wisdom | Que-Hegans Wisdom | 0 | auto-allocated |
| 1193 | items.unique.black-hades | Black Hades | 0 | auto-allocated |
| 1194 | items.unique.hexfire | Hexfire | 0 | auto-allocated |
| 1195 | items.unique.stoneraven | Stoneraven | 0 | auto-allocated |
| 1196 | items.unique.the-battlebranch | The Battlebranch | 0 | auto-allocated |
| 1197 | items.unique.veil-of-steel | Veil of Steel | 0 | auto-allocated |
| 1198 | items.unique.frostwind | Frostwind | 0 | auto-allocated |
| 1199 | items.unique.bing-sz-wang | Bing Sz Wang | 0 | auto-allocated |
| 1200 | items.unique.buriza-do-kyanon-cb | Buriza-Do Kyanon (Crossbow) | 0 | auto-allocated |
| 1201 | items.unique.corpsemourn | Corpsemourn | 0 | auto-allocated |
| 1202 | items.unique.endlesshail | Endlesshail | 0 | auto-allocated |
| 1203 | items.unique.gore-burnt-skull | Goreburnt Skull | 0 | auto-allocated |
| 1204 | items.unique.snowclash | Snowclash | 0 | auto-allocated |
| 1205 | items.unique.string-of-ears-greater | String of Ears (Greater) | 0 | auto-allocated |
| 1206 | items.unique.tiamat-rebuke | Tiamat's Rebuke | 0 | auto-allocated |
| 1207 | items.unique.blackhorn-face-2 | Blackhorn's Face (Greater) | 0 | auto-allocated |
| 1208 | items.unique.homunculus-orb | Homunculus (Orb) | 0 | auto-allocated |
| 1209 | items.unique.pompe-wrath | Pompeii's Wrath | 0 | auto-allocated |
| 1210 | items.unique.the-chieftain | The Chieftain | 0 | auto-allocated |
| 1211 | items.unique.steel-driver | Steeldriver | 0 | auto-allocated |
| 1212 | items.unique.bul-kathos-wedding-band | Bul-Kathos' Wedding Band | 0 | auto-allocated |
| 1213 | items.unique.guardian-naga | Guardian Naga | 0 | auto-allocated |
| 1214 | items.unique.shadow-killer | Shadow Killer | 0 | auto-allocated |
| 1215 | items.unique.spike-thorn | Spike Thorn | 0 | auto-allocated |
| 1216 | items.unique.stormlash | Stormlash | 0 | auto-allocated |
| 1217 | items.unique.athulua-rule | Athulua's Rule | 0 | auto-allocated |
| 1218 | items.unique.atmas-scarab | Atmas Scarab | 0 | auto-allocated |
| 1219 | items.unique.carrion-wind | Carrion Wind | 0 | auto-allocated |
| 1220 | items.unique.giant-skull | Giant Skull | 0 | auto-allocated |
| 1221 | items.unique.the-vile-husk-armor | Husk of Bones | 0 | auto-allocated |
| 1222 | items.unique.radament-sphere | Radament's Sphere | 0 | auto-allocated |
| 1223 | items.unique.suicide-branch | Suicide Branch | 0 | auto-allocated |
| 1224 | items.unique.the-vile-husk-2 | The Vile Husk II | 0 | auto-allocated |
| 1225 | items.unique.blackoak-shield | Blackoak Shield | 0 | auto-allocated |
| 1226 | items.unique.heaven-light | Heaven's Light | 0 | auto-allocated |
| 1227 | items.unique.hellmouth | Hellmouth | 0 | auto-allocated |
| 1228 | items.unique.vampire-gaze-greater | Vampire Gaze (Greater) | 0 | auto-allocated |
| 1229 | items.unique.firelizard-talon | Firelizard's Talons | 0 | auto-allocated |
| 1230 | items.unique.steel-shade | Steel Shade | 0 | auto-allocated |
| 1231 | items.unique.steelshade | Steelshade | 0 | auto-allocated |
| 1232 | items.unique.the-redeemer | The Redeemer | 0 | auto-allocated |
| 1233 | items.unique.boneshade | Boneshade | 0 | auto-allocated |
| 1234 | items.unique.demon-limb | Demon Limb | 0 | auto-allocated |
| 1235 | items.unique.verdungos-hearty | Verdungos Hearty Cord | 0 | auto-allocated |
| 1236 | items.unique.bonehew | Bonehew | 0 | auto-allocated |
| 1237 | items.unique.cure-all | Cure-All | 0 | auto-allocated |
| 1238 | items.unique.sandstorm-trek | Sandstorm Trek | 0 | auto-allocated |
| 1239 | items.unique.warlord-trust | Warlord's Trust | 0 | auto-allocated |
| 1240 | items.unique.carin-shard | Carin Shard | 0 | auto-allocated |
| 1241 | items.unique.chains-of-honor-armor | Chains of Honor | 0 | auto-allocated |
| 1242 | items.unique.crown-of-ages | Crown of Ages | 0 | auto-allocated |
| 1243 | items.unique.djinn-slayer | Djinn Slayer | 0 | auto-allocated |
| 1244 | items.unique.griffons-eye | Griffons Eye | 0 | auto-allocated |
| 1245 | items.unique.griffons-strike | Griffons Strike | 0 | auto-allocated |
| 1246 | items.unique.highlords-wrath | Highlords Wrath | 0 | auto-allocated |
| 1247 | items.unique.leviathan | Leviathan | 0 | auto-allocated |
| 1248 | items.unique.seraphs-hymn | Seraphs Hymn | 0 | auto-allocated |
| 1249 | items.unique.steel-carapace | Steel Carapace | 0 | auto-allocated |
| 1250 | items.unique.steel-pillar | Steel Pillar | 0 | auto-allocated |
| 1251 | items.unique.rising-sun | The Rising Sun | 0 | auto-allocated |
| 1252 | items.unique.widowmaker | Widowmaker | 0 | auto-allocated |
| 1253 | items.unique.astreon-iron-ward | Astreon's Iron Ward | 0 | auto-allocated |
| 1254 | items.unique.death-web | Death's Web | 0 | auto-allocated |
| 1255 | items.unique.hellslayer | Hellslayer | 0 | auto-allocated |
| 1256 | items.unique.jade-talon | Jade Talon | 0 | auto-allocated |
| 1257 | items.unique.marrowwalk | Marrowwalk | 0 | auto-allocated |
| 1258 | items.unique.cerebus-bite | Cerebus' Bite | 0 | auto-allocated |
| 1259 | items.unique.darkforce-spawn | Darkforce Spawn | 0 | auto-allocated |
| 1260 | items.unique.darkforce-spawn-shield | Darkforce Spawn (Shield) | 0 | auto-allocated |
| 1261 | items.unique.demonhorn-edge | Demonhorn's Edge | 0 | auto-allocated |
| 1262 | items.unique.dragonscale | Dragonscale | 0 | auto-allocated |
| 1263 | items.unique.kerke-sanctuary | Kerke's Sanctuary | 0 | auto-allocated |
| 1264 | items.unique.mara-kaleidoscope | Maras Kaleidoscope | 0 | auto-allocated |
| 1265 | items.unique.nightwing-veil | Nightwing's Veil | 0 | auto-allocated |
| 1266 | items.unique.spellsteel | Spellsteel | 0 | auto-allocated |
| 1267 | items.unique.lacerator | Lacerator | 0 | auto-allocated |
| 1268 | items.unique.nords-tenderizer | Nord's Tenderizer | 0 | auto-allocated |
| 1269 | items.unique.plague-bearer | Plague Bearer | 0 | auto-allocated |
| 1270 | items.unique.blackhand-key-2 | Blackhand Key (Greater) | 0 | auto-allocated |
| 1271 | items.unique.breath-of-the-dying-uniq | Breath of the Dying | 0 | auto-allocated |
| 1272 | items.unique.doombringer | Doombringer | 0 | auto-allocated |
| 1273 | items.unique.eaglehorn | Eaglehorn | 0 | auto-allocated |
| 1274 | items.unique.earthshifter | Earthshifter | 0 | auto-allocated |
| 1275 | items.unique.rune-master | Rune Master | 0 | auto-allocated |
| 1276 | items.unique.thunderstroke | Thunderstroke | 0 | auto-allocated |
| 1277 | items.unique.eschuta-temper | Eschuta's Temper | 0 | auto-allocated |
| 1278 | items.unique.steelrend | Steelrend | 0 | auto-allocated |
| 1279 | items.unique.stormrider | Stormrider | 0 | auto-allocated |
| 1280 | items.unique.stormspire | Stormspire | 0 | auto-allocated |
| 1281 | items.unique.the-grim-reaper | The Grim Reaper | 0 | auto-allocated |
| 1282 | items.unique.shadow-dancer | Shadow Dancer | 0 | auto-allocated |
| 1283 | items.unique.halaberd-reign | Halaberd's Reign | 0 | auto-allocated |
| 1284 | items.unique.death-fathom | Death's Fathom | 0 | auto-allocated |
| 1285 | items.unique.stormshield | Stormshield | 0 | auto-allocated |
| 1286 | items.unique.the-stone-crusher | The Stone Crusher | 0 | auto-allocated |
| 1287 | items.unique.ondal-wisdom | Ondal's Wisdom | 0 | auto-allocated |
| 1288 | items.unique.ravenlore | Ravenlore | 0 | auto-allocated |
| 1289 | items.unique.templar-might | Templar's Might | 0 | auto-allocated |
| 1290 | items.unique.boneslayer-blade | Boneslayer Blade | 0 | auto-allocated |
| 1291 | items.unique.head-hunter-glory | Head Hunter's Glory | 0 | auto-allocated |
| 1292 | items.unique.ormus-robes | Ormus' Robes | 0 | auto-allocated |
| 1293 | items.unique.spirit-keeper | Spirit Keeper | 0 | auto-allocated |
| 1294 | items.unique.reaper-toll | The Reaper's Toll | 0 | auto-allocated |
| 1295 | items.unique.dracs-grasp | Draculs Grasp | 0 | auto-allocated |
| 1296 | items.unique.hellrack | Hellrack | 0 | auto-allocated |
| 1297 | items.unique.wisp-projector | Wisp Projector | 0 | auto-allocated |
| 1298 | items.unique.alma-negra | Alma Negra | 0 | auto-allocated |
| 1299 | items.unique.kira-guardian | Kira's Guardian | 0 | auto-allocated |
| 1300 | items.unique.arreats-face-uniq | Arreat's Face (Greater) | 0 | auto-allocated |
| 1301 | items.unique.knell-striker-2 | Knell Striker (Greater) | 0 | auto-allocated |
| 1302 | items.unique.ondal-almighty | Ondal's Almighty | 0 | auto-allocated |
| 1303 | items.unique.boneflame-shield | Boneflame Shield | 0 | auto-allocated |
| 1304 | items.unique.hand-of-blessed-light | Hand of Blessed Light | 0 | auto-allocated |
| 1305 | items.unique.schaefer-hammer | Schaefer's Hammer | 0 | auto-allocated |
| 1306 | items.unique.wolfhowl | Wolfhowl | 0 | auto-allocated |
| 1307 | items.unique.arachnids-mesh | Arachnid Mesh | 0 | auto-allocated |
| 1308 | items.unique.the-minotaur | The Minotaur | 0 | auto-allocated |
| 1309 | items.unique.baranar-star | Baranar's Star | 0 | auto-allocated |
| 1310 | items.unique.metalgrid | Metalgrid | 0 | auto-allocated |
| 1311 | items.unique.demonhorn-edge-2 | Demonhorn's Edge (Greater) | 0 | auto-allocated |
| 1312 | items.unique.halaberd-reign-2 | Halaberd's Reign (Greater) | 0 | auto-allocated |
| 1313 | items.unique.messerschmidt-reaver | Messerschmidt's Reaver | 0 | auto-allocated |
| 1314 | items.unique.tomb-reaver | Tomb Reaver | 0 | auto-allocated |
| 1315 | items.unique.tyraels-might | Tyraels Might | 0 | auto-allocated |
| 1316 | items.unique.arkaines-valor | Arkaines Valor | 0 | auto-allocated |
| 1317 | items.unique.azurewrath | Azurewrath | 0 | auto-allocated |
| 1318 | items.unique.ethereal-edge | Ethereal Edge | 0 | auto-allocated |
| 1319 | items.unique.the-gladiator-bane | The Gladiator's Bane | 0 | auto-allocated |
| 1320 | items.unique.the-cranium-basher | The Cranium Basher | 0 | auto-allocated |
| 1321 | items.unique.the-cranium-basher-greater | The Cranium Basher (Greater) | 0 | auto-allocated |

### monster — new act1/act2 archetypes (subjectIds 1000+)

| subjectId | id | subject | accepted variant | notes |
|----------:|----|---------|------------------|-------|
| 1000 | monsters.act1.corpsefire | Corpsefire | 0 | auto-allocated |
| 1001 | monsters.act1.spike-fiend | Spike Fiend | 0 | auto-allocated |
| 1002 | monsters.act1.dark-one | Dark One | 0 | auto-allocated |
| 1003 | monsters.act1.carver | Carver | 0 | auto-allocated |
| 1004 | monsters.act1.misshapen | Misshapen | 0 | auto-allocated |
| 1005 | monsters.act1.disfigured | Disfigured | 0 | auto-allocated |
| 1006 | monsters.act1.devilkin | Devilkin | 0 | auto-allocated |
| 1007 | monsters.act1.carver-shaman | Carver Shaman | 0 | auto-allocated |
| 1008 | monsters.act1.devilkin-shaman | Devilkin Shaman | 0 | auto-allocated |
| 1009 | monsters.act1.bishibosh | Bishibosh | 0 | auto-allocated |
| 1010 | monsters.act1.rakanishu | Rakanishu | 0 | auto-allocated |
| 1011 | monsters.act1.tainted | Tainted | 0 | auto-allocated |
| 1012 | monsters.act1.afflicted | Afflicted | 0 | auto-allocated |
| 1013 | monsters.act1.hungry-dead | Hungry Dead | 0 | auto-allocated |
| 1014 | monsters.act1.ghoul | Ghoul | 0 | auto-allocated |
| 1015 | monsters.act1.ghost | Ghost | 0 | auto-allocated |
| 1016 | monsters.act1.wraith | Wraith | 0 | auto-allocated |
| 1017 | monsters.act1.dark-archer | Dark Archer | 0 | auto-allocated |
| 1018 | monsters.act1.dark-ranger | Dark Ranger | 0 | auto-allocated |
| 1019 | monsters.act1.vile-hunter | Vile Hunter | 0 | auto-allocated |
| 1020 | monsters.act1.coldcrow | Coldcrow | 0 | auto-allocated |
| 1021 | monsters.act1.brute | Brute | 0 | auto-allocated |
| 1022 | monsters.act1.yeti | Yeti | 0 | auto-allocated |
| 1023 | monsters.act1.crusher | Crusher | 0 | auto-allocated |
| 1024 | monsters.act1.treehead-woodfist | Treehead Woodfist | 0 | auto-allocated |
| 1025 | monsters.act1.pitspawn-fouldog | Pitspawn Fouldog | 0 | auto-allocated |
| 1026 | monsters.act1.returned | Returned | 0 | auto-allocated |
| 1027 | monsters.act1.returned-archer | Returned Archer | 0 | auto-allocated |
| 1028 | monsters.act1.burning-dead-mage | Burning Dead Mage | 0 | auto-allocated |
| 1029 | monsters.act1.bone-ash | Bone Ash | 0 | auto-allocated |
| 1030 | monsters.act1.the-countess | The Countess | 0 | auto-allocated |
| 1031 | monsters.act1.griswold | Griswold | 0 | auto-allocated |
| 1032 | monsters.act1.the-smith | The Smith | 0 | auto-allocated |
| 1033 | monsters.act1.blood-raven | Blood Raven | 0 | auto-allocated |
| 1034 | monsters.act1.andariel | Andariel, Maiden of Anguish | 0 | auto-allocated |
| 1035 | monsters.act2.marauder | Marauder | 0 | auto-allocated |
| 1036 | monsters.act2.invader | Invader | 0 | auto-allocated |
| 1037 | monsters.act2.infidel | Infidel | 0 | auto-allocated |
| 1038 | monsters.act2.fire-eye | Fire Eye | 0 | auto-allocated |
| 1039 | monsters.act2.sand-maggot | Sand Maggot | 0 | auto-allocated |
| 1040 | monsters.act2.sand-maggot-young | Sand Maggot Young | 0 | auto-allocated |
| 1041 | monsters.act2.rock-worm | Rock Worm | 0 | auto-allocated |
| 1042 | monsters.act2.devourer | Devourer | 0 | auto-allocated |
| 1043 | monsters.act2.coldworm-the-burrower | Coldworm the Burrower | 0 | auto-allocated |
| 1044 | monsters.act2.dune-beast | Dune Beast | 0 | auto-allocated |
| 1045 | monsters.act2.saber-cat | Saber Cat | 0 | auto-allocated |
| 1046 | monsters.act2.bloodhawk | Bloodhawk | 0 | auto-allocated |
| 1047 | monsters.act2.claw-viper | Claw Viper | 0 | auto-allocated |
| 1048 | monsters.act2.salamander | Salamander | 0 | auto-allocated |
| 1049 | monsters.act2.pit-viper | Pit Viper | 0 | auto-allocated |
| 1050 | monsters.act2.fangskin | Fangskin | 0 | auto-allocated |
| 1051 | monsters.act2.greater-mummy | Greater Mummy | 0 | auto-allocated |
| 1052 | monsters.act2.burning-dead-archer | Burning Dead Archer | 0 | auto-allocated |
| 1053 | monsters.act2.horadrim-ancient | Horadrim Ancient | 0 | auto-allocated |
| 1054 | monsters.act2.ancient-kaa | Ancient Kaa the Soulless | 0 | auto-allocated |
| 1055 | monsters.act2.radament | Radament | 0 | auto-allocated |
| 1056 | monsters.act2.horror-mage | Horror Mage | 0 | auto-allocated |
| 1057 | monsters.act2.cantor | Cantor | 0 | auto-allocated |
| 1058 | monsters.act2.dark-elder | Dark Elder | 0 | auto-allocated |
| 1059 | monsters.act2.scarab | Scarab | 0 | auto-allocated |
| 1060 | monsters.act2.steel-scarab | Steel Scarab | 0 | auto-allocated |
| 1061 | monsters.act2.plague-bug | Plague Bug | 0 | auto-allocated |
| 1062 | monsters.act2.death-beetle | Death Beetle | 0 | auto-allocated |
| 1063 | monsters.act2.beetleburst | Beetleburst | 0 | auto-allocated |
| 1064 | monsters.act2.sand-leaper | Sand Leaper | 0 | auto-allocated |
| 1065 | monsters.act2.cave-leaper | Cave Leaper | 0 | auto-allocated |
| 1066 | monsters.act2.vulture-demon | Vulture Demon | 0 | auto-allocated |
| 1067 | monsters.act2.undead-scavenger | Undead Scavenger | 0 | auto-allocated |
| 1068 | monsters.act2.undead-flayer | Undead Flayer | 0 | auto-allocated |
| 1069 | monsters.act2.the-summoner | The Summoner | 0 | auto-allocated |
| 1070 | monsters.act2.duriel | Duriel | 0 | auto-allocated |

## skill-icon (seed-base 600000)

Producer sign-off: approved for dedicated `skill-icon` style recovery and full 213-skill replacement production, 2026-05-01. Subject IDs are per playable-class skill within this category.

Planned subjectId ranges for full production:
- Amazon: 1-99
- Assassin: 101-199
- Barbarian: 201-299
- Druid: 301-399
- Necromancer: 401-499
- Paladin: 501-599
- Sorceress: 601-699

| subjectId | id | subject | accepted variant | notes |
|----------:|----|---------|------------------|-------|
| 1 | skills.amazon.magic-arrow | Magic Arrow | 1 | pilot accepted; data id `skills-amazon-magic-arrow`; full-production recovery allocated 2026-05-01; data id `skills-amazon-magic-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.magic-arrow.v1.png`; data id `skills-amazon-magic-arrow` |
| 2 | skills.amazon.multiple-shot | Multiple Shot | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-multiple-shot`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.multiple-shot.png`; data id `skills-amazon-multiple-shot` |
| 3 | skills.amazon.freezing-arrow | Freezing Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-freezing-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.freezing-arrow.png`; data id `skills-amazon-freezing-arrow` |
| 4 | skills.amazon.lightning-fury | Lightning Fury | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-lightning-fury`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.lightning-fury.png`; data id `skills-amazon-lightning-fury` |
| 5 | skills.amazon.plague-javelin | Plague Javelin | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-plague-javelin`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.plague-javelin.png`; data id `skills-amazon-plague-javelin` |
| 6 | skills.amazon.strafe | Strafe | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-strafe`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.strafe.png`; data id `skills-amazon-strafe` |
| 7 | skills.amazon.critical-strike | Critical Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-critical-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.critical-strike.png`; data id `skills-amazon-critical-strike` |
| 8 | skills.amazon.penetrate | Penetrate | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-penetrate`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.penetrate.png`; data id `skills-amazon-penetrate` |
| 9 | skills.amazon.dodge | Dodge | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-dodge`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.dodge.png`; data id `skills-amazon-dodge` |
| 10 | skills.amazon.valkyrie | Valkyrie | 1 | pilot accepted; data id `skills-amazon-valkyrie`; full-production recovery allocated 2026-05-01; data id `skills-amazon-valkyrie`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.valkyrie.v1.png`; data id `skills-amazon-valkyrie` |
| 11 | skills.amazon.jab | Jab | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-jab`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.jab.png`; data id `skills-amazon-jab` |
| 12 | skills.amazon.power-strike | Power Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-power-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.power-strike.png`; data id `skills-amazon-power-strike` |
| 13 | skills.amazon.poison-javelin | Poison Javelin | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-poison-javelin`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.poison-javelin.png`; data id `skills-amazon-poison-javelin` |
| 14 | skills.amazon.impale | Impale | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-impale`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.impale.png`; data id `skills-amazon-impale` |
| 15 | skills.amazon.lightning-bolt | Lightning Bolt | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-lightning-bolt`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.lightning-bolt.png`; data id `skills-amazon-lightning-bolt` |
| 16 | skills.amazon.charged-strike | Charged Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-charged-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.charged-strike.png`; data id `skills-amazon-charged-strike` |
| 17 | skills.amazon.fend | Fend | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-fend`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.fend.png`; data id `skills-amazon-fend` |
| 18 | skills.amazon.lightning-strike | Lightning Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-lightning-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.lightning-strike.png`; data id `skills-amazon-lightning-strike` |
| 19 | skills.amazon.inner-sight | Inner Sight | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-inner-sight`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.inner-sight.png`; data id `skills-amazon-inner-sight` |
| 20 | skills.amazon.slow-missiles | Slow Missiles | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-slow-missiles`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.slow-missiles.png`; data id `skills-amazon-slow-missiles` |
| 21 | skills.amazon.avoid | Avoid | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-avoid`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.avoid.png`; data id `skills-amazon-avoid` |
| 22 | skills.amazon.decoy | Decoy | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-decoy`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.decoy.png`; data id `skills-amazon-decoy` |
| 23 | skills.amazon.evade | Evade | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-evade`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.evade.png`; data id `skills-amazon-evade` |
| 24 | skills.amazon.pierce | Pierce | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-pierce`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.pierce.png`; data id `skills-amazon-pierce` |
| 25 | skills.amazon.fire-arrow | Fire Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-fire-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.fire-arrow.png`; data id `skills-amazon-fire-arrow` |
| 26 | skills.amazon.cold-arrow | Cold Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-cold-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.cold-arrow.png`; data id `skills-amazon-cold-arrow` |
| 27 | skills.amazon.exploding-arrow | Exploding Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-exploding-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.exploding-arrow.png`; data id `skills-amazon-exploding-arrow` |
| 28 | skills.amazon.ice-arrow | Ice Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-ice-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.ice-arrow.png`; data id `skills-amazon-ice-arrow` |
| 29 | skills.amazon.guided-arrow | Guided Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-guided-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.guided-arrow.png`; data id `skills-amazon-guided-arrow` |
| 30 | skills.amazon.immolation-arrow | Immolation Arrow | 0 | allocated for full-production skill-icon recovery; data id `skills-amazon-immolation-arrow`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.amazon.immolation-arrow.png`; data id `skills-amazon-immolation-arrow` |
| 101 | skills.assassin.shock-web | Shock Web | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-shock-web`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.shock-web.png`; data id `skills-assassin-shock-web` |
| 102 | skills.assassin.fire-blast | Fire Blast | 1 | pilot accepted; data id `skills-assassin-fire-blast`; full-production recovery allocated 2026-05-01; data id `skills-assassin-fire-blast`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.fire-blast.v1.png`; data id `skills-assassin-fire-blast` |
| 103 | skills.assassin.blade-fury | Blade Fury | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-blade-fury`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.blade-fury.png`; data id `skills-assassin-blade-fury` |
| 104 | skills.assassin.mind-blast | Mind Blast | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-mind-blast`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.mind-blast.png`; data id `skills-assassin-mind-blast` |
| 105 | skills.assassin.dragon-claw | Dragon Claw | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-dragon-claw`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.dragon-claw.png`; data id `skills-assassin-dragon-claw` |
| 106 | skills.assassin.phoenix-strike | Phoenix Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-phoenix-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.phoenix-strike.png`; data id `skills-assassin-phoenix-strike` |
| 107 | skills.assassin.claw-mastery | Claw Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-claw-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.claw-mastery.png`; data id `skills-assassin-claw-mastery` |
| 108 | skills.assassin.weapon-block | Weapon Block | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-weapon-block`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.weapon-block.png`; data id `skills-assassin-weapon-block` |
| 109 | skills.assassin.fade | Fade | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-fade`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.fade.png`; data id `skills-assassin-fade` |
| 110 | skills.assassin.venom | Venom | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-venom`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.venom.png`; data id `skills-assassin-venom` |
| 111 | skills.assassin.tiger-strike | Tiger Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-tiger-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.tiger-strike.png`; data id `skills-assassin-tiger-strike` |
| 112 | skills.assassin.dragon-talon | Dragon Talon | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-dragon-talon`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.dragon-talon.png`; data id `skills-assassin-dragon-talon` |
| 113 | skills.assassin.fists-of-fire | Fists Of Fire | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-fists-of-fire`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.fists-of-fire.png`; data id `skills-assassin-fists-of-fire` |
| 114 | skills.assassin.cobra-strike | Cobra Strike | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-cobra-strike`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.cobra-strike.png`; data id `skills-assassin-cobra-strike` |
| 115 | skills.assassin.claws-of-thunder | Claws Of Thunder | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-claws-of-thunder`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.claws-of-thunder.png`; data id `skills-assassin-claws-of-thunder` |
| 116 | skills.assassin.dragon-tail | Dragon Tail | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-dragon-tail`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.dragon-tail.png`; data id `skills-assassin-dragon-tail` |
| 117 | skills.assassin.blades-of-ice | Blades Of Ice | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-blades-of-ice`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.blades-of-ice.png`; data id `skills-assassin-blades-of-ice` |
| 118 | skills.assassin.dragon-flight | Dragon Flight | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-dragon-flight`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.dragon-flight.png`; data id `skills-assassin-dragon-flight` |
| 119 | skills.assassin.psychic-hammer | Psychic Hammer | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-psychic-hammer`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.psychic-hammer.png`; data id `skills-assassin-psychic-hammer` |
| 120 | skills.assassin.burst-of-speed | Burst Of Speed | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-burst-of-speed`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.burst-of-speed.png`; data id `skills-assassin-burst-of-speed` |
| 121 | skills.assassin.cloak-of-shadows | Cloak Of Shadows | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-cloak-of-shadows`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.cloak-of-shadows.png`; data id `skills-assassin-cloak-of-shadows` |
| 122 | skills.assassin.shadow-warrior | Shadow Warrior | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-shadow-warrior`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.shadow-warrior.png`; data id `skills-assassin-shadow-warrior` |
| 123 | skills.assassin.shadow-master | Shadow Master | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-shadow-master`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.shadow-master.png`; data id `skills-assassin-shadow-master` |
| 124 | skills.assassin.charged-bolt-sentry | Charged Bolt Sentry | 2 | pilot; v0 rendered as lightning spear/blade (failed trap subject fidelity); v1 accepted as squat lightning trap totem; data id `skills-assassin-charged-bolt-sentry`; full-production recovery allocated 2026-05-01; data id `skills-assassin-charged-bolt-sentry`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.charged-bolt-sentry.v2.png`; data id `skills-assassin-charged-bolt-sentry` |
| 125 | skills.assassin.wake-of-fire | Wake Of Fire | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-wake-of-fire`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.wake-of-fire.png`; data id `skills-assassin-wake-of-fire` |
| 126 | skills.assassin.blade-sentinel | Blade Sentinel | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-blade-sentinel`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-assassin-blade-sentinel`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.blade-sentinel.png`; data id `skills-assassin-blade-sentinel` |
| 127 | skills.assassin.lightning-sentry | Lightning Sentry | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-lightning-sentry`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.lightning-sentry.png`; data id `skills-assassin-lightning-sentry` |
| 128 | skills.assassin.wake-of-inferno | Wake Of Inferno | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-wake-of-inferno`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.wake-of-inferno.png`; data id `skills-assassin-wake-of-inferno` |
| 129 | skills.assassin.death-sentry | Death Sentry | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-death-sentry`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.death-sentry.png`; data id `skills-assassin-death-sentry` |
| 130 | skills.assassin.blade-shield | Blade Shield | 0 | allocated for full-production skill-icon recovery; data id `skills-assassin-blade-shield`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.assassin.blade-shield.png`; data id `skills-assassin-blade-shield` |
| 201 | skills.barbarian.bash | Bash | 1 | pilot accepted; data id `skills-barbarian-bash`; full-production recovery allocated 2026-05-01; data id `skills-barbarian-bash`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.bash.v1.png`; data id `skills-barbarian-bash` |
| 202 | skills.barbarian.double-swing | Double Swing | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-double-swing`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.double-swing.png`; data id `skills-barbarian-double-swing` |
| 203 | skills.barbarian.whirlwind | Whirlwind | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-whirlwind`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.whirlwind.png`; data id `skills-barbarian-whirlwind` |
| 204 | skills.barbarian.leap-attack | Leap Attack | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-leap-attack`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.leap-attack.png`; data id `skills-barbarian-leap-attack` |
| 205 | skills.barbarian.berserk | Berserk | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-berserk`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.berserk.png`; data id `skills-barbarian-berserk` |
| 206 | skills.barbarian.war-cry | War Cry | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-war-cry`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.war-cry.png`; data id `skills-barbarian-war-cry` |
| 207 | skills.barbarian.iron-skin | Iron Skin | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-iron-skin`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.iron-skin.png`; data id `skills-barbarian-iron-skin` |
| 208 | skills.barbarian.natural-resistance | Natural Resistance | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-natural-resistance`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.natural-resistance.png`; data id `skills-barbarian-natural-resistance` |
| 209 | skills.barbarian.battle-orders | Battle Orders | 1 | pilot accepted; data id `skills-barbarian-battle-orders`; full-production recovery allocated 2026-05-01; data id `skills-barbarian-battle-orders`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.battle-orders.v1.png`; data id `skills-barbarian-battle-orders` |
| 210 | skills.barbarian.shout | Shout | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-shout`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.shout.png`; data id `skills-barbarian-shout` |
| 211 | skills.barbarian.sword-mastery | Sword Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-sword-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.sword-mastery.png`; data id `skills-barbarian-sword-mastery` |
| 212 | skills.barbarian.axe-mastery | Axe Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-axe-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.axe-mastery.png`; data id `skills-barbarian-axe-mastery` |
| 213 | skills.barbarian.mace-mastery | Mace Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-mace-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.mace-mastery.png`; data id `skills-barbarian-mace-mastery` |
| 214 | skills.barbarian.pole-arm-mastery | Pole Arm Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-pole-arm-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.pole-arm-mastery.png`; data id `skills-barbarian-pole-arm-mastery` |
| 215 | skills.barbarian.throwing-mastery | Throwing Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-throwing-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.throwing-mastery.png`; data id `skills-barbarian-throwing-mastery` |
| 216 | skills.barbarian.spear-mastery | Spear Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-spear-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.spear-mastery.png`; data id `skills-barbarian-spear-mastery` |
| 217 | skills.barbarian.increased-stamina | Increased Stamina | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-increased-stamina`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.increased-stamina.png`; data id `skills-barbarian-increased-stamina` |
| 218 | skills.barbarian.increased-speed | Increased Speed | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-increased-speed`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.increased-speed.png`; data id `skills-barbarian-increased-speed` |
| 219 | skills.barbarian.leap | Leap | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-leap`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.leap.png`; data id `skills-barbarian-leap` |
| 220 | skills.barbarian.stun | Stun | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-stun`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.stun.png`; data id `skills-barbarian-stun` |
| 221 | skills.barbarian.double-throw | Double Throw | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-double-throw`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-barbarian-double-throw`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.double-throw.png`; data id `skills-barbarian-double-throw` |
| 222 | skills.barbarian.concentrate | Concentrate | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-concentrate`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.concentrate.png`; data id `skills-barbarian-concentrate` |
| 223 | skills.barbarian.frenzy | Frenzy | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-frenzy`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.frenzy.png`; data id `skills-barbarian-frenzy` |
| 224 | skills.barbarian.howl | Howl | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-howl`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.howl.png`; data id `skills-barbarian-howl` |
| 225 | skills.barbarian.find-potion | Find Potion | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-find-potion`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-barbarian-find-potion`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.find-potion.png`; data id `skills-barbarian-find-potion` |
| 226 | skills.barbarian.taunt | Taunt | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-taunt`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.taunt.png`; data id `skills-barbarian-taunt` |
| 227 | skills.barbarian.find-item | Find Item | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-find-item`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.find-item.png`; data id `skills-barbarian-find-item` |
| 228 | skills.barbarian.battle-cry | Battle Cry | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-battle-cry`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-barbarian-battle-cry`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.battle-cry.png`; data id `skills-barbarian-battle-cry` |
| 229 | skills.barbarian.grim-ward | Grim Ward | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-grim-ward`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-barbarian-grim-ward`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.grim-ward.png`; data id `skills-barbarian-grim-ward` |
| 230 | skills.barbarian.battle-command | Battle Command | 0 | allocated for full-production skill-icon recovery; data id `skills-barbarian-battle-command`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.barbarian.battle-command.png`; data id `skills-barbarian-battle-command` |
| 301 | skills.druid.firestorm | Firestorm | 1 | pilot accepted; data id `skills-druid-firestorm`; full-production recovery allocated 2026-05-01; data id `skills-druid-firestorm`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.firestorm.v1.png`; data id `skills-druid-firestorm` |
| 302 | skills.druid.arctic-blast | Arctic Blast | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-arctic-blast`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.arctic-blast.png`; data id `skills-druid-arctic-blast` |
| 303 | skills.druid.tornado | Tornado | 1 | allocated for full-production skill-icon recovery; data id `skills-druid-tornado`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-tornado`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.tornado.v1.png`; data id `skills-druid-tornado` |
| 304 | skills.druid.summon-dire-wolf | Summon Dire Wolf | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-summon-dire-wolf`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.summon-dire-wolf.png`; data id `skills-druid-summon-dire-wolf` |
| 305 | skills.druid.werewolf-maul | Werewolf Maul | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-werewolf-maul`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-werewolf-maul`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.werewolf-maul.png`; data id `skills-druid-werewolf-maul` |
| 306 | skills.druid.hurricane | Hurricane | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-hurricane`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-hurricane`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.hurricane.png`; data id `skills-druid-hurricane` |
| 307 | skills.druid.elemental-mastery | Elemental Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-elemental-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.elemental-mastery.png`; data id `skills-druid-elemental-mastery` |
| 308 | skills.druid.lycanthropy | Lycanthropy | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-lycanthropy`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-lycanthropy`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.lycanthropy.png`; data id `skills-druid-lycanthropy` |
| 309 | skills.druid.heart-of-wolverine | Heart Of Wolverine | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-heart-of-wolverine`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-heart-of-wolverine`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.heart-of-wolverine.png`; data id `skills-druid-heart-of-wolverine` |
| 310 | skills.druid.oak-sage | Oak Sage | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-oak-sage`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.oak-sage.png`; data id `skills-druid-oak-sage` |
| 311 | skills.druid.molten-boulder | Molten Boulder | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-molten-boulder`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.molten-boulder.png`; data id `skills-druid-molten-boulder` |
| 312 | skills.druid.fissure | Fissure | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-fissure`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-fissure`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.fissure.png`; data id `skills-druid-fissure` |
| 313 | skills.druid.cyclone-armor | Cyclone Armor | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-cyclone-armor`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.cyclone-armor.png`; data id `skills-druid-cyclone-armor` |
| 314 | skills.druid.twister | Twister | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-twister`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-twister`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.twister.png`; data id `skills-druid-twister` |
| 315 | skills.druid.volcano | Volcano | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-volcano`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-volcano`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.volcano.png`; data id `skills-druid-volcano` |
| 316 | skills.druid.armageddon | Armageddon | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-armageddon`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-armageddon`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.armageddon.png`; data id `skills-druid-armageddon` |
| 317 | skills.druid.werewolf | Werewolf | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-werewolf`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-werewolf`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.werewolf.png`; data id `skills-druid-werewolf` |
| 318 | skills.druid.werebear | Werebear | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-werebear`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.werebear.png`; data id `skills-druid-werebear` |
| 319 | skills.druid.feral-rage | Feral Rage | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-feral-rage`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-feral-rage`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.feral-rage.png`; data id `skills-druid-feral-rage` |
| 320 | skills.druid.rabies | Rabies | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-rabies`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.rabies.png`; data id `skills-druid-rabies` |
| 321 | skills.druid.fire-claws | Fire Claws | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-fire-claws`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.fire-claws.png`; data id `skills-druid-fire-claws` |
| 322 | skills.druid.hunger | Hunger | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-hunger`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-hunger`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.hunger.png`; data id `skills-druid-hunger` |
| 323 | skills.druid.shock-wave | Shock Wave | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-shock-wave`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-shock-wave`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.shock-wave.png`; data id `skills-druid-shock-wave` |
| 324 | skills.druid.fury | Fury | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-fury`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.fury.png`; data id `skills-druid-fury` |
| 325 | skills.druid.raven | Raven | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-raven`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.raven.png`; data id `skills-druid-raven` |
| 326 | skills.druid.poison-creeper | Poison Creeper | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-poison-creeper`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.poison-creeper.png`; data id `skills-druid-poison-creeper` |
| 327 | skills.druid.summon-spirit-wolf | Summon Spirit Wolf | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-summon-spirit-wolf`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-summon-spirit-wolf`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.summon-spirit-wolf.png`; data id `skills-druid-summon-spirit-wolf` |
| 328 | skills.druid.carrion-vine | Carrion Vine | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-carrion-vine`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.carrion-vine.png`; data id `skills-druid-carrion-vine` |
| 329 | skills.druid.solar-creeper | Solar Creeper | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-solar-creeper`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.solar-creeper.png`; data id `skills-druid-solar-creeper` |
| 330 | skills.druid.spirit-of-barbs | Spirit Of Barbs | 0 | allocated for full-production skill-icon recovery; data id `skills-druid-spirit-of-barbs`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-druid-spirit-of-barbs`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.spirit-of-barbs.png`; data id `skills-druid-spirit-of-barbs` |
| 331 | skills.druid.summon-grizzly | Summon Grizzly | 3 | pilot blocked after 3 rejected variants: v0 full bear scene + rune/text-like mark; v1 bear portrait with circular frame + paw mark; v2 full bear body + circular frame + paw mark. Needs preset/descriptors tuning before production; data id `skills-druid-summon-grizzly`; full-production recovery allocated 2026-05-01; data id `skills-druid-summon-grizzly`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.druid.summon-grizzly.v3.png`; data id `skills-druid-summon-grizzly` |
| 401 | skills.necromancer.raise-skeleton | Raise Skeleton | 3 | pilot blocked after 3 rejected variants: v0 text-like rune/symbol; v1 baked frame + symbol medallion; v2 signature/text leakage. Needs preset/descriptors tuning before production; data id `skills-necromancer-raise-skeleton`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-raise-skeleton`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.raise-skeleton.v3.png`; data id `skills-necromancer-raise-skeleton` |
| 402 | skills.necromancer.corpse-explosion | Corpse Explosion | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-corpse-explosion`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.corpse-explosion.png`; data id `skills-necromancer-corpse-explosion` |
| 403 | skills.necromancer.poison-nova | Poison Nova | 1 | pilot accepted; data id `skills-necromancer-poison-nova`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-poison-nova`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-poison-nova`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.poison-nova.v1.png`; data id `skills-necromancer-poison-nova` |
| 404 | skills.necromancer.bone-spear | Bone Spear | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-bone-spear`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.bone-spear.png`; data id `skills-necromancer-bone-spear` |
| 405 | skills.necromancer.amplify-damage | Amplify Damage | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-amplify-damage`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.amplify-damage.png`; data id `skills-necromancer-amplify-damage` |
| 406 | skills.necromancer.decrepify | Decrepify | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-decrepify`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-decrepify`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.decrepify.png`; data id `skills-necromancer-decrepify` |
| 407 | skills.necromancer.summon-mastery | Summon Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-summon-mastery`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.summon-mastery.png`; data id `skills-necromancer-summon-mastery` |
| 408 | skills.necromancer.poison-mastery | Poison Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-poison-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-poison-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.poison-mastery.png`; data id `skills-necromancer-poison-mastery` |
| 409 | skills.necromancer.blood-golem | Blood Golem | 3 | tightened preset pilot: v0 full creature scene + two hearts, v1 full humanoid golem scene; v2 accepted as single bloodstone heart idol, strong screenshot-relevant summon read; data id `skills-necromancer-blood-golem`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-blood-golem`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.blood-golem.v3.png`; data id `skills-necromancer-blood-golem` |
| 410 | skills.necromancer.bone-armor | Bone Armor | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-bone-armor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-bone-armor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.bone-armor.png`; data id `skills-necromancer-bone-armor` |
| 411 | skills.necromancer.dim-vision | Dim Vision | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-dim-vision`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-dim-vision`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.dim-vision.png`; data id `skills-necromancer-dim-vision` |
| 412 | skills.necromancer.weaken | Weaken | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-weaken`; full-production recovery accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.weaken.png`; data id `skills-necromancer-weaken` |
| 413 | skills.necromancer.iron-maiden | Iron Maiden | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-iron-maiden`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-iron-maiden`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.iron-maiden.png`; data id `skills-necromancer-iron-maiden` |
| 414 | skills.necromancer.terror | Terror | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-terror`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-terror`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.terror.v1.png`; data id `skills-necromancer-terror` |
| 415 | skills.necromancer.confuse | Confuse | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-confuse`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-confuse`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.confuse.v1.png`; data id `skills-necromancer-confuse` |
| 416 | skills.necromancer.life-tap | Life Tap | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-life-tap`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-life-tap`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.life-tap.png`; data id `skills-necromancer-life-tap` |
| 417 | skills.necromancer.attract | Attract | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-attract`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-attract`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.attract.v1.png`; data id `skills-necromancer-attract` |
| 418 | skills.necromancer.lower-resist | Lower Resist | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-lower-resist`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-lower-resist`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.lower-resist.v1.png`; data id `skills-necromancer-lower-resist` |
| 419 | skills.necromancer.teeth | Teeth | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-teeth`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-teeth`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.teeth.v1.png`; data id `skills-necromancer-teeth` |
| 420 | skills.necromancer.poison-dagger | Poison Dagger | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-poison-dagger`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-poison-dagger`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.poison-dagger.png`; data id `skills-necromancer-poison-dagger` |
| 421 | skills.necromancer.bone-wall | Bone Wall | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-bone-wall`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-bone-wall`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.bone-wall.png`; data id `skills-necromancer-bone-wall` |
| 422 | skills.necromancer.poison-explosion | Poison Explosion | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-poison-explosion`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-poison-explosion`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.poison-explosion.v1.png`; data id `skills-necromancer-poison-explosion` |
| 423 | skills.necromancer.bone-prison | Bone Prison | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-bone-prison`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-bone-prison`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.bone-prison.png`; data id `skills-necromancer-bone-prison` |
| 424 | skills.necromancer.bone-spirit | Bone Spirit | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-bone-spirit`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-bone-spirit`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.bone-spirit.v1.png`; data id `skills-necromancer-bone-spirit` |
| 425 | skills.necromancer.skeleton-mastery | Skeleton Mastery | 1 | allocated for full-production skill-icon recovery; data id `skills-necromancer-skeleton-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-skeleton-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.skeleton-mastery.v1.png`; data id `skills-necromancer-skeleton-mastery` |
| 426 | skills.necromancer.clay-golem | Clay Golem | 1 | tightened preset pilot accepted: v0 reads as a heavy clay fist/token, strong silhouette, no text/frame; data id `skills-necromancer-clay-golem`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-clay-golem`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-clay-golem`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.clay-golem.v1.png`; data id `skills-necromancer-clay-golem` |
| 427 | skills.necromancer.golem-mastery | Golem Mastery | 3 | tightened preset pilot: v0 skull portrait, v1 skull portrait too close to monster/portrait; v2 accepted as squat clay-and-bone binding totem with red core, strong 64px read; data id `skills-necromancer-golem-mastery`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-golem-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-golem-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.golem-mastery.v3.png`; data id `skills-necromancer-golem-mastery` |
| 428 | skills.necromancer.raise-skeletal-mage | Raise Skeletal Mage | 3 | tightened preset pilot blocked after 3 rejected variants: v0 full robed skeleton mage, v1 full robed skeleton mage portrait, v2 full-body skeleton mage scene. Descriptors keep pulling character art; needs subject strategy/preset tuning before production; data id `skills-necromancer-raise-skeletal-mage`; full-production recovery allocated 2026-05-01; data id `skills-necromancer-raise-skeletal-mage`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-raise-skeletal-mage`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.raise-skeletal-mage.v3.png`; data id `skills-necromancer-raise-skeletal-mage` |
| 429 | skills.necromancer.summon-resist | Summon Resist | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-summon-resist`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-summon-resist`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.summon-resist.png`; data id `skills-necromancer-summon-resist` |
| 430 | skills.necromancer.iron-golem | Iron Golem | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-iron-golem`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-iron-golem`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.iron-golem.png`; data id `skills-necromancer-iron-golem` |
| 431 | skills.necromancer.fire-golem | Fire Golem | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-fire-golem`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-fire-golem`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.fire-golem.png`; data id `skills-necromancer-fire-golem` |
| 432 | skills.necromancer.revive | Revive | 0 | allocated for full-production skill-icon recovery; data id `skills-necromancer-revive`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-necromancer-revive`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.necromancer.revive.png`; data id `skills-necromancer-revive` |
| 501 | skills.paladin.zeal | Zeal | 2 | pilot; v0 signature/text leakage in lower-right and read as plain sword; v1 accepted as clean holy slash-star emblem; data id `skills-paladin-zeal`; full-production recovery allocated 2026-05-01; data id `skills-paladin-zeal`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-zeal`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.zeal.v2.png`; data id `skills-paladin-zeal` |
| 502 | skills.paladin.holy-bolt | Holy Bolt | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-holy-bolt`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-holy-bolt`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.holy-bolt.png`; data id `skills-paladin-holy-bolt` |
| 503 | skills.paladin.blessed-hammer | Blessed Hammer | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-blessed-hammer`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-blessed-hammer`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.blessed-hammer.png`; data id `skills-paladin-blessed-hammer` |
| 504 | skills.paladin.vengeance | Vengeance | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-vengeance`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-vengeance`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.vengeance.png`; data id `skills-paladin-vengeance` |
| 505 | skills.paladin.charge | Charge | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-charge`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-charge`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.charge.png`; data id `skills-paladin-charge` |
| 506 | skills.paladin.fist-of-heavens | Fist Of Heavens | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-fist-of-heavens`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-fist-of-heavens`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.fist-of-heavens.png`; data id `skills-paladin-fist-of-heavens` |
| 507 | skills.paladin.might | Might | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-might`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-might`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.might.png`; data id `skills-paladin-might` |
| 508 | skills.paladin.holy-fire | Holy Fire | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-holy-fire`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-holy-fire`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.holy-fire.png`; data id `skills-paladin-holy-fire` |
| 509 | skills.paladin.conviction | Conviction | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-conviction`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-conviction`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.conviction.png`; data id `skills-paladin-conviction` |
| 510 | skills.paladin.meditation | Meditation | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-meditation`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-meditation`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.meditation.png`; data id `skills-paladin-meditation` |
| 511 | skills.paladin.sacrifice | Sacrifice | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-sacrifice`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-sacrifice`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.sacrifice.png`; data id `skills-paladin-sacrifice` |
| 512 | skills.paladin.smite | Smite | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-smite`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-smite`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.smite.png`; data id `skills-paladin-smite` |
| 513 | skills.paladin.conversion | Conversion | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-conversion`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-conversion`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.conversion.png`; data id `skills-paladin-conversion` |
| 514 | skills.paladin.holy-shield | Holy Shield | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-holy-shield`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-holy-shield`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.holy-shield.png`; data id `skills-paladin-holy-shield` |
| 515 | skills.paladin.thorns | Thorns | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-thorns`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-thorns`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.thorns.png`; data id `skills-paladin-thorns` |
| 516 | skills.paladin.blessed-aim | Blessed Aim | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-blessed-aim`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-blessed-aim`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.blessed-aim.png`; data id `skills-paladin-blessed-aim` |
| 517 | skills.paladin.concentration | Concentration | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-concentration`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-concentration`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.concentration.png`; data id `skills-paladin-concentration` |
| 518 | skills.paladin.holy-freeze | Holy Freeze | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-holy-freeze`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-holy-freeze`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.holy-freeze.png`; data id `skills-paladin-holy-freeze` |
| 519 | skills.paladin.holy-shock | Holy Shock | 1 | pilot accepted; data id `skills-paladin-holy-shock`; full-production recovery allocated 2026-05-01; data id `skills-paladin-holy-shock`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-holy-shock`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.holy-shock.v1.png`; data id `skills-paladin-holy-shock` |
| 520 | skills.paladin.sanctuary | Sanctuary | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-sanctuary`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-sanctuary`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.sanctuary.png`; data id `skills-paladin-sanctuary` |
| 521 | skills.paladin.fanaticism | Fanaticism | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-fanaticism`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-fanaticism`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.fanaticism.png`; data id `skills-paladin-fanaticism` |
| 522 | skills.paladin.prayer | Prayer | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-prayer`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-prayer`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.prayer.png`; data id `skills-paladin-prayer` |
| 523 | skills.paladin.resist-fire | Resist Fire | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-resist-fire`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-resist-fire`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.resist-fire.png`; data id `skills-paladin-resist-fire` |
| 524 | skills.paladin.defiance | Defiance | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-defiance`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-defiance`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.defiance.png`; data id `skills-paladin-defiance` |
| 525 | skills.paladin.resist-cold | Resist Cold | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-resist-cold`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-resist-cold`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.resist-cold.png`; data id `skills-paladin-resist-cold` |
| 526 | skills.paladin.cleansing | Cleansing | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-cleansing`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-cleansing`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.cleansing.png`; data id `skills-paladin-cleansing` |
| 527 | skills.paladin.resist-lightning | Resist Lightning | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-resist-lightning`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-resist-lightning`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.resist-lightning.png`; data id `skills-paladin-resist-lightning` |
| 528 | skills.paladin.vigor | Vigor | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-vigor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-vigor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.vigor.png`; data id `skills-paladin-vigor` |
| 529 | skills.paladin.redemption | Redemption | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-redemption`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-redemption`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.redemption.png`; data id `skills-paladin-redemption` |
| 530 | skills.paladin.salvation | Salvation | 0 | allocated for full-production skill-icon recovery; data id `skills-paladin-salvation`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-paladin-salvation`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.paladin.salvation.png`; data id `skills-paladin-salvation` |
| 601 | skills.sorceress.ice-bolt | Ice Bolt | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-ice-bolt`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-ice-bolt`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.ice-bolt.png`; data id `skills-sorceress-ice-bolt` |
| 602 | skills.sorceress.frost-nova | Frost Nova | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-frost-nova`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-frost-nova`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.frost-nova.png`; data id `skills-sorceress-frost-nova` |
| 603 | skills.sorceress.frozen-orb | Frozen Orb | 1 | pilot accepted; data id `skills-sorceress-frozen-orb`; full-production recovery allocated 2026-05-01; data id `skills-sorceress-frozen-orb`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-frozen-orb`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.frozen-orb.v1.png`; data id `skills-sorceress-frozen-orb` |
| 604 | skills.sorceress.chain-lightning | Chain Lightning | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-chain-lightning`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-chain-lightning`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.chain-lightning.png`; data id `skills-sorceress-chain-lightning` |
| 605 | skills.sorceress.fire-ball | Fire Ball | 1 | pilot accepted; data id `skills-sorceress-fire-ball`; full-production recovery allocated 2026-05-01; data id `skills-sorceress-fire-ball`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-fire-ball`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.fire-ball.v1.png`; data id `skills-sorceress-fire-ball` |
| 606 | skills.sorceress.meteor | Meteor | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-meteor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-meteor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.meteor.png`; data id `skills-sorceress-meteor` |
| 607 | skills.sorceress.cold-mastery | Cold Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-cold-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-cold-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.cold-mastery.png`; data id `skills-sorceress-cold-mastery` |
| 608 | skills.sorceress.lightning-mastery | Lightning Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-lightning-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-lightning-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.lightning-mastery.png`; data id `skills-sorceress-lightning-mastery` |
| 609 | skills.sorceress.fire-mastery | Fire Mastery | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-fire-mastery`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-fire-mastery`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.fire-mastery.png`; data id `skills-sorceress-fire-mastery` |
| 610 | skills.sorceress.energy-shield | Energy Shield | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-energy-shield`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-energy-shield`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.energy-shield.png`; data id `skills-sorceress-energy-shield` |
| 611 | skills.sorceress.frozen-armor | Frozen Armor | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-frozen-armor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-frozen-armor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.frozen-armor.png`; data id `skills-sorceress-frozen-armor` |
| 612 | skills.sorceress.ice-blast | Ice Blast | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-ice-blast`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-ice-blast`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.ice-blast.png`; data id `skills-sorceress-ice-blast` |
| 613 | skills.sorceress.shiver-armor | Shiver Armor | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-shiver-armor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-shiver-armor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.shiver-armor.png`; data id `skills-sorceress-shiver-armor` |
| 614 | skills.sorceress.glacial-spike | Glacial Spike | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-glacial-spike`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-glacial-spike`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.glacial-spike.png`; data id `skills-sorceress-glacial-spike` |
| 615 | skills.sorceress.blizzard | Blizzard | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-blizzard`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-blizzard`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.blizzard.png`; data id `skills-sorceress-blizzard` |
| 616 | skills.sorceress.chilling-armor | Chilling Armor | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-chilling-armor`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-chilling-armor`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.chilling-armor.png`; data id `skills-sorceress-chilling-armor` |
| 617 | skills.sorceress.charged-bolt | Charged Bolt | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-charged-bolt`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-charged-bolt`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.charged-bolt.png`; data id `skills-sorceress-charged-bolt` |
| 618 | skills.sorceress.static-field | Static Field | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-static-field`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-static-field`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.static-field.png`; data id `skills-sorceress-static-field` |
| 619 | skills.sorceress.telekinesis | Telekinesis | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-telekinesis`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-telekinesis`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.telekinesis.png`; data id `skills-sorceress-telekinesis` |
| 620 | skills.sorceress.nova | Nova | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-nova`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-nova`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.nova.png`; data id `skills-sorceress-nova` |
| 621 | skills.sorceress.lightning | Lightning | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-lightning`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-lightning`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.lightning.png`; data id `skills-sorceress-lightning` |
| 622 | skills.sorceress.teleport | Teleport | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-teleport`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-teleport`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.teleport.png`; data id `skills-sorceress-teleport` |
| 623 | skills.sorceress.thunder-storm | Thunder Storm | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-thunder-storm`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-thunder-storm`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.thunder-storm.png`; data id `skills-sorceress-thunder-storm` |
| 624 | skills.sorceress.fire-bolt | Fire Bolt | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-fire-bolt`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-fire-bolt`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.fire-bolt.png`; data id `skills-sorceress-fire-bolt` |
| 625 | skills.sorceress.warmth | Warmth | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-warmth`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-warmth`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.warmth.png`; data id `skills-sorceress-warmth` |
| 626 | skills.sorceress.inferno | Inferno | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-inferno`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-inferno`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.inferno.png`; data id `skills-sorceress-inferno` |
| 627 | skills.sorceress.blaze | Blaze | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-blaze`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-blaze`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.blaze.png`; data id `skills-sorceress-blaze` |
| 628 | skills.sorceress.fire-wall | Fire Wall | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-fire-wall`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-fire-wall`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.fire-wall.png`; data id `skills-sorceress-fire-wall` |
| 629 | skills.sorceress.enchant | Enchant | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-enchant`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-enchant`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.enchant.png`; data id `skills-sorceress-enchant` |
| 630 | skills.sorceress.hydra | Hydra | 0 | allocated for full-production skill-icon recovery; data id `skills-sorceress-hydra`; full-production recovery blocked: no accepted production replacement file created before handoff after repeated service timeout/abort; do not expose stale pilot art; data id `skills-sorceress-hydra`; continuation accepted 2026-05-01; asset `public/assets/d2/generated/skill-icons/skills.sorceress.hydra.png`; data id `skills-sorceress-hydra` |


