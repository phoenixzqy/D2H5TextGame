# Items Spec — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** Diablo 2 patch 1.13c–1.14d, D2 Arreat Summit, PureDiablo wiki, D2R item database
**Cross-refs:** `combat-formulas.md` §3 (damage), `monster-spec.md` (drop level), `drop-tables.md` (TC tables), `skills-spec.md` (skill IDs for +skill mods)

---

## 1. Summary

Item system loosely modeled on Diablo 2 with simplifications for the text/idle context:

- **6 rarity tiers**: white / blue (magic) / yellow (rare) / unique / set / runeword
- **10 equipment slots**: helm, armor, gloves, boots, belt, ring (×2), amulet, weapon-1h, weapon-2h, shield
- **~60 prefixes** + **~60 suffixes** for magic/rare rolls (item level gated)
- **40 unique items**, **6 partial sets** (24 set items), **33 runes** (El→Zod), **25 runewords**
- Items have an **item level (ilvl)** = monster level that dropped it; ilvl gates affix tiers
- **Magic Find (MF)** improves rarity weights via diminishing returns curve

All numeric ranges below are **decided**; balance pass may shift ±20% but tiers are locked.

---

## 2. Rarity Tiers

| Tier | Color | Affix Count | Sockets | Base Drop Weight | Notes |
|---|---|---|---|---|---|
| White (Normal) | white | 0 | 0–2 (rare) | 1000 | Vendor fodder; runeword bases must be white socketed |
| Superior (white+) | grey | 0 (implicit %) | 0–2 | 80 | +5–15% damage OR +5–15% defense |
| Magic (Blue) | blue | 1 prefix + 1 suffix (max) | 0–2 | 300 | Affix tiers gated by ilvl |
| Rare (Yellow) | yellow | 3–6 affixes (≤3 prefix, ≤3 suffix) | 0–2 | 80 | Random name pair |
| Set (Green) | green | Fixed 2–6 set bonuses | Fixed | 8 | Bonuses scale with pieces equipped |
| Unique (Gold) | gold | Fixed 4–8 mods | Fixed | 4 | Named D2-flavored items |
| Crafted (Orange) 🟡 | orange | 4 fixed + 1–4 magic | Fixed | — | 🟡 OPEN (v1.1+) |

**Effective drop weight** is multiplied by `rarityMultiplier(MF)` per `drop-tables.md` §3.

### 2.1 Rarity → Quality Multiplier

When a slot rolls, a single rarity is chosen via weighted RNG. **Final weights** at MF=0:

```
white:80.4%  blue:24.1%  rare:6.4%  set:0.64%  unique:0.32%
(after normalization across all valid bases for the monster's TC)
```

At MF=300: roughly white:55% / blue:30% / rare:10% / set:2.5% / unique:1.5%.

---

## 3. Item Bases

Each slot has 6 base tiers (Normal → Exceptional → Elite, 2 per ladder). Higher tier = higher base stats and **required level (rlvl)**.

### 3.1 Helms

| ID | Name (zh / en) | Tier | rlvl | Base Defense | Implicit |
|---|---|---|---|---|---|
| `helm_cap` | 布帽 / Cap | Normal | 1 | 5–8 | — |
| `helm_skull_cap` | 头骨帽 / Skull Cap | Normal | 5 | 10–14 | — |
| `helm_war_hat` | 战帽 / War Hat | Exceptional | 22 | 25–35 | +1 all skills (1%) |
| `helm_casque` | 头盔 / Casque | Exceptional | 28 | 38–52 | — |
| `helm_armet` | 全盔 / Armet | Elite | 45 | 65–85 | +5% phys dodge |
| `helm_giant_conch` | 巨人海螺 / Giant Conch | Elite | 55 | 90–120 | +20 life |

### 3.2 Body Armor

| ID | Name (zh / en) | Tier | rlvl | Base Defense | Implicit |
|---|---|---|---|---|---|
| `armor_quilted` | 棉甲 / Quilted Armor | Normal | 1 | 8–12 | — |
| `armor_leather` | 皮甲 / Leather Armor | Normal | 6 | 18–24 | — |
| `armor_chain_mail` | 锁子甲 / Chain Mail | Exceptional | 25 | 45–60 | +5 all res |
| `armor_breast_plate` | 胸甲 / Breast Plate | Exceptional | 32 | 65–85 | +10 def |
| `armor_dusk_shroud` | 暮色裹布 / Dusk Shroud | Elite | 50 | 110–140 | +1 socket potential |
| `armor_archon_plate` | 执政官板甲 / Archon Plate | Elite | 60 | 160–200 | +30 life |

### 3.3 Gloves

| ID | Name | Tier | rlvl | Base Defense | Implicit |
|---|---|---|---|---|---|
| `glove_leather` | 皮手套 / Leather Gloves | Normal | 1 | 3–5 | — |
| `glove_heavy` | 重型手套 / Heavy Gloves | Normal | 7 | 6–9 | — |
| `glove_chain` | 锁链手套 / Chain Gloves | Exceptional | 24 | 14–20 | +5% AS |
| `glove_light_gauntlets` | 轻型护手 / Light Gauntlets | Exceptional | 30 | 22–30 | +3 dex |
| `glove_vampirebone` | 吸血鬼骨手套 / Vampirebone Gloves | Elite | 48 | 35–48 | +8% crit chance |
| `glove_bramble_mitts` | 荆棘手套 / Bramble Mitts | Elite | 58 | 50–65 | +10% poison dmg |

### 3.4 Boots

| ID | Name | Tier | rlvl | Base Defense | Implicit |
|---|---|---|---|---|---|
| `boot_leather` | 皮靴 / Boots | Normal | 1 | 3–5 | — |
| `boot_heavy` | 重靴 / Heavy Boots | Normal | 7 | 6–9 | — |
| `boot_chain` | 锁链靴 / Chain Boots | Exceptional | 24 | 14–20 | — |
| `boot_light_plated` | 轻型护甲靴 / Light Plated Boots | Exceptional | 30 | 22–30 | +3 dex |
| `boot_demonhide` | 恶魔皮靴 / Demonhide Boots | Elite | 48 | 35–48 | +10 life |
| `boot_myrmidon_greaves` | 蚁人胫甲 / Myrmidon Greaves | Elite | 58 | 50–65 | +5% all res |

### 3.5 Belts

| ID | Name | Tier | rlvl | Base Defense | Implicit |
|---|---|---|---|---|---|
| `belt_sash` | 饰带 / Sash | Normal | 1 | 2–3 | — |
| `belt_light` | 轻型腰带 / Light Belt | Normal | 7 | 4–6 | — |
| `belt_heavy` | 重型腰带 / Heavy Belt | Exceptional | 22 | 8–12 | — |
| `belt_plated` | 板甲腰带 / Plated Belt | Exceptional | 30 | 14–20 | +10 life |
| `belt_demonhide` | 恶魔皮腰带 / Demonhide Sash | Elite | 48 | 25–35 | +15 life |
| `belt_mithril_coil` | 秘银线圈 / Mithril Coil | Elite | 58 | 40–55 | +20 life, +5 all res |

