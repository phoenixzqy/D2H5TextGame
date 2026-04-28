# Early-game Balance Spec — Act 1, Levels 1–15

**Owner:** game-designer
**Status:** v1 — ready for engine-dev implementation
**Linked code:**
- `src/engine/progression/stats.ts` (`deriveStats`)
- `src/engine/combat/damage.ts` (`resolveDamage`)
- `src/engine/combat/combat.ts` (`basicAttack`, `buildDamageInput`)
- `src/stores/combatHelpers.ts` (`createSimpleEnemy` — the mock with the bug)
- `src/data/monsters/act1.json`

---

## 1. Summary

The current `createSimpleEnemy` mock generates absurd attack values (`100 + 10·level`) producing a Lv1 Fallen with **attack 110**, which one-shots a Lv1 player on crit (220 dmg vs 120 HP). The damage **formula** is correct (`(base+flat)·(1+inc)·combo·crit·(1-resist) − mitigation`, per `combat-formulas.md §6`); the bug is **data**, not pipeline.

Fix is purely numerical: rewrite the trash-monster baseline, lower trash crit multiplier from 2.0 → 1.5, and let the existing `deriveStats` formula stand.

---

## 2. Problem statement

| Entity (current) | attack | defense | life | crit× | Result vs L1 Sorc (atk 22, def 20, HP 120) |
|---|---|---|---|---|---|
| L1 Fallen (mock) | 110 | 5 | 70 | 2.0 | 110−20 = **90 dmg/hit (75% HP)**, **220 on crit → ONE-SHOT** |
| L1 Sorc → Fallen | 22 | — | 70 | 2.0 | 22−5 = 17/hit → 4 hits (TTK fine) |

Player damage **out** is in target range; only enemy damage **in** is broken.

---

## 3. Damage formula audit

### Current pipeline (`resolveDamage`, do not change)

```
1. dodge roll (effective hit = max(0.05, hitChance − defenderDodge))
2. base = U(baseMin, baseMax)              // for basic attack: floor(attacker.attack)
3. + flatBonus
4. × (1 + increasedPct)
5. × comboMult
6. × critMult (if crit roll)
7. × (1 − clamp(resist − pen, −100, 75)/100)
8. − mitigation (defense for phys/fire/poison; magicResist for cold/ltn/arc)
9. final = max(1, floor(...))
```

**Verdict: KEEP.** This is the documented D2-style additive-pre-crit / flat-mitigation pipeline. It works correctly *given sane inputs*.

### One subtle issue (flag, do not fix in this pass)

`buildDamageInput` (combat.ts) sets `defenderMagicResist = defender.stats.defense`. That means cold/lightning/arcane currently mitigate against the *armor* number, not a separate magic-resist stat. Acceptable for v1 because the `DerivedStats` type doesn't yet have `magicResist`. **Open question for PM:** add `magicResist` field, or accept armor-as-MR for v1? Tracked separately — no change in this spec.

### Basic attack base damage is a single point, not a range

`basicAttack` passes `[floor(attack), floor(attack)]` → no roll variance. Acceptable for v1; if we want feel improvements later, swap to `[floor(0.85·atk), ceil(1.15·atk)]` (±15% spread). **Not changing in this pass** to minimize churn.

---

## 4. Recommended monster baseline (trash tier — Fallen archetype)

Trash monsters should follow this scaling. Apply via `createSimpleEnemy` immediately; mirror into `src/data/monsters/act1.json` next pass (content-designer).

```ts
// Replace in src/stores/combatHelpers.ts → createSimpleEnemy
const lvlAbove1 = Math.max(0, level - 1);
const life       = 50 + lvlAbove1 * 16;
const attack     = 32 + lvlAbove1 * 5;
const defense    = 4  + Math.floor(lvlAbove1 * 1.5);
const attackSpeed = 95;
const critChance  = 0.05;
const critDamage  = 1.5;     // ← was 2.0; trash should not threaten one-shots
const physDodge   = 0.05;
const magicDodge  = 0.05;
```

### Concrete table — Fallen Lv N

