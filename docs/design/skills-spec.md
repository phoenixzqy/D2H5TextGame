# Skills Specification — v1 Catalog

**Owner:** `game-designer`  
**Status:** ✅ DECIDED (v1 locked)  
**Last updated:** 2025-01-01  
**Source references:** Diablo 2 skill trees (all classes), D2R balance patches

---

## 1. Summary

This document defines **~70 skills** across 7 character archetypes. Each archetype has ~6 active skills + ~4 passives for v1. Skills are JSON-defined; `content-designer` owns the data files. This spec provides the **design template** and **example skill catalog**.

**JSON Schema:** `src/data/schema/skill.schema.json` (to be created by `technical-director` + `content-designer`).

---

## 2. Skill Field Template

Each skill requires the following fields:

| Field | Type | Description | Example |
|---|---|---|---|
| `id` | string | Unique identifier | `"skills/sorceress.chain_lightning"` |
| `nameZh` | string | Chinese display name | `"连锁闪电"` |
| `nameEn` | string | English display name | `"Chain Lightning"` |
| `descriptionZh` | string | Chinese description | `"向多个敌人释放闪电链，造成雷电伤害并麻痹目标。"` |
| `descriptionEn` | string | English description | `"Releases a chain of lightning..."` |
| `archetype` | string | Class/merc | `"sorceress"` |
| `school` | string | Skill tree | `"lightning"` |
| `type` | enum | `active` / `passive` / `buff` / `aura` | `"active"` |
| `element` | enum | `physical` / `cold` / `lightning` / `fire` / `arcane` / `poison` / `thorns` | `"lightning"` |
| `target` | enum | `single` / `cleave` / `cone` / `all` / `self` | `"cone"` |
| `baseDamage` | number[] | [min, max] at level 1 | `[40, 60]` |
| `damagePerLevel` | number[] | [min, max] growth per skill level | `[8, 12]` |
| `scaling` | object | Stat scaling | `{ "int": 1.2, "energy": 0.5 }` |
| `cooldown` | number | Turns (≥1) | `2` |
| `manaCost` | number | Base cost at level 1 | `25` |
| `manaCostPerLevel` | number | Increment per level | `3` |
| `maxLevel` | number | Cap | `20` |
| `prerequisites` | string[] | Skill IDs required | `["skills/sorceress.static_field"]` |
| `statusApplied` | string[] | Status effect IDs | `["paralyze"]` |
| `comboTag` | object | Input/output for combos | `{ "consumes": ["chill"], "grants": ["paralyze"] }` |
| `special` | string? | Free-text special mechanic | `"Bounces to 5 targets"` |

---

## 3. Skill Catalog — 7 Archetypes × ~10 Skills Each

Below is the **v1 skill list**. `content-designer` will populate the full JSON.

---

### 3.1 Sorceress (冰火雷三系法师)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `sorceress.ice_bolt` | Ice Bolt / 冰弹 | Cold | Single | 30–45 | 1 | 10 | Chill | Single-target cold |
| `sorceress.frost_nova` | Frost Nova / 霜冻新星 | Cold | All | 25–35 | 3 | 20 | Chill + Freeze (10%) | AOE cold, chance freeze |
| `sorceress.frozen_orb` | Frozen Orb / 冰封球 | Cold | Cone | 60–90 | 2 | 30 | Chill | Multi-target piercing |
| `sorceress.chain_lightning` | Chain Lightning / 连锁闪电 | Lightning | Cone | 50–70 | 2 | 25 | Paralyze | Hits 5 targets |
| `sorceress.fire_ball` | Fire Ball / 火球术 | Fire | Single | 70–100 | 1 | 20 | Burn | High single-target DPS |
| `sorceress.meteor` | Meteor / 陨石术 | Fire | All | 100–150 | 4 | 50 | Burn + Armor Melt | Ultimate AOE fire |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `sorceress.cold_mastery` | Cold Mastery / 冰系精通 | -15% enemy cold resist | Unlocks at L12 |
| `sorceress.lightning_mastery` | Lightning Mastery / 闪电精通 | +4% direct lightning damage per allocated skill rank (cap 20: +80%); Paralyze unchanged | Unlocks at L30; automatic passive, no combo/MP/CD |
| `sorceress.fire_mastery` | Fire Mastery / 火焰精通 | +4% fire damage per allocated skill rank (cap 20: +80%); additive with Warmth | Unlocks at L30; automatic passive, no combo/MP/CD |
| `sorceress.energy_shield` | Energy Shield / 能量护盾 | 30% damage → mana instead of HP | Unlocks at L18 |

