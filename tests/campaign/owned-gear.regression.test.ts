/** Constructed native custody checks; no earned progression or balance claim. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { armIronGolemSelection } from '@/stores/ironGolemSelectionStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { auditCampaignEconomy, campaignEconomy } from './economy';
import { retrieveCampaignGear } from './owned-gear';

let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Managed gear QA', 'amazon').ok).toBe(true);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });
const item = (id: string): Item => ({ id, baseId: 'items/base/helm-cap', rarity: 'magic',
  level: 1, ilvl: 1, equipped: false, identified: true });
const save = () => { const result = snapshotStores(); assert.ok(result); return result; };
const fill = (count: number, stashCount = 1) => {
  const backpack = Array.from({ length: count }, (_, i) => item(`bag-${String(i).padStart(3, '0')}`));
  const stash = [item('selected'), ...Array.from({ length: stashCount - 1 }, (_, i) => item(`stash-${String(i)}`))];
  useInventoryStore.setState({ backpack: [...backpack].reverse(), stash });
  return { backpack, stash };
};

it.each([100, 117])('retrieves selected gear after native staging from a %s-item bag without income or loss', count => {
  const initial = fill(count), before = save(), records: Readonly<Record<string, unknown>>[] = [];
  const selected = retrieveCampaignGear('selected', row => { records.push(row); }, 'stash-room-v1');
  expect(selected).toEqual(initial.stash[0]);
  const after = save(), moved = initial.backpack.slice(0, count - 99);
  expect(after.inventory.backpack).toEqual([...initial.backpack].reverse().filter(row => !moved.includes(row)).concat(initial.stash));
  expect(after.inventory.stash).toEqual(moved);
  expect(records.filter(row => row.kind === 'campaign-gear-stage').map(row => row.itemId))
    .toEqual(moved.map(row => row.id));
  expect(auditCampaignEconomy(campaignEconomy(before), campaignEconomy(after), []))
    .toEqual({ xp: 0, addedItems: 0 });
  expect(after).toEqual({ ...before, inventory: { ...before.inventory,
    backpack: after.inventory.backpack, stash: after.inventory.stash } });
});

it.each([{ bag: 100, stash: 500 }, { bag: 101, stash: 499 }])('refuses without partial staging when room is insufficient: $bag/$stash', fixture => {
  fill(fixture.bag, fixture.stash); const before = save();
  expect(retrieveCampaignGear('selected', () => undefined, 'stash-room-v1')).toBeNull();
  expect(save()).toEqual(before);
});

it('preserves the current hero Iron Golem selection while staging another owned item', () => {
  fill(100); const hero = usePlayerStore.getState().player; assert.ok(hero);
  armIronGolemSelection(hero.id, 'bag-000', true);
  const before = save();
  expect(retrieveCampaignGear('selected', () => undefined, 'stash-room-v1')?.id).toBe('selected');
  expect(useInventoryStore.getState().backpack.some(row => row.id === 'bag-000')).toBe(true);
  expect(useInventoryStore.getState().stash.map(row => row.id)).toEqual(['bag-001']);
  expect(save().player).toEqual(before.player);
});

it('keeps the existing native full-bag refusal without the explicit policy', () => {
  fill(100); const before = save();
  expect(retrieveCampaignGear('selected', () => undefined)).toBeNull();
  expect(save()).toEqual(before);
});

it('requires an idle boundary before staging anything', () => {
  fill(100); useCombatStore.setState({ inCombat: true }); const before = save();
  expect(() => retrieveCampaignGear('selected', () => undefined, 'stash-room-v1')).toThrow('idle');
  expect(save()).toEqual(before);
});

it('retains a committed native staging transfer when recording fails', () => {
  fill(100);
  expect(() => retrieveCampaignGear('selected', () => { throw new Error('Recorder failed'); }, 'stash-room-v1'))
    .toThrow('Recorder failed');
  expect(useInventoryStore.getState().backpack).toHaveLength(99);
  expect(useInventoryStore.getState().stash.map(row => row.id)).toEqual(['selected', 'bag-000']);
});

it('does not stage or retrieve an item already in the backpack', () => {
  fill(117); const before = save();
  expect(retrieveCampaignGear('bag-001', () => { throw new Error('Unexpected record'); }, 'stash-room-v1')?.id)
    .toBe('bag-001');
  expect(save()).toEqual(before);
});