### 3.6 Rings

| ID | Name | Tier | rlvl | Implicit |
|---|---|---|---|---|
| `ring_iron` | 铁戒 / Iron Ring | Normal | 1 | — |
| `ring_silver` | 银戒 / Silver Ring | Normal | 10 | — |
| `ring_jade` | 玉戒 / Jade Ring | Exceptional | 25 | +5 mana |
| `ring_amber` | 琥珀戒 / Amber Ring | Exceptional | 35 | +5 life |
| `ring_obsidian` | 黑曜戒 / Obsidian Ring | Elite | 50 | +1 random res |
| `ring_zircon` | 锆石戒 / Zircon Ring | Elite | 60 | +1 random res |

### 3.7 Amulets

| ID | Name | Tier | rlvl | Implicit |
|---|---|---|---|---|
| `amu_tin` | 锡项链 / Tin Amulet | Normal | 1 | — |
| `amu_brass` | 黄铜项链 / Brass Amulet | Normal | 10 | — |
| `amu_silver` | 银项链 / Silver Amulet | Exceptional | 25 | +1 random skill |
| `amu_jade` | 玉项链 / Jade Amulet | Exceptional | 35 | +5 mana |
| `amu_obsidian` | 黑曜项链 / Obsidian Amulet | Elite | 50 | +5 all res |
| `amu_zircon` | 锆石项链 / Zircon Amulet | Elite | 60 | +5 all res |

### 3.8 1H Weapons (sword family — others mirrored)

| ID | Name | Tier | rlvl | Base Damage | Implicit |
|---|---|---|---|---|---|
| `wp1h_short_sword` | 短剑 / Short Sword | Normal | 1 | 4–8 | — |
| `wp1h_scimitar` | 弯刀 / Scimitar | Normal | 8 | 7–13 | +5% AS |
| `wp1h_long_sword` | 长剑 / Long Sword | Exceptional | 22 | 14–24 | — |
| `wp1h_war_sword` | 战剑 / War Sword | Exceptional | 32 | 20–32 | +5% crit |
| `wp1h_phase_blade` | 相位之刃 / Phase Blade | Elite | 50 | 32–55 | indestructible |
| `wp1h_legend_sword` | 传奇之剑 / Legend Sword | Elite | 60 | 45–75 | +10% AS |

### 3.9 2H Weapons

| ID | Name | Tier | rlvl | Base Damage | Implicit |
|---|---|---|---|---|---|
| `wp2h_two_handed_sword` | 双手剑 / Two-Handed Sword | Normal | 1 | 8–18 | — |
| `wp2h_great_axe` | 巨斧 / Great Axe | Normal | 8 | 12–24 | — |
| `wp2h_war_pike` | 战矛 / War Pike | Exceptional | 24 | 22–48 | — |
| `wp2h_giant_thresher` | 巨人铡刀 / Giant Thresher | Exceptional | 35 | 32–62 | +10% AS |
| `wp2h_colossus_blade` | 巨像之剑 / Colossus Blade | Elite | 52 | 50–95 | — |
| `wp2h_thunder_maul` | 雷霆战锤 / Thunder Maul | Elite | 62 | 65–120 | +1d6 lightning |

### 3.10 Shields

| ID | Name | Tier | rlvl | Base Block | Base Def | Implicit |
|---|---|---|---|---|---|---|
| `sh_buckler` | 圆盾 / Buckler | Normal | 1 | 15% | 4–8 | — |
| `sh_kite` | 鸢盾 / Kite Shield | Normal | 8 | 25% | 12–18 | — |
| `sh_aegis` | 神盾 / Aegis | Exceptional | 25 | 30% | 22–35 | +5 all res |
| `sh_dragon_shield` | 龙盾 / Dragon Shield | Exceptional | 35 | 32% | 32–48 | +10 fire res |
| `sh_monarch` | 君主盾 / Monarch | Elite | 50 | 35% | 50–75 | sockets up to 4 |
| `sh_sacred_targe` | 神圣轻盾 / Sacred Targe | Elite | 60 | 40% | 70–95 | +10% block |

---

## 4. Affix Pool — 60 Prefixes

Affix tier table: each affix has up to 6 tiers. **ilvl gating**: tier `n` requires ilvl ≥ `n × 8 - 4` (tier 1 from ilvl 4, tier 6 from ilvl 44). Affix value range is per-tier; rare items roll affix value within tier range.