---

### 3.2 Necromancer (死灵法师 — 毒+召唤)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `necromancer.raise_skeleton` | Raise Skeleton / 召唤骷髅 | — | Self | — | — | 15 | Summon | Authored cap: ranks1–5→1,6–11→2,12–20→3. D06 v1c specifies paid battle-start preparation without corpse consumption; implementation pending. |
| `necromancer.corpse_explosion` | Corpse Explosion / 尸体爆炸 | Fire | All | 50–80 | 2 | 20 | Ignite | Requires an actual current-wave enemy-monster corpse; one shared corpse per accepted cast, empty-pool combo skip and new-wave reset under the [accepted contract](../plans/decisions/D06-corpse-consumption-v1.md). [Bounded engine/native/Skills and bilingual production-browser acceptance](../plans/evidence/d06-corpse-explosion-ui.md) through `f0f4d99`; earned progression, affordability, balance and player feel remain open. |
| `necromancer.poison_nova` | Poison Nova / 剧毒新星 | Poison | All | 20–30 | 3 | 25 | Poison (2 stacks) | Low base, high stack scaling |
| `necromancer.bone_spear` | Bone Spear / 白骨之矛 | Arcane | Single | 60–90 | 1 | 20 | — | Ignores armor |
| `necromancer.amplify_damage` | Amplify Damage / 伤害加深 | — | All | — | 3 | 15 | -50% physical resist debuff | Curse |
| `necromancer.decrepify` | Decrepify / 衰老 | — | All | — | 3 | 20 | -50% attack speed, -33% damage | Curse |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `necromancer.skeleton_mastery` (`skills-necromancer-skeleton-mastery`) | Skeleton Mastery / 支配骷髅 | Newly created skeleton warriors/mages: +4% maximum life, +2% Attack and +1% ordinary Defense per allocated rank; cap20 totals +80%/+40%/+20%. | Unlock level1; creation only, no existing-summon retrofit/refill. [D05 contract](../plans/decisions/D05-skeleton-mastery-v1.md). |
| `necromancer.poison_mastery` | Poison & Bone Mastery / 毒骨精通 | Per rank: +4% poison/+2% arcane damage; unlock30/cap20; hero only, next-wave, hit-derived poison snapshot once ([D05](../plans/decisions/D05-poison-elemental-masteries-v1.md)) | |
| `necromancer.corpse_attracter` | Blood Golem / 血石魔像 | Passive: 10% life leech | Always-on aura |
| `necromancer.bone_armor` | Bone Armor / 白骨护甲 | Automatic personal absorption:12 per rank, cap20/240; unlock1 | One pool per fresh area run; all mitigated direct/periodic damage, no wave refill or HP increase; [D05 contract](../plans/decisions/D05-bone-armor-v1.md) |

---

### 3.3 Paladin (圣骑士 — 光环+近战)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `paladin.zeal` | Zeal / 狂热 | Physical | Cleave | 40–60 | 1 | 10 | — | Hits 3 targets |
| `paladin.holy_bolt` | Holy Bolt / 圣光弹 | Arcane | Single | 50–70 | 1 | 15 | — | Heals self for 50% dmg |
| `paladin.blessed_hammer` | Blessed Hammer / 祝福之锤 | Arcane | All | 60–90 | 2 | 25 | — | Ignores magic resist |
| `paladin.vengeance` | Vengeance / 复仇 | Fire+Cold+Lightning | Single | 30–50 per element | 2 | 30 | Burn+Chill+Paralyze | Tri-element |
| `paladin.charge` | Charge / 冲锋 | Physical | Single | 80–120 | 3 | 20 | Stun (1 turn) | High damage, repositions |
| `paladin.fist_of_heavens` | Fist of the Heavens / 天堂之拳 | Lightning | All | 100–150 | 4 | 50 | Paralyze | Ultimate AOE |

