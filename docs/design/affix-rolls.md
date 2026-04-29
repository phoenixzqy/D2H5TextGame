# Affix Rolls Vertical Slice

## Objective
Make every dropped equipment item a distinct instance instead of a static base clone. A drop still resolves treasure class and rarity exactly as before, then rolls D2/Arreat-Summit-style base variance and prefix/suffix affixes. Success means two drops of the same base can display different damage/defense and affix values, and those rolls survive save/load.

## Existing Infrastructure Found
- `src/engine/loot/drop-roller.ts` already rolls treasure-class base, rarity, and ilvl; the drop pipeline will keep this step and replace `generateItem` with/call through the new `rollItem` materializer.
- `src/engine/loot/item-instance.ts` already materializes drops and has partial affix rolling, but affixes are flat one-tier entries and base stats are not instance-rolled; it will be kept as a compatibility wrapper or retired after `rollItem` owns instance creation.
- `src/data/items/affixes-prefix.json`, `affixes-suffix.json`, and `src/data/schema/affix.schema.json` already exist and will be extended rather than duplicated.
- `src/data/items/rarity-rules.json` already stores per-rarity affix-count ranges and will remain the tuning source.
- UI compare already consumes item instances via `aggregateEquipmentMods`; it needs to read rolled base values and render localized affix lines.

## Tech Stack
TypeScript strict, pure engine modules under `src/engine/**`, React 18 UI, Vite, Zustand, i18next, Ajv JSON schema validation, Vitest, Playwright.

## Commands
- Branch: `git switch -c feat/affix-rolls`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Unit tests: `npm test -- --run --reporter=basic`
- Build: `npm run build`
- E2E target: `npx playwright test tests/e2e/playthrough/affix-rolls.spec.ts --project=chromium`
- Data validation: `npm test -- --run src/data/__tests__/data-integrity.test.ts --reporter=basic`
- Balance smoke: run the combat-balance skill after implementation.

## Project Structure
- `src/engine/loot/rollItem.ts`: pure item-instance roller `(baseId, rarity, ilvl, rng, pools/rules)` called by the existing drop pipeline after TC/rarity resolution.
- `src/engine/items/computeStats.ts`: pure rolled-stat aggregation for UI/combat.
- `src/engine/types/items.ts`: extend `Item` with required persisted instance fields. Existing code uses `level`; this slice will add `ilvl` and keep `level` as a compatibility alias until all callers migrate. Existing `AffixRoll.values` will be replaced/bridged by `affixes: { id, tier, rolledValue }[]` plus a stat lookup in affix data.
- `src/data/items/affixes-*.json`: starter tiered prefix/suffix table.
- `src/data/schema/affix.schema.json`: tiered affix schema with required fields `id`, `kind`, `appliesTo`, `stat`, `tiers`, `rarityWeights`, and `i18nKey`; legacy `type`/`minIlvl` entries migrate to the new shape rather than coexisting long-term.
- `src/i18n/locales/{zh-CN,en}/affixes.json`: affix line and name fragments.
- `src/ui` and `src/features/inventory`: render rolled stats and localized affix lines.
- `src/engine/types/save.ts`: bump v4 -> v5 with legacy item migration.
- `tests/e2e/playthrough/affix-rolls.spec.ts`: visible variance and compare-panel coverage.

