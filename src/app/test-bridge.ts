/**
 * Test bridge — exposes a tiny, stable surface on `window.__GAME__` for E2E
 * tests to seed deterministic state (items into backpack, etc.).
 *
 * Gated to non-production environments only: enabled in dev (`vite dev`),
 * Vitest (`MODE === 'test'`), and Playwright builds that opt-in via
 * `VITE_E2E=true`. Production preview/build does **not** expose the bridge,
 * so end-users never see `window.__GAME__` or `seedItem`. Surface area is
 * kept minimal — store references plus a single `seedItem` helper — and
 * never invoked by app code.
 */
import { useInventoryStore, usePlayerStore, useCombatStore, useMercStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { loadAwardPools } from '@/data/loaders/loot';
import { loadMercPool } from '@/data/loaders/mercs';
import { rollItem } from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import type { Item, Rarity } from '@/engine/types/items';

export interface TestBridge {
  readonly inventory: typeof useInventoryStore;
  readonly player: typeof usePlayerStore;
  readonly combat: typeof useCombatStore;
  readonly merc: typeof useMercStore;
  /**
   * Roll a full item instance into the backpack. Returns the new item id.
   */
  seedItem: (
    baseId: string,
    opts?: { rarity?: Rarity; level?: number; toStash?: boolean }
  ) => string;
  /**
   * Seed a mercenary into the roster and optionally field it.
   * Picks the first available merc def from the pool when `defId` is omitted.
   * Returns the runtime merc id (may include `#` instance suffix).
   */
  seedMerc: (opts?: { defId?: string; field?: boolean }) => string;
}

declare global {
  // eslint-disable-next-line no-var
  var __GAME__: TestBridge | undefined;
}

let seedCounter = 0;
function nextSeedId(): string {
  seedCounter += 1;
  return `seed-${String(Date.now())}-${String(seedCounter)}`;
}

export function installTestBridge(): void {
  if (typeof window === 'undefined') return;
  const env = import.meta.env;
  const enabled =
    env.DEV ||
    env.MODE === 'test' ||
    env.VITE_E2E === 'true';
  if (!enabled) return;
  const bridge: TestBridge = {
    inventory: useInventoryStore,
    player: usePlayerStore,
    combat: useCombatStore,
    merc: useMercStore,
    seedItem: (baseId, opts = {}) => {
      const id = nextSeedId();
      const rarity = opts.rarity ?? 'normal';
      const level = opts.level ?? 1;
      const rolled = rollItem(
        { baseId, rarity, ilvl: level },
        loadAwardPools(),
        createRng(hashSeed(`${id}:${baseId}:${rarity}:${String(level)}`))
      );
      const item: Item = rolled
        ? { ...rolled, id, identified: true, equipped: false }
        : {
            id,
            baseId,
            rarity,
            level,
            ilvl: level,
            baseRolls: {},
            affixes: [],
            identified: true,
            equipped: false
          };
      useInventoryStore.getState().addItem(item, opts.toStash ?? false);
      return item.id;
    },
    seedMerc: (opts = {}) => {
      const pool = loadMercPool();
      const def = opts.defId
        ? pool.pool.find((d) => d.id === opts.defId) ?? pool.pool[0]
        : pool.pool[0];
      if (!def) throw new Error('[seedMerc] mercenary pool is empty');
      const suffix = `e2e-${String(Date.now())}`;
      const mercEntity = createMercFromDef(def, suffix);
      useMercStore.getState().addMerc(mercEntity);
      if (opts.field !== false) {
        useMercStore.getState().setFieldedMerc(mercEntity.id);
      }
      return mercEntity.id;
    }
  };
  (window as unknown as { __GAME__: TestBridge }).__GAME__ = bridge;
}
