import { describe, expect, it } from 'vitest';
import { loadItemBases, loadUniques, loadAffixPool, loadTreasureClasses } from '../loaders/loot';
import { rollUniqueItem } from '@/engine/loot/rollItem';
import { createRng } from '@/engine/rng';
import { aggregateEquipmentMods } from '@/engine/progression/equipment-mods';
import { resolveItemIcon } from '@/ui/cardAssets';
import { loadQuests } from '../loaders/quests';
import { ORMUS } from '@/engine/map/ormus-quest';

const baseId = 'items/base/small-charm', uniqueId = 'items/unique/ormus-charm';
describe('first authored quest-only charm', () => {
  it('authors the actual complete clear, ordered Ormus Talk, and exact reward input', () => {
    expect(loadQuests().find(row => row.id === ORMUS.quest)).toMatchObject({
      giver: ORMUS.npc, actId: ORMUS.actId,
      objectives: [ { id: ORMUS.first, type: 'clear-area', areaId: ORMUS.area },
        { id: ORMUS.talk, type: 'talk', npcId: ORMUS.npc } ],
      rewards: { xp: 5000, itemDrop: { uniqueId, ilvl: 32 } }
    });
  });
  it('authors exactly the approved base and fixed unique', () => {
    expect(loadItemBases().get(baseId)).toEqual({ id: baseId, name: 'items.base.small-charm',
      type: 'charm', slot: 'charm', reqLevel: 1, maxSockets: 0, metal: false, canHaveAffixes: false });
    expect(loadUniques().filter(row => row.id === uniqueId)).toEqual([{ id: uniqueId,
      name: 'items.unique.ormus-charm.name', baseId, reqLevel: 1, qlvl: 32, weight: 1,
      stats: { statMods: { life: 20, mana: 10 } } }]);
  });
  it('constructs the exact quest input and contributes only from the hero slot', () => {
    const item = rollUniqueItem({ uniqueId, ilvl: 32 }, { bases: loadItemBases(),
      uniques: loadUniques(), affixes: loadAffixPool() }, createRng(32));
    expect(item).toMatchObject({ baseId, uniqueId, rarity: 'unique', ilvl: 32, equipped: false });
    if (!item) throw new Error('Missing authored charm');
    expect(item.socketCapacity ?? 0).toBe(0); expect(item.socketContents).toBeUndefined();
    expect(item.baseRolls).toEqual({}); expect(item.affixes).toEqual([]); expect(item.statRolls).toEqual({});
    expect(aggregateEquipmentMods({ charm: item })).toEqual({ life: 20, mana: 10 });
    expect(aggregateEquipmentMods({ arbitrary: item })).toEqual({});
  });
  it('has a reusable existing icon for base, bare unique and item context', () => {
    const icon = resolveItemIcon(baseId);
    expect(icon).toBeTruthy(); expect(resolveItemIcon(uniqueId)).toBe(icon);
    expect(resolveItemIcon(uniqueId, { baseId })).toBe(icon);
  });
  it('keeps acquisition out of every treasure class', () => {
    for (const table of loadTreasureClasses().values()) {
      expect(table.picks.some(pick => pick.baseId === baseId || pick.itemId === uniqueId)).toBe(false);
    }
  });
});
