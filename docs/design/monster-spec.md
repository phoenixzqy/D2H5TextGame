# Monster Specification — v1 Catalog

**Owner:** `game-designer`  
**Status:** ✅ DECIDED (v1 locked)  
**Last updated:** 2025-01-01  
**Source references:** Diablo 2 monster tables (Arreat Summit), D2R Hell difficulty balance

---

## 1. Summary

This document defines **monster archetypes** and provides a **catalog of ~50 monster types** across Acts I–V. Each monster has:
- **Base stats** (life, attack, defense, resistances, attack speed)
- **Per-level growth ranges** (defined in JSON)
- **Skill priority list** (1–3 skills)
- **Tier** (trash / elite / champion / boss)

**JSON Schema:** `src/data/schema/monster.schema.json` (to be created by `technical-director` + `content-designer`).

---

## 2. Monster Field Template

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier | `"monsters/act1.fallen"` |
| `nameZh` | string | Chinese name | `"沉沦魔"` |
| `nameEn` | string | English name | `"Fallen"` |
| `family` | string | Monster family | `"demons"` |
| `tier` | enum | `trash` / `elite` / `champion` / `boss` | `"trash"` |
| `baseLife` | number[] | [min, max] at level 1 | `[30, 50]` |
| `lifeGrowth` | number[] | [min, max] per level | `[3, 5]` |
| `baseAttack` | number[] | [min, max] at level 1 | `[8, 12]` |
| `attackGrowth` | number[] | [min, max] per level | `[1, 2]` |
| `defense` | number | Flat physical mitigation | `15` |
| `defenseGrowth` | number | Per level | `2` |
| `magicResist` | number | Flat magical mitigation | `0` |
| `magicResistGrowth` | number | Per level | `1` |
| `attackSpeed` | number | Initiative (higher = faster) | `80` |
| `resistances` | object | Fire/Cold/Lightning/Poison/Arcane % | `{ "fire": 0, "cold": 0, ... }` |
| `skills` | string[] | Skill IDs (priority order) | `["monster.weak_melee"]` |
| `xpReward` | number | Base XP at level 1 | `10` |
| `xpGrowth` | number | Per level | `2` |
| `mfTag` | string | Loot table tag | `"act1.trash"` |
| `loreZh` | string | Chinese lore | `"被地狱腐化的小恶魔"` |
| `loreEn` | string | English lore | `"Corrupted by Hell..."` |
| `immunities` | string[] | Absolute immunity to elements | `[]` (empty for most) |

---

## 3. Tier Multipliers (Applied at Spawn)

When a monster spawns, its base stats are multiplied by tier:

| Tier | Life | Attack | Defense | Magic Resist | Attack Speed | XP | Loot Rolls |
|---|---|---|---|---|---|---|---|
| **Trash** | ×1.0 | ×1.0 | ×1.0 | ×1.0 | ×1.0 | ×1.0 | 1 |
| **Elite** | ×1.5 | ×1.2 | ×1.3 | ×1.5 | ×1.1 | ×2.0 | 2 |
| **Champion** | ×2.0 | ×1.4 | ×1.5 | ×2.0 | ×1.2 | ×3.0 | 3 |
| **Boss** | ×5.0 | ×2.0 | ×2.5 | ×3.0 | ×1.5 | ×10.0 | 5 + guaranteed unique roll |

**Design note:** Elites/Champions spawn with 1–2 random affixes (e.g., "Extra Fast", "Fire Enchanted"). See §8.

---

## 4. Act I Monsters (Levels 1–10)