#### Passive Skills (Auras, only 1 active at a time)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `paladin.might` | Might / 力量 | Per allocated rank: +3% physical damage and +1% Attack; cap20 (+60% / +20%) | Explicit selection; living self + fielded living merc, any position; unlock L1 |
| `paladin.holy_fire` | Holy Fire / 神圣之火 | Selected: 20 base fire damage every 1s to all living enemies; guaranteed mitigated-damage Burn; +3% fire damage/rank | First pulse after 1s; unlock L6/cap20; D05 aura-family contract |
| `paladin.conviction` | Conviction / 信念 | Selected: -25 percentage points to all six enemy resistances; +2% elemental and +1% arcane damage per rank for hero/fielded merc | Unlocks L30, Sanctuary prerequisite; cap20; D05 aura-family contract |
| `paladin.meditation` | Meditation / 冥想 | Per allocated rank: adds 3% of source hero normal mana regeneration per second; cap20 (+60%) | Explicit selection; living self + original living fielded merc, each retains own baseline; unlock L24 |
| `paladin.prayer` | Prayer / 祈祷 | Selected: floor(20 × (1 + 3% × rank)) HP every 5s, capped to missing HP; ranks1/2/20 give20/21/32 | Living hero/original living fielded merc; first heal after 5s, no resurrection; unlock L1/cap20; provisional local interval; D05 aura-family contract |

---

### 3.4 Amazon (亚马逊 — 弓+标枪)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `amazon.magic_arrow` | Magic Arrow / 魔法箭 | Arcane | Single | 35–50 | 1 | 5 | — | 0 ammo cost |
| `amazon.multiple_shot` | Multiple Shot / 多重箭 | Physical | Cone | 40–60 | 2 | 15 | — | Hits 5 targets |
| `amazon.freezing_arrow` | Freezing Arrow / 冰冻箭 | Cold | Cone | 50–70 | 2 | 20 | Chill + Freeze (15%) | Cold AOE |
| `amazon.lightning_fury` | Lightning Fury / 闪电标枪 | Lightning | All | 60–90 | 3 | 30 | Paralyze | Chain lightning effect |
| `amazon.plague_javelin` | Plague Javelin / 瘟疫标枪 | Poison | Cone | 30–50 | 2 | 25 | Poison (3 stacks) + Plague | Spreads on kill |
| `amazon.piercing_strike` | Strafe / 炮轰 | Physical | All | 35–55 | 2 | 20 | — | Rapid multi-hit |

#### Passive and Summon Skills (7)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `amazon.critical_strike` | Critical Strike / 致命攻击 | +1 percentage point crit chance per rank | Unlock L1; cap20; automatic, player only. D05 Amazon contract supersedes fixed15%. |
| `amazon.penetrate` | Penetrate / 穿透 | +3% equipment-derived Attack per rank | Unlock L18; Critical Strike prerequisite; cap20; automatic, player only. Authored `attackPct`, no accuracy/dodge change. |
| `amazon.dodge` | Dodge / 闪避 | +1 percentage point physical dodge per rank | Unlock L6; cap20; automatic, player only. D05 Amazon contract supersedes fixed25%. |
| `amazon.avoid` | Avoid / 躲避 | +1 percentage point magical dodge per rank | Unlock L12; Dodge prerequisite; cap20; automatic, next wave. |
| `amazon.evade` | Evade / 回避 | +0.5 percentage point physical and magical dodge per rank | Unlock L24; Avoid prerequisite; cap20; automatic, next wave; no movement condition. |
| `amazon.pierce` | Pierce / 穿刺 | +2% direct physical damage and +1% equipment-derived Attack per rank | Unlock L30; Penetrate prerequisite; cap20; Attack percentages add with Penetrate; no projectile passthrough. |
| `amazon.valkyrie` | Valkyrie / 女武神 | Summons 1 Valkyrie minion | Unlocks L18 |

---

### 3.5 Barbarian (野蛮人 — 物理+战吼)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `barbarian.bash` | Bash / 猛击 | Physical | Single | 50–70 | 1 | 5 | — | Basic single-target |
| `barbarian.double_swing` | Double Swing / 双手挥击 | Physical | Cleave | 40–60 | 1 | 10 | — | Dual-wield cleave |
| `barbarian.whirlwind` | Whirlwind / 旋风斩 | Physical | All | 60–90 | 2 | 25 | — | AOE physical |
| `barbarian.leap_attack` | Leap Attack / 跳跃攻击 | Physical | All | 70–100 | 3 | 20 | Stun (1 turn) | AOE stun |
| `barbarian.berserk` | Berserk / 狂暴 | Arcane | Single | 80–120 | 2 | 20 | — | Converts physical to arcane |
| `barbarian.war_cry` | War Cry / 战嗥 | — | All | 30–50 | 3 | 30 | Stun (1 turn) | Debuff AOE |

