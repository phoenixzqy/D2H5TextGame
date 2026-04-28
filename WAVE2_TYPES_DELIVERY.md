# Wave 2 Pre-Work: Type System & JSON Schemas — DELIVERY REPORT

**Date:** 2026-04-27  
**Agent:** engine-dev  
**Status:** ✅ COMPLETE

---

## Summary

Delivered comprehensive **pure TypeScript type definitions** and **JSON Schema (Draft 2020-12)** infrastructure for the D2 H5 text game. All subsequent engine work (combat resolution, skill systems, loot, progression) will conform to these contracts.

**Verification:**
- ✅ `npx tsc --noEmit` — **CLEAN**
- ✅ `npm run lint` — **CLEAN** (0 errors, TypeScript version warning only)
- ✅ `npm test -- --run` — **ALL 67 TESTS PASS**

---

## Deliverables

### 1. Pure-TS Engine Type Definitions (`src/engine/types/`)

All types are `readonly` where appropriate, no `any`, fully compliant with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

#### `attributes.ts`
- `DamageType` — union type for 7 damage types (physical, fire, cold, lightning, arcane, poison, thorns)
- `CoreStats` — str/dex/vit/ene primary attributes
- `Resistances` — fire/cold/lightning/poison/arcane/physical resistance values
- `DerivedStats` — life, mana, attack, defense, attackSpeed, critChance, critDamage, physDodge, magicDodge, magicFind, goldFind, resistances
- `DamageRange` — `readonly [number, number]` tuple
- `DamageBreakdown` — damage by type
- `DamageInfo` — min/max + breakdown

#### `entities.ts`
- `Team` — 'player' | 'enemy'
- `UnitType` — 'player' | 'mercenary' | 'monster' | 'summon'
- `Unit` — base interface for all combat entities
- `Player` — extends Unit with class, experience, stat/skill points
- `Mercenary` — extends Unit with archetype and rarity (R/SR/SSR)
- `Monster` — extends Unit with archetypeId, elite/boss flags, affixes
- `Summon` — extends Unit with ownerId and duration
- `BattleSnapshot` — immutable combat state at a point in time

#### `skills.ts`
- `SkillTarget` — self, single-enemy, all-enemies, area-enemies, single-ally, all-allies, summon
- `SkillTrigger` — active, passive, on-hit, on-kill, on-damaged, on-dodge
- `ComboTag` — cold, fire, lightning, poison, physical, arcane, chill, burn, shock, bleed, amp-damage
- `StatusEffect` — buff/debuff/DoT with duration, stacks, stat/resist mods, tags
- `Buff` — positive status effect
- `SkillCost` — mana/life cost
- `SkillDef` — immutable skill template with trigger, target, cooldown, damage, status, healing, combo tags, synergies, scaling
- `CooldownState` — skillId, remaining, total

#### `items.ts`
- `Rarity` — normal, magic, rare, unique, set, runeword
- `EquipmentSlot` — 10 slots (head, chest, gloves, belt, boots, amulet, ring-left, ring-right, weapon, offhand)
- `ItemBaseType` — weapon, armor, jewelry, charm, rune, gem, material
- `ItemBase` — white item template with base damage/defense, requirements, sockets
- `Affix` — prefix/suffix modifiers with minIlvl, stat/resist mods, granted skills
- `AffixRoll` — affix instance with rolled values
- `Item` — item instance with baseId, rarity, affixes, unique/set/runeword IDs, runes, identified, equipped
- `Rune` — socketable rune with weapon/armor/shield effects
- `RuneWord` — rune sequence + base requirements + stats
- `SetDef` — set collection with bonuses per pieces equipped
- `Inventory` — backpack, stash, equipment, max sizes

#### `monsters.ts`
- `MonsterDef` — archetype matching Diablo2TextGame.md §7.2 with life [min,max], lifeGrowth [min,max], skills, resistances, experience, elite/boss flags
- `EliteAffixDef` — elite modifiers with multipliers, granted skills, resistances

#### `maps.ts`
- `ActDef` — act 1-5 with town, sub-areas, reqLevel
- `SubAreaDef` — area with waves, boss encounter, loot table
- `WaveDef` — trash/elite/boss/treasure/shrine waves with encounters
- `Encounter` — monster group with archetypeId, count, level, elite/boss flags
- `MapProgress` — player progress through acts/areas/waypoints

