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
import { useInventoryStore, usePlayerStore, useCombatStore } from '@/stores';
import type { Item, Rarity } from '@/engine/types/items';

export interface TestBridge {
  readonly inventory: typeof useInventoryStore;
  readonly player: typeof usePlayerStore;
  readonly combat: typeof useCombatStore;
  /**
   * Push a minimal {@link Item} into the backpack. Returns the new item id.
   * Affixes are intentionally empty — base `baseDefense`/`baseDamage` is
   * enough to verify equip → derived-stat recompute.
   */
  seedItem: (
    baseId: string,
    opts?: { rarity?: Rarity; level?: number; toStash?: boolean }
  ) => string;
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
    seedItem: (baseId, opts = {}) => {
      const item: Item = {
        id: nextSeedId(),
        baseId,
        rarity: opts.rarity ?? 'normal',
        level: opts.level ?? 1,
        identified: true,
        equipped: false
      };
      useInventoryStore.getState().addItem(item, opts.toStash ?? false);
      return item.id;
    }
  };
  (window as unknown as { __GAME__: TestBridge }).__GAME__ = bridge;
}