| ID | zh | en | Stat | T1 | T2 | T3 | T4 | T5 | T6 | Slots |
|---|---|---|---|---|---|---|---|---|---|---|
| `pre_sharp` | 锋利的 | Sharp | +% Phys Dmg | 10–20 | 21–40 | 41–60 | 61–90 | 91–130 | 131–180 | weapon |
| `pre_jagged` | 锯齿的 | Jagged | +flat Phys Dmg | 1–3 | 4–6 | 7–10 | 11–15 | 16–22 | 23–30 | weapon |
| `pre_fiery` | 燃烧的 | Fiery | +Fire Dmg | 1–4 | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | weapon |
| `pre_smoking` | 冒烟的 | Smoking | +% Fire Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `pre_chilling` | 冰冷的 | Chilling | +Cold Dmg | 1–4 | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | weapon |
| `pre_glacial` | 冰川的 | Glacial | +% Cold Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `pre_static` | 静电的 | Static | +Lightning Dmg | 1–6 | 7–14 | 15–28 | 29–48 | 49–72 | 73–110 | weapon |
| `pre_thundering` | 雷鸣的 | Thundering | +% Lightning Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `pre_arcane` | 奥术的 | Arcane | +Arcane Dmg | 1–4 | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | weapon |
| `pre_venomous` | 毒液的 | Venomous | +Poison DoT/sec | 1–2 | 3–5 | 6–10 | 11–18 | 19–30 | 31–45 | weapon, glove |
| `pre_thorned` | 尖刺的 | Thorned | Thorns flat | 1–3 | 4–8 | 9–16 | 17–28 | 29–45 | 46–70 | armor, shield |
| `pre_robust` | 强健的 | Robust | +Life | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | armor, helm, belt |
| `pre_mystical` | 神秘的 | Mystical | +Mana | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | helm, amu, ring |
| `pre_strong` | 强壮的 | Strong | +Str | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `pre_dextrous` | 灵巧的 | Dextrous | +Dex | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `pre_vital` | 生命的 | Vital | +Vit | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `pre_lucid` | 清明的 | Lucid | +Energy | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `pre_warding` | 守护的 | Warding | +Defense | 5–10 | 11–25 | 26–50 | 51–90 | 91–150 | 151–230 | armor, shield |
| `pre_shimmering` | 闪耀的 | Shimmering | +All Res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | armor, shield, amu |
| `pre_azure` | 苍蓝的 | Azure | +Cold Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `pre_ruby` | 红宝石的 | Ruby | +Fire Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `pre_amber` | 琥珀的 | Amber | +Lightning Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `pre_emerald` | 翡翠的 | Emerald | +Poison Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `pre_sapphire` | 蓝宝石的 | Sapphire | +Magic Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `pre_swift` | 迅捷的 | Swift | +AS% | 3–5 | 6–9 | 10–13 | 14–17 | 18–22 | 23–28 | weapon, glove |
| `pre_lethal` | 致命的 | Lethal | +Crit Chance% | 2–3 | 4–5 | 6–8 | 9–11 | 12–14 | 15–18 | weapon, amu, glove |
| `pre_savage` | 野蛮的 | Savage | +Crit Dmg% | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | weapon, amu |
| `pre_lifestealing` | 吸血的 | Lifestealing | Life-on-Hit | 1–2 | 3–4 | 5–7 | 8–10 | 11–14 | 15–18 | weapon, amu |
| `pre_manatap` | 吸蓝的 | Manatap | Mana-on-Hit | 1–2 | 3–4 | 5–7 | 8–10 | 11–14 | 15–18 | weapon, amu |
| `pre_piercing` | 穿透的 | Piercing | -% enemy phys res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `pre_burning` | 焚烧的 | Burning | -% enemy fire res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `pre_freezing` | 冰封的 | Freezing | -% enemy cold res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `pre_shocking` | 震击的 | Shocking | -% enemy ltn res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `pre_corrosive` | 腐蚀的 | Corrosive | -% enemy poison res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `pre_nimble` | 敏捷的 | Nimble | +Phys Dodge% | 2–3 | 4–5 | 6–7 | 8–9 | 10–12 | 13–15 | armor, boots |
| `pre_ethereal` | 缥缈的 | Ethereal | +Magic Dodge% | 2–3 | 4–5 | 6–7 | 8–9 | 10–12 | 13–15 | armor, helm, amu |
| `pre_blocking` | 格挡的 | Blocking | +Block% | 2–3 | 4–5 | 6–8 | 9–11 | 12–14 | 15–17 | shield |
| `pre_blessed` | 神佑的 | Blessed | +1 random skill | — | — | T3+ | T3+ | T3+ | T3+ | amu, weapon |
| `pre_arcanist` | 法师的 | Arcanist | +1 to Energy skill tree | — | — | T3+ | T3+ | T3+ | T3+ | amu, helm |
| `pre_warrior` | 战士的 | Warrior | +1 to Strength skill tree | — | — | T3+ | T3+ | T3+ | T3+ | amu, helm |
| `pre_lucky` | 幸运的 | Lucky | +MF% | 5–10 | 11–20 | 21–35 | 36–55 | 56–75 | 76–100 | any |
| `pre_glimmering` | 微光的 | Glimmering | +GF% (gold find) | 10–20 | 21–40 | 41–70 | 71–110 | 111–160 | 161–220 | any |
| `pre_vampiric` | 吸血鬼的 | Vampiric | Life Steal% | 1–2 | 3–4 | 5–6 | 7–8 | 9–11 | 12–14 | weapon |
| `pre_thirsting` | 渴血的 | Thirsting | Mana Steal% | 1–2 | 3–4 | 5–6 | 7–8 | 9–11 | 12–14 | weapon |
| `pre_dread` | 恐惧的 | Dread | +Stun Chance% | 3–5 | 6–8 | 9–12 | 13–16 | 17–20 | 21–25 | weapon |
| `pre_shocking_aoe` | 闪电链的 | Chain | +Lightning Chain% | 5 | 10 | 15 | 20 | 25 | 30 | weapon |
| `pre_explosive` | 爆裂的 | Explosive | +Fire Splash% | 5 | 10 | 15 | 20 | 25 | 30 | weapon |
| `pre_pure` | 纯净的 | Pure | +Light Radius (cosmetic) | — | — | — | — | — | — | helm |
| `pre_holy` | 神圣的 | Holy | +Damage vs Undead% | 10–20 | 21–35 | 36–55 | 56–80 | 81–110 | 111–150 | weapon |
| `pre_demonic` | 恶魔的 | Demonic | +Damage vs Demons% | 10–20 | 21–35 | 36–55 | 56–80 | 81–110 | 111–150 | weapon |
| `pre_godly` | 神迹的 | Godly | +1 all skills | — | — | — | — | T5+ | T6 | amu, weapon |
| `pre_replenishing` | 再生的 | Replenishing | Life Regen/sec | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | armor, helm, belt |
| `pre_meditative` | 冥想的 | Meditative | Mana Regen/sec | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | helm, amu |
| `pre_resolute` | 坚毅的 | Resolute | Reduced Stun Duration% | 5 | 10 | 15 | 20 | 25 | 30 | helm, boots |
| `pre_iron` | 铁铸的 | Iron | +% Defense | 10–20 | 21–40 | 41–70 | 71–100 | 101–140 | 141–200 | armor, shield |
| `pre_rugged` | 粗犷的 | Rugged | +Max Life% | 1 | 2 | 3 | 4 | 5 | 6 | armor, belt |
| `pre_sage` | 贤者的 | Sage | +Max Mana% | 1 | 2 | 3 | 4 | 5 | 6 | helm, amu |
| `pre_keen` | 敏锐的 | Keen | +ToHit% | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | weapon, amu |
| `pre_radiant` | 光辉的 | Radiant | Magic Find Aura (party) | 5 | 8 | 12 | 16 | 20 | 25 | amu |
| `pre_grandmaster` | 大师的 | Grandmaster | +2 to single skill | — | — | T3+ | T3+ | T3+ | T3+ | amu |

## 5. Affix Pool — 60 Suffixes

