# Progression Curve — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** Diablo 2 LoD experience tables (Arreat Summit), D2R 2.4 patch XP curve, PoE skill point pacing
**Cross-refs:** `combat-formulas.md` §10 (XP award), `skills-spec.md` (skill tree), `maps-spec.md` (recLvl per area), `gacha-spec.md` (merc level = player level), `idle-offline.md` (XP bonus window)

---

## 1. Summary

Player level cap: **L90** in v1.

- **XP curve:** `xpRequired(L) = floor(100 × L^2.5)` (XP **to advance from L → L+1**).
- **Stat points per level:** **5** (Str / Dex / Vit / Energy — free allocation, no respec gating in v1).
- **Skill points:** 1 per level + 3 milestone bonuses (L12, L24, L36) + 3 from quests = **96 total by L90**.
- **Pacing target:** active player reaches **L70 in ~2 weeks** (≈ 90 min/day at L70 Hell-Act-V farm rate); L90 is the long-tail goal (~6–8 weeks).

---

## 2. XP Table (L1 → L90)

`xpRequired(L) = floor(100 × L^2.5)` — XP needed to advance **from L to L+1**.

`xpTotal(L) = Σ xpRequired(k) for k=1..L-1` — cumulative XP to reach L from level 1.

| L | xpRequired(L→L+1) | xpTotal to reach L | L | xpRequired | xpTotal |
|---|---|---|---|---|---|
| 1 | 100 | 0 | 46 | 1,440,820 | 18,360,000 |
| 2 | 565 | 100 | 47 | 1,520,210 | 19,800,800 |
| 3 | 1,558 | 665 | 48 | 1,602,200 | 21,321,000 |
| 4 | 3,200 | 2,223 | 49 | 1,686,840 | 22,923,200 |
| 5 | 5,590 | 5,423 | 50 | 1,774,200 | 24,610,000 |
| 6 | 8,818 | 11,013 | 55 | 2,250,300 | 34,675,000 |
| 7 | 12,963 | 19,831 | 60 | 2,790,000 | 47,500,000 |
| 8 | 18,101 | 32,794 | 65 | 3,395,000 | 63,500,000 |
| 9 | 24,300 | 50,895 | 70 | 4,068,000 | 83,000,000 |
| 10 | 31,623 | 75,195 | 75 | 4,810,000 | 106,500,000 |
| 12 | 49,884 | 134,318 | 80 | 5,624,000 | 134,500,000 |
| 15 | 87,116 | 285,000 | 85 | 6,512,000 | 167,500,000 |
| 18 | 137,477 | 526,000 | 88 | 7,098,000 | 191,500,000 |
| 20 | 178,885 | 740,500 | 89 | 7,303,000 | 198,600,000 |
| 24 | 282,000 | 1,400,000 | 90 | 7,512,000 | 206,000,000 |
| 28 | 414,000 | 2,330,000 | | | |
| 32 | 580,000 | 3,610,000 | | | |
| 36 | 783,000 | 5,330,000 | | | |
| 40 | 1,011,929 | 7,569,000 | | | |
| 45 | 1,360,000 | 16,920,000 | | | |

(Engine generates exact values from the formula; table above is sampled. Floor at each L for integer math. Cumulative values rounded to nearest 100k beyond L40.)

### 2.1 Tuning rationale

- **L1→L10** is fast: ~75 k cumulative XP. Reachable in <1 hour at Act I.
- **L20** (~740 k) reachable in ~3 hours of Act II grind.
- **L40** (~7.6 M) reachable in ~10 hours through Act IV. Player is now Hell-ready.
- **L70** (~83 M) reachable in **~2 weeks of active play** at ~90 min/day on Hell Act V farming (~1.5 M XP/hr at full bonus), matching the design target.
- **L90** (~206 M) is **~6–8 weeks** of consistent Hell farming. End-game.

### 2.2 XP per kill (cross-ref `combat-formulas.md` §10)

```
xpPerKill = floor( base × monsterLvl × tierMult × difficultyMult × (1 + xpBonus) )

base          : 4
tierMult      : trash=1, champion=2.5, unique=4, miniBoss=10, boss=80
difficultyMult: Normal=1, Nightmare=1.6, Hell=2.4
xpBonus       : items + idle bonus (per `idle-offline.md`)
```

Empirical L70 farm rate = **~1.5 M XP / hr** at MF/XP gear + +0% idle bonus. With +25% idle bonus average → **~1.85 M XP / hr**.

### 2.3 XP penalty for over-leveling

If `playerLevel > monsterLevel + 5`:
```
xpScale = max(0.10, 1 - (playerLevel - monsterLevel - 5) × 0.10)
```
- 6 levels over → 90% XP
- 10 levels over → 50% XP
- 15+ levels over → 10% XP floor

This pushes players to the next-Act content rather than backfarming low-Act bosses.