| ID | Name (EN / ZH) | Tier | Base Life | Life Growth | Attack | Skills | Resists | MF Tag | Lore |
|---|---|---|---|---|---|---|---|---|---|
| `act1.fallen` | Fallen / 沉沦魔 | Trash | 30–50 | 3–5 | 8–12 | `weak_melee`, `panic_flee` | 0 | `act1.trash` | Small cowardly demons |
| `act1.zombie` | Zombie / 僵尸 | Trash | 50–70 | 5–7 | 10–15 | `weak_melee` | 0 fire, +25 cold | `act1.trash` | Slow undead |
| `act1.quill_rat` | Quill Rat / 刺鼠 | Trash | 20–40 | 2–4 | 6–10 | `weak_melee` | 0 | `act1.trash` | Fast rodents |
| `act1.dark_archer` | Dark Archer / 黑暗弓手 | Trash | 40–60 | 4–6 | 12–18 | `monster.weak_ranged` | 0 | `act1.trash` | Ranged skeleton |
| `act1.fallen_shaman` | Fallen Shaman / 沉沦魔巫师 | Elite | 60–90 | 6–10 | 10–15 | `monster.fire_bolt`, `monster.resurrect_fallen` | +25 fire | `act1.elite` | Resurrects fallen allies |
| `act1.carver` | Carver / 切割者 | Trash | 40–60 | 4–6 | 10–14 | `weak_melee` | 0 | `act1.trash` | Upgraded fallen |
| `act1.tainted` | Tainted / 污染者 | Trash | 50–70 | 5–7 | 12–16 | `weak_melee`, `monster.poison_spit` | +25 poison | `act1.trash` | Poisonous undead |
| `act1.bone_warrior` | Bone Warrior / 骨战士 | Elite | 70–100 | 7–10 | 15–20 | `strong_melee` | +25 physical | `act1.elite` | Skeleton knight |
| `act1.dark_stalker` | Dark Stalker / 黑暗追猎者 | Champion | 100–150 | 10–15 | 18–25 | `strong_melee`, `monster.charge` | +25 all | `act1.champion` | Fast assassin undead |
| `act1.blood_raven` | Blood Raven / 血鸦 | Boss | 500–700 | 50–70 | 30–50 | `monster.fire_arrow`, `monster.summon_adds` | +50 fire, -25 cold | `act1.boss` | Act I boss (corrupted Rogue) |

**Boss Notes — Blood Raven:**
- Summons 3 Zombies every 5 turns.
- Fire Arrow applies Burn (2 stacks).
- Enrage at 10% HP: +100% attack speed.

---

## 5. Act II Monsters (Levels 8–18)

| ID | Name (EN / ZH) | Tier | Base Life | Life Growth | Attack | Skills | Resists | MF Tag | Lore |
|---|---|---|---|---|---|---|---|---|---|
| `act2.sand_raider` | Sand Raider / 沙地劫掠者 | Trash | 60–80 | 6–8 | 15–20 | `weak_melee` | 0 | `act2.trash` | Desert bandits |
| `act2.horror_mage` | Horror Mage / 恐惧法师 | Elite | 80–120 | 8–12 | 12–18 | `monster.lightning_bolt`, `monster.frost_bolt` | +25 cold, +25 lightning | `act2.elite` | Caster mummy |
| `act2.claw_viper` | Claw Viper / 爪蛇 | Trash | 50–70 | 5–8 | 12–16 | `weak_melee`, `monster.poison_spit` | +50 poison | `act2.trash` | Poisonous serpent |
| `act2.scarab` | Scarab / 圣甲虫 | Trash | 40–60 | 4–6 | 10–14 | `weak_melee` | +25 physical | `act2.trash` | Armored beetle |
| `act2.mummy` | Mummy / 木乃伊 | Trash | 70–100 | 7–10 | 14–18 | `strong_melee` | +25 fire | `act2.trash` | Slow but tough |
| `act2.vulture_demon` | Vulture Demon / 秃鹫恶魔 | Elite | 90–130 | 9–13 | 16–22 | `strong_melee`, `monster.charge` | 0 | `act2.elite` | Flying charger |
| `act2.sand_maggot` | Sand Maggot / 沙地蛆虫 | Trash | 80–120 | 8–12 | 12–18 | `weak_melee`, `monster.weak_ranged` | 0 | `act2.trash` | Spawns eggs |
| `act2.greater_mummy` | Greater Mummy / 高级木乃伊 | Champion | 150–200 | 15–20 | 20–30 | `strong_melee`, `monster.fire_breath` | +50 fire | `act2.champion` | Elite mummy |
| `act2.undead_flayer` | Undead Flayer / 不死剥皮者 | Elite | 100–140 | 10–14 | 18–24 | `strong_melee` | 0 | `act2.elite` | Fast melee |
| `act2.duriel` | Duriel / 督瑞尔 | Boss | 1200–1500 | 100–150 | 50–80 | `strong_melee`, `monster.charge`, `monster.frost_aura` | +75 cold, -25 fire | `act2.boss` | Act II boss (frozen tunnels) |