| ID | zh | en | Stat | T1 | T2 | T3 | T4 | T5 | T6 | Slots |
|---|---|---|---|---|---|---|---|---|---|---|
| `suf_of_health` | 生命之 | of Health | +Life | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | armor, helm |
| `suf_of_the_mind` | 智慧之 | of the Mind | +Mana | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | helm, amu |
| `suf_of_strength` | 力量之 | of Strength | +Str | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_dexterity` | 敏捷之 | of Dexterity | +Dex | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_vitality` | 生命力之 | of Vitality | +Vit | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_energy` | 能量之 | of Energy | +Energy | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_warding` | 守护之 | of Warding | +All Res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | armor, shield, amu |
| `suf_of_flame` | 火焰之 | of Flame | +Fire Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `suf_of_ice` | 冰霜之 | of Ice | +Cold Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `suf_of_thunder` | 雷电之 | of Thunder | +Lightning Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `suf_of_venom` | 剧毒之 | of Venom | +Poison Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `suf_of_shielding` | 庇护之 | of Shielding | +Magic Res | 3–8 | 9–15 | 16–22 | 23–30 | 31–38 | 39–48 | any |
| `suf_of_speed` | 神速之 | of Speed | +AS% | 3–5 | 6–9 | 10–13 | 14–17 | 18–22 | 23–28 | weapon, glove |
| `suf_of_alacrity` | 敏捷之 | of Alacrity | +Cooldown Reduction% | 2–4 | 5–7 | 8–10 | 11–13 | 14–16 | 17–20 | helm, amu |
| `suf_of_precision` | 精准之 | of Precision | +Crit Chance% | 2–3 | 4–5 | 6–8 | 9–11 | 12–14 | 15–18 | any |
| `suf_of_carnage` | 屠戮之 | of Carnage | +Crit Dmg% | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | weapon, amu |
| `suf_of_butchery` | 屠夫之 | of Butchery | +% Phys Dmg | 10–20 | 21–40 | 41–60 | 61–90 | 91–130 | 131–180 | weapon |
| `suf_of_burning` | 燃烧之 | of Burning | +% Fire Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `suf_of_frost` | 寒霜之 | of Frost | +% Cold Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `suf_of_storms` | 风暴之 | of Storms | +% Ltn Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `suf_of_blight` | 凋零之 | of Blight | +% Poison Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `suf_of_arcana` | 奥秘之 | of Arcana | +% Arcane Dmg | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | any |
| `suf_of_lifesteal` | 吸血之 | of Lifesteal | Life Steal% | 1–2 | 3–4 | 5–6 | 7–8 | 9–11 | 12–14 | weapon |
| `suf_of_manasteal` | 吸魔之 | of Manasteal | Mana Steal% | 1–2 | 3–4 | 5–6 | 7–8 | 9–11 | 12–14 | weapon |
| `suf_of_regeneration` | 再生之 | of Regeneration | Life Regen/s | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | armor, helm, belt |
| `suf_of_meditation` | 冥想之 | of Meditation | Mana Regen/s | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | helm, amu |
| `suf_of_thorns` | 荆棘之 | of Thorns | Thorns flat | 1–3 | 4–8 | 9–16 | 17–28 | 29–45 | 46–70 | armor, shield |
| `suf_of_thorned_rage` | 暴怒荆棘之 | of Thorned Rage | Thorns% | 50 | 100 | 200 | 350 | 500 | 750 | armor |
| `suf_of_blocking` | 格挡之 | of Blocking | +Block% | 2–3 | 4–5 | 6–8 | 9–11 | 12–14 | 15–17 | shield |
| `suf_of_evasion` | 闪避之 | of Evasion | +Phys Dodge% | 2–3 | 4–5 | 6–7 | 8–9 | 10–12 | 13–15 | armor, boots |
| `suf_of_phasing` | 相位之 | of Phasing | +Magic Dodge% | 2–3 | 4–5 | 6–7 | 8–9 | 10–12 | 13–15 | armor, helm |
| `suf_of_balance` | 平衡之 | of Balance | Reduced Stun Dur% | 5 | 10 | 15 | 20 | 25 | 30 | helm, boots |
| `suf_of_perfection` | 完美之 | of Perfection | +ToHit% | 5–10 | 11–20 | 21–35 | 36–55 | 56–80 | 81–110 | weapon |
| `suf_of_truth` | 真实之 | of Truth | +Damage vs Undead% | 10–20 | 21–35 | 36–55 | 56–80 | 81–110 | 111–150 | weapon |
| `suf_of_slaying` | 屠戮恶魔之 | of Slaying | +Damage vs Demons% | 10–20 | 21–35 | 36–55 | 56–80 | 81–110 | 111–150 | weapon |
| `suf_of_quickness` | 急速之 | of Quickness | +Movement (idle tick speed)% | 2 | 4 | 6 | 8 | 10 | 12 | boots |
| `suf_of_passage` | 旅者之 | of Passage | +XP gain% | 2 | 3 | 5 | 7 | 9 | 12 | helm, amu, ring |
| `suf_of_chance` | 机运之 | of Chance | +MF% | 5–10 | 11–20 | 21–35 | 36–55 | 56–75 | 76–100 | any |
| `suf_of_greed` | 贪婪之 | of Greed | +GF% | 10–20 | 21–40 | 41–70 | 71–110 | 111–160 | 161–220 | any |
| `suf_of_the_bear` | 熊之 | of the Bear | +Stun Chance% | 3–5 | 6–8 | 9–12 | 13–16 | 17–20 | 21–25 | weapon |
| `suf_of_freezing` | 冰封之 | of Freezing | +Freeze Chance% | 5 | 10 | 15 | 20 | 25 | 30 | weapon |
| `suf_of_blinding` | 致盲之 | of Blinding | +Blind Chance% | 5 | 10 | 15 | 20 | 25 | 30 | weapon, helm |
| `suf_of_amplification` | 放大之 | of Amplification | -% enemy phys res | 2–4 | 5–7 | 8–11 | 12–15 | 16–19 | 20–24 | weapon |
| `suf_of_destruction` | 毁灭之 | of Destruction | +% Damage all | 5 | 10 | 15 | 20 | 25 | 30 | weapon |
| `suf_of_kings` | 王者之 | of Kings | +1 all skills | — | — | — | — | T5+ | T6 | amu |
| `suf_of_apprentice` | 学徒之 | of Apprentice | +1 random skill | — | — | T3+ | T3+ | T3+ | T3+ | amu |
| `suf_of_the_whale` | 巨鲸之 | of the Whale | +Life large | 25 | 50 | 75 | 100 | 130 | 160 | armor, belt |
| `suf_of_the_titan` | 泰坦之 | of the Titan | +Str large | 5 | 8 | 11 | 14 | 17 | 20 | armor, weapon |
| `suf_of_wraith` | 死灵之 | of Wraith | Curse-on-Hit (weakness) | 5% | 10% | 15% | 20% | 25% | 30% | weapon |
| `suf_of_doom` | 末日之 | of Doom | Curse-on-Hit (decrepify) | 3% | 5% | 8% | 12% | 16% | 20% | weapon |
| `suf_of_remedy` | 解药之 | of Remedy | Reduced Poison Dur% | 10 | 20 | 30 | 40 | 50 | 60 | helm, amu |
| `suf_of_warmth` | 温暖之 | of Warmth | Reduced Cold Dur% | 10 | 20 | 30 | 40 | 50 | 60 | helm, boots |
| `suf_of_grounding` | 接地之 | of Grounding | Reduced Stun Dur% | 5 | 10 | 15 | 20 | 25 | 30 | helm, boots |
| `suf_of_might` | 强力之 | of Might | +Str | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_the_fox` | 狐狸之 | of the Fox | +Dex | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_the_giant` | 巨人之 | of the Giant | +Vit | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_sorcery` | 巫术之 | of Sorcery | +Energy | 1–2 | 3–5 | 6–9 | 10–14 | 15–20 | 21–28 | any |
| `suf_of_haste` | 神速之 | of Haste | +AS% | 3–5 | 6–9 | 10–13 | 14–17 | 18–22 | 23–28 | weapon, glove |
| `suf_of_pacing` | 步调之 | of Pacing | +Cooldown Reduction% | 2–4 | 5–7 | 8–10 | 11–13 | 14–16 | 17–20 | helm, amu |
| `suf_of_assault` | 突袭之 | of Assault | +AoE Damage% | 5 | 10 | 15 | 20 | 25 | 30 | weapon, glove |
| `suf_of_finality` | 终结之 | of Finality | +Damage to Low-HP enemies% | 10 | 20 | 30 | 40 | 50 | 60 | weapon |

---

## 6. Unique Items (40)

All uniques have **fixed stats** within ±10% roll variance (4 stats variable, rest fixed). `clvl` = required character level.

### 6.1 Helms (5)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_shako` | 哈拉迪克之心 / Harlequin Crest (Shako) | War Hat | 50 | +2 all skills, +1 to all attributes per clvl, +50% MF, +75 life, +75 mana, dmg taken -10% |
| `uniq_andariels_visage` | 安达利尔的容貌 / Andariel's Visage | Demonhead | 60 | +2 Strength tree, +30% AS, +10% life leech, +20% poison dmg, fire res -30, +120 def |
| `uniq_crown_of_ages` | 时代之冠 / Crown of Ages | Corona | 65 | +1 all skills, dmg reduced 10–15%, +20% all res, 2 sockets, +50 life |
| `uniq_giant_skull` | 巨人头骨 / Giant Skull | Bone Visage | 60 | +2 Strength tree, +50 str, 25% chance to stun, +200 def |
| `uniq_griffons_eye` | 狮鹫之眼 / Griffon's Eye | Diadem | 65 | +1 all skills, +20% lightning dmg, -20% enemy ltn res, +15% AS |

