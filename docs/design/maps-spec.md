# Maps Spec — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** Diablo 2 LoD/Resurrected Acts I–V, Arreat Summit area level tables, PureDiablo wiki
**Cross-refs:** `monster-spec.md` (monster pools per area), `drop-tables.md` (per-area TCs), `items-spec.md` (rlvl gating)

---

## 1. Summary

Five Acts mirror Diablo 2's structure. Each Act has:
- A **town hub** (safe, no combat) with 3–6 NPCs and a mercenary recruiter
- **4–5 sub-areas** (combat zones) + 1 boss area
- Total **25 sub-areas** in v1 (excluding towns)

Sub-areas are auto-played idle waves: enter → fight N waves → optional boss → loot → exit.

Recommended level (`recLvl`) is the design target; engine scales **monster level = clamp(recLvl ± 2, 1, 90)**.

---

## 2. Acts Overview

| Act | Theme | Town | Sub-areas | Boss | Level Band |
|---|---|---|---|---|---|
| I | Wilderness / undead | Rogue Encampment | 5 | Andariel | 1–14 |
| II | Desert / ancient | Lut Gholein | 5 | Duriel | 14–26 |
| III | Jungle / Kurast | Kurast Docks | 5 | Mephisto | 26–40 |
| IV | Hell / pandemonium | Pandemonium Fortress | 4 | Diablo | 40–55 |
| V | Frozen / barbarian | Harrogath | 5 | Baal | 55–75 |
| Endless 🟡 | Rifts | — | ∞ | rotating | 75–90 |

🟡 Endless is **OPEN (v1.1+)**.

---

## 3. Town Hubs

Town schema:
```ts
{
  id, name.zh, name.en,
  act,
  npcs: [ { id, role, services: ['vendor'|'gamble'|'stash'|'quest'|'merc'|'gossip'] } ],
  mercRecruiter: npcId | null,
  unlockedAfter: questId | null
}
```

### 3.1 Rogue Encampment (Act I, `town_act1`)
- `npc_akara` — Healer & Caster Vendor (potions, scrolls, staves) | quest: Den of Evil
- `npc_charsi` — Blacksmith (weapon/armor vendor + imbue 🟡 v1.1)
- `npc_gheed` — Gambler & Merchant
- `npc_kashya` — **Merc recruiter** (Rogue Scouts — Cold/Fire bow mercs)
- `npc_warriv` — Caravan (travel to Act II after Andariel)
- `npc_cain` (joins post-Tristram) — Item Identifier

### 3.2 Lut Gholein (Act II, `town_act2`)
- `npc_atma` — Tavern keeper / quest giver
- `npc_drognan` — Sorcerer Vendor
- `npc_fara` — Smith / repair
- `npc_greiz` — **Merc recruiter** (Desert Mercenaries — Jab + auras)
- `npc_lysander` — Caster Vendor (potions, charms)
- `npc_meshif` — Sailor (travel to Act III)

### 3.3 Kurast Docks (Act III, `town_act3`)
- `npc_alkor` — Alchemist / vendor
- `npc_asheara` — **Merc recruiter** (Iron Wolves — Fire/Cold/Ltn casters)
- `npc_hratli` — Blacksmith
- `npc_ormus` — Sorcerer Vendor
- `npc_natalya` — visitor (Act IV unlock quest)
- `npc_cain` — identify/follow

### 3.4 Pandemonium Fortress (Act IV, `town_act4`)
- `npc_tyrael` — Quest giver / archangel
- `npc_halbu` — Smith
- `npc_jamella` — Caster Vendor + gambler
- `npc_deckard_cain` — identify
- (no merc recruiter — Iron Wolves carry over)

### 3.5 Harrogath (Act V, `town_act5`)
- `npc_larzuk` — Smith / **socket quest** giver
- `npc_malah` — Healer
- `npc_anya` (rescued) — caster vendor + personal-resist quest reward
- `npc_qual_kehk` — **Merc recruiter** (Barbarian Warriors — battle cries + 2H)
- `npc_nihlathak` — quest giver
- `npc_cain` — identify

---

## 4. Sub-Area Schema

