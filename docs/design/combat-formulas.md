# Combat Formulas — v1 Spec

**Owner:** `game-designer`  
**Status:** ✅ DECIDED (v1 locked)  
**Last updated:** 2025-01-01  
**Source references:** Diablo 2 patch 1.13c-1.14d, D2 Arreat Summit, PureDiablo wiki

---

## 1. Summary

This document specifies the **concrete numeric formulas** for all combat calculations in v1. The combat pipeline is:

1. **Hit chance** (opposed by dodge)
2. **Critical strike** check
3. **Damage calculation** (base → +flat → ×%inc → ×combo → ×crit)
4. **Resistance** reduction
5. **Mitigation** (armor / magic resist)
6. **Final damage** applied
7. **Status effects** applied (per-damage-type)

All formulas use integer math (floor after each step) unless otherwise noted. Random rolls use a seeded RNG for deterministic combat replay.

---

## 2. Core Stats — Player & Monster Baseline

### 2.1 Player (Level 1)
| Stat | Value | Per-Level Growth |
|---|---|---|
| Life | 100 | +8 + (Vitality × 2) |
| Mana | 50 | +4 + (Energy × 1.5) |
| Attack (base damage) | 10 | +2 + (Str × 0.5) or (Dex × 0.5) |
| Defense (physical mitigation) | 20 | +3 + (items) |
| Magic Resist (magical mitigation) | 0 | +(items) |
| Attack Speed (AS) | 100 | +(Dex × 1) + (items) |
| Crit Chance | 5% | +(items, passives) |
| Crit Damage | 200% | +(items, passives) |
| Physical Dodge | 5% | +(Dex × 0.2) + (items) |
| Magical Dodge | 5% | +(items) |
| Resistances (Fire/Cold/Lightning/Poison/Arcane) | 0% | +(items), cap at 75% |

**Stat allocation per level:** Player chooses to allocate **5 stat points** among Strength, Dexterity, Vitality, Energy.

### 2.2 Monster (Level 1 baseline, scales per-Act)
| Stat | Trash (Level 1) | Elite (×1.5) | Champion (×2) | Boss (×5) |
|---|---|---|---|
| Life | 50 | 75 | 100 | 250 |
| Attack | 8 | 12 | 16 | 40 |
| Defense | 15 | 22 | 30 | 75 |
| Magic Resist | 0 | 10 | 15 | 30 |
| Attack Speed | 80 | 90 | 100 | 120 |
| Crit Chance | 0% | 5% | 10% | 15% |
| Physical Dodge | 0% | 5% | 10% | 20% |
| Magical Dodge | 0% | 5% | 10% | 15% |

**Per-level growth:** Each monster type has JSON-defined growth ranges (see `docs/design/monster-spec.md`). E.g., `lifeGrowth: [3, 5]` means +3–5 HP per level.

**Resistances:** Defined per-monster in JSON. Default 0%; bosses may have 50% baseline to one element and -25% to another.

---

## 3. Turn Order & Action Resolution

### 3.1 Attack Speed → Initiative
- **Initiative = Attack Speed** (higher goes first).
- Ties broken by deterministic seed: `hash(combatId + unitId) % 1000`.
- After each action, unit's next turn = `currentTurn + (1000 / attackSpeed)`.
- Engine maintains a priority queue; next actor is `min(nextTurn)`.

**Example:**
- Player AS 150 → acts every ~6.67 time units.
- Monster AS 75 → acts every ~13.33 time units.
- Player acts twice before monster acts once.

### 3.2 Skill vs Basic Attack Decision
**Priority (per turn, for player & merc):**
1. Check combo list (order 1→2→3…).
2. For each skill:
   - If on cooldown → skip.
   - If resource insufficient → skip.
   - If no valid target → skip.
   - If buff-type and buff already active → skip.
3. First valid skill → execute.
4. If no valid skill → **basic attack** (0 CD, 0 resource cost).

**Monster AI:** Same logic. Monsters have a 1–3 skill priority list defined in JSON.

---

## 4. Hit Chance & Dodge

### 4.1 Formula
```
attackerHitChance = 85% (base)
defenderDodge = physicalDodge (for physical/fire/poison) OR magicalDodge (for cold/lightning/arcane)

effectiveHitChance = max(5%, attackerHitChance - defenderDodge)
```

Roll 1d100:
- If roll ≤ effectiveHitChance → **hit**.
- Else → **miss** (no damage, no status effect applied).

**Design note:** We intentionally do not model attacker-accuracy vs defender-defense as in D2. Simplification for v1. Dodge is the sole evasion stat.

**Special cases:**
- AOE skills hit *each* target independently (each target rolls dodge).
- Thorns/reflect ignores dodge (always hits back).

---

