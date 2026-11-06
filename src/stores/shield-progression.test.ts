/** Constructed real-pick/three-socket fixtures prove native use, not farming odds. */
import { afterEach, assert, beforeEach, expect, it } from 'vitest';
import policy from '../../tests/fixtures/shield-progression-v1.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { createRng } from '@/engine/rng';
import { rollKillRewards } from '@/engine/loot/award';
import { rollItem, __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from './materialActions';

const pools = loadAwardPools();
function reset() {
  useInventoryStore.getState().reset(); usePlayerStore.getState().reset();
  useMapStore.getState().reset(); useMercStore.getState().reset(); useFormationStore.getState().reset();
  useHydrationStore.getState().setStatus('ready'); __resetRollItemSeqForTests();
}
beforeEach(reset); afterEach(reset);

it.each(policy.tiers.filter(tier => tier.from > 1))(
  '$baseId materializes a declared pick, enforces its base level and preserves weapon/displaced-shield custody', tier => {
    const source = policy.tables.find(row => row.additions.some(band => band.baseId === tier.baseId));
    assert(source);
    const band = source.additions.find(band => band.baseId === tier.baseId);
    const table = pools.treasureClasses.get(source.id); assert(band && table);
    const pick = table.picks.find(pick => pick.baseId === tier.baseId &&
      pick.qlvlMin === band.from && pick.qlvlMax === band.to); assert(pick);
    // Isolate an actual appended pick, without forcing rarity or searching seeds.
    const rewards = rollKillRewards({ act: source.id.endsWith('act1') ? 1 : 2,
      monsterLevel: band.from, tier: 'chapter-boss', treasureClassId: source.id, magicFind: 0, goldFind: 0 }, {
      ...pools, treasureClasses: new Map([[source.id, { ...table, picks: [pick] }]])
    }, createRng(3286157777));
    const candidate = rewards.items[0]; assert(candidate);
    const base = pools.bases.get(tier.baseId); assert(base?.baseDefense);
    expect(candidate).toMatchObject({ baseId: tier.baseId, ilvl: band.from });
    expect(candidate.baseRolls?.defense).toBe(base.baseDefense);
    const weapon = rollItem({ baseId: 'items/base/wp1h-short-sword', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
    const shield = rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 1 }, pools, createRng(7));
    assert(weapon && shield);
    usePlayerStore.getState().setPlayer({ ...createMockPlayer('Shield progression fixture', 'paladin'),
      level: base.reqLevel - 1, skillLevels: {}, equipment: [] });
    for (const item of [weapon, shield, candidate]) useInventoryStore.getState().addItem(item);
    for (const item of [weapon, shield]) expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
    const frozen = structuredClone({ backpack: useInventoryStore.getState().backpack,
      equipped: useInventoryStore.getState().equipped, player: usePlayerStore.getState().player });
    expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: false, reason: 'requirements_not_met' });
    expect({ backpack: useInventoryStore.getState().backpack, equipped: useInventoryStore.getState().equipped,
      player: usePlayerStore.getState().player }).toEqual(frozen);
    const current = usePlayerStore.getState().player; assert(current);
    usePlayerStore.getState().setPlayer({ ...current, level: base.reqLevel });
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    const before = usePlayerStore.getState().player; assert(before);
    expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: true });
    const after = usePlayerStore.getState().player; assert(after);
    expect(after.derivedStats.defense).toBeGreaterThan(before.derivedStats.defense);
    expect(useInventoryStore.getState().equipped.weapon).toEqual({ ...weapon, equipped: true });
    expect(useInventoryStore.getState().equipped.offhand).toEqual({ ...candidate, equipped: true });
    expect(useInventoryStore.getState().backpack).toEqual([{ ...shield, equipped: false }]);
  });

it('spends Ral/Ort/Tal once to craft Ancient’s Pledge on a constructed normal three-socket Dragon Shield', () => {
  // Explicit rarity/socket-capacity fixture, not a naturally sampled reward.
  const generated = rollItem({ baseId: 'items/base/sh-dragon-shield', rarity: 'normal', ilvl: 35 }, pools, createRng(7));
  assert(generated);
  const shield = { ...generated, socketCapacity: 3 };
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Shield crafting fixture', 'paladin'),
    level: 35, skillLevels: {}, equipment: [] });
  useInventoryStore.getState().addItem(shield);
  expect(useInventoryStore.getState().equipItem(shield)).toEqual({ ok: true });
  const before = usePlayerStore.getState().player; assert(before);
  expect(useInventoryStore.getState().unequipItem('offhand')).toEqual({ ok: true });
  useInventoryStore.setState({ materials: { 'runes/ral': 1, 'runes/ort': 1, 'runes/tal': 1, 'runes/el': 2 } });
  let remaining: Record<string, number> = { 'runes/ral': 1, 'runes/ort': 1, 'runes/tal': 1, 'runes/el': 2 };
  for (const materialId of ['runes/ral', 'runes/ort', 'runes/tal']) {
    const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: [shield.id], materialId });
    const inventory = useInventoryStore.getState();
    const preview = previewLiveMaterialAction(request);
    expect(useInventoryStore.getState()).toBe(inventory);
    const result = executeLiveMaterialAction(request);
    expect(result.replay).toBe(false);
    expect(result.result).toEqual(preview.result);
    remaining = Object.fromEntries(Object.entries(remaining).filter(([id]) => id !== materialId));
    expect(useInventoryStore.getState().materials).toEqual(remaining);
    const committed = useInventoryStore.getState();
    expect(executeLiveMaterialAction(request).replay).toBe(true);
    expect(useInventoryStore.getState()).toBe(committed);
  }
  const crafted = useInventoryStore.getState().backpack[0]; assert(crafted);
  expect(crafted).toEqual({ ...shield, rarity: 'runeword', runewordId: 'runewords/ancients-pledge',
    socketContents: ['runes/ral', 'runes/ort', 'runes/tal'].map(id => ({ kind: 'rune', id })) });
  expect(useInventoryStore.getState().equipItem(crafted)).toEqual({ ok: true });
  const after = usePlayerStore.getState().player; assert(after);
  expect(after.derivedStats.defense).toBe(before.derivedStats.defense + 50);
  expect(after.derivedStats.resistances).toMatchObject({ fire: 83, cold: 43, lightning: 83, poison: 83 });
  expect(useInventoryStore.getState().backpack).toEqual([]);
  expect(useInventoryStore.getState().equipped.offhand).toEqual({ ...crafted, equipped: true });
});