```ts
type SubArea = {
  id: string,                    // "act1_blood_moor"
  name: { zh: string, en: string },
  act: 1|2|3|4|5,
  recLvl: number,                // recommended character level
  monsterLvlRange: [n, n],
  waveCount: number,             // 3..8
  monstersPerWave: [min, max],
  monsterPool: string[],         // monster IDs from monster-spec
  eliteChance: number,           // 0..1 per non-boss wave
  championChance: number,        // 0..1 per non-boss wave
  treasureChance: number,        // 0..1 of a "treasure" wave (loot+gold bonus)
  hasBoss: boolean,
  bossId: string | null,
  exitConditions: ('all_waves'|'kill_boss'|'survive_n_seconds')[],
  unlockReq: { questId?: string, prevAreaId?: string },
  tcOverride?: string,           // override TC table id from drop-tables
  flavor: { zh: string, en: string }
};
```

`waveTickInterval = 6s` (per `idle-offline.md` §2). Average **clear time = waveCount × monstersPerWave.avg × 6s**.

---

## 5. Act I Sub-Areas (5)

| ID | Name (zh / en) | recLvl | mLvl | Waves | Mob/Wave | Elite% | Treas% | Boss | Pool |
|---|---|---|---|---|---|---|---|---|---|
| `act1_blood_moor` | 血腥荒野 / Blood Moor | 2 | 1–3 | 3 | 3–5 | 8% | 10% | — | fallen, fallen_shaman, quill_rat, zombie |
| `act1_den_of_evil` | 邪恶洞穴 / Den of Evil | 3 | 2–4 | 4 | 3–5 | 12% | 8% | corpsefire (boss) | imp, fallen, dark_one (boss) |
| `act1_cold_plains` | 寒原 / Cold Plains | 5 | 4–6 | 4 | 4–6 | 10% | 12% | — | zombie, skeleton_archer, brute, dark_hunter |
| `act1_burial_grounds` | 坟场 / Burial Grounds | 7 | 6–9 | 4 | 4–6 | 15% | 10% | blood_raven (mini) | ghoul, blood_raven_minion, returned, blood_raven (mini-boss) |
| `act1_dark_wood` | 黑暗森林 / Dark Wood | 9 | 8–11 | 5 | 4–7 | 12% | 12% | tree_of_inifuss (loot) | spike_fiend, vile_archer, brute, ghoul |
| `act1_catacombs` | 地下墓穴 / Catacombs Lv4 | 12 | 11–14 | 6 | 4–7 | 15% | 12% | **andariel** (boss) | skeleton_mage, ghoul, blood_clan, andariel |

Andariel boss (`mob_andariel`) drops from `tc_act1_boss` — `drop-tables.md` §6.1.

---

## 6. Act II Sub-Areas (5)

| ID | Name (zh / en) | recLvl | mLvl | Waves | Mob/Wave | Elite% | Treas% | Boss | Pool |
|---|---|---|---|---|---|---|---|---|---|
| `act2_rocky_waste` | 岩石荒野 / Rocky Waste | 14 | 13–16 | 4 | 5–7 | 12% | 10% | — | sand_raider, leaper, sand_maggot, dune_beast |
| `act2_dry_hills` | 干旱山丘 / Dry Hills | 16 | 15–18 | 5 | 5–7 | 12% | 12% | — | huntress, vulture, bone_warrior, claw_viper |
| `act2_far_oasis` | 远方绿洲 / Far Oasis | 18 | 17–20 | 5 | 5–8 | 14% | 12% | radament (mini) | swarm, sand_maggot_lord, mummy, radament (mini) |
| `act2_lost_city` | 失落之城 / Lost City | 21 | 20–23 | 6 | 5–8 | 16% | 12% | — | greater_mummy, sand_leaper, claw_viper_lord, scarab_demon |
| `act2_arcane_sanctuary` | 奥术圣所 / Arcane Sanctuary | 23 | 22–25 | 6 | 5–8 | 18% | 14% | summoner (mini) | ghost, vampire, specter, summoner |
| `act2_tomb_duriel` | 杜瑞尔之墓 / Tal Rasha's Tomb | 25 | 24–27 | 6 | 5–8 | 18% | 12% | **duriel** (boss) | unraveler, burning_dead, mummy, duriel |