### 6.2 Body Armors (5)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_skin_of_vipermagi` | 蛇魔之皮 / Skin of the Vipermagi | Serpentskin Armor | 29 | +1 all skills, +30% all res, +30% Faster Cast (cooldown reduction), magic dmg taken -8 |
| `uniq_que_hegan_wisdom` | 奎黑根的智慧 / Que-Hegan's Wisdom | Mage Plate | 51 | +2 Energy tree, +20% mana, +15% AS, +30 mana, dmg taken -3 |
| `uniq_tyraels_might` | 泰瑞尔之力 / Tyrael's Might | Sacred Armor | 84 | +2 all skills, +20–30 all stats, dmg reduced 10–15%, +30% MF, +1.0% life regen |
| `uniq_arkaines_valor` | 阿凯尼之勇 / Arkaine's Valor | Balrog Skin | 85 | +1–2 all skills, +150–180 def, +0.5–1 life per clvl, dmg reduced 10–15%, +30 vit |
| `uniq_chains_of_honor` | 荣耀之链 / Chains of Honor (unique armor variant) | Archon Plate | 65 | +2 all skills, +65% all res, +200 def, +20 str, +20 vit |

### 6.3 Gloves (4)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_dracs_grasp` | 龙影之握 / Dracul's Grasp | Vampirebone Gloves | 76 | +10–15% life leech, 5–10% open wounds, +20 str, +25% phys dmg |
| `uniq_steelrend` | 钢铁撕裂 / Steelrend | Ogre Gauntlets | 70 | +20% phys dmg, +60–90 def, +20–30 str |
| `uniq_lavagout` | 熔岩涌出 / Lava Gout | Battle Gauntlets | 42 | +20% AS, +24% fire dmg, hit casts L5 Enchant 2% |
| `uniq_magefist` | 法师拳套 / Magefist | Light Gauntlets | 23 | +20% Faster Cast, +1 Fire skills, +20–30% fire dmg, +1 mana regen |

### 6.4 Boots (4)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_war_traveler` | 战神旅程 / War Traveler | Battle Boots | 42 | +50% MF, +10% AS, +15–25 str, +15–25 vit, +15 dmg |
| `uniq_gore_riders` | 血腥骑乘 / Gore Rider | War Boots | 47 | +30% AS, 10% open wounds, 15% crushing blow, 10% deadly strike |
| `uniq_silkweave` | 丝织之履 / Silkweave | Mesh Boots | 50 | +5 mana per kill, +30% Faster Cast, +50% mana, +20% magic dodge |
| `uniq_marrowwalk` | 骨髓行者 / Marrowwalk | Boneweave Boots | 66 | +1 Strength tree, +20–25 str, +20% AS, +120 def |

### 6.5 Belts (4)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_string_of_ears` | 双耳串 / String of Ears | Demonhide Sash | 29 | +6–8% life leech, dmg reduced 10–15%, +75 def, +15 vit |
| `uniq_arachnids_mesh` | 蜘蛛之网 / Arachnid Mesh | Spiderweb Sash | 80 | +1 all skills, +20% Faster Cast, +5% max mana, slows target by 10% (idle tick) |
| `uniq_thundergods_vigor` | 雷神之能 / Thundergod's Vigor | War Belt | 47 | +20 str, +20 vit, +1–3 ltn skills, +10% max ltn res, +5–10 ltn dmg, hit casts L5 Fist of Heavens 5% |
| `uniq_verdungos_hearty` | 维顿戈斐肉块 / Verdungo's Hearty Cord | Mithril Coil | 63 | +30–40 vit, dmg reduced 10–15%, +100 mana, +10% all res |

### 6.6 Rings (4)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_stone_of_jordan` | 乔丹之石 / Stone of Jordan (SoJ) | Ring | 29 | +1 all skills, +20 mana, +25% max mana, +1–12 ltn dmg |
| `uniq_bul_kathos` | 布尔·卡索之戒 / Bul-Kathos' Wedding Band | Ring | 58 | +1 all skills, +3–5% life leech, +50 life, +20 str |
| `uniq_raven_frost` | 寒鸦之霜 / Raven Frost | Ring | 45 | +15–20 dex, +40 mana, +250 def vs missile, cannot be frozen, +15–45 cold dmg |
| `uniq_carrion_wind` | 腐风 / Carrion Wind | Ring | 60 | +10% phys dodge, +20% poison dmg, +10% all res, hit casts L8 Twister 8% |

### 6.7 Amulets (4)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_mara_kaleidoscope` | 玛拉的万花筒 / Mara's Kaleidoscope | Amulet | 67 | +2 all skills, +5 all stats, +20–30% all res |
| `uniq_highlords_wrath` | 高地领主之怒 / Highlord's Wrath | Amulet | 65 | +1 all skills, +20% AS, +1% deadly strike per clvl, +20 ltn dmg |
| `uniq_atmas_scarab` | 阿特玛圣甲虫 / Atma's Scarab | Amulet | 60 | +2 Strength tree, +5–10% life leech, hit casts Amplify Damage 5% |
| `uniq_seraphs_hymn` | 炽天使之歌 / Seraph's Hymn | Amulet | 65 | +2 all skills, +75% damage vs demons & undead, +50 def |

