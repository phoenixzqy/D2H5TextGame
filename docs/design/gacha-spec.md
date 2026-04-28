# Gacha Spec — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** Genshin Impact 50/50 pity model (rates simplified), Honkai Star Rail soft pity, AFK Arena hero pool, D2 Act II Desert Mercenary
**Cross-refs:** `drop-tables.md` §9 (wishstone faucet), `skills-spec.md` (signature skills), `combat-formulas.md` §11 (merc combat math), `monster-spec.md` (some merc IDs cross over from desert merc roster)

---

## 1. Summary

A single gacha called **Wish of the Horadrim** (`gacha_horadrim`). Currency: **Wishstones** (`item_wishstone`).

- **1 pull = 10 wishstones**, **10-pull = 90 wishstones** (10% bulk discount).
- **Single rate banner**, no rate-up. v1 keeps it simple; rate-up event banners are 🟡 v1.1+.
- **Drop pool: 25 mercenaries** — 5 SSR / 8 SR / 12 R.
- **Rates:** SSR 2% · SR 13% · R 85%.
- **Pity:**
  - Every **10 pulls without an SR+** → next pull guaranteed **SR or higher**.
  - Every **50 pulls without an SSR** → next pull guaranteed **SSR**.
  - Pity counters carry across sessions, **never reset by getting a higher tier** (i.e., a guaranteed-SR pull from 10-pity does not reset the 50-pity SSR counter).
- **Duplicates** convert to **Shards** of that mercenary; 100 shards = +1 star (max +5 stars). Shard rate per dupe: SSR=15, SR=5, R=2.

---

## 2. Wishstone Faucet Recap

From `drop-tables.md` §9:

| Source | Wishstones |
|---|---|
| Champion kill | 0–1 (40% rate) |
| Unique mob | 1–2 |
| Mini-boss | 6–10 |
| Act boss (Acts I–V) | 8 / 12 / 16 / 24 / 40 |
| Treasure goblin | 1–3 |
| First clear of an area | 5 |
| Quest completion (~30 quests) | 10–25 each |
| Daily login (🟡 v1.1+) | 5 |

**Target faucet rate at L70 Hell-Act-V farm: ~80 wishstones / hour** (≈ 1 ten-pull every 7–8 minutes including boss + champ + unique mobs + treasure goblin spawns).

A casual player reaches **50 pity (≈ 500 wishstones)** in roughly **6 hours of focused farming** at L70.

---

## 3. Banner Rates

### 3.1 Base rates (no pity active)

| Tier | Rate |
|---|---|
| SSR | 2% |
| SR | 13% |
| R | 85% |

Each tier has uniform distribution across its members:
- SSR: 5 mercs × 0.4% each
- SR: 8 mercs × 1.625% each
- R: 12 mercs × ≈7.083% each

### 3.2 Pity behavior

```
state: { pullsSinceSR: 0, pullsSinceSSR: 0 }

onPull():
  isGuaranteedSR  = (pullsSinceSR  >= 10)   // 10th pull guaranteed SR+
  isGuaranteedSSR = (pullsSinceSSR >= 50)   // 50th pull guaranteed SSR

  if isGuaranteedSSR:
    tier = 'SSR'
  elif isGuaranteedSR:
    tier = rollWeighted({SSR: 2, SR: 98})   // 2% chance still SSR within the SR-guaranteed slot
  else:
    tier = rollWeighted({SSR: 2, SR: 13, R: 85})

  if tier == 'SSR':
    pullsSinceSSR = 0
    pullsSinceSR  = 0
  elif tier == 'SR':
    pullsSinceSR  = 0
    pullsSinceSSR += 1
  else: // R
    pullsSinceSR  += 1
    pullsSinceSSR += 1
```

### 3.3 Effective long-run rates with pity

By Markov-chain steady state (for the 50-pity SSR floor): effective SSR rate is approximately **2.4%** (vs base 2%) — i.e. ~1 SSR every ~42 pulls on average. Effective SR rate ≈ **15%**, R ≈ **82.6%**.

### 3.4 10-pull behavior

A 10-pull rolls 10 independent pulls in sequence (pity counters update between). The 10-pull discount (90 stones vs 100) is the only structural difference. There is **no separate "10-pull guaranteed SR" rule** beyond what the running pity already provides — but in practice the 10-pity reliably triggers within most 10-pulls because of the carryover counters.