---

## 7. Act III Sub-Areas (5)

| ID | Name (zh / en) | recLvl | mLvl | Waves | Mob/Wave | Elite% | Treas% | Boss | Pool |
|---|---|---|---|---|---|---|---|---|---|
| `act3_spider_forest` | 蛛网森林 / Spider Forest | 27 | 26–29 | 5 | 6–8 | 14% | 12% | — | giant_spider, flayer, sucker, fetish_shaman |
| `act3_great_marsh` | 巨沼 / Great Marsh | 29 | 28–31 | 5 | 6–8 | 16% | 12% | — | swamp_dweller, dark_shape, blowfish, vampire_lord |
| `act3_flayer_jungle` | 剥皮丛林 / Flayer Jungle | 32 | 31–34 | 6 | 6–9 | 16% | 14% | witch_doctor (mini) | flayer_shaman, soul_killer, undead_flayer, witch_doctor_endugu |
| `act3_kurast_bazaar` | 库拉斯特集市 / Kurast Bazaar | 35 | 34–37 | 6 | 6–9 | 18% | 14% | battlemaid (mini) | zealot, cantor, sexton, battlemaid_sarina |
| `act3_travincal` | 崔凡卡 / Travincal | 38 | 37–40 | 6 | 5–7 | 22% | 12% | council3 (mini) | hierophant, zealot, council_member ×3 |
| `act3_durance_meph` | 仇恨之厅 / Durance of Hate | 40 | 39–42 | 6 | 5–8 | 20% | 14% | **mephisto** (boss) | blood_lord, council_member, abyss_knight, mephisto |

---

## 8. Act IV Sub-Areas (4)

| ID | Name (zh / en) | recLvl | mLvl | Waves | Mob/Wave | Elite% | Treas% | Boss | Pool |
|---|---|---|---|---|---|---|---|---|---|
| `act4_outer_steppes` | 外环荒原 / Outer Steppes | 42 | 41–44 | 5 | 6–8 | 18% | 12% | — | doom_knight, abyss_knight, urdar, venom_lord |
| `act4_plains_of_despair` | 绝望平原 / Plains of Despair | 45 | 44–47 | 5 | 6–8 | 20% | 12% | izual (mini) | corpulent, doom_knight, mage, izual |
| `act4_city_of_damned` | 受咒之城 / City of the Damned | 48 | 47–50 | 6 | 6–9 | 22% | 12% | — | corpse_spitter, balrog, oblivion_knight, undead |
| `act4_river_of_flame` | 火焰之河 / River of Flame | 51 | 50–53 | 6 | 6–9 | 24% | 14% | hephasto (mini) | grotesque, flame_lord, balrog, hephasto |
| `act4_chaos_sanctuary` | 混沌庇护所 / Chaos Sanctuary | 54 | 53–57 | 7 | 6–9 | 25% | 14% | **diablo** (boss) | oblivion_knight, venom_lord, balrog, diablo |