#### Passive skills and combat buffs
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `barbarian.sword_mastery` | Sword Mastery / 剑类精通 | +3% direct physical damage and +0.5pp critical chance per rank | L1, cap20; canonical weapon slot must hold a sword, either handedness; [D05 contract](../plans/decisions/D05-barbarian-weapon-masteries-v1.md) |
| `barbarian.axe_mastery` | Axe Mastery / 斧类精通 | +3% direct physical damage and +0.5pp critical chance per rank | L1, cap20; canonical weapon slot must hold an axe; other learned masteries do not stack |
| `barbarian.mace_mastery` | Mace Mastery / 钝器精通 | +3% direct physical damage and +0.5pp critical chance per rank | L1, cap20; canonical weapon slot must hold a mace; automatic from next wave |
| `barbarian.pole_arm_mastery` | Pole Arm Mastery / 长杆武器精通 | Per allocated rank: +3% direct physical damage and +0.5pp direct-hit critical chance; cap20 | Automatic with canonical weapon-slot polearm; unlock L6; War Pike remains polearm |
| `barbarian.spear_mastery` | Spear Mastery / 矛类精通 | Per allocated rank: +3% direct physical damage and +0.5pp direct-hit critical chance; cap20 | Automatic with canonical weapon-slot spear; unlock L6 |
| `barbarian.throwing_mastery` | Throwing Mastery / 投掷精通 | Per allocated rank: +2.5% direct physical damage and +1% attack speed; cap20 | Automatic with canonical weapon-slot throwing weapon; unlock L6; no critical bonus |
| `barbarian.iron_skin` | Iron Skin / 钢铁之肤 | +4% ordinary defense per allocated rank; cap20/+80% | L18; [D05 controlling contract](../plans/decisions/D05-iron-skin-v1.md) |
| `barbarian.natural_resistance` | Natural Resistance / 自然抗性 | +2pp each of six resistances and +0.5pp magical dodge per rank | L30; Iron Skin prerequisite; cap20; [D05 contract](../plans/decisions/D05-barbarian-endurance-v1.md) |
| `barbarian.increased_stamina` | Increased Stamina / 提升耐力 | +3% equipment-derived combat max life per rank | L12; cap20; automatic, no healing on learning |
| `barbarian.increased_speed` | Increased Speed / 提升速度 | +1% equipment-derived attack speed and +0.5pp physical dodge per rank | L24; Stamina prerequisite; cap20; automatic |
| `barbarian.battle_orders` | Battle Orders / 战斗体制 | +50% max HP/mana at combat start | Buff |
| `barbarian.shout` | Shout / 大叫 | +50% defense to self+merc | Buff, 5 turns |

---

### 3.6 Druid (德鲁伊 — 元素+变形)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `druid.firestorm` | Firestorm / 火焰风暴 | Fire | All | 40–60 | 2 | 20 | Burn | AOE fire |
| `druid.arctic_blast` | Arctic Blast / 极地风暴 | Cold | Cone | 50–70 | 2 | 25 | Chill | Cone cold |
| `druid.tornado` | Tornado / 龙卷风 | Physical | Cone | 60–90 | 2 | 30 | — | Physical AOE |
| `druid.summon_dire_wolf` | Summon Dire Wolf / 召唤狼 | — | Self | — | — | 20 | Summon | Existing authored cap: L1/2/3/6/20→1/2/3/4/8; see D06 v1b (no new tuning). |
| `druid.werewolf_maul` | Werewolf: Maul / 狼人：撕咬 | Physical | Single | 80–120 | 1 | 15 | Bleed | High single-target |
| `druid.hurricane` | Hurricane / 飓风 | Cold | All | 70–100 | 4 | 50 | Chill | Ultimate cold AOE |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `druid.elemental_mastery` | Elemental Mastery / 元素精通 | Per rank: +3% fire/cold damage and +0.5pp magical dodge; unlock30/cap20; hero only, next-wave ([D05](../plans/decisions/D05-poison-elemental-masteries-v1.md)) | |
| `druid.lycanthropy` | Lycanthropy / 变形术 | +50% max HP in werewolf form | |
| `druid.heart_of_wolverine` | Heart of Wolverine / 狼獾之心 | +30% attack speed (aura) | |
| `druid.oak_sage` | Oak Sage / 橡木智者 | +50% max HP (aura) | Unlocks L18 |