| Level | life | attack | defense | AS | crit% | critMult | physDodge |
|------:|-----:|-------:|--------:|---:|------:|---------:|----------:|
|  1    |  50  |  32    |   4     | 95 |   5   |   1.5    |   5%      |
|  3    |  82  |  42    |   7     | 95 |   5   |   1.5    |   5%      |
|  5    | 114  |  52    |  10     | 95 |   5   |   1.5    |   5%      |
|  8    | 162  |  67    |  14     | 95 |   5   |   1.5    |   5%      |
| 12    | 226  |  87    |  20     | 95 |   5   |   1.5    |   5%      |
| 15    | 274  | 102    |  25     | 95 |   5   |   1.5    |   5%      |

### Other Act 1 archetypes (multipliers off Fallen baseline)

For variety; engine-dev/content-designer can pick a tier flag in `createSimpleEnemy(level, archetype?)` later.

| Archetype     | life × | atk × | def × | AS  | Notes                              |
|---------------|-------:|------:|------:|----:|------------------------------------|
| Fallen        | 1.00   | 1.00  | 1.00  |  95 | baseline                           |
| Carver        | 1.10   | 1.05  | 1.10  | 100 | sturdier melee                     |
| Quill Rat     | 0.75   | 0.85  | 0.80  | 120 | fragile, fast — pressure target    |
| Zombie        | 1.30   | 0.90  | 1.20  |  75 | tanky, slow                        |
| Dark Archer   | 0.85   | 1.10  | 0.90  | 100 | ranged, glass                      |
| Tainted       | 1.00   | 1.00  | 1.10  |  90 | poison resist 25%                  |
| Bone Warrior  | 1.40   | 1.10  | 1.50  |  85 | physical resist 25% — break on cold/fire |

---

## 5. Player formula recommendation

**No change to `deriveStats` formulas.** Existing scaling is fine once monster numbers are sane.

For reference (existing, unchanged):
- `life = 100 + (lvl-1)·8 + Vit·2`
- `attack = 10 + (lvl-1)·2 + max(Str,Dex)·0.5`
- `defense = 20 + (lvl-1)·3`
- `physDodge = 0.05 + Dex·0.002`

### Starting points (per PM request)

- L1 character: **1 skill point, 0 stat points**
- Each level after L1: **+5 stat points, +1 skill point**
- Existing milestone bonuses at L12 / L24 / L36 (+1 skill each) preserved

Apply in `createMockPlayer` (and any future "real" character-creation flow):

```ts
statPoints: 0,
skillPoints: 1,    // ← was 0
```

`totalSkillPoints(level)` in `progression/stats.ts` should be updated:

```ts
// before: pts = max(0, level - 1)
// after:  pts = level                    // L1 grants 1, L2 grants 2, ...
```

(Net effect at any level ≥ 2: +1 skill point relative to today.)

---

## 6. Sanity check against acceptance targets

Player class used: **Sorceress** (worst-case for HP). Lv1: HP 120, atk 22, def 20, dodge 10%.

### TTK player → enemy (target 3–5 hits)

Per-hit: `floor(22) − 4 = 18`. Hit chance ≈ 0.85 − 0.05 = 0.80 → 14.4/hit avg.
**TTK ≈ 50 / 14.4 = 3.5 hits.** ✅

### TTK enemy → player (target 8–12 hits)

Per-hit: `32 − 20 = 12`. Hit chance ≈ 0.85 − 0.10 = 0.75 → 9/hit avg.
**TTK ≈ 120 / 9 = 13.3 hits.** ✅ (top of band; comfortable for new players)

For Barbarian (HP 100+25·2 = 150, def 20): TTK ≈ 150/9 = 16.6 hits — even safer.

### Crit one-shot guard (target ≤ 25% HP on crit at L1)

Crit: `32 × 1.5 = 48` raw, − 20 def = **28 dmg = 23.3% of 120 HP.** ✅

### 3-pack wave, "playing reasonably"

Player AS 125, Fallen AS 95 → player turn:enemy turn ratio ≈ 1.32 : 1.

Naive math (no skills, focus-fire): 3 enemies × 3.5 hits to kill = ~10.5 player attacks; enemies get ~10.5 / 1.32 ≈ 8 attacks total across the pack (decreasing as they die — effective ~5.5 landed hits with hit-rate 0.75) → ~50 dmg taken ≈ **42% HP loss**.

