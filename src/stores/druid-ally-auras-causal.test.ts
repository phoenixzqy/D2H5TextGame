import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve()),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, playerToCombatUnit, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
];
function reset() {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
});
function native(
  oak: number,
  heart = 0,
  form = false,
  classId: 'druid' | 'sorceress' = 'druid',
  level = 30
) {
  reset();
  const fresh = createMockPlayer('Constructed allied aura fixture', classId);
  const player = {
    ...fresh,
    level,
    skillLevels: {
      'druid.oak_sage': oak,
      'druid.heart_of_wolverine': heart,
      ...(form ? { 'druid.werewolf': 20, 'druid.lycanthropy': 20 } : {})
    },
    comboOrder: form ? ['druid.werewolf'] : []
  };
  usePlayerStore.getState().setPlayer(player);
  const cap: Item = {
    id: 'synthetic-aura-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    socketCapacity: 0,
    identified: true,
    equipped: false,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', 100]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const bare = playerToCombatUnit(player);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const state = useCombatStore.getState(),
    hero = state.playerTeam[0],
    final = state.outcome?.finalPlayerTeam[0];
  if (!hero || !final) throw new Error('Missing native aura recording');
  return { bare, hero, final, events: state.recordedEvents };
}
it.each([1, 20])('rank%s Oak Sage increases native initial capacity without filling it', (rank) => {
  const r = native(rank),
    expected = r.bare.stats.lifeMax + Math.floor((r.bare.stats.lifeMax * 3 * rank) / 100);
  expect(r.hero.stats.lifeMax).toBe(expected);
  expect(r.hero.life).toBe(r.bare.stats.lifeMax);
  expect(r.events.some((e) => e.kind === 'action' && e.skillId === 'druid.oak_sage')).toBe(false);
});
it.each([1, 20])(
  'rank%s Heart of Wolverine increases actual native basic damage without a cast',
  (rank) => {
    const control = native(1),
      enabled = native(1, rank);
    const firstDamage = (r: typeof enabled) =>
      r.events.find((e) => e.kind === 'damage' && e.source === r.hero.id);
    const a = firstDamage(control),
      b = firstDamage(enabled);
    if (a?.kind !== 'damage' || b?.kind !== 'damage')
      throw new Error('Missing actual native hero damage');
    expect(b.amount).toBeGreaterThan(a.amount);
    expect(
      enabled.events.some((e) => e.kind === 'action' && e.skillId === 'druid.heart_of_wolverine')
    ).toBe(false);
  }
);
it('adds Oak and paid wolf life over the same fresh base without refilling or compounding', () => {
  const r = native(20, 0, true),
    base = r.bare.stats.lifeMax;
  expect(r.final.stats.lifeMax).toBe(base + 2 * Math.floor((base * 60) / 100));
  const paid = r.events.find((e) => e.kind === 'life-capacity' && e.druidFormState?.druidForm);
  if (paid?.kind !== 'life-capacity') throw new Error('Missing paid form capacity observation');
  expect(paid.life).toBeLessThanOrEqual(r.bare.stats.lifeMax);
});
it.each([
  ['sorceress', 30],
  ['druid', 5]
] as const)('rejects foreign/locked Oak allocations: %s/%s', (classId, level) => {
  const r = native(20, 20, false, classId, level);
  expect(r.hero.stats.lifeMax).toBe(r.bare.stats.lifeMax);
});
it('missing Oak prerequisite cannot grant Heart damage', () => {
  const a = native(0),
    b = native(0, 20);
  const damage = (r: typeof a) =>
    r.events
      .filter((e) => e.kind === 'damage' && e.source === r.hero.id)
      .map((e) => (e.kind === 'damage' ? e.amount : 0));
  expect(damage(b)).toEqual(damage(a));
});