---

## 4. Mercenary Catalog (25)

Each merc has:
- `id`, `name.zh`, `name.en`
- `tier` (SSR/SR/R)
- `archetype` (front/back/support)
- `baseStats` at L1, scale to **mercLevel = playerLevel** (XP shared)
- 1 **signature skill** + (SSR-only) 1 **aura/passive**
- Equip slots: weapon + armor + helm + 1 jewelry (4 slots, vs 10 for player)

Star bonuses (per +1 star, applies cumulatively up to +5):
- +8% all stats
- +1 to signature skill rank (caps at base+5)

### 4.1 SSR (5)

| ID | Name (zh / en) | Origin | Archetype | Base Stats (L1) | Signature Skill | Aura/Passive |
|---|---|---|---|---|---|---|
| `merc_act2_holy_freeze` | 沙漠雇佣兵·圣冰 / Desert Merc — Holy Freeze | Act II | front (jab) | HP 140, Atk 18, Def 28, Vit 10 | `mskill_jab` (3-hit phys combo, +50% phys dmg) | `aura_holy_freeze` — enemies in fight slowed 50% (tick speed -50%), +20% cold dmg dealt |
| `merc_act2_might` | 沙漠雇佣兵·力量 / Desert Merc — Might | Act II | front (jab) | HP 140, Atk 22, Def 26, Vit 10 | `mskill_jab` | `aura_might` — party +30% phys dmg |
| `merc_iron_wolf_fire` | 钢狼·火 / Iron Wolf — Fire | Act III | back (caster) | HP 90, Atk 24 (fire), Def 16, Eng 16 | `mskill_fire_ball` — 50–80 fire AoE, 4s CD | `passive_fire_mastery` — +25% fire dmg dealt by party |
| `merc_barbarian_battle_orders` | 蛮族战士·战令 / Barbarian — Battle Orders | Act V | front (2H) | HP 180, Atk 26, Def 30, Vit 14 | `mskill_bash` — 2-hit phys combo +stun 25% | `aura_battle_orders` — party +30% max HP/MP |
| `merc_rogue_pierce` | 罗格·穿透 / Rogue Scout — Pierce | Act I | back (bow) | HP 100, Atk 28 (phys), Def 14, Dex 18 | `mskill_pierce_arrow` — 3-target piercing arrow, +60% phys dmg | `passive_critical` — party +5% crit chance, +20% crit dmg |

### 4.2 SR (8)

| ID | Name (zh / en) | Origin | Archetype | Base Stats (L1) | Signature Skill |
|---|---|---|---|---|---|
| `merc_act2_thorns` | 沙漠雇佣兵·荆棘 / Desert Merc — Thorns | Act II | front | HP 140, Atk 18, Def 30, Vit 10 | `mskill_jab` + `aura_thorns` (return 100% phys dmg) |
| `merc_act2_prayer` | 沙漠雇佣兵·祈祷 / Desert Merc — Prayer | Act II | front | HP 140, Atk 17, Def 28, Vit 10 | `mskill_jab` + `aura_prayer` (party regen 5 HP/s) |
| `merc_iron_wolf_cold` | 钢狼·冰 / Iron Wolf — Cold | Act III | back | HP 90, Atk 22 (cold), Def 16, Eng 16 | `mskill_glacial_spike` — 40–60 cold + chill 30%, 5s CD |
| `merc_iron_wolf_lightning` | 钢狼·电 / Iron Wolf — Lightning | Act III | back | HP 90, Atk 26 (ltn), Def 16, Eng 16 | `mskill_charged_bolt` — 5 bolts × 12 dmg, 4s CD |
| `merc_rogue_fire` | 罗格·火焰之箭 / Rogue Scout — Fire Arrow | Act I | back | HP 100, Atk 24 (phys+fire), Def 14, Dex 18 | `mskill_fire_arrow` — phys + 50% fire splash |
| `merc_rogue_cold` | 罗格·冰冻之箭 / Rogue Scout — Cold Arrow | Act I | back | HP 100, Atk 22 (phys+cold), Def 14, Dex 18 | `mskill_cold_arrow` — phys + chill 30% |
| `merc_barbarian_war_cry` | 蛮族战士·战吼 / Barbarian — War Cry | Act V | front | HP 180, Atk 24, Def 30, Vit 14 | `mskill_war_cry` — 6s stun AoE, 12s CD |
| `merc_paladin_holy_fire` | 圣骑士·圣火 / Paladin — Holy Fire | Pandemonium | front | HP 130, Atk 22, Def 26, Vit 12 | `mskill_holy_fire` — aura: enemies take 8 fire/s while in fight |