That's above the 30% target without skill use. **With one cleave/AOE skill** (e.g. Sorc Frost Nova, Pally Holy Fire aura, Barb Whirlwind tap) clearing or softening the wave in 1–2 player turns, projected loss drops to ~20–25%. ✅ contingent on skill availability.

**Implication for engine-dev:** L1 starting skill must include at least one usable damage skill (single-target nuke OR AOE). With `skillPoints = 1` at L1, the character-creation flow must auto-allocate that point into the class's tier-1 attack skill, OR force the player to spend it before entering combat. **Open question for PM** — see §9.

---

## 7. Acceptance criteria (for QA)

Run these as Vitest balance sims (seeded RNG, 1000 trials each):

1. **Solo TTK, L1 Sorc vs L1 Fallen:** mean player attacks to kill ∈ [3, 5]. ✅ target 3.5.
2. **Solo TTK, L1 Fallen vs L1 Sorc (no skills, no dodge cheese):** mean enemy attacks to kill ∈ [8, 14]. ✅ target ~13.
3. **Crit cap, all classes L1:** for every (class, monster level 1) pair, `max single-hit damage taken ≤ 0.30 × playerHP`. (Allow 30% to absorb roll variance — true target 25%.)
4. **3-pack wave, L1 Sorc with auto-cast tier-1 skill:** mean HP remaining at wave end ≥ 65% over 1000 seeded trials.
5. **Scaling continuity:** at every level L ∈ {3,5,8,12,15}, solo-vs-solo TTKs both fall within bands [3, 6] (player→enemy) and [7, 14] (enemy→player). Slight drift acceptable; hard fail if any TTK <2 or >20.
6. **No regression in damage pipeline tests:** existing `damage.test.ts` and `combat.test.ts` continue to pass.

---

## 8. Edge cases & invariants

- **Min damage 1:** preserved — flat mitigation can over-subtract, `max(1, …)` clamps. Don't change.
- **Dodge floor 5%:** `effectiveHit = max(0.05, …)` — even fully dodge-stacked players get hit eventually. Preserve.
- **Seedable RNG:** all rolls go through `state.rng` (already verified in `combat.ts`). Don't introduce `Math.random()` in the new monster factory — only in the `id` string (cosmetic).
- **JSON-first data:** the monster numbers in this spec should migrate into `src/data/monsters/act1.json` via new fields (`attack: [min, max]`, `attackGrowth: [min, max]`, `critChance`, `critDamage`, `physDodge`). Until schema is extended, `createSimpleEnemy` carries the formulas. **Hand-off to content-designer.**
- **Single-protagonist invariant:** monster turn order = AS only (per `combat.ts` initiative loop). No change.
- **No movement / range stats:** preserved — Dark Archer "ranged" is flavor; mechanically just higher AS / lower HP.

---

## 9. Open questions for PM

1. **L1 skill auto-allocation.** With `skillPoints=1` at L1, must character creation force the player to spend it before first combat, or auto-pick the class's signature tier-1 skill (Sorc → Fire Bolt; Barb → Bash; etc.)? My recommendation: **auto-allocate signature skill** to keep the L1 tutorial frictionless; player can respec later.
2. **Magic resist field.** Should `DerivedStats` gain a separate `magicResist` number, or do we keep using `defense` for both armor and MR through Act 1? Affects content-designer Act 2+ work.
3. **Basic attack roll variance.** Add ±15% spread to basic-attack base damage (`[0.85·atk, 1.15·atk]`)? Improves feel; tiny engine churn. My vote: yes, but next pass — not blocking on this fix.
4. **Per-archetype JSON schema extension.** Approve adding `attack`, `attackGrowth`, `critChance`, `critDamage`, `physDodge` fields to monster JSON? Required to retire the formula-in-code mock.

---

## 10. Hand-offs

- **engine-dev:** apply §4 (createSimpleEnemy rewrite), §5 (createMockPlayer skillPoints + totalSkillPoints).
- **content-designer:** after PM approves §9 Q4, extend monster JSON schema and port §4 numbers into `act1.json`. Apply archetype multipliers from §4 table to the seven Act 1 monsters already on file.
- **qa-engineer:** implement §7 acceptance sims; add to CI as `balance-early-game.test.ts`.
- **frontend-dev:** no UI changes required; verify combat log readability with new (lower) damage numbers on mobile.