---

### 3.7 Assassin (刺客 — 陷阱+武技)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `assassin.shock_web` | Shock Web / 电网 | Lightning | All | 30–50 | 2 | 20 | Paralyze | AOE lightning trap |
| `assassin.fire_blast` | Fire Blast / 火焰爆破 | Fire | Cone | 50–70 | 2 | 25 | Burn | Cone fire trap |
| `assassin.blade_fury` | Blade Fury / 刀刃之怒 | Physical | Cone | 40–60 | 1 | 15 | — | Physical multi-hit |
| `assassin.mind_blast` | Mind Blast / 心灵震爆 | Arcane | All | 50–70 | 3 | 30 | Mana Burn + Stun | Arcane AOE |
| `assassin.dragon_claw` | Dragon Claw / 龙爪 | Physical | Single | 70–100 | 1 | 20 | — | Dual-wield crit boost |
| `assassin.phoenix_strike` | Phoenix Strike / 凤凰打击 | Fire+Cold+Lightning | Single | 40–60 per element | 3 | 40 | Burn+Chill+Paralyze | Tri-element combo |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `assassin.claw_mastery` | Claw Mastery / 爪类武器精通 | Per rank +2.5% Attack/+0.5pp critical chance with a main-hand one-handed claw; cap20 | [D05 contract](../plans/decisions/D05-assassin-weapon-passives-v1.md) |
| `assassin.weapon_block` | Weapon Block / 武器格挡 | Per rank +1pp physical/+0.5pp magical dodge with two distinct one-handed weapons and learned Claw Mastery; unlock12/cap20 | [D05 contract](../plans/decisions/D05-assassin-weapon-passives-v1.md) |
| `assassin.fade` | Fade / 能量消解 | Per rank +2 points to all six resistances/+0.5pp magical dodge; unlock18/cap20 | [D05 contract](../plans/decisions/D05-assassin-shadow-v1.md) |
| `assassin.venom` | Venom / 淬毒 | Per rank +3% poison damage; successful basic hits apply one 5s poison stack, 5% Attack/s before poison bonuses and mitigation; unlock30/cap20 | [D05 contract](../plans/decisions/D05-assassin-shadow-v1.md) |

---

## 4. Monster-Only Skills (~20)

Monsters use a simplified skill set. Examples:

| ID | Name | Element | Target | Base Dmg | CD | Notes |
|---|---|---|---|---|---|---|
| `monster.weak_melee` | Weak Melee | Physical | Single | 10–15 | 1 | Trash mob basic attack |
| `monster.strong_melee` | Strong Melee | Physical | Single | 30–50 | 1 | Elite/boss basic |
| `monster.fire_breath` | Fire Breath | Fire | Cone | 40–60 | 3 | Dragon-type |
| `monster.poison_spit` | Poison Spit | Poison | Single | 20–30 | 2 | Applies 2 poison stacks |
| `monster.lightning_bolt` | Lightning Bolt | Lightning | Single | 50–70 | 2 | Caster mob |
| `monster.frost_aura` | Frost Aura | Cold | All | 15–25 | 3 | Passive AOE chill |
| `monster.charge` | Charge | Physical | Single | 60–90 | 4 | Boss ability |
| `monster.summon_adds` | Summon Minions | — | Self | — | 5 | Boss summons 2 trash |
| `monster.heal` | Heal | — | Self | — | 4 | Restore 30% HP |
| `monster.teleport` | Teleport | — | Self | — | 3 | Repositions, grants 1-turn dodge +50% |

**Design note:** Monsters do NOT have passives or buff management; their AI is "cast skill 1 if ready, else skill 2, else basic attack."

---

## 5. Skill Leveling & Synergy