#### `combat.ts`
- `CombatState` — turn, phase, player/enemy units, turn order, current actor, events, seed
- `CombatEvent` — typed union of 17 event types:
  - `TurnStartEvent`, `AttackEvent`, `DamageEvent`, `CritEvent`, `DodgeEvent`
  - `StatusAppliedEvent`, `StatusTickEvent`, `StatusExpiredEvent`
  - `HealEvent`, `ManaEvent`, `DeathEvent`, `LootEvent`
  - `VictoryEvent`, `DefeatEvent`, `SkillCastEvent`, `SummonEvent`

#### `save.ts`
- `SaveVersion` — type alias for version number
- `Settings` — locale, stealthMode, soundEnabled, musicEnabled, combatSpeed, autoCombat
- `IdleState` — lastOnline, offlineTime, multiplierSecondsRemaining, activeMultiplier, idleTarget
- `GachaState` — currency, ownedMercIds, pityCounter
- `SaveV1` — version 1 save schema with player, inventory, mercenaries, mapProgress, idleState, gachaState, settings, timestamp
- `MIGRATIONS` — placeholder map for future save migrations

#### `index.ts`
Barrel re-export of all types.

---

### 2. Ajv JSON Schemas (`src/data/schema/`)

All schemas are **JSON Schema Draft 2020-12**, `strict: true`, `additionalProperties: false`, with shared `$defs` for common fragments.

#### `monster.schema.json`
- Validates `MonsterDef`
- Pattern: `^monsters/[a-z0-9-]+$`
- Required: id, name, life, lifeGrowth, skills, baseExperience
- Includes `$defs/range`, `$defs/resistances`

#### `skill.schema.json`
- Validates `SkillDef`
- Enums for trigger, target, damageType, comboTag
- Includes `$defs/damageInfo`, `$defs/damageType`, `$defs/comboTag`
- Optional: damage, cost, heal, appliesTags, synergies, scaling

#### `item-base.schema.json`
- Validates `ItemBase`
- Pattern: `^items/base/[a-z0-9-]+$`
- Slot enum includes null for non-equippable items
- Optional: baseDamage, baseDefense, reqStats, sockets

#### `affix.schema.json`
- Validates `Affix`
- Pattern: `^affixes/(prefix|suffix)/[a-z0-9-]+$`
- Type enum: prefix, suffix
- Includes `$defs/coreStats`, `$defs/resistances`, `$defs/statMods`, `$defs/damageInfo`

#### `unique.schema.json`
- Validates unique item definitions
- Pattern: `^items/unique/[a-z0-9-]+$`
- Required: id, name, baseId, reqLevel, stats
- Optional: flavor text

#### `set.schema.json`
- Validates `SetDef`
- Pattern: `^sets/[a-z0-9-]+$`
- Bonuses keyed by number of pieces equipped (patternProperties `^[0-9]+$`)
- Includes `$defs/setBonus`

#### `rune.schema.json`
- Validates `Rune`
- Pattern: `^runes/[a-z0-9-]+$`
- Tier: 1-33
- Optional: weaponEffect, armorEffect, shieldEffect

#### `runeword.schema.json`
- Validates `RuneWord`
- Pattern: `^runewords/[a-z0-9-]+$`
- Required rune sequence (array), allowedBases (enum), sockets (2-6), reqLevel, stats

#### `act.schema.json`
- Validates `ActDef`
- Pattern: `^acts/act[1-5]$`
- Act: 1-5
- Required: town, subAreas, reqLevel

#### `sub-area.schema.json`
- Validates `SubAreaDef`
- Pattern: `^areas/[a-z0-9-]+$`
- Includes `$defs/wave`, `$defs/encounter`
- Wave type enum: trash, elite, boss, treasure, shrine

#### `merc.schema.json`
- Validates mercenary archetype
- Pattern: `^mercs/[a-z0-9-]+$`
- Rarity enum: R, SR, SSR
- Required: baseStats, skills, comboOrder (optional), reqLevel

#### `drop-table.schema.json`
- Validates loot drop tables
- Pattern: `^loot/[a-z0-9-]+$`
- Includes `$defs/dropEntry`
- Entry type enum: item, gold, rune, gem, material, currency
- Weight-based drops with level constraints

---

### 3. Data Loader + Validator (`src/data/loader.ts`)

#### `GameDataValidationError`
Custom error class with `filePath` and Ajv `errors` array for debugging.

#### `GameData` interface
Frozen maps for:
- monsters, skills, itemBases, affixes, uniques, sets, runes, runewords, acts, subAreas, mercenaries, dropTables

#### `loadGameData(): Promise<GameData>`
- Creates Ajv 2020 validator with `strict: true`, `allErrors: true`
- Adds all schemas
- Loads JSON files (placeholder fetch calls for content team)
- Validates against schemas
- Returns frozen `GameData` object

#### `validateGameData<T>(schemaId, data, context): T`
- Public API for testing
- Validates a single data object against a schema
- Throws `GameDataValidationError` on failure