### 4.3 R (12)

| ID | Name (zh / en) | Origin | Archetype | Base Stats (L1) | Signature Skill |
|---|---|---|---|---|---|
| `merc_rogue_basic` | 罗格·新兵 / Rogue Scout — Trainee | Act I | back | HP 90, Atk 16 (phys), Def 12, Dex 14 | `mskill_basic_arrow` — single phys shot |
| `merc_rogue_inner_sight` | 罗格·内视 / Rogue Scout — Inner Sight | Act I | back | HP 90, Atk 14, Def 12, Dex 14 | `mskill_inner_sight` — -25% enemy def for 8s |
| `merc_act2_blessed_aim` | 沙漠雇佣兵·圣礼瞄准 / Desert Merc — Blessed Aim | Act II | front | HP 130, Atk 16, Def 24, Vit 8 | `mskill_jab` + `aura_blessed_aim` (+30% AR) |
| `merc_act2_defiance` | 沙漠雇佣兵·反抗 / Desert Merc — Defiance | Act II | front | HP 130, Atk 14, Def 28, Vit 10 | `mskill_jab` + `aura_defiance` (+30% party def) |
| `merc_iron_wolf_armor` | 钢狼·盔甲 / Iron Wolf — Frozen Armor | Act III | back | HP 80, Atk 18 (cold), Def 22, Eng 14 | `mskill_frozen_armor` — self +120 def, chill on melee |
| `merc_iron_wolf_telekinesis` | 钢狼·心灵控制 / Iron Wolf — Telekinesis | Act III | back | HP 80, Atk 16 (mag), Def 14, Eng 16 | `mskill_telekinesis` — single magic, 50% knockback |
| `merc_militia_pikeman` | 民兵·长枪兵 / Militia — Pikeman | Act III | front | HP 110, Atk 16, Def 22, Vit 10 | `mskill_pierce_thrust` — 2-target phys |
| `merc_militia_swordsman` | 民兵·剑士 / Militia — Swordsman | Act III | front | HP 110, Atk 18, Def 22, Vit 10 | `mskill_chop` — single phys, +25% crit |
| `merc_thief_pickpocket` | 盗贼·扒手 / Thief — Pickpocket | tavern | support | HP 90, Atk 12, Def 14, Dex 16 | `mskill_pilfer` — +30% gold find on this fight |
| `merc_acolyte_priestess` | 见习修女·女祭司 / Acolyte Priestess | tavern | back | HP 80, Atk 10 (mag), Def 12, Eng 16 | `mskill_minor_heal` — heal party 12 HP/tick |
| `merc_barbarian_recruit` | 蛮族新兵 / Barbarian Recruit | Act V | front | HP 160, Atk 18, Def 24, Vit 12 | `mskill_basic_swing` — single phys |
| `merc_paladin_initiate` | 圣骑士新人 / Paladin Initiate | Pandemonium | front | HP 110, Atk 18, Def 22, Vit 10 | `mskill_smite` — phys + 25% stun |

---

## 5. Mercenary Slot Rules

- Player has **1 active merc slot** in v1 (single companion). 🟡 v1.1+ may add a second slot.
- Mercs are **interchangeable** at any time outside combat (in town or sub-area entry screen).
- Inactive mercs **do not gain XP**. Active merc shares full XP with the player.
- Merc death in combat → revives at **50% HP** at the start of the next sub-area; cannot fight current sub-area's remaining waves.
- Merc HP/MP regenerates between sub-areas (full).
- Merc respects **all combat formulas** (`combat-formulas.md`) including auras (treated as `buff_*`).

---

## 6. Star System (Duplicates)

When the gacha rolls a merc the player already owns:

- Convert to **Shards of `merc_<id>`**:
  - SSR dupe → **15 shards**
  - SR dupe → **5 shards**
  - R dupe → **2 shards**
- 100 shards = **+1 star**, max +5 stars.
- Each star: +8% to all base stats, +1 rank to signature skill (skill ranks cap at base + 5).

