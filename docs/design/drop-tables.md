# Drop Tables — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** Diablo 2 Arreat Summit TC tables, PureDiablo droprate datamine, D2R 2.4 patch
**Cross-refs:** `items-spec.md` (rarity, MF curve, runes), `monster-spec.md` (tiers), `maps-spec.md` (per-area override)

---

## 1. Summary

Drop resolution per monster death:
1. Roll `noDrop` chance — if hit, no item.
2. Otherwise resolve **Treasure Class (TC)** — picks an item base.
3. Roll **rarity** for that item (white/blue/yellow/set/unique) using MF-modulated weights.
4. Roll **gold** independently (always rolls).
5. Roll **runes/gems/wishstones** as **independent secondary drops** (not consuming the TC slot).

Each TC contains a list of **picks**; each pick samples one item from `bases[]` weighted by `weight`, gated by `qlvlMin`/`qlvlMax`.

---

## 2. Treasure Classes by Tier

```
Trash (default monsters)         → tc_trash_<actN>
Champion (forced champ wave)     → tc_champion_<actN>
Unique (random "magic" elite)    → tc_unique_<actN>
Boss (act-end boss)              → tc_act<N>_boss
Mini-boss (radament, izual, etc) → tc_mini_<actN>
Treasure Goblin                  → tc_treasure
```

`<actN>` ∈ {1..5}; difficulty (Nightmare, Hell) shifts the table by +1, +2 tiers (per `maps-spec.md` §11).

### 2.1 noDrop chance per tier

| Tier | Normal | Nightmare | Hell |
|---|---|---|---|
| Trash | 60% | 50% | 40% |
| Champion | 20% | 12% | 6% |
| Unique | 10% | 5% | 0% |
| Mini-boss | 0% | 0% | 0% |
| Boss | 0% | 0% | 0% |
| Treasure | 0% | 0% | 0% |

`noDrop` is reduced by **partyDropMod = 1 / (1 + 0.15 × (partySize - 1))` 🟡 v1.1+ (party play).

---

## 3. Rarity Weight Resolution (recap of `items-spec.md` §11)

```
effectiveMF = floor(MF / (MF + 250) * 600)        // 0..600

baseRarityWeights = {
  white:  1000,
  blue:    300,
  rare:     80,
  set:       8,
  unique:    4,
}

modulated:
  white   *= (1 - effectiveMF / 1200)
  blue    *= (1 + effectiveMF /  600)
  rare    *= (1 + effectiveMF /  400)
  set     *= (1 + effectiveMF /  200)
  unique  *= (1 + effectiveMF /  180)

monster-tier multiplier:
  trash    rare/set/unique × 1.0
  champion rare ×1.5, set ×2.0, unique ×3.0
  unique   rare ×2.0, set ×3.0, unique ×6.0
  miniBoss rare ×3.0, set ×4.0, unique ×8.0
  boss     rare ×4.0, set ×6.0, unique ×12.0