**Boss Notes — Duriel:**
- Frost Aura: Applies Chill to all player units every turn (15 cold damage).
- Charge: High single-target burst.
- Immune to Freeze.

---

## 6. Act III Monsters (Levels 16–28)

| ID | Name (EN / ZH) | Tier | Base Life | Life Growth | Attack | Skills | Resists | MF Tag | Lore |
|---|---|---|---|---|---|---|---|---|---|
| `act3.jungle_hunter` | Jungle Hunter / 丛林猎手 | Trash | 100–140 | 10–14 | 20–28 | `weak_melee`, `monster.leap` | 0 | `act3.trash` | Fast jungle demon |
| `act3.fetish` | Fetish / 侏儒 | Trash | 80–120 | 8–12 | 18–24 | `weak_melee`, `monster.poison_dagger` | +25 poison | `act3.trash` | Tiny but deadly |
| `act3.spider` | Giant Spider / 巨型蜘蛛 | Trash | 90–130 | 9–13 | 16–22 | `weak_melee`, `monster.poison_spit` | +50 poison | `act3.trash` | Web trapper |
| `act3.flayer` | Flayer / 剥皮者 | Trash | 110–150 | 11–15 | 22–30 | `strong_melee` | 0 | `act3.trash` | Aggressive pack |
| `act3.thorned_hulk` | Thorned Hulk / 荆棘巨兽 | Elite | 200–280 | 20–28 | 30–40 | `strong_melee`, `monster.thorns_aura` | +50 physical | `act3.elite` | Reflects 50% damage |
| `act3.swamp_dweller` | Swamp Dweller / 沼泽居民 | Trash | 120–160 | 12–16 | 20–26 | `weak_melee`, `monster.poison_cloud` | +25 poison | `act3.trash` | Poison AOE |
| `act3.doom_ape` | Doom Ape / 末日巨猿 | Champion | 250–350 | 25–35 | 35–50 | `strong_melee`, `monster.charge` | +25 all | `act3.champion` | Boss-tier ape |
| `act3.infector` | Infector / 感染者 | Elite | 180–240 | 18–24 | 28–36 | `weak_melee`, `monster.plague_spit` | +75 poison | `act3.elite` | Spreads plague |
| `act3.serpent_magus` | Serpent Magus / 蛇人法师 | Elite | 150–210 | 15–21 | 24–32 | `monster.fire_ball`, `monster.lightning_bolt` | +25 fire, +25 lightning | `act3.elite` | Dual-element caster |
| `act3.mephisto` | Mephisto / 墨菲斯托 | Boss | 2000–2500 | 150–200 | 60–100 | `monster.frost_nova`, `monster.lightning`, `monster.poison_cloud` | +50 all | `act3.boss` | Act III boss (Lord of Hatred) |

**Boss Notes — Mephisto:**
- Tri-element caster (cold/lightning/poison).
- Poison Cloud: AOE 3-stack poison every 3 turns.
- Immune to poison.

---

## 7. Act IV Monsters (Levels 26–38)

