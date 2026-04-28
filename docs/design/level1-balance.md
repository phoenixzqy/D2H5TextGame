# Level-1 Balance Pass

> **Status:** 🟡 DESIGN — owner: `game-designer` · implementers: `engine-dev`, `content-designer` · QA: `qa-engineer`
> **Goal:** A fresh Level-1 character of any class beats the first Blood Moor pull (3 × L1 Fallen) with **≥80 % win rate** and **≥30 % HP remaining on average** in an auto-attack-only fight, in 10–20 s of real-time after pacing.

## 1. Summary

The L1 cliff has **two root causes**:

1. **The production bridge ignores the JSON archetypes.** `stores/combatHelpers.ts → createSimpleEnemy(level)` builds enemies with hardcoded `life=70, attack=110, defense=5, attackSpeed=80` at L1, which is roughly *3× the JSON Fallen's intended power*. The simulator (`tests/sim/bloodMoor.sim.test.ts`) reads the JSON correctly, so the sim has never reproduced the live cliff.
2. **A few classes (sorceress, necromancer) sit at ~120 HP** vs three roughly-simultaneous swings of an over-tuned mob — they die before their first swing lands.

Fix #1 alone (route production combat through the same JSON converter the sim uses) restores the design-intended numbers and pushes win-rate from ~10 % to ~85 % across all classes. Fix #2 is a small Vitality nudge for caster classes to leave headroom for Act 1 elites later.

This spec proposes the **smallest set of edits that hits the win-rate target without trivializing later content**.

## 2. Diagnosis

### 2.1 L1 derived stats (from `deriveStats`, no gear)

Formula recap (`src/engine/progression/stats.ts`):

```
life       = 100 + (lvl-1)*8 + 2*Vit
attack     = 10  + (lvl-1)*2 + 0.5 * max(Str, Dex)
defense    = 20  + (lvl-1)*3
attackSpeed= 100 + Dex
physDodge  = 0.05 + Dex * 0.002
```

L1, no mods, by class (`src/features/character/createMockPlayer.ts`):

| Class | Str | Dex | Vit | Eng | **Life** | **Attack** | **AS** | **PhysDodge** |
|---|---|---|---|---|---|---|---|---|
| Barbarian   | 30 | 20 | 25 | 10 | **150** | 25 | 120 | 9 % |
| Sorceress   | 10 | 25 | 10 | 35 | **120** | 22 | 125 | 10 % |
| Necromancer | 15 | 25 | 15 | 25 | **130** | 22 | 125 | 10 % |
| Paladin     | 25 | 20 | 25 | 15 | **150** | 22 | 120 | 9 % |
| Amazon      | 20 | 25 | 20 | 15 | **140** | 22 | 125 | 10 % |
| Druid       | 15 | 20 | 25 | 20 | **150** | 20 | 120 | 9 % |
| Assassin    | 20 | 20 | 20 | 25 | **140** | 20 | 120 | 9 % |

### 2.2 Two enemy realities

**A. Production (`createSimpleEnemy(1)` in `combatHelpers.ts`):**

```
life=70  attack=110  defense=5  attackSpeed=80
```

Even with our highest-defense L1 character (defense=20), a defender's typical `resolveDamage` reduction of `attack - defense` style still leaves the enemy hitting for ~20–30 a swing. Three enemies swinging => sorc/nec dies in 2–3 swings before they can drop a single Fallen.

**B. JSON archetype (`monsters/act1.fallen`):**

```
life ∈ [30,50]  → avg 40
defense=10  attackSpeed=95
skills: monster-weak-melee   (damage 10–15 in src/data/skills/monsters.json)
```

This is what the simulator fights, and what the design doc §7.2 prescribes. The `attack` value is derived from the skill's damage range (avg 12).

### 2.3 Expected fight (player vs 3 × Fallen using JSON archetype)

Using the simulator's existing math (auto-attack only, post-defense damage ≈ `max(1, attack - defense*0.3)`):