```

### 3.1 Final rarity probability table (illustrative @ MF 0)

| Source | white | blue | rare | set | unique |
|---|---|---|---|---|---|
| Trash | 71.7% | 21.5% | 5.7% | 0.57% | 0.29% |
| Champion | 70.5% | 21.2% | 8.5% | 1.13% | 0.85% |
| Unique mob | 68.6% | 20.6% | 11.0% | 1.65% | 1.65% |
| Mini-boss | 67.1% | 20.1% | 16.1% | 2.15% | 2.15% |
| Act boss | 64.0% | 19.2% | 20.5% | 3.07% | 3.07% |

### 3.2 At MF=300 (a moderate MF build)

| Source | white | blue | rare | set | unique |
|---|---|---|---|---|---|
| Trash | 60.5% | 25.0% | 11.5% | 1.50% | 1.50% |
| Champion | 56.6% | 23.4% | 16.1% | 2.81% | 4.21% |
| Boss | 47.0% | 19.4% | 26.7% | 5.59% | 6.71% |

These values are computed from the formulas in §3 and §11 of `items-spec.md` and **must** be matched by the engine's drop tests.

---

## 4. TC Tables

Each entry: `{ baseId, weight, qlvlMin, qlvlMax }`. Engine picks one base via weighted RNG, filtered by `monsterLevel ∈ [qlvlMin, qlvlMax]`.

### 4.1 `tc_trash_act1` (Act I trash mobs)

| baseId | weight | qlvl |
|---|---|---|
| `helm_cap` | 200 | 1–10 |
| `helm_skull_cap` | 150 | 4–14 |
| `armor_quilted` | 200 | 1–10 |
| `armor_leather` | 150 | 5–14 |
| `glove_leather` | 200 | 1–14 |
| `boot_leather` | 200 | 1–14 |
| `belt_sash` | 200 | 1–14 |
| `belt_light` | 100 | 6–14 |
| `wp1h_short_sword` | 250 | 1–10 |
| `wp1h_scimitar` | 150 | 7–14 |
| `wp2h_two_handed_sword` | 100 | 1–10 |
| `wp2h_great_axe` | 70 | 7–14 |
| `sh_buckler` | 150 | 1–10 |
| `sh_kite` | 100 | 7–14 |
| `ring_iron` | 80 | 1–14 |
| `ring_silver` | 50 | 9–14 |
| `amu_tin` | 60 | 1–14 |
| `amu_brass` | 40 | 9–14 |

### 4.2 `tc_trash_act2` (Act II)
Drops Normal-tier bases, qlvl 14–26. Same shape as above; weights doubled for `helm_skull_cap`, `armor_leather`, `wp1h_scimitar`, `boot_heavy`, `belt_light` and Exceptional bases (`helm_war_hat`, `armor_chain_mail`, `wp1h_long_sword`, `sh_aegis`) added at weight 60–80, qlvl 22–28.

### 4.3 `tc_trash_act3`
qlvl 26–40. Exceptional bases dominant; Elite bases (`helm_armet`, `armor_dusk_shroud`, `wp1h_phase_blade`, `sh_monarch`) appear at weight 30–50, qlvl 38–45.

### 4.4 `tc_trash_act4`
qlvl 40–55. Elite bases dominant. Normal bases removed.

### 4.5 `tc_trash_act5`
qlvl 55–75. Elite bases only. Higher weight on shields & armor (Lister/Baal minion theme).

### 4.6 `tc_champion_actN`
Champion adds **+1 picks** vs trash (so **2 picks total**) and inherits the act's trash table — but `qlvlMin += 2`. Boosts rare/set/unique multipliers per §3.

### 4.7 `tc_unique_actN`
Unique mobs roll **3 picks**, qlvl `+3`. Plus a **guaranteed** roll on `tc_jewelry_actN` (rings/amulets/charms).

### 4.8 `tc_jewelry_actN`
Always picks from rings/amulets only. Used as a forced extra roll for Unique mobs and bosses.

```
tc_jewelry_act1: ring_iron(200, 1–14), ring_silver(120, 9–14), amu_tin(150, 1–14), amu_brass(80, 9–14)
tc_jewelry_act2: ring_silver(150), ring_jade(80, 23–32), amu_brass(120), amu_silver(70, 23–32)
tc_jewelry_act3: ring_jade(150), ring_amber(80, 33–45), amu_silver(120), amu_jade(70, 33–45)
tc_jewelry_act4: ring_amber(150), ring_obsidian(80, 48–58), amu_jade(120), amu_obsidian(70, 48–58)
tc_jewelry_act5: ring_obsidian(150), ring_zircon(100, 58–75), amu_obsidian(120), amu_zircon(100, 58–75)
```

### 4.9 `tc_treasure` (Treasure Goblin)

5 picks at boss-tier weights. **Always at least 1 rare**. Independent extra rolls:
- 1d4 runes (per §4 rune table at `act+1`)
- 5–10 gems
- 1–3 wishstones (gacha currency, see §5)
- 5× normal gold drop

---

## 5. Boss Loot Tables

### 5.1 `tc_act1_boss` — Andariel
- 4 picks from `tc_trash_act1` with `qlvlMin += 5`
- 2 picks from `tc_jewelry_act1`
- 1 forced **rare or better** (reroll until ≥ rare)
- 1 forced rune from `tc_runes_act2` (Tal..Ith band)
- 25% chance: extra unique attempt with 5× unique multiplier
- Always: 8 wishstones, 2 gems, gold = `monsterLvl × 200 × (1 + GF/100)`
- First-kill (per save): guaranteed unique drop (engine flag `firstKillBonus`)

### 5.2 `tc_act2_boss` — Duriel
- 5 picks `tc_trash_act2`, qlvl +5
- 3 picks `tc_jewelry_act2`
- 1 forced rare+
- 1–2 runes from `tc_runes_act3` (Ral..Hel)
- 30% chance extra unique
- 12 wishstones, 3 gems
- First-kill: guaranteed `uniq_stone_of_jordan` 5% / random unique 95%

### 5.3 `tc_act3_boss` — Mephisto
- 6 picks `tc_trash_act3`, qlvl +5
- 3 picks `tc_jewelry_act3`
- 2 forced rare+
- 2 runes from `tc_runes_act4` (Hel..Lem)
- 35% chance extra unique
- 16 wishstones, 4 gems
- First-kill: guaranteed unique armor or weapon

### 5.4 `tc_act4_boss` — Diablo
- 7 picks `tc_trash_act4`, qlvl +5
- 3 picks `tc_jewelry_act4`
- 2 forced rare+
- 1 forced **set or unique** (reroll until)
- 2–3 runes from `tc_runes_act5` (Ko..Pul)
- 40% chance extra unique
- 24 wishstones, 5 gems
- First-kill: guaranteed `uniq_grandfather` (chance 3%) or random Elite-base unique 97%

### 5.5 `tc_act5_boss` — Baal
- 8 picks `tc_trash_act5`, qlvl +5
- 4 picks `tc_jewelry_act5`
- 3 forced rare+
- 1 forced set or unique
- 3–5 runes from `tc_runes_act5_baal` (Pul..Zod, with Mal+ realistic only on Hell)
- 50% chance extra unique
- 40 wishstones, 8 gems
- First-kill: guaranteed unique + 1 high rune (Mal+) on Hell only

### 5.6 Mini-boss tables (`tc_mini_actN`)
Halfway between trash and act-boss tables:
- 3 picks `tc_trash_actN` (qlvl +3)
- 1 pick `tc_jewelry_actN`
- 1 forced rare+ (50% chance, not guaranteed)
- 1 rune from `tc_runes_actN`
- 6–10 wishstones (scales with act)

Mini-boss list (from `maps-spec.md`): blood_raven, radament, summoner, witch_doctor_endugu, battlemaid_sarina, council3, izual, hephasto, shenk, eldritch, thresh_socket, nihlathak, ancients.

---

## 6. Monster-tier multipliers on TC weight

Already encoded in §3 rarity multipliers. **No additional multiplier on item base picks** — base distribution stays similar across tiers; only rarity rolls shift.

---

## 7. Rune Drop Tables per Act

Independent secondary roll on every kill. Probability of "any rune drops" is configured per tier:

| Tier | Rune-drop chance |
|---|---|
| Trash | 0.6% |
| Champion | 3% |
| Unique mob | 5% |
| Mini-boss | 25% |
| Act boss | 100% (1–5 runes per §5) |
| Treasure goblin | 100% (1d4 runes) |

When a rune drops, sample from the act's rune pool weighted by `items-spec.md` §8 with **per-Act caps**:

```
Act I:   El..Ral allowed (runes #1..#8). Max rune cap = Ith.
Act II:  El..Hel allowed (#1..#15).      Cap = Tal..Hel.
Act III: El..Fal allowed (#1..#19).      Cap = Sol..Fal.
Act IV:  El..Pul allowed (#1..#21).      Cap = Lem..Pul.
Act V:   All 33 allowed.                  Cap = Um..Zod (Hell only for ≥ Mal).
```

Weights from items-spec are scaled by `1 / (Σ weights up to cap)`. Top runes Sur..Zod are **Hell-difficulty only** in v1; on Normal/Nightmare, an unrolled top rune downgrades to the next-highest allowed.

### 7.1 Practical examples

- **Andariel Hell (mlvl 75)**: 1 forced rune from Act II pool → expected ≈ Tal/Ith/Ral.
- **Baal Hell (mlvl 90)**: 3–5 runes from full pool. Probability of a Ber+ on a single Baal kill ≈ 1.2%.

---

## 8. Gem Drop Tables

Gems are simpler: independent roll on every kill.

| Tier | Gem chance | Quality bias |
|---|---|---|
| Trash | 1.5% | chipped/flawed |
| Champion | 4% | flawed/normal |
| Unique mob | 8% | flawed/normal/flawless |
| Mini-boss | 35% | normal/flawless |
| Boss | guaranteed (n) | flawless/perfect |
| Treasure | guaranteed (5–10) | normal+ |

Per-act quality cap:

| Act | Quality cap |
|---|---|
| I | flawed |
| II | normal |
| III | flawless |
| IV | flawless |
| V | perfect (Hell only) |

Gem types: amethyst, diamond, emerald, ruby, sapphire, skull, topaz. Equal weight at roll time.

---

## 9. Wishstone (Gacha Currency) Drops

Wishstones are the only currency for the gacha (see `gacha-spec.md`). Sources:

| Source | Wishstones |
|---|---|
| Per kill (any monster) | 0 (none on trash) |
| Champion kill | 0–1 (40% chance for 1) |
| Unique mob kill | 1–2 (always at least 1) |
| Mini-boss | 6–10 (scales with act) |
| Act boss | 8 / 12 / 16 / 24 / 40 (Acts I–V) |
| Treasure goblin | 1–3 |
| First-time area clear | 5 (one-shot) |
| Daily login (🟡 v1.1) | 5 |
| Quest completion (~30 quests) | 10–25 each |

**Hell-difficulty multiplier:** ×1.5 on champion/unique/mini/boss wishstone drops. **Nightmare:** ×1.2.

Target faucet rate at L70 Hell-Act-V farm: **~80 wishstones per hour** (1 ten-pull every ~8 minutes farming + boss + champions).

---

## 10. Gold Drops

```
goldPerKill = floor( base × monsterLvl × tierMult × (1 + GF / 100) × rng(0.7, 1.3) )

tierMult: trash=1, champion=2.5, unique=4, miniBoss=10, boss=50, treasure=20
base    : 5
```

E.g., Hell Baal (mlvl 90, GF 200) average: `5 × 90 × 50 × 3 × 1.0 ≈ 67,500` gold per kill.

---

## 11. MF Diminishing Returns Curve (visual)

```
effectiveMF = MF / (MF + 250) × 600

MF    | effMF | unique mult | "marginal +100 MF gain"
0     |   0   | 1.00×       | +94%
100   | 171   | 1.95×       | +44%
200   | 267   | 2.49×       | +28%
300   | 327   | 2.82×       | +20%
500   | 400   | 3.22×       | +13%
800   | 457   | 3.54×       |  +7%
1500  | 514   | 3.86×       |  +3%
∞     | 600   | 4.33×       |   —
```

**Designer rationale:** soft cap ~300 MF, hard ceiling ~800. Encourages 200–400 MF gear builds (Tal Rasha + War Traveler + Stone of Jordan stack ≈ 320 MF without sacrificing power).

---

## 12. Engine Drop Pipeline

```
function rollDrop(monster, player):
  if rng() < noDropChance(monster.tier, difficulty): return []
  drops = []
  for picks in TC(monster.tcId).picks:           // boss has multiple picks
    base = pickWeighted(TC.bases, qlvl=monster.lvl)
    rarity = pickRarity(player.MF, monster.tier)
    item = generateItem(base, rarity, ilvl=monster.lvl)
    drops.push(item)
  // independent secondary rolls
  if rng() < runeChance(tier): drops.push(rollRune(act))
  if rng() < gemChance(tier): drops.push(rollGem(act))
  drops.push({ kind:'gold', amount: rollGold(monster, player) })
  drops.push({ kind:'wishstone', amount: rollWishstone(monster) })
  return drops
```

All RNG goes through engine's seeded PRNG (`engine/rng.ts`) so drops are deterministic per encounter seed.

---

## 13. Cross-Reference Index

- TC base IDs → `items-spec.md` §3 (helm/armor/etc).
- Monster `tcId` field → `monster-spec.md` (each monster JSON has `tcId`).
- Sub-area `tcOverride` → `maps-spec.md` §4 schema.
- MF effective curve → `items-spec.md` §11.

---

## 14. Handoff to Content Designer

Produce JSON files validated by `src/data/schema/treasure-class.schema.json`:

1. **`src/data/treasure/trash.json`** — `tc_trash_act1` … `tc_trash_act5` per §4.
2. **`src/data/treasure/champion.json`**, **`unique.json`**, **`mini.json`**, **`boss.json`** — per §4.6, §4.7, §5.6, §5.1–§5.5.
3. **`src/data/treasure/jewelry.json`** — `tc_jewelry_act1..5` per §4.8.
4. **`src/data/treasure/treasure-goblin.json`** — `tc_treasure` per §4.9.
5. **`src/data/treasure/runes.json`** — per-act caps per §7.
6. **`src/data/treasure/gems.json`** — quality cap per Act per §8.
7. **`src/data/treasure/wishstones.json`** — sources per §9.

Add a **drop-rate test harness** under `engine/__tests__/drops.test.ts`: run 10 000 simulated boss kills, assert observed rarity matches §3.1/§3.2 within ±15%.

🟡 **OPEN (v1.1+):**
- Party drop modifier
- Diablo Clone / über event TCs
- Crafting recipe ingredient TCs
- Charms (small/large/grand)