### 5.1 Skill Points
- **Player gains 1 skill point per level** (L1→L90 = 90 points).
- **Milestone bonuses:** +1 at L12, +1 at L24, +1 at L36 (total 93 points).
- **Quest rewards:** 3 points total from main-quest Act bosses.
- **Total available:** ~96 skill points by L90.

### 5.2 Synergy Bonuses (D2-style)
**v1:** Simplified. No synergy bonuses between skills (to reduce complexity). Each skill scales independently.

**🟡 OPEN (v1.1+):** Add synergy bonuses (e.g., *Fire Bolt* +5% dmg per level of *Fire Ball*).

---

## 6. Buff & Aura Rules

### 6.1 Buff Skills
- **Do not recast while active.** Engine skips buff skills if buff is present.
- **Duration:** Defined per skill (e.g., 5 turns, 10 turns, or "until combat ends").
- **Stacking:** Buffs with same ID do NOT stack. Different buffs (e.g., *Battle Orders* + *Shout*) do stack.

### 6.2 Aura Skills (Paladin-specific)
The implemented player selection supports **None, Might, Meditation, Thorns,
Blessed Aim, Fanaticism, Defiance, Resist Fire, Resist Cold, Resist Lightning,
Salvation, Holy Freeze, Conviction, Holy Fire, Holy Shock, Prayer, Cleansing, Redemption, Vigor and Sanctuary** in one
exclusive saved canonical slot. Stat, enemy, pulse and healing effects follow
[the family contract](../plans/decisions/D05-paladin-aura-family-v1.md).
Concentration still requires its distinct interruption-prevention mechanic;
full aura-catalog and independent acceptance remain open.

- **Selection:** None is physical absence of `selectedAuraId`. Runtime-supported
  selections use canonical `paladin.*` IDs. Each requires Paladin, its own unlock
  level (Might1, Meditation24) and a positive allocated rank. Learning, inspecting
  and combo editing do not select an aura; successful paid respec clears it.
  Old/new characters default to None. Retained but unavailable imported selection
  grants no effect and remains clearable through None.
- **Persistence:** v22 admits the complete twenty-ID canonical aura domain without
  implying runtime support or eligibility. v21 remains frozen to Might/Meditation;
  its validated migration changes only the version. No selection is inferred.
- **Stat auras:** Thorns reflects actual physical HP loss from a surviving
  recipient through existing deterministic thorns mitigation. Blessed Aim affects
  basic Attack and Attack-scaled skill components. Fanaticism changes physical
  increased damage and scheduled cadence; Defiance changes actual Defense.
  Named resistance auras retain their authored all-six-resistance and named
  elemental damage bonuses; Salvation adds fire/cold/lightning damage. Coefficients
  and authored unlocks remain in JSON. These effects apply over baseline views,
  never accumulating into persistent or carried combat stats.
- **Vigor:** authored2% maximum life/0.5% attack speed per rank becomes temporary
  endurance/cadence, replacing nonexistent movement/stamina promises. Extra
  capacity floors once over the fresh maximum; selection grants no healing.
  Existing healing/orbs can fill it; source death removes it and caps actual HP.
  Transient carry identity prevents compounding and is never persisted.
- **Sanctuary:** authored 3% Arcane damage per rank applies to hero/original
  living fielded merc against any target. Every 2000 ms, the living hero deals
  20 base Arcane damage only to explicitly authored undead enemies, including
  factory-backed enemy summons. Repulsion is canonical Stun on survivors for
  500 ms (bosses 250 ms), with no movement. First pulse waits a full interval;
  normal mitigation, source death and next-wave rules apply. See the
  [undead identity contract](../plans/decisions/D05-monster-undead-v1.md).
  Pulse/control tuning is provisional; earned balance remains open.
- **Might strength:** Each allocated rank supplies separate additive physical
  increased damage (+3%) and Attack (+1%), capped at rank20. Basic Attack100
  therefore gives104/192 at ranks1/20; fixed physical100 gives103/160, without new
  weapon scaling.
- **Timing:** Freeze selection, rank and authored strengths at wave input. Stat
  and enemy effects begin at simulation0ms; damage/healing pulses start after
  their first full authored interval. Meditation also freezes the source's authoritative fresh
  `playerToCombatUnit` numeric `manaRegenPerSecond` baseline; equipment and
  effective Energy have already been applied once. Selection, upgrades, equipment
  changes and respec affect the next wave. Explicit replay recomposes current
  eligibility over immutable original resource and all three recovery-carry
  inputs, preserving recorded history; there is no action, mana payment or CD.