## 5. Critical Strike

### 5.1 Formula
```
critChance = attacker.critChance
if (rand(0,100) < critChance):
    damage *= (critDamage / 100)  // default 200% = ×2
```

**Over-crit mitigation:** If crit chance exceeds 100%, excess converts to bonus crit damage at **1:2 ratio**:
```
if (critChance > 100):
    excessCrit = critChance - 100
    critDamage += (excessCrit / 2)
    critChance = 100
```

**Example:** 130% crit → 100% crit, 215% crit damage.

---

## 6. Damage Pipeline

### 6.1 Step-by-step
```
1. baseDamage = skill.baseDamage OR unit.attack (for basic attack)
2. +flat = baseDamage + sum(flatBonuses from gear/buffs)
3. ×%inc = flat × (1 + sum(%increased_damage from passives/gear))
4. ×combo = ×%inc × comboMultiplier (if combo triggered; see §7)
5. ×crit = ×combo × (critDamage/100) (if crit; else ×1)
6. ×resist = ×crit × (1 - target.resistance_to_damageType / 100)
   - cap: resistance clamped to [-100%, 75%] before this step
   - negative resist = amplified damage
7. mitigation = ×resist - (target.defense OR target.magicResist)
   - physical/fire/poison → subtract target.defense
   - cold/lightning/arcane → subtract target.magicResist
8. finalDamage = max(1, floor(mitigation))
```

**Design notes:**
- Resistances cap at +75% (cap raised by specific uniques/runewords).
- Negative resistance (from debuffs like *Lower Resist* or *Amplify Damage*) can reach -100%, effectively doubling damage.
- Armor/MR is flat subtraction *after* resistance %; intentionally makes high-defense viable vs low hits, weak vs big hits.

### 6.2 Example Calculation
**Scenario:** Sorceress casts *Chain Lightning* at L10.
- Base damage: 120
- +Flat from gear: +30 → 150
- %Increased lightning damage: 50% → 150 × 1.5 = 225
- Combo: Cold debuff active on target → +30% lightning amp → 225 × 1.3 = 292.5 → 292
- Crit: yes, 200% → 292 × 2 = 584
- Target resist: 25% lightning → 584 × 0.75 = 438
- Target magic resist: 40 → 438 - 40 = 398
- **Final damage: 398**

---

## 7. Combo Synergy Multipliers

**See `docs/design/combo-matrix.md` for the full cross-element table.** Summary of major amplifiers:

| Status on Target | Next Hit Type | Bonus |
|---|---|---|
| Cold debuff (chilled) | Lightning | +30% |
| Fire debuff (burning) | Physical | +25% (armor-melt) |
| Lightning debuff (paralyzed) | Any | Target loses next turn (stun) |
| Arcane debuff (mana-burned) | Arcane | +20% |
| Poison (3+ stacks) | Poison | +15% per stack over 2 |

**Application:** Combo multiplier applies *once per triggering hit*, then the debuff may refresh or expire per its duration.

---

## 8. Resistance Caps & Penetration

### 8.1 Resistance Cap
- **Player & monsters:** 75% base cap.
- Certain uniques/sets/runewords grant "+5% max resist" (stacks to ~90% achievable with perfect gear).

### 8.2 Resistance Penetration (v1 simplified)
Monsters in Hell difficulty (Act IV+) have implicit "-X% player resist" aura:
- **Act IV:** -20% all resists
- **Act V:** -40% all resists

This is applied *before* the 75% cap clamp:
```
effectiveResist = clamp(playerResist - actPenalty, -100%, 75%)
```

**Example:** Player has 60% fire resist. In Act V (−40%), effective = 20%.

---

## 9. Status Effects — Detailed Formulas

### 9.1 Chill (Cold)
- **Effect:** Target attack speed reduced by 50% for 2 turns.
- **Stacks:** No. Refresh duration.
- **Combo tag:** Amplifies next lightning hit by +30%.

### 9.2 Freeze (Cold, high-tier skills only)
- **Effect:** Target cannot act for 1 turn (2 turns if boss resist <25%).
- **Stacks:** No. Bosses have 50% freeze duration reduction.

### 9.3 Burn (Fire)
- **Effect:** DoT = (10% of hit damage) per turn for 3 turns.
- **Stacks:** Yes. Each fire hit adds a new burn stack (max 5 stacks).

### 9.4 Armor Melt (Fire, specific skills)
- **Effect:** Target defense reduced by 30% for 3 turns.
- **Stacks:** No. Refresh duration.
- **Combo tag:** Physical damage +25% vs melted targets.

### 9.5 Paralyze (Lightning)
- **Effect:** Target loses next action (1-turn stun). Attack speed -20% for 2 turns after.
- **Stacks:** No. Diminishing returns: 2nd application within 5 turns has 50% chance to fail.

