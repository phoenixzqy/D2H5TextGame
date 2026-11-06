/** Permanent literal29 controls. The pre-widening equality proof is retained in the shared task packet. */
import { describe, expect, it } from 'vitest';
import { FROZEN_V28 } from './frozen-v28';
import { FROZEN_V29, FROZEN_V29_ITEM_BASES } from './frozen-v29';

describe('accepted literal29 authority', () => {
  it('captures only the accepted Nihlathak delta and excludes future enlistment authority', () => {
    expect(FROZEN_V29.nihlathak).toEqual({ quest: 'quests/side-act5-nihlathaks-treasure', objective: 'obj-fetch',
      source: 'quests/side-act5-nihlathaks-treasure#objective:obj-fetch', itemId: 'quest/nihlathak_relic',
      prerequisite: 'quests/act5-prison-of-ice' });
    const quest = FROZEN_V29.quests.find(row => row.id === FROZEN_V29.nihlathak?.quest);
    expect(quest?.objectives).toEqual([{ id: 'obj-fetch', type: 'fetch', itemId: 'quest/nihlathak_relic',
      areaId: 'areas/act5-crystalline-passage', targetId: 'objects/nihlathak_relic_cache',
      description: "Recover Nihlathak's relic." }]);
    expect(quest?.rewards).toEqual({ xp: 12000, itemDrop: { uniqueId: 'items/unique/mara-kaleidoscope', ilvl: 82 } });
    expect(FROZEN_V29.items.at(-1)).toEqual({ id: 'quest/nihlathak_relic', sourceQuestId: 'quests/side-act5-nihlathaks-treasure',
      kind: 'tool', sourceObjectiveId: 'obj-fetch', nameKey: 'inventory:questItems.nihlathakRelic.name',
      descKey: 'inventory:questItems.nihlathakRelic.description' });
    expect(FROZEN_V29.townEnlistments).toBeUndefined();
  });
  it('retains all predecessor authorities and bases except the exact Nihlathak quest and tool', () => {
    expect(FROZEN_V29.quests.filter(row => row.id !== FROZEN_V29.nihlathak?.quest))
      .toEqual(FROZEN_V28.quests.filter(row => row.id !== FROZEN_V29.nihlathak?.quest));
    expect(FROZEN_V29.items.slice(0, -1)).toEqual(FROZEN_V28.items);
    for (const key of ['actions', 'victories', 'act5', 'act1', 'council', 'ormus', 'larzuk', 'warband', 'drognan',
      'serviceSources', 'servicePrerequisites', 'selectedDifficulties', 'nightmareAreaIds', 'achievementTitleId',
      'hellforgeQuestId', 'hephastoProof', 'campaignTitleId', 'nightmareUnlockId', 'challengeOrdinalLimit', 'auraIds'] as const) {
      expect(FROZEN_V29[key]).toEqual(FROZEN_V28[key]);
    }
    expect(FROZEN_V29_ITEM_BASES.has('items/base/small-charm')).toBe(true);
    expect(FROZEN_V29_ITEM_BASES.has('items/base/wp1h-short-sword')).toBe(true);
  });
  it('deeply freezes the new captured Nihlathak data', () => {
    const quest = FROZEN_V29.quests.find(row => row.id === FROZEN_V29.nihlathak?.quest);
    expect(Object.isFrozen(FROZEN_V29)).toBe(true);
    expect(Object.isFrozen(FROZEN_V29.nihlathak)).toBe(true);
    expect(Object.isFrozen(quest)).toBe(true);
    expect(Object.isFrozen(quest?.objectives)).toBe(true);
    expect(Object.isFrozen(quest?.objectives[0])).toBe(true);
    expect(Object.isFrozen(quest?.rewards?.itemDrop)).toBe(true);
    expect(Object.isFrozen(FROZEN_V29.items.at(-1))).toBe(true);
  });
});