| ID | Name (EN / ZH) | Tier | Base Life | Life Growth | Attack | Skills | Resists | MF Tag | Lore |
|---|---|---|---|---|---|---|---|---|---|
| `act4.venom_lord` | Venom Lord / 剧毒领主 | Elite | 300–400 | 30–40 | 40–60 | `strong_melee`, `monster.poison_spit`, `monster.inferno` | +50 poison, +25 fire | `act4.elite` | Poison+fire hybrid |
| `act4.abyss_knight` | Abyss Knight / 深渊骑士 | Champion | 350–500 | 35–50 | 50–70 | `strong_melee`, `monster.charge` | +50 physical | `act4.champion` | Heavy armor knight |
| `act4.stygian_doll` | Stygian Doll / 冥河玩偶 | Trash | 100–150 | 10–15 | 30–40 | `weak_melee`, `monster.corpse_explosion` | 0 | `act4.trash` | Explodes on death |
| `act4.damned` | The Damned / 被诅咒者 | Trash | 150–200 | 15–20 | 35–45 | `weak_melee` | 0 | `act4.trash` | Undead souls |
| `act4.doom_caster` | Doom Caster / 末日施法者 | Elite | 280–380 | 28–38 | 40–55 | `monster.fire_ball`, `monster.frost_nova` | +50 fire, +50 cold | `act4.elite` | High-tier caster |
| `act4.oblivion_knight` | Oblivion Knight / 湮灭骑士 | Elite | 320–450 | 32–45 | 45–65 | `strong_melee`, `monster.bone_spirit` | +50 all | `act4.elite` | Curses player |
| `act4.pit_lord` | Pit Lord / 深渊领主 | Champion | 400–600 | 40–60 | 55–80 | `strong_melee`, `monster.fire_breath`, `monster.charge` | +75 fire | `act4.champion` | Tank demon |
| `act4.mega_demon` | Mega Demon / 巨型恶魔 | Champion | 450–650 | 45–65 | 60–90 | `strong_melee`, `monster.inferno` | +50 fire, +25 physical | `act4.champion` | Elite demon |
| `act4.izual` | Izual / 伊姿艾尔 | Boss | 2500–3000 | 200–250 | 80–120 | `strong_melee`, `monster.frost_nova`, `monster.charge` | +75 cold, +50 physical | `act4.boss` | Act IV mini-boss (fallen angel) |
| `act4.diablo` | Diablo / 迪亚波罗 | Boss | 5000–6000 | 300–400 | 100–150 | `monster.fire_breath`, `monster.lightning`, `monster.bone_prison`, `monster.charge` | +75 fire, +75 lightning | `act4.boss` | Act IV final boss (Lord of Terror) |

**Boss Notes — Diablo:**
- Fire Breath: Cone 5 targets, applies Burn (3 stacks).
- Lightning Hose: Cone 5 targets, applies Paralyze.
- Bone Prison: Roots player for 2 turns (no dodge).
- Enrage at 15% HP.

---

## 8. Act V Monsters (Levels 36–55)

| ID | Name (EN / ZH) | Tier | Base Life | Life Growth | Attack | Skills | Resists | MF Tag | Lore |
|---|---|---|---|---|---|---|---|---|---|
| `act5.barbarian_savage` | Barbarian Savage / 野蛮人劫掠者 | Trash | 200–280 | 20–28 | 50–70 | `strong_melee` | +25 physical | `act5.trash` | Corrupted warrior |
| `act5.death_mauler` | Death Mauler / 死亡撕裂者 | Elite | 350–500 | 35–50 | 60–85 | `strong_melee`, `monster.leap_attack` | +50 physical | `act5.elite` | Heavy charger |
| `act5.overseer` | Overseer / 监工 | Elite | 300–450 | 30–45 | 55–75 | `strong_melee`, `monster.war_cry` | +25 all | `act5.elite` | AOE stun |
| `act5.blood_lord` | Blood Lord / 血腥领主 | Champion | 500–700 | 50–70 | 70–100 | `strong_melee`, `monster.fire_breath` | +75 fire | `act5.champion` | Fire demon |
| `act5.warped_shaman` | Warped Shaman / 扭曲萨满 | Elite | 280–400 | 28–40 | 45–65 | `monster.frost_nova`, `monster.summon_adds` | +50 cold | `act5.elite` | Summoner |
| `act5.succubus` | Succubus / 魅魔 | Elite | 320–480 | 32–48 | 60–80 | `monster.arcane_bolt`, `monster.curse` | +50 arcane | `act5.elite` | Mana burn caster |
| `act5.frozen_terror` | Frozen Terror / 冰封恐魔 | Champion | 550–800 | 55–80 | 75–110 | `strong_melee`, `monster.frost_aura` | +75 cold | `act5.champion` | Cold AOE aura |
| `act5.ancient_barbarian` | Ancient Barbarian / 远古野蛮人 | Boss | 3000–4000 | 250–300 | 90–130 | `strong_melee`, `monster.whirlwind`, `monster.shout` | +50 physical, +25 all | `act5.boss` | Act V mini-boss (1 of 3 Ancients) |
| `act5.baal_minion` | Baal's Minion / 巴尔的仆从 | Champion | 600–900 | 60–90 | 80–120 | `strong_melee`, `monster.fire_breath`, `monster.poison_cloud` | +50 fire, +50 poison | `act5.champion` | Elite demon |
| `act5.baal` | Baal / 巴尔 | Boss | 8000–10000 | 500–700 | 120–180 | `monster.frost_nova`, `monster.inferno`, `monster.mana_rift`, `monster.tentacles` | +75 all | `act5.boss` | Act V final boss (Lord of Destruction) |

