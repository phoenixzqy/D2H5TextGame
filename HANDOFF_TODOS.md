# Handoff TODOs

## For `engine-dev`

### 1. Combat Integration
**File:** `src/features/combat/CombatScreen.tsx`

Currently shows mock combat log. Needs:
- Wire `useCombatStore` to actual combat runner
- Implement turn resolution via `src/engine/combat/combat.ts`
- Populate log entries with real damage/skill/death events
- Handle wave transitions
- Victory/defeat conditions & rewards distribution

**Example flow:**
```typescript
// In CombatScreen or a combat controller hook
import { runBattle } from '@/engine/combat/combat';
import { useCombatStore } from '@/stores';

function startBattle() {
  const playerTeam = [player, merc];
  const enemyTeam = generateWaveEnemies(mapArea, waveNum);
  
  const result = runBattle({ seed: Date.now(), playerTeam, enemyTeam });
  
  // Process result.events → useCombatStore.addLogEntry()
  // Update HP/MP via useCombatStore.updateUnit()
}
```

### 2. Skill Tree Data
**File:** `src/features/skills/SkillsScreen.tsx`

Currently shows mock skills. Needs:
- Load real skill definitions from `src/data/skills/*.json`
- Validate against JSON schema
- Wire allocate button to `usePlayerStore.allocateSkillPoint(skillId)`
- Implement prerequisite checking
- Implement max-level caps

### 3. Item Generation & Drops
**Files:** `src/features/inventory/InventoryScreen.tsx`, `src/features/combat/CombatScreen.tsx`

Currently shows placeholder items. Needs:
- Wire combat victory → loot drops via `src/engine/loot/drop-roller.ts`
- Generate items with affixes
- Implement sell/salvage mechanics (currency rewards)
- Implement equip stat recalculation

### 4. Map Unlock Logic
**File:** `src/features/map/MapScreen.tsx`

Currently all areas shown as unlocked. Needs:
- Quest-gated area unlocking
- Recommended level calculation per area
- Idle farming target persistence via `useMetaStore.updateIdleState({ idleTarget: areaId })`

### 5. Save/Load Integration
**Files:** All stores

Currently stores have actions but no auto-save. Needs:
- Debounced save trigger (500ms after any store mutation)
- `SaveV1` serialization from all store slices
- Migration wiring in `src/stores/migrations.ts`
- Load on app init (check `hasSave()` → `loadSave()` → hydrate stores)

**Example pattern:**
```typescript
// In a useEffect or a persistence middleware
useEffect(() => {
  const timer = setTimeout(() => {
    const saveData: SaveV1 = {
      version: 1,
      player: usePlayerStore.getState().player,
      inventory: { /* ... */ },
      // ... all stores
      timestamp: Date.now()
    };
    saveSave(saveData);
  }, 500);
  
  return () => clearTimeout(timer);
}, [/* store deps */]);
```

---

## For `content-designer`

### 1. NPC Dialogue Trees
**File:** `src/features/town/TownScreen.tsx`

NPCs are placeholders. Needs:
- Dialogue JSON files per NPC (Akara, Charsi, Gheed, Kashya, etc.)
- Quest trigger dialogue
- Shop inventory for vendors

### 2. Quest Definitions
**File:** `src/features/quests/QuestsScreen.tsx`

Quests show mock data. Needs:
- `src/data/quests/act1.json`, `act2.json`, etc.
- Objectives (kill X, collect Y, reach location Z)
- Rewards (items, skill points, area unlocks)

### 3. Mercenary Roster
**File:** `src/features/gacha/GachaScreen.tsx`, `src/features/mercs/MercsScreen.tsx`

Gacha pulls from mock data. Needs:
- `src/data/mercenaries/*.json` — full merc roster with rarity tiers (R/SR/SSR)
- Signature skills per merc
- Star upgrade curves
- Pity system rates (90-pull SSR guarantee)

### 4. Monster Spawn Tables
**File:** `src/features/map/MapScreen.tsx` → Combat