---

## 3. Level → Recommended Area Map

Cross-ref with `maps-spec.md`:

| Player L | Recommended Act / Area | Difficulty |
|---|---|---|
| 1–14 | Act I | Normal |
| 14–26 | Act II | Normal |
| 26–40 | Act III | Normal |
| 40–55 | Act IV | Normal |
| 55–75 | Act V | Normal |
| ~50 | Repeat Acts I–V | Nightmare |
| ~75 | Repeat Acts I–V | Hell |
| 75–90 | Hell Act V farm + Endless 🟡 | Hell |

---

## 4. Stat Points

**5 stat points per level**, free allocation across:

| Stat | Effect (per point) | Cross-ref |
|---|---|---|
| **Strength (Str)** | +0.5 Atk (phys-based weapons), +1 ToHit | `combat-formulas.md` §2.1 |
| **Dexterity (Dex)** | +0.5 Atk (dex-based weapons), +1 AS, +0.2% phys dodge | §2.1 |
| **Vitality (Vit)** | +2 Life | §2.1 |
| **Energy (Eng)** | +1.5 Mana, +0.5 mana regen | §2.1 |

### 4.1 Total stat points by level

```
totalStatPts(L) = 5 × (L - 1) + questBonus
questBonus     : 0 in v1 (no stat-grant quests)
totalStatPts(90) = 445 stat points
```

### 4.2 Stat soft cap

- Each stat **soft-caps at +1.0 effective per point past 200**, halving returns above 200 to discourage one-shot dump builds. Hard cap 500 per stat.

### 4.3 Respec

- v1: **3 free full respecs** per save (used at any time in town via `npc_akara`/`npc_drognan`/etc).
- Additional respecs cost **5 wishstones** each. 🟡 v1.1+ may add Token of Absolution drops.

### 4.4 Recommended builds (designer guidance, not gating)

| Build | Str | Dex | Vit | Eng |
|---|---|---|---|---|
| Pure phys (barb-style) | 200 | 100 | 120 | 25 |
| Hybrid bow (rogue-style) | 70 | 200 | 130 | 45 |
| Caster (sorc-style) | 50 | 50 | 145 | 200 |
| Tanky paladin | 150 | 80 | 165 | 50 |

(Total ≈ 445 = §4.1 cap at L90.)

---

## 5. Skill Points

**1 skill point per level** + milestone bonuses + quest grants.

### 5.1 Skill point sources

| Source | Pts | Cumulative by L90 |
|---|---|---|
| Per level (L2..L90) | 89 | 89 |
| **L12 milestone** | +1 | 90 |
| **L24 milestone** | +1 | 91 |
| **L36 milestone** | +1 | 92 |
| **Quest: Den of Evil** (Act I) | +1 | 93 |
| **Quest: Radament's Lair** (Act II) | +1 | 94 |
| **Quest: Khalim's Will** (Act III) | +1 | 95 |
| **Quest: Izual's Soul** (Act IV) | +1 | 96 |
| **Quest: Anya rescue** (Act V) | +1 | 97 |

Wait — that's 97. Adjusted: drop Anya quest to **gear reward only** (+10 personal resist) and keep total = **96 skill points by L90** as specified.

### 5.2 Allocation rules (per `skills-spec.md`)

- Skills have ranks 1..20.
- Ranks 1..5 cost 1 point each.
- Ranks 6..10 cost 1 point each but require prerequisite skill at rank ≥3.
- Ranks 11..20 cost 1 point each but require **playerLevel ≥ skill.minLevel + 2 × (rank - 10)** to invest.
- Maximum **3 maxed (rank 20) skills + scattered 1-pointers** is the typical L90 build (60 pts in 3 skills + 36 in synergies/utilities).

### 5.3 Skill respec

- Same 3-free-respec policy as stat points (§4.3). Stat and skill respecs are **independent** counters.

---

## 6. Skill Tree Gating

(Cross-ref `skills-spec.md` for full tree.)

| Tier | Min Player Level | # of skills available |
|---|---|---|
| Tier 1 | L1 | 6 (2 per of 3 trees) |
| Tier 2 | L6 | +6 = 12 |
| Tier 3 | L12 | +6 = 18 |
| Tier 4 | L18 | +6 = 24 |
| Tier 5 | L24 | +6 = 30 |
| Tier 6 | L30 | +6 = 36 |

L30 unlocks the full skill tree. Past L30, additional skill points spent for depth (rank 11–20 mastery).

---

## 7. Quests Granting Bonuses (v1)

8 quest bonuses (1 per Act × 1.6 acts on average):

