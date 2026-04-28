# Combo Synergy Matrix — v1 Spec

**Owner:** `game-designer`  
**Status:** ✅ DECIDED (v1 locked)  
**Last updated:** 2025-01-01  
**Source references:** Diablo 3 status system, Path of Exile ailment interactions

---

## 1. Summary

Players define a 3–5 skill combo sequence. When skill A applies a status effect to a target, and skill B hits that target **on the same turn or next**, the combo triggers a **damage amplification** or **special effect**. This document defines all cross-element synergies in v1.

---

## 2. Combo Trigger Rules

1. **Status must be active** on target when combo skill hits.
2. **Multiplier applies once per hit** (for AOE, each target checks independently).
3. **Status refreshes** if same-element skill reapplies (duration resets, stacks if stackable).
4. **No self-combo:** A skill cannot combo with itself (e.g., Lightning → Lightning doesn't trigger unless a debuff was applied by a *different* lightning skill).

---

## 3. Cross-Element Amplification Table

| Status on Target | Next Hit Element | Multiplier | Duration | Notes |
|---|---|---|---|---|
| **Chill** (Cold) | Lightning | ×1.30 | 2 turns | Cold slows → lightning conducts better |
| **Chill** (Cold) | Physical | ×1.10 | 2 turns | Brittle bonus (minor) |
| **Freeze** (Cold) | Physical | ×1.50 | 1 turn | Shatter bonus (massive) |
| **Burn** (Fire) | Physical | ×1.25 | 3 turns | Armor melt amplifies physical |
| **Burn** (Fire) | Poison | ×1.15 | 3 turns | Heat accelerates poison spread |
| **Armor Melt** (Fire) | Physical | ×1.25 | 3 turns | Explicit armor reduction |
| **Paralyze** (Lightning) | Any | Target loses next turn | 1 turn | Stun effect |
| **Paralyze** (Lightning) | Fire | ×1.20 | 1 turn | Shock + ignition |
| **Mana Burn** (Arcane) | Arcane | ×1.20 | Until mana restores | Overload damage |
| **Mana Burn** (Arcane) | Lightning | ×1.15 | Until mana restores | Energy destabilization |
| **Poison (3+ stacks)** | Poison | ×(1 + 0.15 × stacks) | 5 turns | Poison synergy (exponential scaling) |
| **Poison (3+ stacks)** | Arcane | ×1.10 | 5 turns | Corrupted magic amp |
| **Bleed** (Physical) | Physical | ×1.10 | 3 turns | Open wound (minor amp) |
| **Thorns reflect active** | Any melee hit | Attacker takes X% reflect | Permanent (passive) | Counter-damage |

---

## 4. Special Combo Effects (Non-Multiplier)

### 4.1 Freeze → Physical = Shatter
- **Condition:** Physical hit on frozen target.
- **Effect:** Target instantly dies if HP <20%. Otherwise, ×1.5 damage.
- **Cooldown:** Once per target per combat.

### 4.2 Burn (5 stacks) → Cold = Steam Explosion
- **Condition:** Cold hit on target with 5 burn stacks.
- **Effect:** AOE explosion (radius = skill AOE), dealing 50% of cold damage to nearby enemies. All burn stacks removed.
- **Cooldown:** None (consumes stacks).

### 4.3 Poison (10 stacks) + Plague Skill = Epidemic
- **Condition:** Cast *Plague Nova* or similar on target at max poison stacks.
- **Effect:** On target death, spread 100% (instead of 50%) of stacks to all enemies in combat.
- **Cooldown:** Once per combat per cast.

### 4.4 Paralyze + Any = Lost Turn
- **Condition:** Any damage type hits paralyzed target.
- **Effect:** Target skips next turn (effectively stunned). Paralyze consumed.
- **Cooldown:** Paralyze has diminishing returns (see `combat-formulas.md` §9.5).

### 4.5 Mana Burn (0 mana) + Arcane = Overload
- **Condition:** Arcane hit on target with 0 mana.
- **Effect:** ×1.5 damage. Target cannot regenerate mana for 3 turns.
- **Cooldown:** None.

---

## 5. Damage Type → Status Mapping

For reference, which skills apply which statuses:

| Element | Primary Status | Secondary Status |
|---|---|---|
| **Physical** | Bleed | Stun (specific skills) |
| **Cold** | Chill | Freeze (high-tier skills) |
| **Lightning** | Paralyze | — |
| **Fire** | Burn | Armor Melt (specific skills) |
| **Arcane** | Mana Burn | — |
| **Poison** | Poison (stacking) | Plague (AOE spread on death) |
| **Thorns** | Reflect | — |

---

## 6. Player-Facing Combo Examples

### 6.1 Sorceress (Cold + Lightning Build)
**Combo sequence:**
1. *Frost Nova* → applies Chill to all enemies
2. *Chain Lightning* → hits chilled enemies for ×1.3 damage

**Result:** 30% amp on all lightning hits.

### 6.2 Necromancer (Poison Stack Build)
**Combo sequence:**
1. *Poison Nova* → applies 2 stacks to all
2. *Poison Nova* again → 4 stacks → now ×1.3 damage
3. *Poison Dagger* → single-target, now ×1.6 damage (6 stacks)
4. *Plague Strike* → target dies, spreads 6 stacks to all nearby

**Result:** Exponential poison scaling in multi-wave fights.

### 6.3 Paladin (Fire + Physical Build)
**Combo sequence:**
1. *Holy Fire* aura → applies Burn to all nearby
2. *Zeal* (physical) → ×1.25 damage vs burning targets

**Result:** Sustained melee amp.

### 6.4 Assassin (Arcane + Lightning Build)
**Combo sequence:**
1. *Mind Blast* (arcane) → mana burn
2. *Shock Web* (lightning) → ×1.15 damage if target at 0 mana
3. Repeat → target cannot cast skills

**Result:** Mage-killer.

---

## 7. Monster Combos (AI)

Monsters can trigger combos if their skill list is designed to synergize. Examples:

### 7.1 Act V — Baal's Minions (Cold + Physical)
- **Minion A:** *Frozen Orb* → Chill
- **Minion B:** *Leap Attack* (physical) → ×1.1 damage

### 7.2 Act IV — Venom Lords (Poison + Arcane)
- **Venom Lord:** *Poison Cloud* → 3 stacks
- **Venom Lord:** *Arcane Bolt* → ×1.1 if 3+ stacks

**Design note:** Monsters do not optimize combos as aggressively as players; their skill priority is simpler (1–3 skills, fixed order).

---

## 8. Balance Constraints (for QA)

| Rule | Rationale |
|---|---|
| **No combo multiplier >×2.0** (except Freeze→Shatter ×1.5 + execute) | Prevent one-shot trivialize |
| **Stacking combos (e.g., Chill→Lightning→Burn→Physical) do NOT multiply** | Additive, not multiplicative; else exponential |
| **Thorns combos do NOT trigger on spell damage** | Prevent infinite loops |
| **Boss combo resistance: 50%** | E.g., ×1.3 → ×1.15 vs bosses |

---

## 9. Open Questions 🟡

| # | Question | Owner | Proposed v1 Default |
|---|---|---|---|
| 1 | Should combos trigger on DoT ticks? | game-designer | No; only direct hits |
| 2 | Diminishing returns on repeated combos? | qa-engineer | Not v1; watch for abuse |
| 3 | Combo UI indicator (floating text / buff icon)? | frontend-dev | Both; + combat log line |

---

## 10. Change Log

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2025-01-01 | game-designer | Initial v1 matrix |