Needs:
- `src/data/monsters/act1.json`, `act2.json`, etc.
- Monster stat configs per level
- Skill IDs per monster type
- Elite/boss variants

### 5. Item Bases & Affixes
**File:** Inventory & drops

Needs:
- `src/data/items/bases.json` — weapon/armor base types
- `src/data/items/affixes.json` — prefix/suffix pools
- `src/data/items/uniques.json` — unique item definitions
- `src/data/items/sets.json` — set item definitions
- `src/data/items/runewords.json` — runeword recipes

### 6. Localization Content
**Files:** All i18n JSON files

Currently have UI keys. Needs:
- Monster names
- Item names (bases, affixes, uniques, sets)
- Skill names & descriptions
- Quest dialogue & objectives
- NPC dialogue

---

## For `qa-engineer`

### 1. Playwright E2E Tests
**New files:** `tests/e2e/*.spec.ts`

Write tests for:
- Character creation flow (select class → name → enter game)
- Town → Map → Combat → Victory → Loot → Return
- Inventory: equip/unequip/transfer/sell
- Skills: allocate points, reorder combo
- Gacha: single pull, 10-pull, pity counter
- Settings: locale switch, stealth toggle, save export/import

### 2. Mobile Viewport Tests
Verify all screens at:
- 360×640 (iPhone SE)
- 412×915 (Pixel)
- 768×1024 (iPad)
- 1280×800 (Desktop)

Check:
- No horizontal overflow
- Tap targets ≥44px
- Bottom nav transitions to side rail at `md:` (768px)
- Safe-area insets on notched devices

### 3. Stealth Mode Verification
Enable stealth mode in Settings, check:
- All images/icons hidden
- Rarity colors neutralized to gray
- Shadows removed
- Animations disabled
- "摸鱼模式" indicator visible in corner

### 4. i18n Verification
Switch locale (Settings → Language → en), verify:
- All screens render in English
- No missing translation keys (no `[missing]` strings)
- Date/number formatting (if applicable)

### 5. Save/Load Tests
- Create character → play → close tab
- Reopen → "Continue" button should appear
- Export save → delete save → import → verify state restored

---

## For `architect`

### 1. Performance Budget Check
Current build:
- Total: 407.92 KiB precache
- Gzip: ~143 KiB transfer

Monitor:
- First contentful paint (FCP)
- Time to interactive (TTI)
- Lighthouse PWA score

### 2. Service Worker Strategy
Current: `generateSW` mode (Workbox)

Consider:
- Runtime caching for API calls (if future)
- Background sync for offline saves

### 3. Bundle Analysis
Consider code-splitting:
- Combat logic (99 KB) could be lazy-loaded
- i18n bundles (60 KB) could be split per-locale

---

## Known Issues (Low Priority)

### 1. Engine Test Failures (3)
**Files:** `src/engine/combat/damage.test.ts`, `src/engine/idle/offline-bonus.test.ts`, `src/engine/progression/xp.test.ts`

Pre-existing failures unrelated to UI work. Should be fixed but don't block UI delivery.

### 2. TypeScript Version Warning
ESLint warns about TypeScript 5.9.3 vs supported <5.6.0. Doesn't affect functionality but should update `@typescript-eslint/*` packages.

### 3. Vite CSS Import Warning
Fixed (moved `@import './stealth.css'` before `@tailwind`).

---

## Next Milestones

1. **Content Integration** (content-designer) — 1 week
   - All JSON data files
   - Localization strings

2. **Engine Wiring** (engine-dev) — 1 week
   - Combat loop integration
   - Save/load lifecycle
   - Skill tree logic

3. **QA Pass** (qa-engineer) — 3 days
   - E2E tests
   - Mobile verification
   - Save/load edge cases

4. **Polish** (frontend-dev) — 2 days
   - Loading states
   - Error boundaries
   - Accessibility audit

**Target:** End-to-end playable v1 in ~2.5 weeks.