### 6.8 Weapons (8)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_grandfather` | 祖父 / The Grandfather | Colossus Blade | 81 | +1 all skills, +200% phys dmg, +20 all stats, +80 max dmg, +50% AS |
| `uniq_doombringer` | 末日使者 / Doombringer | Champion Sword | 69 | +180–220% phys dmg, +5% life leech, +40 str, hit casts L20 Weaken 8% |
| `uniq_breath_of_the_dying` | 垂死之息 / Breath of the Dying | Phase Blade | 69 | +60% AS, +400% phys dmg vs undead, +50 all stats, +12% life leech |
| `uniq_windforce` | 风之力 / Windforce | Hydra Bow | 73 | +250% phys dmg, +20% AS, hit casts L10 Knockback 8%, +8 mana per hit |
| `uniq_buriza_do_kyanon` | 布利泽多·凯农 / Buriza-Do Kyanon | Ballista | 65 | +200% phys dmg, +50% AS, +40% pierce, +10–14 cold dmg |
| `uniq_eaglehorn` | 鹰角弓 / Eaglehorn | Crusader Bow | 69 | +1 Dex tree, +200% phys dmg, +200 ToHit, +15% Pierce |
| `uniq_oculus` | 眼眸 / The Oculus (orb) | Swirling Crystal | 42 | +3 Energy tree, +20% all res, +20% MF, +50% mana, hit casts Teleport 5% |
| `uniq_griffons_strike` | 狮鹫之击 / Griffon's Strike | Thunder Maul | 65 | +250% phys dmg, +30% AS, hit casts L20 Charged Bolt 10% |

### 6.9 Shields (2)

| ID | zh / en | Base | clvl | Mods |
|---|---|---|---|---|
| `uniq_stormshield` | 风暴之盾 / Stormshield | Monarch | 73 | dmg reduced 35%, +25% Lightning Res, +30% Block, +30 str, +60% def |
| `uniq_homunculus` | 巫毒人偶 / Homunculus | Hierophant Trophy | 50 | +2 Energy tree, +50% Block, +20% all res, +40% mana |

---

## 7. Sets (6 partial sets, 24 items)

Each set has **4 pieces** with cumulative bonuses (2-piece, 3-piece, 4-piece). Sets are themed; partial bonuses are additive with set item's own mods.

### 7.1 Tal Rasha's Wrappings (sorceress, 4 pieces)
- `set_talrasha_amu` Tal Rasha's Adjudication (amulet, clvl 67): +2 all skills, +20% MF
- `set_talrasha_armor` Tal Rasha's Guardianship (Lacquered Plate, clvl 71): +88 life, +10% all res
- `set_talrasha_helm` Tal Rasha's Horadric Crest (Death Mask, clvl 66): +60 life, +10% life leech
- `set_talrasha_belt` Tal Rasha's Fine-Spun Cloth (Mesh Belt, clvl 53): +5–15 dex, +20–60 mana
- **2-set:** +15% all elemental dmg
- **3-set:** +1 all skills
- **4-set:** +20% Faster Cast, +30% all res, +120 mana

### 7.2 Immortal King (barbarian, 4 pieces)
- `set_ik_helm` Immortal King's Will (Avenger Guard, clvl 47): +25% MF, +5% deadly strike
- `set_ik_armor` Immortal King's Soul Cage (Sacred Armor, clvl 76): +2 Str tree, +15% AS, +120 def
- `set_ik_gloves` Immortal King's Forge (War Gauntlets, clvl 59): +20 str, +65% phys dmg
- `set_ik_belt` Immortal King's Detail (War Belt, clvl 47): +25% phys dmg, +20 str
- **2-set:** +25 vit
- **3-set:** +50% AS
- **4-set:** +1 all skills, +200% phys dmg, +50 all stats

### 7.3 Natalya's Odium (assassin-style, 4 pieces)
- `set_nat_helm` Natalya's Totem (Grim Helm, clvl 59): +1 Dex tree, +20% all res
- `set_nat_armor` Natalya's Shadow (Loricated Mail, clvl 73): +75 def, +20 dex, +25 vit
- `set_nat_boots` Natalya's Soul (Mesh Boots, clvl 25): +30% AS, +25% MF
- `set_nat_weapon` Natalya's Mark (Scissors Suwayyah, clvl 79): +200% phys dmg, +20% crit
- **2-set:** +15% phys dodge
- **3-set:** +30% Cold Res
- **4-set:** +2 all skills, +30% AS, +50% deadly strike

### 7.4 Trang-Oul's Avatar (necromancer-style, 4 pieces)
- `set_trang_helm` Trang-Oul's Guise (Bone Visage, clvl 65): +30 vit, +50 mana
- `set_trang_armor` Trang-Oul's Scales (Chaos Armor, clvl 49): +50% all res
- `set_trang_gloves` Trang-Oul's Claws (Heavy Bracers, clvl 45): +20% Faster Cast
- `set_trang_belt` Trang-Oul's Girth (Troll Belt, clvl 62): +75 life
- **2-set:** +1 to Cold skills
- **3-set:** +25% Fire absorb
- **4-set:** +1 all skills, hit casts L10 Decrepify 10%, +30% poison dmg

### 7.5 Aldur's Watchtower (druid-style, 4 pieces)
- `set_aldur_helm` Aldur's Stony Gaze (Hunter's Guise, clvl 36): +20% AS, +25 mana
- `set_aldur_armor` Aldur's Deception (Shadow Plate, clvl 76): +2 Vit tree, +90 life
- `set_aldur_boots` Aldur's Advance (Battle Boots, clvl 45): +50 life, +10% all res
- `set_aldur_weapon` Aldur's Rhythm (Jagged Star, clvl 42): +100% phys dmg, +20% AS
- **2-set:** +20 dex
- **3-set:** +20% MF
- **4-set:** +1 all skills, +50% phys dmg, +60 life

### 7.6 Griswold's Legacy (paladin-style, 4 pieces)
- `set_gris_helm` Griswold's Valor (Corona, clvl 69): +1 Str tree, +50 life
- `set_gris_armor` Griswold's Heart (Ornate Plate, clvl 69): +120 def, +25 str
- `set_gris_shield` Griswold's Honor (Vortex Shield, clvl 69): +40% Block, +20% all res
- `set_gris_weapon` Griswold's Redemption (Caduceus, clvl 69): +180% phys dmg, +1 all skills
- **2-set:** +20% AS
- **3-set:** +25% all res
- **4-set:** +2 all skills, +50% phys dmg, +50% damage vs demons

---

## 8. Runes (33: El→Zod)

Runes drop in **rune tiers** by Act. Higher runes have exponentially lower drop rate.