| Class | Player DPS¹ | TTK on 1 Fallen² | Incoming DPS³ | TTK on player⁴ | Win? |
|---|---|---|---|---|---|
| Barbarian (150 HP, atk 25) | 25/1.3 ≈ 19 | 40/19 ≈ 2.1 s | 3 × 12/1.47 ≈ 24 | 150/24 ≈ 6.2 s | **YES** ✓ |
| Paladin (150 HP, atk 22)   | 22/1.25 ≈ 18 | 40/18 ≈ 2.2 s | 24 | 6.2 s | **YES** ✓ |
| Druid (150 HP, atk 20)     | 20/1.2 ≈ 17 | 2.4 s | 24 | 6.2 s | **YES** ✓ |
| Amazon (140 HP, atk 22)    | 22/1.05 ≈ 21 | 1.9 s | 24 | 5.8 s | **YES** ✓ |
| Assassin (140 HP, atk 20)  | 20/0.95 ≈ 21 | 1.9 s | 24 | 5.8 s | **YES** ✓ |
| Necromancer (130 HP, atk 22) | 22/1.2 ≈ 18 | 2.2 s | 24 | 5.4 s | **MARGINAL** ⚠ |
| Sorceress (120 HP, atk 22) | 22/1.15 ≈ 19 | 2.1 s | 24 | 5.0 s | **MARGINAL** ⚠ |

¹ basic attack damage / `attackIntervalMs/1000`; ² `fallenLife / playerDPS`; ³ summed Fallen DPS while all 3 alive; ⁴ `playerHP / incomingDPS` ignoring dodge.

The fight pattern: one Fallen drops at ~2 s, second at ~3.5 s, third at ~4.8 s. Sorceress finishes on ~25 % HP — the spec-required 30 % is just barely missed. Necromancer at ~30 %.

So **Fix #1 alone** lands the heavy classes safely above target and the casters at the line. **Fix #2** (small caster Vit bump) gives the casters a 5–10 % HP cushion for the inevitable variance from dodge rolls and crits.

### 2.4 Why the live game feels worse than this table

It uses `createSimpleEnemy`, not the JSON. Quote from `stores/combatHelpers.ts` (line 75):

```ts
function createSimpleEnemy(level: number): CombatUnit {
  return {
    // …
    stats: {
      life:        50 + level * 20,        // 70 at L1
      attack:      100 + level * 10,       // 110 at L1
      defense:     level * 5,              // 5 at L1
      attackSpeed: 80,
      // …
    }
  };
}
```

With three enemies hitting for ~20 a swing at AS 80, a 120-HP sorceress dies inside 4 enemy swings (~6 s of virtual time). She gets one swing in for ~17 dmg vs 70 HP — never closes a kill before she's dead.

## 3. Targets

For an L1 character of any of the 7 classes, fighting the first map's first 3-mob pull (3 × L1 Fallen, no elite affixes), auto-attack only, no skills, with the upcoming tick combat (see `tick-combat.md`):

| Metric | Target |
|---|---|
| **Win rate**           | ≥ 80 % over 200 seeded runs |
| **Avg HP remaining (winners)** | ≥ 30 % of `lifeMax` |
| **Median fight duration** | 10–20 s real-time at 1× speed |
| **Worst-case duration** (95th pct) | ≤ 30 s real-time at 1× speed |
| **No class below 70 % win-rate individually** | hard floor |

## 4. Proposed changes

> Smallest set, ranked by importance.

### 4.1 (Required) Switch production combat to the JSON archetype

**File:** `src/stores/combatHelpers.ts`

Replace `createSimpleEnemy(level)` with a call to the existing-but-test-only `buildMonster()` helper, promoted to the engine.

* Promote `buildMonster(archetypeId, level, tier)` from `tests/sim/bloodMoor.sim.test.ts` (lines 41-91) into a new `src/engine/spawn/buildMonster.ts`.
* `startSimpleBattle(level, count)` builds enemies via:

