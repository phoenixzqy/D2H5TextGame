/** Durable ingress: real awards and returned gear must remain owned above UI limits. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { MercsScreen } from '@/features/mercs/MercsScreen';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import type { SaveCurrent } from '@/engine/types/save';
import { decodeSave } from '@/engine/save/validate';
import { exportCurrentSave, importIntoStores, hydrateFromSave, snapshotStores, __resetPersistenceForTests } from './persistence';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { awardLootForVictory, createSimpleEnemy } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';

// Only disk IO is replaced; serialize/validate/import/hydrate are production APIs.
const disk = vi.hoisted(() => ({ data: null as SaveCurrent | null }));
vi.mock('./save-adapter', () => ({
  saveSave: (data: SaveCurrent) => { disk.data = structuredClone(data); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk.data ? structuredClone(disk.data) : null),
  hasSave: () => Promise.resolve(disk.data !== null),
  deleteSave: () => { disk.data = null; return Promise.resolve(); }
}));

function items(prefix: string, count: number): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index)}`, baseId: 'items/base/helm-cap',
    rarity: 'normal', level: 1, identified: true, equipped: false, socketCapacity: 0, affixes: []
  }));
}
function reset(): void {
  __resetPersistenceForTests();
  useInventoryStore.getState().reset();
  usePlayerStore.getState().reset();
  useMercStore.getState().reset();
  useMapStore.getState().reset();
  useMetaStore.getState().reset();
  useFormationStore.getState().reset();
}
beforeEach(async () => {
  reset();
  disk.data = null;
  await i18n.changeLanguage('en');
  useMetaStore.getState().setLocale('en');
  usePlayerStore.getState().setPlayer(createMockPlayer('Ingress', 'sorceress'));
});
afterEach(reset);

describe('lossless inventory award and return ingress', () => {
  it.each([
    [false, 99], [false, 100], [false, 101], [false, 499], [false, 500], [false, 501],
    [true, 499], [true, 500], [true, 501], [true, 1999], [true, 2000], [true, 2001]
  ] as const)('retains a new item with stash=%s at existing length %s', (toStash, count) => {
    const target = toStash ? 'stash' : 'backpack';
    const before = items('existing', count);
    const incoming = items('award', 1)[0];
    if (!incoming) throw new Error('Missing awarded fixture');
    useInventoryStore.setState({ [target]: before });
    const other = toStash ? 'backpack' : 'stash';
    const untouched = useInventoryStore.getState()[other];
    useInventoryStore.getState().addItem(incoming, toStash);
    expect(useInventoryStore.getState()[target]).toHaveLength(count + 1);
    expect(useInventoryStore.getState()[target]).toEqual([...before, incoming]);
    expect(useInventoryStore.getState()[other]).toBe(untouched);
    expect(useInventoryStore.getState().currencies).toEqual({});
  });

  it('retains every item reported by the real victory reward dispatcher beyond the old full limit', () => {
    const before = items('existing', 500);
    useInventoryStore.setState({ backpack: before, currencies: { 'rune-shard': 11, 'gem-shard': 3, wishstone: 7 } });
    const result = awardLootForVictory({
      slainEnemies: Array.from({ length: 8 }, (_, index) => ({ ...createSimpleEnemy(1, index), life: 0 })),
      act: 1, treasureClassId: 'loot/trash-act1', seed: 7
    });
    expect(result.items.length).toBeGreaterThan(0);
    const state = useInventoryStore.getState();
    expect(state.backpack).toHaveLength(before.length + result.items.length);
    expect(state.backpack).toEqual([...before, ...result.items]);
    expect(new Set(state.backpack.map(item => item.id)).size).toBe(state.backpack.length);
    expect(state.currencies).toEqual({
      'rune-shard': 11 + result.runeShards + result.runes,
      'gem-shard': 3 + result.gems,
      wishstone: 7 + result.wishstones
    });
  });
});

function showEquippedMerc(gear: Item): string {
  const def = loadMercPool().pool[0];
  if (!def) throw new Error('Missing merc definition');
  const merc = createMercFromDef(def);
  useMercStore.getState().addMerc(merc);
  useMercStore.setState({ mercEquipment: { [merc.id]: { head: gear } } });
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MercsScreen />
      </MemoryRouter>
    </I18nextProvider>
  );
  fireEvent.click(screen.getByTestId(`merc-equipment-${def.id}`));
  return merc.id;
}
function ownedIds(): string[] {
  return [
    ...useInventoryStore.getState().backpack,
    ...useInventoryStore.getState().stash,
    ...Object.values(useMercStore.getState().mercEquipment).flatMap(slots =>
      Object.values(slots).filter((item): item is Item => item !== null))
  ].map(item => item.id).sort();
}

describe('ordinary merc equipment return at the old backpack limit', () => {
  it('retains manual merc gear at the legacy overflow limit and explains making room', () => {
    const gear: Item = { id: 'merc-cap', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1,
      identified: true, equipped: true,
      affixes: [{ affixId: 'test', values: new Map([['coreStats.vitality', 3]]) }] };
    useInventoryStore.setState({ backpack: items('existing', 500) });
    const mercId = showEquippedMerc(gear);
    const before = ownedIds();
    fireEvent.click(within(screen.getByTestId('merc-equip-slot-head')).getByRole('button', { name: 'Unequip' }));
    expect(useMercStore.getState().getMercEquipment(mercId).head).toBe(gear);
    expect(useInventoryStore.getState().backpack).toHaveLength(500);
    expect(screen.getByRole('status')).toHaveTextContent('Backpack is full. Make room before moving or removing equipment.');
    expect(ownedIds()).toEqual(before);
  });

  it('swaps the incoming item onto the merc and retains the displaced item exactly once', () => {
    const gear: Item = { id: 'merc-cap', baseId: 'items/base/helm-cap', rarity: 'normal', level: 1,
      identified: true, equipped: true };
    const incoming: Item = { ...gear, id: 'incoming-cap', equipped: false };
    const filler = items('existing', 499).map(item => ({ ...item, baseId: 'items/base/wp1h-short-sword' }));
    useInventoryStore.setState({ backpack: [...filler, incoming] });
    const mercId = showEquippedMerc(gear);
    const before = ownedIds();
    fireEvent.click(screen.getByTestId('merc-equip-slot-head'));
    fireEvent.click(screen.getByRole('button', { name: 'Equip' }));
    expect(useMercStore.getState().getMercEquipment(mercId).head?.id).toBe(incoming.id);
    expect(useInventoryStore.getState().backpack).toHaveLength(500);
    expect(useInventoryStore.getState().backpack.filter(item => item.id === incoming.id)).toEqual([]);
    expect(useInventoryStore.getState().backpack.filter(item => item.id === gear.id)).toHaveLength(1);
    expect(ownedIds()).toEqual(before);
  });
});

describe('overflow ownership across public save boundaries', () => {
  it('exports, validates, imports and reloads every retained item without a second award', async () => {
    const backpack = items('backpack', 500);
    const stash = items('stash', 2000);
    useInventoryStore.setState({ backpack, stash, currencies: { 'rune-shard': 23 } });
    const returned: Item = { id: 'returned-with-map', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1,
      identified: true, equipped: false, socketCapacity: 0,
      affixes: [{ affixId: 'test', values: new Map([['coreStats.vitality', 3]]) }] };
    useInventoryStore.getState().addItem(returned);
    useInventoryStore.getState().addItem({ ...returned, id: 'stash-return-with-map' }, true);
    expect(useInventoryStore.getState().backpack).toHaveLength(501);
    expect(useInventoryStore.getState().stash).toHaveLength(2001);
    const before = snapshotStores();
    const exported = exportCurrentSave();
    if (!before || !exported) throw new Error('Missing exported overflow save');
    const decoded = decodeSave(JSON.parse(exported) as unknown);
    expect(decoded.inventory).toEqual(before.inventory);
    const affix = decoded.inventory.backpack.at(-1)?.affixes?.[0];
    if (!affix || !('values' in affix)) throw new Error('Missing retained map affix');
    expect(affix.values).toEqual(new Map([['coreStats.vitality', 3]]));
    await importIntoStores(exported);
    expect(snapshotStores()?.inventory).toEqual(before.inventory);
    reset();
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(await hydrateFromSave()).toBe(true);
    expect(snapshotStores()?.inventory).toEqual(before.inventory);
    expect(snapshotStores()?.player).toEqual(before.player);
    const inventory = useInventoryStore.getState();
    expect(inventory.backpack.map(item => item.id)).toEqual([...backpack.map(item => item.id), returned.id]);
    expect(inventory.stash.map(item => item.id)).toEqual([...stash.map(item => item.id), 'stash-return-with-map']);
    expect(inventory.currencies).toEqual({ 'rune-shard': 23 });
  });
});