- **Recipients:** The exact source hero and exact original living fielded
  mercenary at any position. Summons, enemies and unfielded/replaced mercs receive
  no recipient rank bonuses or periodic aura healing. Enemy aura effects retain the
  family's enemy-target rules, including Conviction benefiting allied summon
  damage. Existing baseline recovery eligibility remains independent.
- **Prayer:** JSON-owned20 base HP every5000ms, first heal one full interval
  after wave entry. Heal floor(base × (1 + 3% × allocated rank)), capped to
  missing HP: ranks1/2/20 give20/21/32. Living hero/original living fielded merc
  only; living source required, crowd control does not suppress. Periodic deaths
  precede healing, healing precedes surviving tied actions, and due60000ms healing
  is included. No resurrection, banking, RNG, mana/cast/action slot, saved timer
  or implicit Vitality baseline regeneration. The interval is provisional local
  tuning; earned balance and independent acceptance remain open.
- **Cleansing:** Independent JSON-owned50% finite Poison/Plague/curse duration
  reduction once per application/first eligible admission; the transient status
  marker prevents repeated cross-wave shortening. Preserve source/potency/stack
  identity and indefinite legacy effects. Source death never lengthens a duration
  already shortened. Independent20-base HP/5000ms recovery uses1.5%/rank,
  floor/cap and the same living-recipient/timeline rules as Prayer; no Prayer
  synergy or Vitality regeneration. Authored magical dodge adds0.5 percentage
  point/rank. These duration/recovery numbers are provisional local defaults;
  earned balance and independent acceptance remain open. Full details in the
  [family contract](../plans/decisions/D05-paladin-aura-family-v1.md).
- **Redemption:** Every5000ms, starting one full interval after each wave entry,
  consume one oldest corpse from the shared CE/PE wave-local pool only if an
  eligible living hero/original fielded merc can recover. One body grants each
  eligible recipient20 base HP/10 base MP, each scaled by its authored2%/rank,
  floored and capped independently. Full resources preserve the body. Existing
  primary death/summon/orphan guards, periodic-death-first ordering, source death,
  deadline/action cap and battle-end rules remain authoritative. No resurrection,
  extra RNG/cast/action/mana cost, banked recovery or saved corpse/timer. The
  interval/base resources are provisional local tuning. Item-granted Redemption
  stays separate; earned balance and independent acceptance remain open.
- **Meditation strength:** Each allocated rank adds3% of the source hero's normal
  mana-regeneration baseline per second to each recipient, capped at rank20/60%.
  Each recipient retains its own existing baseline. Source baseline4 therefore
  gives hero4.12/6.4 and native merc0.12/2.4 MP/s at ranks1/20; a merc with no own
  baseline still receives its eligible additional recovery. This is continuous
  recovery, not percent maximum mana or fixed mana per turn. Cleansing remains a
  learning prerequisite, with no new runtime imported-allocation prerequisite.
- **Exact recovery:** Integrate the recipient's independently qualified baseline
  plus source baseline × authored coefficient × allocated rank in one exact
  decimal MP-millisecond integral. Make one whole-MP/carry/capped commit; do not
  round individual contributions or form a binary rate sum/product first. Existing
  cap reset discards overflow and recovery carry. Switching preserves earned MP
  and carry; it never refills resources or stacks aura effects.
- **Suppression:** Current encounter source absence/death suppresses future
  bonuses; source stun/freeze does not. Might checks current source life for its
  contribution. Meditation captures source/recipient eligibility at interval
  start, then settles periodic effects and rechecks each recipient at the end.
  A surviving merc retains elapsed credit if the source dies at that endpoint;
  a dead recipient receives none. No recovery is added after termination, between
  waves, offline or from playback wallclock. There is no permanent stat mutation.

See [D05 selected Might](../plans/decisions/D05-selected-might-aura-v1.md) and
[D05 Meditation](../plans/decisions/D05-meditation-v1.md) for the controlling
authored, save, selection, exact interval and runtime contracts.

---

## 7. Summon Skills

### 7.1 Summoning Behavior

