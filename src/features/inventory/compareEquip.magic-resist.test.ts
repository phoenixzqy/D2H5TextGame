import { afterEach, beforeEach, expect, it } from 'vitest';
import { compareEquip, isClearNetUpgrade, netEquipDelta, prepareCompareEquip } from './compareEquip';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { Item } from '@/engine/types/items';

const plain: Item = { id: 'plain-cap', baseId: 'items/base/helm-cap', rarity: 'normal',
  level: 1, ilvl: 1, identified: true, equipped: false, socketCapacity: 2,
  baseRolls: { defense: 7 }, affixes: [] };
const diamond: Item = { ...plain, id: 'diamond-cap',
  socketContents: [{ kind: 'gem', id: 'gems/diamond/chipped' }] };
const coreStats = { strength: 20, dexterity: 25, vitality: 20, energy: 30 };
const owner = { level: 6, coreStats, derivedStats: deriveStats(coreStats, 6) };
function mrCap(value: number): Item {
  return { ...plain, id: `mr-cap-${String(value)}`, rarity: 'magic',
    affixes: [{ affixId: 'constructed-mr', values: new Map([['statMods.magicResist', value]]) }] };
}

beforeEach(() => { useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); });
afterEach(() => { useInventoryStore.getState().reset(); usePlayerStore.getState().reset(); });

it('counts only the real Diamond flat-MR gain as a clear +2 upgrade without mutation', () => {
  const before = structuredClone({ owner, plain, diamond });
  const result = compareEquip(owner, diamond, 'head', { head: plain });
  expect(result.stats.magicResist).toEqual({ current: 0, candidate: 2, delta: 2 });
  expect(result.stats.defense.delta).toBe(0);
  expect(Object.values(result.resistances).every(row => row.delta === 0)).toBe(true);
  expect(netEquipDelta(result)).toBe(2);
  expect(isClearNetUpgrade(result)).toBe(true);
  expect({ owner, plain, diamond }).toEqual(before);
  expect(prepareCompareEquip(owner, { head: plain })(diamond, 'head')).toEqual(result);
});

it('predicts the same MR gain as the actual inventory equip action', () => {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('MR compare', 'sorceress'),
    level: owner.level, coreStats });
  useInventoryStore.getState().addItem(plain);
  expect(useInventoryStore.getState().equipItem(plain, 'head')).toEqual({ ok: true });
  useInventoryStore.getState().addItem(diamond);
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing fixture player');
  const before = player.derivedStats.magicResist;
  const comparison = compareEquip(player, diamond, 'head', useInventoryStore.getState().equipped);
  expect(useInventoryStore.getState().equipItem(diamond, 'head')).toEqual({ ok: true });
  const after = usePlayerStore.getState().player?.derivedStats.magicResist;
  expect(after).toBe(2);
  expect(comparison.stats.magicResist).toEqual({ current: before, candidate: after, delta: 2 });
});

it('does not call an armor gain a clear upgrade when flat MR is lost', () => {
  const armored: Item = { ...plain, id: 'armor-cap', baseRolls: { defense: 12 } };
  const result = compareEquip(owner, armored, 'head', { head: mrCap(6) });
  expect(result.stats.defense.delta).toBe(5);
  expect(result.stats.magicResist).toEqual({ current: 6, candidate: 0, delta: -6 });
  expect(netEquipDelta(result)).toBe(-1);
  expect(isClearNetUpgrade(result)).toBe(false);
});

it('reports signed MR through the canonical zero clamp and keeps unchanged gear neutral', () => {
  const negative = compareEquip(owner, mrCap(-4), 'head', { head: diamond });
  expect(negative.stats.magicResist).toEqual({ current: 2, candidate: 0, delta: -2 });
  expect(netEquipDelta(negative)).toBe(-2);
  expect(isClearNetUpgrade(negative)).toBe(false);
  const same = compareEquip(owner, diamond, 'head', { head: diamond });
  expect(same.stats.magicResist).toEqual({ current: 2, candidate: 2, delta: 0 });
  expect(netEquipDelta(same)).toBe(0);
  expect(isClearNetUpgrade(same)).toBe(false);
});

it('includes MR removed by native two-handed weapon displacement', () => {
  const shield: Item = { ...mrCap(4), id: 'mr-shield', baseId: 'items/base/sh-buckler' };
  const bow: Item = { ...plain, id: 'bow', baseId: 'items/base/weapon-bow',
    socketCapacity: 0, baseRolls: { attack: 13 } };
  const result = compareEquip(owner, bow, 'weapon', { offhand: shield });
  expect(result.stats.magicResist).toEqual({ current: 4, candidate: 0, delta: -4 });
  expect(isClearNetUpgrade(result)).toBe(false);
});