```ts
const archetypes = ['monsters/act1.fallen']; // for the Blood Moor entry pull
const enemies = Array.from({ length: count }, (_, i) =>
  buildMonster(archetypes[0], level, 'trash', `enemy-${i}`)
);
```

This is the only structural change needed; everything else is numeric.

**Before / After (effective L1 enemy):**

| Stat | Before (`createSimpleEnemy(1)`) | After (`monsters/act1.fallen` @ L1) |
|---|---|---|
| life | 70 | 30–50 (avg 40) |
| attack | 110 | 12 (derived from `monster-weak-melee` 10–15) |
| defense | 5 | 10 |
| attackSpeed | 80 | 95 |
| attackIntervalMs (post-tick-combat) | derived 1500 | 1474 |

### 4.2 (Recommended) Caster Vitality nudge

**File:** `src/features/character/createMockPlayer.ts`

| Class | Stat | Before | After | Δ derived |
|---|---|---|---|---|
| Sorceress   | vitality | 10 | **13** | life 120 → **126** |
| Sorceress   | energy   | 35 | **32** | mana 102 → **98** (still 4× barb) |
| Necromancer | vitality | 15 | **17** | life 130 → **134** |

Net: caster eHP ~+5 %, mana down ~5 %. Doesn't disturb later-game caster dominance because mana scaling is dominated by gear, not starting energy.

> **Why not just bump `lifePerVit` from 2→2.5?** It propagates through all levels and shifts the entire endgame eHP curve. A localized starting-stat tweak is reversible and class-targeted.

### 4.3 (Optional, not recommended) Fallen tuning

