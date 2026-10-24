import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';

const ring = (id: string): Item => ({
  id, baseId: 'items/base/ring-iron', rarity: 'normal', level: 1,
  identified: true, equipped: false,
});

describe('explicit hero equipment destination', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    usePlayerStore.getState().reset();
    usePlayerStore.getState().setPlayer(createMockPlayer('Ring slots', 'barbarian'));
  });

  it.each([false, true])('refuses an incompatible slot using the stored base, forged caller=%s', forged => {
    const owned = ring('owned');
    useInventoryStore.getState().addItem(owned);
    const before = useInventoryStore.getState();
    const player = usePlayerStore.getState().player;
    const requested = forged ? { ...owned, baseId: 'items/base/helm-cap' } : owned;
    expect(before.equipItem(requested, 'head')).toEqual({ ok: false, reason: 'no_slot' });
    expect(useInventoryStore.getState()).toBe(before);
    expect(usePlayerStore.getState().player).toBe(player);
  });

  it('keeps default automatic ring filling and left replacement for callers without a destination', () => {
    const items = [ring('first'), ring('second'), ring('third')];
    for (const item of items) useInventoryStore.getState().addItem(item);
    for (const item of items) expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
    const after = useInventoryStore.getState();
    expect(after.equipped['ring-left']?.id).toBe('third');
    expect(after.equipped['ring-right']?.id).toBe('second');
    expect(after.backpack).toEqual([{ ...items[0], equipped: false }]);
  });
});