**Boss Notes — Baal:**
- Frost Nova: AOE all targets, applies Freeze (1 turn).
- Inferno: Cone 5 targets, applies Burn (5 stacks) + Armor Melt.
- Mana Rift: AOE arcane damage + Mana Burn.
- Tentacles: Summons 5 tentacles (act as separate trash units).
- Immune to all status effects except stun (50% reduced duration).
- Enrage at 20% HP: +150% attack speed, +100% damage.

---

## 9. Elite/Champion Affixes (Random Modifiers)

When an Elite or Champion spawns, roll 1–2 affixes from this table:

| Affix | Effect | Visual Tag (combat log) |
|---|---|---|
| **Extra Fast** | +50% attack speed | `⚡ Fast` |
| **Extra Strong** | +50% damage | `💪 Strong` |
| **Cursed** | Player regen -50% | `🔮 Cursed` |
| **Fire Enchanted** | +50% fire resist; explodes on death (50 fire AOE) | `🔥 Fire` |
| **Cold Enchanted** | +50% cold resist; Frost Aura (15 cold/turn) | `❄️ Cold` |
| **Lightning Enchanted** | +50% lightning resist; Lightning bolt on hit (25% chance) | `⚡ Lightning` |
| **Mana Burn** | Each hit drains 20 mana | `🧿 Mana Burn` |
| **Spectral Hit** | Attacks cannot be dodged | `👻 Spectral` |
| **Stone Skin** | +100% defense | `🛡️ Stone Skin` |
| **Teleportation** | Teleports every 5 turns (+50% dodge for 1 turn) | `🌀 Teleport` |

**Design note:** Bosses do NOT get random affixes; their mechanics are hand-designed.

---

## 10. Immunities (Act IV+ Only)

| Monster | Immunity | Notes |
|---|---|---|
| Andariel (Act I boss) | Poison 100% | Cannot be poisoned |
| Duriel | Freeze 100% | Can be chilled, not frozen |
| Mephisto | Poison 100% | Cannot be poisoned |
| Diablo | Stun 75% (reduced) | Hard to stun |
| Baal | All status 75% (reduced) | Hard to control |
| Specific Act V Champions | 1 element 100% | E.g., "Immune to Fire" |

**Design note:** v1 does NOT have full-immunity trash mobs (to avoid "skip this pack" degenerate gameplay). Only bosses and select Act V champions.

---

## 11. XP & Loot Rewards

### 11.1 XP Formula
```
xpReward = (monsterBaseXP + level × xpGrowth) × tierMultiplier
```

**Example:** Act III Flayer (level 20, tier = trash):
- Base XP: 15
- Growth: 3
- Formula: (15 + 20 × 3) × 1.0 = **75 XP**

### 11.2 Loot Rolls
See `docs/design/drop-tables.md` for full loot logic. Summary:
- **Trash:** 1 loot roll (low rarity chance).
- **Elite:** 2 rolls (medium rarity).
- **Champion:** 3 rolls (high rarity).
- **Boss:** 5 rolls + 1 guaranteed unique/set/runeword roll.

---

## 12. Open Questions 🟡

| # | Question | Owner | Proposed v1 Default |
|---|---|---|---|
| 1 | Should trash mobs have skills beyond basic attack? | game-designer | Yes, 1–2 simple skills max |
| 2 | Elite affix stacking (2 affixes → multiplicative?)? | qa-engineer | Additive, not multiplicative |
| 3 | Boss enrage HP threshold tuning | qa-engineer | 10% for Acts I–III, 15% for IV, 20% for V |

---

## 13. Handoff to Content Designer

**Next steps:**
1. `content-designer` creates `src/data/monsters/*.json` files (one per Act).
2. Populate all ~50 monsters with the fields from §2.
3. Cross-reference `skills` IDs with `skills-spec.md`.
4. Validate against `src/data/schema/monster.schema.json`.

---

## 14. Change Log

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2025-01-01 | game-designer | Initial v1 catalog (~50 monsters, 5 bosses) |