**Tests:** `loader.test.ts` — 11 tests covering valid/invalid monster & skill definitions, missing fields, additional properties, error handling

---

### 4. Cooldown Tracker (`src/engine/cooldown.ts`)

Pure, immutable cooldown management:
- `createCooldownTracker()` — empty tracker
- `startCooldown(tracker, skillId, duration)` — start or replace cooldown
- `tickCooldowns(tracker)` — decrement all by 1, remove expired
- `isReady(tracker, skillId)` — check if skill is off cooldown
- `getRemaining(tracker, skillId)` — get turns remaining
- `resetCooldowns()` — clear all
- `resetCooldown(tracker, skillId)` — clear specific

**Tests:** `cooldown.test.ts` — 17 tests covering all APIs, edge cases (zero duration, multiple skills, expiration)

---

### 5. Turn Order Calculator (`src/engine/turn-order.ts`)

Deterministic turn order based on attack speed + RNG tie-breaking:
- `calculateTurnOrder(units, rng)` — sort by attackSpeed DESC, RNG tie-break
- `getNextActorIndex(current, length)` — advance with wrap-around
- `isNewTurn(currentIndex, nextIndex)` — detect turn boundary
- `recalculateTurnOrder(currentActorId, units, rng)` — recalc when units die or speed changes

**Tests:** `turn-order.test.ts` — 18 tests covering sorting, tie-breaking determinism, wrap-around, unit death, empty lists

---

### 6. Engine Index (`src/engine/index.ts`)

Barrel re-export:
```typescript
export * from './rng';
export * from './types';
export * from './cooldown';
export * from './turn-order';
```

---

## Dependencies Added

```bash
npm install ajv ajv-formats ajv-errors
```

- `ajv` — JSON Schema validator (Draft 2020-12)
- `ajv-formats` — format validators (date-time, uri, etc.)
- `ajv-errors` — better error messages

---

## Test Coverage

```
Test Files  4 passed (4)
     Tests  67 passed (67)
  Duration  1.21s
```

- `rng.test.ts` — 21 tests (existing)
- `cooldown.test.ts` — 17 tests (new)
- `turn-order.test.ts` — 18 tests (new)
- `loader.test.ts` — 11 tests (new)

**Engine coverage target:** ≥80% (baseline established)

---

## Decisions & Open Items

### Decisions Made
1. **Save format starts at v1** — `MIGRATIONS` map is a placeholder; first migration will be v1→v2 when schema changes
2. **Resistances are additive percentages** — e.g. 25 = +25% resist
3. **Cooldowns tracked per-unit** — not global; each unit has own `CooldownTracker`
4. **Turn order uses RNG fork('turn-order')** — deterministic tie-breaking, does not pollute main RNG stream
5. **ReadonlyMap for game data** — all loaded data is frozen for immutability

### Open Items for Next Wave (Combat Resolution)
1. **Combo synergy matrix specifics** — awaiting design spec from `game-designer` in `docs/design/combo-matrix.md`
2. **Damage calculation pipeline** — resists, immunities, amp, crit — engine implementation
3. **Status effect stacking rules** — poison stacks additively, other debuffs replace or stack?
4. **AI decision policy** — simple priority list or weighted choice?
5. **Attack speed→turn conversion** — linear or logarithmic curve?
6. **Hit chance formula** — D2-style AR vs Defense?

---

## Next Steps (for Wave 3+)

1. **`game-designer`** — finalize combat math, combo synergies, balance curves
2. **`content-designer`** — author sample JSON data for 1-2 monsters, 3-4 skills, 2-3 items to validate schemas
3. **`engine-dev`** (this agent) — implement:
   - `src/engine/damage.ts` — damage pipeline (resists, amp, crit)
   - `src/engine/status.ts` — buff/debuff/DoT engine
   - `src/engine/combat/` — turn loop, attack resolution, AOE
   - `src/engine/skills/` — skill registry + effect implementations
   - `src/engine/ai/` — monster decision policy
4. **`qa-engineer`** — integration tests for combat scenarios (player vs 3 trash, poison stacking, crit chains)
5. **`frontend-dev`** — combat log virtualized list, stat display components

---

## Notes

- **No React/DOM imports** — all engine code is pure TS, can run in Web Worker ✅
- **All RNG via `createRng(seed)`** — no `Math.random()` ✅
- **TSDoc on all public APIs** ✅
- **Strict TS compliance** — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` ✅
- **JSON Schema strict mode** — `additionalProperties: false` on all schemas ✅

---

**Handoff:** Foundation complete. Combat resolution can begin once design specs land.