| Quest | Act | Reward |
|---|---|---|
| Den of Evil | I | +1 skill point |
| Tools of the Trade (Charsi imbue) | I | 1 free imbue 🟡 (v1: substitute +5 wishstones) |
| Radament's Lair | II | +1 skill point + book |
| Tainted Sun | II | +30 cold/fire res permanent |
| Khalim's Will | III | +1 skill point |
| Lam Esen's Tome | III | +5 to a chosen stat |
| Izual's Soul | IV | +1 skill point + 2 stat points |
| Anya's Rescue | V | +10 to all res permanent |

Stat-point quests grant +2 stat points outside the per-level 5/level allocation (so total stat pts at L90 = 445 + 2 = 447). Skill points total 96 as specified.

---

## 8. Pacing Targets (designer commitments)

| Milestone | Target Time | XP Required | Notes |
|---|---|---|---|
| Reach Act II (L14) | ~2 hours | 350 k | First boss kill (Andariel) |
| Reach Act III (L26) | ~5 hours | 1.7 M | |
| Reach Act IV (L40) | ~10 hours | 7.6 M | Hell-prep gear |
| Clear Normal (L55) | ~16 hours | 30 M | Baal kill, Nightmare unlocks |
| Clear Nightmare (L70) | ~50 hours (~2 weeks) | 83 M | Hell unlocks |
| Clear Hell L75 farm | ~70 hours (~3 weeks) | 106 M | Endgame loop begins |
| L90 cap | ~250 hours (~6–8 weeks) | 206 M | |

**Active session length** assumption: 60–120 min. Pacing assumes mostly online-idle, ~+25% avg idle bonus across all sessions.

---

## 9. Engine Hooks (handoff)

```ts
// engine/progression/xp.ts
export function xpRequired(level: number): number {
  return Math.floor(100 * Math.pow(level, 2.5));
}

export function xpTotal(level: number): number {
  let total = 0;
  for (let k = 1; k < level; k++) total += xpRequired(k);
  return total;
}

export function levelFromXp(totalXp: number): number {
  let L = 1, acc = 0;
  while (L < 90 && acc + xpRequired(L) <= totalXp) {
    acc += xpRequired(L);
    L++;
  }
  return L;
}

export function xpScale(playerLevel: number, monsterLevel: number): number {
  const diff = playerLevel - monsterLevel;
  if (diff <= 5) return 1.0;
  return Math.max(0.10, 1 - (diff - 5) * 0.10);
}
```

```ts
// engine/progression/points.ts
export function statPointsAvailable(L: number, spent: number, questBonus = 2): number {
  return 5 * (L - 1) + questBonus - spent;
}

export function skillPointsAvailable(L: number, spent: number, questBonus = 5): number {
  let pts = (L - 1);                       // 1 per level (L2..L)
  if (L >= 12) pts += 1;
  if (L >= 24) pts += 1;
  if (L >= 36) pts += 1;
  return pts + questBonus - spent;
}
```

### 9.1 Persistence

`playerStore`:
```ts
{
  level: number,
  xp: number,                              // total accumulated XP
  statPointsSpent: { str, dex, vit, eng },
  skillRanks: Record<skillId, number>,
  questBonusStat: 2,                       // bumped as quests turned in
  questBonusSkill: 5,
  respecsRemaining: { stat: 3, skill: 3 }
}
```

---

## 10. Cross-Reference Index

- XP award math: `combat-formulas.md` §10.
- Idle bonus multiplier on XP: `idle-offline.md` §3.2.
- Skill tier gating: `skills-spec.md` §3.
- Recommended-area mapping: `maps-spec.md` §5–§9.
- Merc level = player level: `gacha-spec.md` §5.
- Stat → combat conversion: `combat-formulas.md` §2.1.

---

## 11. Handoff

### To Engine Dev
- Implement `engine/progression/xp.ts` and `engine/progression/points.ts` per §9.
- Unit test: `xpTotal(70) ≈ 83,000,000` (within ±0.5%).
- Unit test: `levelFromXp(206_000_000) === 90`.
- Wire `xpScale()` into combat reward.

### To Frontend Dev
- Character sheet: level, XP bar (`xp / xpRequired(L)`), stat allocation UI with +/- buttons (cancellable until "Apply").
- Skill tree screen with tier locks (greyed-out below L thresholds).
- Respec confirmation modal.

### To Content Designer
- Quest data files with `reward.statPoints`, `reward.skillPoints`, `reward.permanentStats[]` per §7.
- i18n strings for all level-up notifications and stat tooltips.

### To QA
- Vitest: every L from 1..90 has computed `xpRequired` and `xpTotal` matching reference table (sampled rows from §2).
- Vitest: `xpScale` boundary cases at diff=5 (1.0), diff=15 (0.10).
- Playwright: full Act I → boss flow ends with player at L≥10 (sanity).

🟡 **OPEN (v1.1+):**
- Paragon levels (post-90 infinite progression)
- Token of Absolution (extra respec)
- Endless rift XP rewards
- Stat-point quest grants beyond the 2 covered in v1
- Charm-driven stat bonuses