### 9.6 Mana Burn (Arcane)
- **Effect:** Target loses (20% of damage dealt) mana. If target is at 0 mana, take +50% damage from arcane.
- **PvE:** Monsters with 0 mana cannot cast skills.

### 9.7 Poison
- **Effect:** DoT = (5% of hit damage) per turn, duration 5 turns.
- **Stacks:** Yes. Max 10 stacks. Each stack increases total DoT linearly.
- **Formula:** `totalPoisonDPS = sum(stack.dps for each active stack)`

### 9.8 Plague (Poison, specific skills)
- **Effect:** On target death, spread 50% of total poison stacks to nearby enemies (range: same AOE group).
- **Stacks:** Inherits from source.

### 9.9 Bleed (Physical)
- **Effect:** DoT = (8% of hit damage) per turn for 3 turns.
- **Stacks:** No (low priority vs burn/poison).

### 9.10 Thorns / Reflect
- **Effect:** Attacker takes (X% of damage dealt) back.
- **Scaling:** Gear/passives grant "X% thorns". Typical range: 10%–100%.
- **Boss mitigation:** Bosses take 50% less thorns damage (hard-coded nerf to prevent trivialize).

---

## 10. Resource Model

### 10.1 Combat Start
- Player & merc start at **full HP and mana**.
- Monsters spawn at full HP; monsters have no mana (skills cost 0 or have CD-only gating).

### 10.2 Recovery (in-combat)
| Source | HP | Mana |
|---|---|---|
| Life Leech (gear %) | X% of damage dealt | — |
| Mana Leech (gear %) | — | X% of damage dealt |
| On-kill orb (D3-style) | 5% max HP | 5% max mana |
| Passive regen (per turn) | Vitality × 0.5 | Energy × 1.0 |
| Skill self-heal | Skill-specific (e.g., Paladin *Prayer*: 20 HP/turn) | — |
| Skill mana-regen buff | Skill-specific (e.g., Meditation aura: +3 mana/turn) | — |

**Orb drop chance:** 25% per kill (trash), 100% per elite/champion/boss.

---

## 11. Armor & Magic Resist (Mitigation)

### 11.1 Physical Armor
- **Formula:** `damageAfterResist - armor`
- **Effective HP scaling:** Each point of armor = +1 effective HP vs physical.
- **Diminishing vs big hits:** A 100-armor target takes 50 less damage from a 200-damage hit (25% reduction), but only 100 less from a 1000-damage hit (10% reduction).

### 11.2 Magic Resist
- **Formula:** `damageAfterResist - magicResist`
- **Same scaling logic as armor.**

**Design note:** D2 used %damage-reduction. We use flat subtraction for smoother low-level balance and to make "one big hit" vs "many small hits" strategically distinct.

---

## 12. AOE & Targeting

### 12.1 AOE Shapes (skill-defined)
- **Single:** 1 target (player-selected or random).
- **Cleave:** 3 targets in front (random if >3 enemies).
- **Cone:** 5 targets (front arc).
- **All:** All enemies.

### 12.2 Damage Falloff
**v1:** No falloff. All targets in AOE take full damage (each rolls dodge independently).

**🟡 OPEN (v1.1+):** Consider 20% falloff per additional target for balance if AOE trivializes single-target builds.

---

## 13. Boss Mechanics — Special Rules

| Rule | Effect |
|---|---|
| +50% all resistances (base) | Defined per-boss in JSON |
| −50% stun/freeze duration | Hard-coded |
| −50% thorns damage taken | Hard-coded |
| Immune to certain combos | JSON-defined (e.g., Andariel immune to poison) |
| Enrage (10% HP threshold) | +100% attack speed, +50% damage |

---

## 14. Open Questions 🟡

| # | Question | Owner | Proposed v1 Default |
|---|---|---|---|
| 1 | AOE damage falloff? | game-designer | None; revisit if broken |
| 2 | Leech caps (prevent 100% face-tank)? | game-designer | Cap at 20% leech per stat |
| 3 | Boss enrage threshold tuning | qa-engineer | 10% HP → triggers |

---

## 15. Validation & Balance Target (for QA)

**Expected TTK (Time-To-Kill) at same level:**
- **Trash mob:** 1–2 player actions
- **Elite:** 3–5 player actions
- **Champion:** 5–8 player actions
- **Boss:** 20–40 player actions (2–3 minutes of real-time combat)

**Glass-cannon build:** 2× damage, 0.5× HP  
**Tank build:** 0.7× damage, 2× HP  
Both should clear Act bosses within 10% of each other's time.

---

## 16. Change Log

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2025-01-01 | game-designer | Initial v1 spec |
