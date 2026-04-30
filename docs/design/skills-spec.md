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
| `sorceress.lightning_mastery` | Lightning Mastery / 雷系精通 | +30% lightning damage | Unlocks at L12 |
| `sorceress.fire_mastery` | Fire Mastery / 火系精通 | +30% fire damage | Unlocks at L12 |
| `sorceress.energy_shield` | Energy Shield / 能量护盾 | 30% damage → mana instead of HP | Unlocks at L18 |

---

### 3.2 Necromancer (死灵法师 — 毒+召唤)

#### Active Skills (6)
| ID | Name (EN / ZH) | Element | Target | Base Dmg (L1) | CD | Mana | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| `necromancer.raise_skeleton` | Raise Skeleton / 召唤骷髅 | — | Self | — | — | 15 | Summon | Summons 1 skeleton (max 5) |
| `necromancer.corpse_explosion` | Corpse Explosion / 尸体爆炸 | Fire | All | 50–80 | 2 | 20 | Burn | Requires corpse (on-kill) |
| `necromancer.poison_nova` | Poison Nova / 剧毒新星 | Poison | All | 20–30 | 3 | 25 | Poison (2 stacks) | Low base, high stack scaling |
| `necromancer.bone_spear` | Bone Spear / 白骨之矛 | Arcane | Single | 60–90 | 1 | 20 | — | Ignores armor |
| `necromancer.amplify_damage` | Amplify Damage / 伤害加深 | — | All | — | 3 | 15 | -50% physical resist debuff | Curse |
| `necromancer.decrepify` | Decrepify / 衰老 | — | All | — | 3 | 20 | -50% attack speed, -33% damage | Curse |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `necromancer.summon_mastery` | Summon Mastery / 召唤精通 | +50% minion HP/damage | |
| `necromancer.poison_mastery` | Poison & Bone Mastery / 毒骨精通 | +30% poison/arcane dmg | |
| `necromancer.corpse_attracter` | Blood Golem / 血石魔像 | Passive: 10% life leech | Always-on aura |
| `necromancer.bone_armor` | Bone Armor / 白骨护甲 | +100 absorb shield at combat start | Buff |

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
| `paladin.might` | Might / 力量 | +50% physical damage | Self + merc |
| `paladin.holy_fire` | Holy Fire / 圣火 | 20 fire damage/turn to all enemies | AOE burn aura |
| `paladin.conviction` | Conviction / 救赎 | -25% enemy all resists | Unlocks L24 |
| `paladin.meditation` | Meditation / 冥想 | +5 mana/turn | Self + merc |

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

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `amazon.critical_strike` | Critical Strike / 致命攻击 | +15% crit chance | |
| `amazon.penetrate` | Penetrate / 穿透 | +20% hit chance (reduces enemy dodge by 20%) | |
| `amazon.dodge` | Dodge / 闪避 | +25% physical dodge | |
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

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `barbarian.iron_skin` | Iron Skin / 钢铁皮肤 | +100% defense | |
| `barbarian.natural_resistance` | Natural Resistance / 自然抗性 | +30% all resists | |
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
| `druid.summon_dire_wolf` | Summon Dire Wolf / 召唤狼 | — | Self | — | — | 20 | Summon | Max 3 wolves |
| `druid.werewolf_maul` | Werewolf: Maul / 狼人：撕咬 | Physical | Single | 80–120 | 1 | 15 | Bleed | High single-target |
| `druid.hurricane` | Hurricane / 飓风 | Cold | All | 70–100 | 4 | 50 | Chill | Ultimate cold AOE |

#### Passive Skills (4)
| ID | Name (EN / ZH) | Effect | Notes |
|---|---|---|---|
| `druid.elemental_mastery` | Elemental Mastery / 元素精通 | +30% fire/cold damage | |
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
| `assassin.claw_mastery` | Claw Mastery / 爪类武器精通 | +50% claw damage | |
| `assassin.weapon_block` | Weapon Block / 武器格挡 | +30% physical dodge when dual-wielding | |
| `assassin.fade` | Fade / 能量消解 | +30% all resists, +15% physical dodge | Buff at combat start |
| `assassin.venom` | Venom / 淬毒 | Basic attacks apply 1 poison stack | Passive enchant |

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
- **Only 1 aura active at a time** per character.
- **Switching aura:** Costs 0 mana, 0 CD, but happens at turn start (not instant).
- **Affects self + mercenary** (if in range).

---

## 7. Summon Skills

### 7.1 Summoning Behavior
- **Summons spawn at combat start** if skill is slotted.
- **Max count:** Defined per skill (e.g., 5 skeletons, 3 wolves, 1 golem).
- **No re-summon mid-combat** unless skill explicitly allows (e.g., "resummon if <max").
- **Summon stats scale with skill level** (HP, damage, attack speed).

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