## Code Style
```ts
export function rollItem(
  input: RollItemInput,
  pools: ItemRollPools,
  rng: Rng
): Item | undefined {
  const base = pools.bases.get(input.baseId);
  if (!base) return undefined;
  const ilvl = input.ilvl;
  return {
    id: nextItemId(rng),
    baseId: base.id,
    rarity: input.rarity,
    ilvl,
    level: ilvl, // compatibility alias for existing callers
    baseRolls: rollBaseStats(base, rng),
    affixes: rollAffixList(base, input.rarity, ilvl, pools.affixes, pools.rarityRules, rng),
    identified: input.rarity === 'normal' || input.rarity === 'magic',
    equipped: false
  };
}
```
Affix JSON shape:
```ts
type AffixDef = {
  id: string;
  kind: 'prefix' | 'suffix';
  appliesTo: Array<'weapon' | 'armor' | 'jewelry' | 'charm'>;
  stat: 'attack' | 'life' | 'mana' | 'defense' | 'critChance' | 'critDamage' | 'physDodge' | 'magicDodge' | 'fireRes' | 'coldRes' | 'lightningRes' | 'poisonRes' | 'arcaneRes' | 'physicalRes';
  tiers: Array<{ ilvlMin: number; ilvlMax: number; valueMin: number; valueMax: number }>;
  rarityWeights: { magic: number; rare: number; unique?: number; set?: number };
  i18nKey: string;
};
```
Conventions: no `Math.random()` in engine; no React/DOM imports in engine; all data-driven stat ranges; user-facing strings through i18next; public engine/store APIs keep TSDoc.

## Roll Rules
- Base rolls: weapons roll a concrete `attack` from existing `baseDamage.min..max`; armor/shields roll `defense` from either future `baseDefenseMin..Max` or current scalar ±15% clamped to at least ±1 for visible variance. Normal items only get these base rolls.
- Magic: roll 1 prefix and 1 suffix when eligible, each chosen by `rarityWeights.magic`; if a kind has no eligible affixes the count degrades gracefully.
- Rare: roll 4-6 total affixes, capped at 3 prefixes and 3 suffixes, chosen by `rarityWeights.rare` without replacement.
- Set/Unique: use fixed roster when present; MVP may convert existing fixed `stats` objects to instance affix rolls with `[min,max]` where ranges exist and fixed values otherwise. Missing set-piece mappings continue to downgrade as today and are tracked as a follow-up.
- Rarity scaling: higher rarity scales by count and by access to higher ilvl tiers; no hidden multiplier outside JSON ranges. Future balance changes should alter `tiers` and `rarityWeights`, not TypeScript.
- Starter table must include at least three ilvl tiers for attack, life, mana, defense, critChance, critDamage, physDodge, magicDodge, and all elemental/physical resistances across weapon/armor/jewelry applicability.

## Testing Strategy
- Vitest for `rollItem`: deterministic seed, snapshot stability, affix counts by rarity, ilvl tier validity, values within `[valueMin,valueMax]`, and same-base variance across seeds.
- Vitest for `computeStats`/equipment aggregation: rolled base values and affix values affect derived compare stats.
- Migration test: v4 item with no `baseRolls`/`affixes` migrates to v5 with midpoint base rolls and no data loss.
- Data integrity: Ajv validates affix schema and rarity rules.
- Playwright: kill/loot or inject deterministic test items through the existing test bridge, verify same base shows different rolled stats, rare shows 4-6 affix lines, and equip compare renders deltas.

## Boundaries
- Always: derive item-drop RNG from the caller's deterministic RNG or `hashSeed("drop|runId|monsterId|dropIdx")` where context is available; preserve existing TC/rarity probabilities; persist rolled instance fields.
- Ask first: new runtime dependencies, changing tech stack, replacing the loot table system, public API changes outside item/loot/save/UI paths.
- Never: use `Math.random()` in engine, hardcode player-visible strings in React, put gameplay logic in UI components, break legacy save migration, duplicate existing affix infrastructure.

## Success Criteria
1. Every materialized equipment drop has `baseRolls`; magic/rare/set/unique drops have rolled affix values where applicable.
2. Magic items roll up to one prefix and one suffix; rares roll 4-6 total affixes with max three prefixes and max three suffixes; tier selection respects ilvl.
3. UI tooltip, inventory, and equip compare display rolled values and localized affix lines.
4. Save/load round-trips rolled items unchanged; v4 saves migrate to v5.
5. Data validation, unit tests, E2E target, typecheck, lint, full tests, and build are green.

## Deferred Follow-ups
- Full unique/set fixed-affix authoring beyond MVP starter coverage.
- Larger 60-prefix/60-suffix endgame affix pool from `items-spec.md`.
- Dedicated visual polish for rarity-tier affix colors beyond base rarity coloring.