| # | ID | Rune | Tier | Earliest Act | Weapon Mod | Armor/Helm Mod | Shield Mod | Drop Weight (TC) |
|---|---|---|---|---|---|---|---|---|
| 1 | `rune_el` | El | 1 | I | +50 ToHit, +1 light radius | +15 def | +15 def, +1 light | 10000 |
| 2 | `rune_eld` | Eld | 1 | I | +75% dmg vs undead | +15% slow stamina drain | +7% block | 9000 |
| 3 | `rune_tir` | Tir | 1 | I | +2 mana per kill | +2 mana per kill | +2 mana per kill | 8000 |
| 4 | `rune_nef` | Nef | 1 | I | knockback 33% | +30 def vs missile | +30 def vs missile | 7000 |
| 5 | `rune_eth` | Eth | 1 | I | -25% target def | regen mana 15% | regen mana 15% | 6000 |
| 6 | `rune_ith` | Ith | 1 | II | +9 max dmg | dmg taken -15% | dmg taken -15% | 5000 |
| 7 | `rune_tal` | Tal | 1 | II | +75 poison dmg/5s | +30% poison res | +35% poison res | 4500 |
| 8 | `rune_ral` | Ral | 1 | II | +5–30 fire dmg | +30% fire res | +35% fire res | 4000 |
| 9 | `rune_ort` | Ort | 1 | II | +1–50 ltn dmg | +30% ltn res | +35% ltn res | 3500 |
| 10 | `rune_thul` | Thul | 1 | II | +3–14 cold dmg | +30% cold res | +35% cold res | 3000 |
| 11 | `rune_amn` | Amn | 2 | III | +7% life leech | thorns 14 | thorns 14 | 2500 |
| 12 | `rune_sol` | Sol | 2 | III | +9 min dmg | dmg taken -7 | dmg taken -7 | 2000 |
| 13 | `rune_shael` | Shael | 2 | III | +20% AS | +20% Faster Hit Recovery | +20% Faster Block | 1500 |
| 14 | `rune_dol` | Dol | 2 | III | hit causes flee 25% | replenish life +7 | replenish life +7 | 1200 |
| 15 | `rune_hel` | Hel | 2 | III | -20% req | -15% req | -15% req | 1000 |
| 16 | `rune_io` | Io | 2 | III | +10 vit | +10 vit | +10 vit | 850 |
| 17 | `rune_lum` | Lum | 2 | III | +10 energy | +10 energy | +10 energy | 700 |
| 18 | `rune_ko` | Ko | 2 | IV | +10 dex | +10 dex | +10 dex | 580 |
| 19 | `rune_fal` | Fal | 2 | IV | +10 str | +10 str | +10 str | 480 |
| 20 | `rune_lem` | Lem | 2 | IV | +75% gold find | +50% gold find | +50% gold find | 380 |
| 21 | `rune_pul` | Pul | 3 | IV | +75% dmg vs demons | +30% def | +30% def | 280 |
| 22 | `rune_um` | Um | 3 | IV | 25% open wounds | +15% all res | +22% all res | 200 |
| 23 | `rune_mal` | Mal | 3 | V | prevents monster heal | magic dmg taken -7 | magic dmg taken -7 | 140 |
| 24 | `rune_ist` | Ist | 3 | V | +30% MF | +25% MF | +25% MF | 95 |
| 25 | `rune_gul` | Gul | 3 | V | +20% AR | +5% max ltn res | +5% max ltn res | 60 |
| 26 | `rune_vex` | Vex | 3 | V | +7% mana steal | +5% max fire res | +5% max fire res | 36 |
| 27 | `rune_ohm` | Ohm | 3 | V | +50% phys dmg | +5% max cold res | +5% max cold res | 22 |
| 28 | `rune_lo` | Lo | 3 | V | 20% deadly strike | +5% max poison res | +5% max poison res | 13 |
| 29 | `rune_sur` | Sur | 4 | V | hit blinds target | +5% max mana | +50 mana | 8 |
| 30 | `rune_ber` | Ber | 4 | V | 20% crushing blow | dmg reduced 8% | dmg reduced 8% | 5 |
| 31 | `rune_jah` | Jah | 4 | V | ignores target def | +5% max life | +50 life | 3 |
| 32 | `rune_cham` | Cham | 4 | V | hit freezes 3s | cannot be frozen | cannot be frozen | 2 |
| 33 | `rune_zod` | Zod | 4 | V | indestructible | indestructible | indestructible | 1 |

Per-Act drop tables in `drop-tables.md` §4. **Higher runes (≥Mal) only drop from elite/champion/boss**.

---

## 9. Runewords (25)

Recipe = base type with required sockets, ordered runes inserted. Bonus is **fixed** (no roll variance).