| Stars | Stat multiplier | Signature skill rank |
|---|---|---|
| ★0 (base) | 1.00× | base |
| ★1 | 1.08× | +1 |
| ★2 | 1.16× | +2 |
| ★3 | 1.24× | +3 |
| ★4 | 1.32× | +4 |
| ★5 | 1.40× | +5 |

A maxed (★5) SSR signature skill outputs roughly **+40% stats and +50–80% skill effect** vs base, depending on per-rank scaling defined in `skills-spec.md` for `mskill_*`.

### 6.1 Shop conversion 🟡 v1.1+

Excess shards beyond ★5 cap convert to **Generic Shards** at 4:1 ratio, exchangeable for any non-SSR merc shard at 1:1. Not in v1.

---

## 7. Banner UI / UX

- **10-pull animation** shows 10 cards revealing in sequence with rarity flair (R white, SR purple, SSR gold).
- **Pity counter** visible at all times: `Next SR in N pulls · Next SSR in M pulls`.
- **Drop history** screen: last 100 pulls timestamped, exportable to clipboard for transparency.
- **Probability disclosure** screen: full §3.1 table + pity rules (legal/transparency).

---

## 8. Engine Hooks (handoff)

```ts
// engine/gacha/banner.ts
export interface BannerState {
  pullsSinceSR: number;
  pullsSinceSSR: number;
}

export type GachaResult =
  | { kind: 'merc'; mercId: string; tier: 'SSR'|'SR'|'R'; isNew: boolean }
  | { kind: 'shard'; mercId: string; tier: 'SSR'|'SR'|'R'; shardCount: number };

export function pull(
  state: BannerState,
  ownedMercs: Set<string>,
  rng: SeededRng
): { result: GachaResult; nextState: BannerState };

export function tenPull(
  state: BannerState,
  ownedMercs: Set<string>,
  rng: SeededRng
): { results: GachaResult[]; nextState: BannerState };
```

Implementation detail: on each pull, after determining tier, sample uniformly from that tier's pool. If owned → return shard. If not owned → return merc + add to `ownedMercs`.

### 8.1 Persistence

`metaStore`:
```ts
{
  wishstones: number,
  ownedMercs: Record<mercId, { stars: number, shards: number, level: number }>,
  bannerState: BannerState,
  pullHistory: Array<{ ts, mercId, tier, isNew }>  // capped at 200 entries
}
```

---

## 9. Cross-Reference Index

- Wishstone drop sources: `drop-tables.md` §9.
- Merc combat math (auras as buffs, skill ticks): `combat-formulas.md` §11.
- Merc skill IDs (`mskill_*`): `skills-spec.md` §7 (Mercenary Skills section — content-designer to add).
- Stat allocation pattern: `progression-curve.md` §4 (mercs use simplified auto-allocation: 60% of merc's natural stat per archetype + 40% to Vit).

---

## 10. Handoff

### To Engine Dev
- Implement `engine/gacha/banner.ts` per §8.
- Vitest: 10 000-pull simulation must produce **SSR rate within 2.0%–2.6%** (matches §3.3 long-run).
- Vitest: pity hard-guarantees: every 50th pull must be SSR if no prior SSR.
- Wire merc auras as `buff_*` in combat pipeline (auras tick with party).

### To Frontend Dev
- Banner screen with 1-pull / 10-pull buttons, wishstone counter, pity indicators.
- Pull animation (3s for 10-pull, skippable).
- Drop history screen.
- Probability disclosure screen.

### To Content Designer
- Produce `src/data/gacha/banner.json` with `bannerId: 'gacha_horadrim'`, rates from §3.1, pool from §4.
- Produce `src/data/mercenaries/*.json` — 25 files, one per merc, schema per §4. Cross-reference `mskill_*` IDs into `src/data/skills/mercenary.json`.
- i18n strings for all merc names + skill descriptions in `zh-CN` and `en`.

### To QA
- Drop-rate empirical test: 10 000 simulated pulls, assert tier rates ≤ 5% deviation from §3.3.
- Pity correctness: scripted Playwright test covering 10-pity and 50-pity edge cases.

🟡 **OPEN (v1.1+):**
- Rate-up event banners
- Two merc slots simultaneously
- Generic shard exchange
- Daily/weekly free pulls
- Limited-time SSR (e.g., uber Tristram event mercs)