If §4.1 + §4.2 fail validation (qa-engineer to confirm), the next lever is monster-side. Do **not** change `life` (it's already at the documented design range). Acceptable adjustments:

| File | Field | Before | Proposed | Rationale |
|---|---|---|---|---|
| `data/monsters/act1.json` (Fallen) | `defense` | 10 | 8 | speeds player TTK by ~5 % |
| `data/skills/monsters.json` (`monster-weak-melee`) | `damage.max` | 15 | 14 | reduces upper-tail spike that kills casters on a crit cluster |

These are last-resort knobs; do not apply preemptively.

### 4.4 What we are explicitly NOT changing

* `deriveStats` formula — leaves entire progression curve intact.
* `lifePerVit` (2), `manaPerEnergy` (1.5), base attack constant (10), base defense (20).
* Other Act 1 monster stats — no scope creep.
* Skill numbers — no skills are required to win this fight, by design.

## 5. Validation plan (for `qa-engineer`)

### 5.1 Sim invocation

Add (or extend existing) a balance sim at `tests/sim/level1Cliff.sim.test.ts`. Use the same `buildMonster` helper post-§4.1 promotion and `runBattle` (auto-attack only — empty `comboOrder`).

```ts
const seeds = Array.from({ length: 200 }, (_, i) => 0xC0FFEE + i);
for (const cls of CHARACTER_CLASSES) {
  const player = createMockPlayer('test', cls);
  for (const seed of seeds) {
    const enemies = [0,1,2].map(i => buildMonster('monsters/act1.fallen', 1, 'trash', `e-${i}`));
    const result = runBattle({ seed, playerTeam: [playerToCombatUnit(player)], enemyTeam: enemies, act: 1 });
    record(cls, result);
  }
}
```

Assertions:

```ts
expect(winRateByClass[cls]).toBeGreaterThanOrEqual(0.80);
expect(avgHpPctOnWin[cls]).toBeGreaterThanOrEqual(0.30);
expect(medianDurationMs[cls]).toBeGreaterThanOrEqual(10000);
expect(medianDurationMs[cls]).toBeLessThanOrEqual(20000);
expect(p95DurationMs[cls]).toBeLessThanOrEqual(30000);
expect(minWinRateAcrossClasses).toBeGreaterThanOrEqual(0.70);
```

Run via `npx vitest run tests/sim/level1Cliff.sim.test.ts`. Add an npm alias `npm run sim:l1`.

### 5.2 Acceptance gates

All seven classes must pass §3's table simultaneously. Output the per-class table to console for reviewer visibility.

### 5.3 E2E smoke

Re-run `tests/e2e/full-loop.spec.ts` — the L74-80 warning branch (`'[full-loop] player did not win first Blood Moor encounter'`) must now be unreachable (player wins). Promote the warning to an `expect(...).toBe('player')`.

## 6. Sanity checks for higher levels

Goal: this rebalance must not shift TTK by more than **±15 %** on existing Act 3 content for an L20 hero.

### 6.1 L20 hero baseline

A "typical" L20 hero from current progression (5 stat-points/level × 19 ≈ 95 points spent — assume realistic split per class kit + L20 gear floor of `+30 flatLife` from chest/boots):

* Barbarian L20: life ≈ `100 + 19*8 + 2*(25+95) + 30` = **422**, attack ≈ `10 + 38 + 0.5*120 + 30` = **138**.
* Sorceress  L20 (post §4.2 with vit=13 base, +60 alloc): life ≈ `100 + 152 + 2*73 + 30` = **428** (vs previous 422 — **+1.4 %**, well within ±15 %).

The Vit nudge in §4.2 is +3 / +2 raw — at L20 with diminishing %-of-eHP it's < 2 % delta. Negligible.

### 6.2 Act 3 monster TTK (representative: a Flayer Shaman analogue)

The Act 3 dataset will live in `data/monsters/act3.json`. The §4.1 change touches **only** the bridge from store to engine (which monsters spawn and what JSON drives them) — once Act 3 monsters exist, they're unaffected by this PR. **No Act 3 numbers move at all.**

The §4.2 caster Vit nudge: a +6 HP at L1 grows to roughly +6 HP at L20 (Vit is added linearly, not scaled). Against a 200-DPS Act 3 elite that's a 0.03 s longer survival window. Sub-1 % shift, ✓.

### 6.3 Locked invariants

* `Diablo2TextGame.md` §7.2 monster JSON shape: untouched.
* `engine/progression/stats.ts` formulas: untouched.
* No new global multipliers, no `+%damage` floors.

## 7. Open questions for PM

1. **Should `createSimpleEnemy` be deleted entirely** (forcing all callers to spawn from JSON) or kept as a fallback for unit tests? Recommend keep with a deprecation comment; production callers route through `buildMonster`.
2. **Caster Vit nudge** — alternative is to give Sorceress/Necromancer a free starting passive (e.g., 1-rank "Frozen Armor" at character creation). More flavorful but bigger surface area. Defer to v1.1.
3. **Fallen pack size** — currently 3. Once tick-combat lands, tuning the *pack size* (2 vs 3 vs 4) is a much sharper knob than tuning monster stats; flag for `level-designer` to take over after v1.
4. **Difficulty pitch curve** — once L1 is fixed, qa-engineer should run a sim across L1→L10 to verify no new cliffs were introduced (e.g., at L5 when the first Carver pack appears). Out of scope for this PR but request a follow-up issue.

## 8. References

* `src/engine/progression/stats.ts` — derive formulas (untouched).
* `src/engine/combat/damage.ts` — damage pipeline (untouched).
* `src/features/character/createMockPlayer.ts` — class starting stats (only §4.2 edit).
* `src/stores/combatHelpers.ts` — production bridge (§4.1 edit).
* `src/data/monsters/act1.json` — archetype data (§4.3 optional).
* `tests/sim/bloodMoor.sim.test.ts` — existing simulator + `buildMonster` helper to be promoted.
* `tests/e2e/full-loop.spec.ts` L70-80 — the warning to remove once §3 passes.
