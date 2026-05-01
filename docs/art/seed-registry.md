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

Producer sign-off: approved for a dedicated `skill-icon` category, 2026-05-01. Subject IDs are per skill within this category. Current allocation is a 14-icon pilot batch (two representative skills per playable class) before full 213-skill production.

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
| 1 | skills.amazon.magic-arrow | Magic Arrow | 0 | pilot accepted; data id `skills-amazon-magic-arrow` |
| 10 | skills.amazon.valkyrie | Valkyrie | 0 | pilot accepted; data id `skills-amazon-valkyrie` |
| 102 | skills.assassin.fire-blast | Fire Blast | 0 | pilot accepted; data id `skills-assassin-fire-blast` |
| 124 | skills.assassin.charged-bolt-sentry | Charged Bolt Sentry | 1 | pilot; v0 rendered as lightning spear/blade (failed trap subject fidelity); v1 accepted as squat lightning trap totem; data id `skills-assassin-charged-bolt-sentry` |
| 201 | skills.barbarian.bash | Bash | 0 | pilot accepted; data id `skills-barbarian-bash` |
| 209 | skills.barbarian.battle-orders | Battle Orders | 0 | pilot accepted; data id `skills-barbarian-battle-orders` |
| 301 | skills.druid.firestorm | Firestorm | 0 | pilot accepted; data id `skills-druid-firestorm` |
| 331 | skills.druid.summon-grizzly | Summon Grizzly | blocked | pilot blocked after 3 rejected variants: v0 full bear scene + rune/text-like mark; v1 bear portrait with circular frame + paw mark; v2 full bear body + circular frame + paw mark. Needs preset/descriptors tuning before production; data id `skills-druid-summon-grizzly` |
| 401 | skills.necromancer.raise-skeleton | Raise Skeleton | blocked | pilot blocked after 3 rejected variants: v0 text-like rune/symbol; v1 baked frame + symbol medallion; v2 signature/text leakage. Needs preset/descriptors tuning before production; data id `skills-necromancer-raise-skeleton` |
| 403 | skills.necromancer.poison-nova | Poison Nova | 0 | pilot accepted; data id `skills-necromancer-poison-nova` |
| 501 | skills.paladin.zeal | Zeal | 1 | pilot; v0 signature/text leakage in lower-right and read as plain sword; v1 accepted as clean holy slash-star emblem; data id `skills-paladin-zeal` |
| 519 | skills.paladin.holy-shock | Holy Shock | 0 | pilot accepted; data id `skills-paladin-holy-shock` |
| 605 | skills.sorceress.fire-ball | Fire Ball | 0 | pilot accepted; data id `skills-sorceress-fire-ball` |
| 603 | skills.sorceress.frozen-orb | Frozen Orb | 0 | pilot accepted; data id `skills-sorceress-frozen-orb` |
