# Progression Curve — v1

**Owner:** `game-designer`
**Status:** native XP arithmetic reconciled; chapter levels/reward pacing remain open under D02
**Last updated:** 2026-11-03 (XP reference and pacing authority)
**Source references:** Diablo 2 LoD experience tables (Arreat Summit), D2R 2.4 patch XP curve, PoE skill point pacing
**Cross-refs:** `src/engine/progression/xp.ts` and `src/stores/combatHelpers.ts` (current XP award), `skills-spec.md` (skill tree), `maps-spec.md` (recLvl per area), `gacha-spec.md` (merc level = player level), `idle-offline.md` (XP bonus window)

This revision reconciles XP references and campaign pacing authority. Historical
stat/skill/quest budgets in other sections remain subject to D11 reconciliation.

---

## 1. Summary

Player level cap: **L90** in v1.

- **XP curve:** `xpRequired(L) = floor(100 × L^2.5)` (XP **to advance from L → L+1**).
- **Stat points per level:** **5** (Str / Dex / Vit / Energy — free allocation, no respec gating in v1).
- **Skill points:** 1 per level + 3 milestone bonuses (L12, L24, L36) + 3 from quests = **96 total by L90**.
- **Campaign pacing target:** **30–50 active hours** for first clear, centered on40h; see §8 and `docs/plans/playable-target.md`. Post-campaign L70/L90 timing and chapter level targets remain unresolved. The old two-week maturity estimate is not a campaign pacing contract.

---

## 2. Exact XP Table (L1 → L90)

`xpRequired(L) = floor(100 × L^2.5)` is the cost from L to L+1.
`xpTotal(L) = Σ xpRequired(k), k=1..L-1` is cumulative XP to reach L.
Floor each cost before summing. The formula is retained under D02; this table
corrects its arithmetic and does not ratify reward rates or chapter levels.

| L | XP L→L+1 | Cumulative XP | L | XP L→L+1 | Cumulative XP |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 0 | 46 | 1,435,141 | 18,150,766 |
| 2 | 565 | 100 | 47 | 1,514,414 | 19,585,907 |
| 3 | 1,558 | 665 | 48 | 1,596,258 | 21,100,321 |
| 4 | 3,200 | 2,223 | 49 | 1,680,700 | 22,696,579 |
| 5 | 5,590 | 5,423 | 50 | 1,767,766 | 24,377,279 |
| 6 | 8,818 | 11,013 | 51 | 1,857,485 | 26,145,045 |
| 7 | 12,964 | 19,831 | 52 | 1,949,882 | 28,002,530 |
| 8 | 18,101 | 32,795 | 53 | 2,044,982 | 29,952,412 |
| 9 | 24,300 | 50,896 | 54 | 2,142,813 | 31,997,394 |
| 10 | 31,622 | 75,196 | 55 | 2,243,400 | 34,140,207 |
| 11 | 40,131 | 106,818 | 56 | 2,346,767 | 36,383,607 |
| 12 | 49,883 | 146,949 | 57 | 2,452,941 | 38,730,374 |
| 13 | 60,933 | 196,832 | 58 | 2,561,946 | 41,183,315 |
| 14 | 73,336 | 257,765 | 59 | 2,673,806 | 43,745,261 |
| 15 | 87,142 | 331,101 | 60 | 2,788,548 | 46,419,067 |
| 16 | 102,400 | 418,243 | 61 | 2,906,193 | 49,207,615 |
| 17 | 119,157 | 520,643 | 62 | 3,026,768 | 52,113,808 |
| 18 | 137,461 | 639,800 | 63 | 3,150,296 | 55,140,576 |
| 19 | 157,356 | 777,261 | 64 | 3,276,800 | 58,290,872 |
| 20 | 178,885 | 934,617 | 65 | 3,406,303 | 61,567,672 |
| 21 | 202,091 | 1,113,502 | 66 | 3,538,831 | 64,973,975 |
| 22 | 227,016 | 1,315,593 | 67 | 3,674,404 | 68,512,806 |
| 23 | 253,699 | 1,542,609 | 68 | 3,813,048 | 72,187,210 |
| 24 | 282,181 | 1,796,308 | 69 | 3,954,783 | 76,000,258 |
| 25 | 312,500 | 2,078,489 | 70 | 4,099,634 | 79,955,041 |
| 26 | 344,693 | 2,390,989 | 71 | 4,247,622 | 84,054,675 |
| 27 | 378,799 | 2,735,682 | 72 | 4,398,769 | 88,302,297 |
| 28 | 414,853 | 3,114,481 | 73 | 4,553,099 | 92,701,066 |
| 29 | 452,892 | 3,529,334 | 74 | 4,710,633 | 97,254,165 |
| 30 | 492,950 | 3,982,226 | 75 | 4,871,392 | 101,964,798 |
| 31 | 535,062 | 4,475,176 | 76 | 5,035,400 | 106,836,190 |
| 32 | 579,261 | 5,010,238 | 77 | 5,202,676 | 111,871,590 |
| 33 | 625,582 | 5,589,499 | 78 | 5,373,243 | 117,074,266 |
| 34 | 674,058 | 6,215,081 | 79 | 5,547,122 | 122,447,509 |
| 35 | 724,719 | 6,889,139 | 80 | 5,724,334 | 127,994,631 |
| 36 | 777,600 | 7,613,858 | 81 | 5,904,900 | 133,718,965 |
| 37 | 832,730 | 8,391,458 | 82 | 6,088,840 | 139,623,865 |
| 38 | 890,141 | 9,224,188 | 83 | 6,276,177 | 145,712,705 |
| 39 | 949,864 | 10,114,329 | 84 | 6,466,930 | 151,988,882 |
| 40 | 1,011,928 | 11,064,193 | 85 | 6,661,120 | 158,455,812 |
| 41 | 1,076,365 | 12,076,121 | 86 | 6,858,768 | 165,116,932 |
| 42 | 1,143,202 | 13,152,486 | 87 | 7,059,893 | 171,975,700 |
| 43 | 1,212,470 | 14,295,688 | 88 | 7,264,515 | 179,035,593 |
| 44 | 1,284,197 | 15,508,158 | 89 | 7,472,656 | 186,300,108 |
| 45 | 1,358,411 | 16,792,355 | 90 | 7,684,334 | 193,772,764 |