| ID | Name | Recipe | Base | Bonuses |
|---|---|---|---|---|
| `rw_steel` | Steel | Tir + El | 2-soc weapon | +25% AS, +20% phys dmg, +50 ToHit, +1 light, +2 mana/kill |
| `rw_stealth` | Stealth | Tal + Eth | 2-soc armor | +25% Faster Cast, +25% Faster Hit Recovery, +6 dex, +15 mana, +30% poison res, +10 magic dmg taken |
| `rw_leaf` | Leaf | Tir + Ral | 2-soc staff | +3 Fire skills, +75 fire dmg, +cold res 33% |
| `rw_malice` | Malice | Ith + El + Eth | 3-soc weapon | +33% phys dmg, +50 AR, +9 min dmg, +5 life regen, prevents heal, drains 5 life/s |
| `rw_strength` | Strength | Amn + Tir | 2-soc weapon | +35% phys dmg, +25% crit, +7% life leech, +2 mana/kill, +20 str, +10 vit |
| `rw_ancients_pledge` | Ancient's Pledge | Ral + Ort + Tal | 3-soc shield | +50% def, +43% cold res, +48% fire res, +48% ltn res, +48% poison res |
| `rw_lore` | Lore | Ort + Sol | 2-soc helm | +1 all skills, +10 energy, +30% ltn res, dmg taken -7, +2 light radius |
| `rw_wealth` | Wealth | Lem + Ko + Tir | 3-soc armor | +300% gold find, +100% MF, +10 dex, +2 mana/kill |
| `rw_steelclash` | Steelclash | Shael + Eth + Lum | 3-soc shield | +60% Faster Block, +25% Block, +20% Faster Hit Recovery, +1 all skills, regen mana 15% |
| `rw_smoke` | Smoke | Nef + Lum | 2-soc armor | +75% all res, +280 def vs missile, +20% Faster Hit Recovery, +10 energy, hit blinds target |
| `rw_rhyme` | Rhyme | Shael + Eth | 2-soc shield | +40% Faster Block, +20% Block, regen mana 15%, +25% all res, +50% MF, +25% gold find, cannot be frozen |
| `rw_insight` | Insight | Ral + Tir + Tal + Sol | 4-soc weapon (polearm/staff) | +35% Faster Cast, Meditation aura (+8 mana regen), +200% dmg, +9 min dmg, +180 AR, +5 all stats, +2 all skills |
| `rw_treachery` | Treachery | Shael + Thul + Lem | 3-soc armor | +45% AS, +20% Faster Hit Recovery, +2 to Dex tree, hit casts Venom 25%, +50% gold find |
| `rw_duress` | Duress | Shael + Um + Thul | 3-soc armor | +40% AS, +10–20% phys dmg, +15% crushing blow, +33% open wounds, +37–133 cold dmg, dmg reduced 7%, +15% all res |
| `rw_spirit` | Spirit | Tal + Thul + Ort + Amn | 4-soc sword/shield | +2 all skills, +25–35% Faster Cast, +55% Faster Hit Recovery, +40% Faster Block (shield), +112 mana, +89 life, +25% cold res, +35% ltn res, +35% poison res |
| `rw_lionheart` | Lionheart | Hel + Lum + Fal | 3-soc armor | +20 str, +15 vit, +20% phys dmg, +50 life, +30% all res, -15% req |
| `rw_obedience` | Obedience | Hel + Ko + Thul + Eth + Fal | 5-soc polearm | +370% phys dmg, +40% Faster Hit Recovery, +200 AR, +75 cold dmg, -25% target def, +30% all res, +10 str, +10 dex, -20% req |
| `rw_passion` | Passion | Dol + Ort + Eld + Lem | 4-soc weapon | +25% AS, +160–210% phys dmg, +50–80% damage vs undead, hit causes flee 25%, +75% gold find |
| `rw_oath` | Oath | Shael + Pul + Mal + Lum | 4-soc weapon | +50% AS, +210–340% phys dmg, +75% damage vs demons, prevents heal, magic dmg taken -10, +10 energy |
| `rw_fortitude` | Fortitude | El + Sol + Dol + Lo | 4-soc weapon/armor | +25% Faster Cast (armor), +20% AS, +300% phys dmg, +200% def, +15 all res, +5% max ltn res, +1 all skills |
| `rw_call_to_arms` | Call to Arms (CtA) | Amn + Ral + Mal + Ist + Ohm | 5-soc weapon | +1 all skills, +40% AS, +250–290% phys dmg, +5 to Battle Command, +6 to Battle Orders (party buff), +6 to Battle Cry, +30% MF |
| `rw_heart_of_the_oak` | Heart of the Oak (HotO) | Ko + Vex + Pul + Thul | 4-soc staff/mace | +3 all skills, +40% Faster Cast, +75% damage vs demons, +30% cold res, +50% poison res, +12 dex, +10 vit, all res +30%, +75% mana, regen mana 15% |
| `rw_enigma` | Enigma | Jah + Ith + Ber | 3-soc armor | +2 all skills, hit casts L14 Teleport (CD 4s), +750–775% def, +0.75 life per clvl, +1 str per clvl, +5% max life, dmg reduced 8%, +14 life on kill, +15% MF per clvl |
| `rw_breath_of_the_dying` | Breath of the Dying (rw) | Vex + Hel + El + Eld + Zod + Eth | 6-soc weapon | indestructible, +60% AS, +350–400% phys dmg, +200% damage vs undead, +50 all stats, +12% life leech, prevents heal, +1 light radius, -25% req |
| `rw_grief` | Grief | Eth + Tir + Lo + Mal + Ral | 5-soc sword | +30–40% AS, +340–400 flat phys dmg, +20% deadly strike, ignores target def, prevents heal, +2 mana/kill, +10–15 life on kill, +40% damage vs demons |

---

## 10. Sockets

- White item bases roll 0–6 sockets at drop. Magic items roll 0–2; rare 0–2; unique fixed; set fixed.
- Higher base tier → higher max sockets:
  - Normal: 1–3 max
  - Exceptional: 1–4 max
  - Elite: 1–6 max
- Socket targeting via Horadric Cube recipe `Hel + Amn + perfect_topaz + body_armor` (random reroll). 🟡 Cube system v1.1+.

---

## 11. Magic Find (MF) Curve

```
effectiveMF = floor(MF / (MF + 250) * 600)   // returns 0..600
rarityWeights = {
  white:  base * (1 - effectiveMF/1200)
  blue:   base * (1 + effectiveMF/600)
  rare:   base * (1 + effectiveMF/400)
  set:    base * (1 + effectiveMF/200)
  unique: base * (1 + effectiveMF/180)
}
```

| MF | Effective MF | Unique Mult | Set Mult | Rare Mult |
|---|---|---|---|---|
| 0 | 0 | 1.00× | 1.00× | 1.00× |
| 100 | 171 | 1.95× | 1.86× | 1.43× |
| 300 | 327 | 2.82× | 2.64× | 1.82× |
| 500 | 400 | 3.22× | 3.00× | 2.00× |
| 1000 | 480 | 3.67× | 3.40× | 2.20× |

(Asymptotic at MF=∞: unique 4.33×, set 4.00×, rare 2.50×, white 0.50×.) Numbers cross-checked with `drop-tables.md` §3.

---

## 12. Item Generation Pipeline (engine handoff)

```
1. monster.die() → roll TC table (drop-tables) → pick base item ID + ilvl = monster.level
2. roll rarity by weighted RNG (weights modulated by effectiveMF)
3. if rarity == magic|rare:
     pick 1..N affixes from valid pool (filtered by slot + ilvl)
     for each: roll tier (uniform among allowed tiers), roll value within tier range
4. if rarity == unique|set: pick instance from pool, apply ±10% variance to "variable" mods
5. roll sockets: weight by base tier, capped by maxSockets
6. roll quality (superior modifier) on white only (10% chance)
7. attach metadata: ilvl, ethereal flag (5% on white only), drop_seed
```

---

## 13. Cross-Reference Index

- Skills referenced in implicits: see `skills-spec.md` skill IDs (e.g., `+1 Strength tree` → `tree:strength`)
- Monster TC tables: `drop-tables.md` §2
- Combat math for life leech / open wounds / crushing blow: `combat-formulas.md` §6, §8
- MF curve interaction with TC weights: `drop-tables.md` §3

---

## 14. Handoff to Content Designer

The `content-designer` agent must produce JSON files validated by `src/data/schema/`:

1. **`src/data/items/bases.json`** — All 60 base items from §3 (10 slots × 6 tiers). Include `id`, `slot`, `tier`, `rlvl`, `baseDef|baseDmg`, `implicit`, `name.zh`, `name.en`, `maxSockets`.
2. **`src/data/items/affixes.json`** — 60 prefixes (§4) + 60 suffixes (§5). Each with `id`, `kind:'prefix'|'suffix'`, `tiers[]` (6 tier value ranges), `slots[]`, `ilvlGate`, `name.zh`, `name.en`.
3. **`src/data/items/uniques.json`** — 40 unique items (§6). Fixed mods + 4 variable mods marked with `variance:0.1`.
4. **`src/data/items/sets.json`** — 6 sets, 24 set items (§7). Include 2/3/4-piece bonus arrays.
5. **`src/data/runes.json`** — 33 runes (§8) with per-Act drop weights.
6. **`src/data/runewords.json`** — 25 runewords (§9) with recipe (rune ID order), allowed bases, fixed mods.

All IDs must be **kebab_snake unique** and referenced in `drop-tables.md` TCs without typos. Run `npm run validate:data` (Ajv) before commit.

🟡 **OPEN (v1.1+):** Crafted items, Horadric Cube, jewels, charms, ethereal repair runeword interactions.