[D06 v1b](../plans/decisions/D06-summon-preparation-v1.md) is the scoped policy
contract for thirteen summon skills without corpse/item inputs. The bounded
runtime/store/bilingual production-browser path is accepted; see the
[evidence and regression mapping](../plans/evidence/d06-summon-preparation.md).
Full D06/P09, external inputs and earned campaign/balance remain open.

- **Startup:** learned, unlocked, prerequisite-eligible and slotted scoped skills prepare once at time0 of each battle/wave, in stable owner/skill order; canonical/authored alias duplicates count once. Require living opposing sides; initially terminal battles skip scoped preparation (implemented for this scope). Fill only missing living owner/template units, preserving preloaded units and existing positions/identity.
- **Payment:** one existing rank-adjusted mana cost per missing-count batch; zero missing costs nothing. Insufficient mana or invalid template/input spawns nothing, spends nothing and receives no later retry. No ordinary action is consumed. Ignore only the scoped skill's stale carried cooldown for startup; set its normal resulting cooldown once, without clearing unrelated cooldowns.
- **Replacement/death:** scoped skills never cast during ordinary actions. Preparation-enabled owner/template pairs govern matching new/preloaded deaths without mana refunds or cooldown resets; template identity alone does not suppress synthetic legacy behavior. Excluded/synthetic prior behavior remains unaccepted, unchanged until its own reviewed slice; do not globally delete the old replacement/refund branch.
- **Caps:** use current authored per-skill curves, without tuning. Raise Skeleton remains ranks1–5→1,6–11→2,12–20→3 (accepted bounded v1c preparation). Dire Wolf/Raven/Spirit Wolf use the existing first-three-then-every-three curve: ranks1/2/3/6/20→1/2/3/4/8. Singleton templates remain1. Preserve owner/exacttemplate coexistence; no new shared family exclusivity or total-unit cap.
- **Necromancer follow-up:** [D06 v1c](../plans/decisions/D06-summon-corpses-v1.md) chooses the canonical battle-start abstraction for Raise Skeleton, Skeletal Mage and Revive, explicitly superseding their deferred corpse requirement. Their paid preparation without selected/stored/consumed corpses and truthful bilingual copy are accepted with [bounded runtime/UI/browser evidence](../plans/evidence/d06-necromancer-preparation.md); no corpse supply is inferred for other consumers. Preserve authored caps, creation-only Skeleton Mastery and wave carry. Generic Revive lasts until death/wave end; enemy-derived Revive and Mage combat identity receive no full-skill acceptance here.
- **External item:** [Accepted D06 v1d contract](../plans/decisions/D06-iron-golem-v1.md) defines explicit one-shot next-wave selection of an identified backpack metal instance, one-wave sacrifice, isolated life/attack/defense inheritance, exact-once item debit and locked Iron-wave replay. QA/GD/TD approved the mechanic contract; concrete transaction ADR/runtime/UI/browser acceptance remain pending. A generic template does not satisfy it.
- **Wave resources:** preserve accepted D04 transient-summon rebuild and hero/merc resource carry. Each wave's batch pays actual carried mana; no automatic refill or campaign/balance acceptance follows.
- **Summon stats** retain current skill-rank scaling/passives. Production uses authoritative allocated rank; standalone synthetic rank1 fallback is compatibility only, not proof of player learning eligibility.

### 7.2 Summon AI
- **Melee summons:** Target nearest enemy, basic attack.
- **Ranged summons:** Random target, basic attack.
- **Summons do NOT use skills** (v1 simplification).

---

## 8. Open Questions 🟡

| # | Question | Owner | Proposed v1 Default |
|---|---|---|---|
| 1 | Skill synergy bonuses? | game-designer | Not v1; defer to v1.1 |
| 2 | Skill respec cost? | game-designer | Free unlimited respec in town |
| 3 | Skills granted by items (D3-style)? | content-designer | Yes, add `grantedBy: "item_id"` field |

---

## 9. Handoff to Content Designer

**Next steps:**
1. `content-designer` creates `src/data/skills/*.json` files (one per archetype + one for monsters).
2. Populate all 70+ skills with the fields from §2.
3. Validate against `src/data/schema/skill.schema.json` (JSON Schema to be created by `technical-director`).
4. Cross-reference `statusApplied` IDs with `combat-formulas.md` §9.

---

## 10. Change Log

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2025-01-01 | game-designer | Initial v1 catalog (~70 skills) |