L90 is the cap. Its 7,684,334 formula result is a reference value, not an available
L90→L91 advancement. All 90 rows and inverse threshold boundaries match the
native module and independent integer-square-root arithmetic. Reproduction and
source hashes: `d02-native-xp-reference-v1.mjs/.json` in the retained evidence
packet; [D02 reference analysis](../balance/2026-11-03-d02-xp-reference-and-pacing.md).

### 2.1 Arithmetic does not establish pacing

Exact cumulative checkpoints include L14=257,765; L26=2,390,989;
L40=11,064,193; L55=34,140,207; L70=79,955,041; L90=193,772,764.
The earlier sampled table and derived hour estimates were incorrect. A time to
reach any level also requires measured net reward income, combat qualification,
loss/retry costs, gear preparation and player interaction time. None follows
from the level-cost formula alone. D02 pairs the selected initial reward curve
with completion planning references; earned pacing acceptance remains open.

### 2.2 Selected production kill XP

The shared `src/engine/progression/xp.ts` reward uses the validated scalar policy
in `src/data/progression/kill-xp.json`:

```text
xpForKill(m) = max(5, round(10 × m × max(1, (m / 18)^1.5)))
winningWaveXP = Σ floor(xpForKill(slainEnemy.level) × activeIdleMultiplier)
```

The winning-wave settlement in `src/stores/combatHelpers.ts` counts slain
non-summoned enemies. It does not apply an additional tier, difficulty or
item-XP multiplier in this path. Difficulty can affect the resolved enemy level;
that is distinct from multiplying the XP grant again. Native idle-bonus
eligibility and consumption remain governed by the existing idle contract.

Enemy levels1–18 retain the prior linear rewards. Above18, rewards grow as
level^2.5. Examples: level19=206,45=1779,56=3073,82=7973 and122=21527.
Resolved enemy levels may exceed the hero cap90. This applies to future native
settlements only, with no historical XP recalculation or save-version change.
See [kill XP policy](kill-xp-policy.md) for selection rationale and qualification.

Initial Normal completion planning references are14/32/47/61/82 for ActsI–V,
paired with the §8 hour centers. They are neither native player entry gates nor
empirically accepted outcomes. Faster XP reduces loot/currency opportunities per
level; acquisition, recruitment, population fairness and pacing remain open.

The earlier `4 × level × tierMult × difficultyMult × (1+xpBonus)` expression
and claimed1.5M/1.85M XP/hour rates remain historical proposals. The
`combat-formulas.md` cross-reference does not establish them as runtime behavior.

### 2.3 Over-level helper is not a settled reward contract

The engine exports this helper:

```text
if playerLevel - monsterLevel <= 5: xpScale = 1
otherwise: xpScale = max(0.10, 1 - (playerLevel - monsterLevel - 5) × 0.10)
```

It returns 90% at a six-level difference, 50% at ten, and 10% at fourteen
or more. The winning-wave settlement described above does **not** call it.
Do not treat low-level backfarming penalties as implemented or add them during
reference correction. D02/D07 review must decide reward-path integration and
its effect on earned progression before changing production behavior.

---

## 3. Level → Recommended Area Map

Historical recommended bands from `maps-spec.md` are design guidance, not native
entry gates or current completion levels. In particular, Act V entry at55
does not establish a campaign-clear target of55. The selected initial completion
references in §2.2 govern prospective screening; this legacy area map establishes
neither earned chapter outcomes nor the §8 pacing acceptance.

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
questBonus     : actual one-time Claims; Lam Esen's Tome +5, Alkor's Experiment +5
totalStatPts(90) = 445 + questBonus (up to 455 after both Claims)
```

### 4.2 Stat soft cap

- Each stat **soft-caps at +1.0 effective per point past 200**, halving returns above 200 to discourage one-shot dump builds. Hard cap 500 per stat.

Malah's completed, claimed five-ingredient exchange adds +10 effective Vitality
after the ordinary soft cap. This is separate from allocated points: raw cap500,
effective sheet maximum510 and formula maximum360. It grants no allocation or
respec refund and does not restore current Life. Source-free historical Claims
remain inert; see [counted-source contract](counted-source-family.md).

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

## 8. Controlling campaign pacing targets

The owner-selected first clear is **30–50 active hours**, centered on 40h.
`docs/plans/playable-target.md` supersedes the former 16h commitment.
Starting cumulative checkpoint medians are below; each has a ±25% target band.
The checkpoint means completing the act, including its boss and unlock/claim.

| Completed act | Cumulative median active hours | Increment from prior checkpoint |
| --- | ---: | ---: |
| I | 5 | 5 |
| II | 12 | 7 |
| III | 22 | 10 |
| IV | 30 | 8 |
| V / first campaign clear | 40 | 10 |

D02 selects initial Normal completion references14/32/47/61/82 together with
the §2.2 reward curve. The exact costs of historical level examples are provided
in §2, not required levels at these time checkpoints. Higher challenge enemy
levels do not create a native hero-level entry gate. Existing evaluation
preparation targets/caps and the two-level safer-source margin remain unchanged;
ranked source fallback requires a separately declared opt-in comparison.

Record cumulative and incremental earned XP, levels, combat time, player-active
time, attempts/losses, preparation and acquisition. Simulated combat hours are
not measured player-active hours; physical test runtime is also separate.
No fixed session-length or average idle bonus assumption establishes acceptance.
L70/L90 and Nightmare/Hell time targets need a compatible post-campaign contract;
the old two-week/6–8-week promises and 50/70/250h estimates are unresolved legacy
estimates, not current designer commitments.

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

export function levelForXp(totalXp: number): number {
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
- Exact reference: `xpTotal(70) === 79_955_041` and `xpTotal(90) === 193_772_764`.
- Native inverse API: `levelForXp(193_772_764) === 90`; threshold minus1 resolves to89. L90 remains capped.
- `xpScale()` exists but is not applied in winning-wave settlement; integration remains a D02/D07 decision, not an instruction to change rewards in this reference correction.

### To Frontend Dev
- Character sheet: level, XP bar (`xp / xpRequired(L)`), stat allocation UI with +/- buttons (cancellable until "Apply").
- Skill tree screen with tier locks (greyed-out below L thresholds).
- Respec confirmation modal.

### To Content Designer
- Quest data files with `reward.statPoints`, `reward.skillPoints`, `reward.permanentStats[]` per §7.
- i18n strings for all level-up notifications and stat tooltips.

### To QA
- Exact arithmetic evidence: every L1..90 matches §2 and an independent integer reference; inverse thresholds and cap verified without combat. Existing engine tests remain unchanged.
- Helper boundary reference: `xpScale` diff5=1.0, diff6=0.9, diff10=0.5, diff14=0.10; this does not prove reward-path application.
- Playwright: full Act I → boss flow ends with player at L≥10 (sanity).

🟡 **OPEN (v1.1+):**
- Paragon levels (post-90 infinite progression)
- Token of Absolution (extra respec)
- Endless rift XP rewards
- Stat-point quest grants beyond the 2 covered in v1
- Charm-driven stat bonuses