(Note: `Chaos Sanctuary` is the boss area for Act IV. Diablo's seal-bosses — De Seis, Infector, Vizier — appear as forced-elite waves on waves 4–6.)

---

## 9. Act V Sub-Areas (5)

| ID | Name (zh / en) | recLvl | mLvl | Waves | Mob/Wave | Elite% | Treas% | Boss | Pool |
|---|---|---|---|---|---|---|---|---|---|
| `act5_bloody_foothills` | 血腥山麓 / Bloody Foothills | 56 | 55–58 | 6 | 7–10 | 18% | 12% | shenk (mini) | death_mauler, frozen_creeper, blood_lord, shenk |
| `act5_frigid_highlands` | 冰封高地 / Frigid Highlands | 59 | 58–61 | 6 | 7–10 | 20% | 12% | eldritch (mini) | overseer, frozen_horror, minion_of_destruction, eldritch |
| `act5_arreat_plateau` | 亚瑞特高原 / Arreat Plateau | 63 | 62–65 | 6 | 7–10 | 22% | 14% | thresh_socket (mini) | siege_beast, stygian_doll, blood_bringer, thresh_socket |
| `act5_crystalline_passage` | 水晶通道 / Crystalline Passage | 66 | 65–68 | 6 | 7–10 | 22% | 14% | nihlathak (mini) | frozen_terror, succubus, witch, nihlathak |
| `act5_ancients_way` | 先祖之路 / Ancient's Way | 70 | 68–72 | 7 | 7–10 | 25% | 14% | ancients (mini) | death_lord, ancient_kaa, frozen_scourge, ancient_warriors ×3 |
| `act5_throne_destruction` | 毁灭王座 / Throne of Destruction | 75 | 73–78 | 8 | 7–10 | 30% | 14% | **baal** (boss) | minion_baal_wave1..5, baal |

Throne of Destruction encodes 5 forced-elite minion waves (Achmel, Lister, etc.) before Baal — see `monster-spec.md`.

---

## 10. Wave Composition Rules

For each non-boss wave:
1. Pick wave size uniformly in `monstersPerWave` range.
2. For each mob slot, sample from `monsterPool` weighted by mob's spawn weight (defined in monster-spec).
3. Roll **eliteChance** (per wave, not per monster) — if hit, **one** monster in this wave is upgraded to Champion or Unique:
   - 50% chance Champion (1.5× hp/dmg, +20% MF, drops `tc_champion`)
   - 50% chance Unique (2× hp/dmg, 2 random affix abilities, drops `tc_unique`)
4. Roll **championChance** = eliteChance × 0.5 for additional champion-pack spawn (3 minions, all champion-tier).
5. Roll **treasureChance** — if hit, replace this wave with a **Goblin/Treasure wave**: 1 Treasure Goblin (1.5× hp, 0× dmg, flees after 8s) drops `tc_treasure`.

For boss wave: spawn boss + 0–2 boss minions per `monster-spec.md`.

---

## 11. Difficulty Tiers (post-campaign)

After clearing Baal (Normal), unlock:

| Difficulty | mLvl Offset | mob HP/Dmg Multiplier | Resists | Drop Bonus |
|---|---|---|---|---|
| Normal | +0 | 1.0× / 1.0× | base | base TCs |
| Nightmare | +20 | 2.5× / 1.8× | +25 all res | +1 TC tier, runes ≥ tier 2 unlocked |
| Hell | +40 | 6.0× / 3.0× | +50 all res, +20% to "immune" type | +2 TC tier, all runes possible |

Player level cap stays at 90 (per `progression-curve.md`). Hell-difficulty level 90 farming is the endgame loop.

---

## 12. Map Travel & Unlock

```
- Town has button list of all unlocked sub-areas (filterable by Act).
- Sub-area unlock requires:
    a) clearing previous sub-area in act order, OR
    b) completing waypoint quest (e.g., Andariel killed → all Act I areas remain accessible after Act II unlocks).
- Boss-area entry consumes 1 "Map Token" 🟡 v1.1 (v1 = no consumable).
- Re-entering a cleared sub-area replays it (idle farm loop).
```

---

## 13. Cross-Reference Index

- Monster IDs in `monsterPool[]` must exist in `src/data/monsters/*.json` (see `monster-spec.md`).
- Boss IDs (e.g., `mob_andariel`) gate the per-Act boss TC in `drop-tables.md` §6.
- Recommended levels align with `progression-curve.md` §3 (level ≈ deepest Act recLvl ÷ 0.85).

---

## 14. Handoff to Content Designer

Produce JSON files validated by `src/data/schema/maps.schema.json`:

1. **`src/data/maps/towns.json`** — 5 towns from §3, each with NPC list and merc recruiter.
2. **`src/data/maps/act1.json` … `act5.json`** — Sub-areas per §5–§9. Include zh+en strings, monster pool refs, exit conditions.
3. **`src/data/maps/difficulty.json`** — three tiers from §11.
4. **`src/data/i18n/zh-CN/areas.json`** + **`en/areas.json`** — flavor strings (`flavor.zh`/`flavor.en`).

Ensure every `monsterPool` entry references a valid monster ID and every boss exists with `tier:'boss'` in monster data. Run `npm run validate:data` before commit.

🟡 **OPEN (v1.1+):**
- Endless / Rift mode
- Map tokens / re-entry consumables
- Random "uber" mini-events (Tristram, Pandemonium ubers)
- Waypoint travel cost
