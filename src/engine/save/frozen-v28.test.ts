/** Constructed authority controls; freeze28-equality-green.log captures pre-live29 equality. */
import { describe, expect, it, vi } from 'vitest';
import { FROZEN_V27, FROZEN_V27_ITEM_BASES } from './frozen-v27';
import { FROZEN_V28, FROZEN_V28_ITEM_BASES } from './frozen-v28';

// Installed before frozen28 imports: even module-load capture of live authority is forbidden.
vi.mock('@/data/loaders/loot', () => { throw new Error('Literal28 must not read future item bases'); });
vi.mock('@/data/loaders/quests', () => { throw new Error('Literal28 must not read future quests'); });
vi.mock('@/data/loaders/quest-items', () => { throw new Error('Literal28 must not read future quest items'); });
vi.mock('@/data/loaders/quest-actions', () => { throw new Error('Literal28 must not read future quest actions'); });
vi.mock('@/data/loaders/act5-runtime', () => { throw new Error('Literal28 must not read future Act V runtime'); });
vi.mock('../map/drognan-quest', () => { throw new Error('Literal28 must not read future Drognan identities'); });

const tomeQuest = 'quests/side-act2-drognan-tome';
const tome = { id: 'quest/sun_cult_tome', sourceQuestId: tomeQuest, kind: 'tool',
  sourceObjectiveId: 'obj-fetch', nameKey: 'inventory:questItems.sunCultTome.name',
  descKey: 'inventory:questItems.sunCultTome.description' };
const objective = { id: 'obj-fetch', type: 'fetch', itemId: 'quest/sun_cult_tome',
  areaId: 'areas/act2-lost-city', targetId: 'objects/sun_cult_tome_cache', description: 'Find the Sun-Cult Tome.' };

describe('literal28 frozen authority', () => {
  it('captures only the literal accepted Drognan quest, item and physical graph delta', () => {
    expect(FROZEN_V28.quests.find(row => row.id === tomeQuest)).toEqual({
      ...FROZEN_V27.quests.find(row => row.id === tomeQuest),
      description: 'Recover the Sun-Cult Tome in the Lost City. Drognan will share its arcane knowledge; claim XP and a skill point separately in Quests.',
      objectives: [objective] });
    expect(FROZEN_V28.items).toEqual([...FROZEN_V27.items, tome]);
    expect(FROZEN_V28.drognan).toEqual({ quest: tomeQuest, objective: 'obj-fetch',
      source: 'quests/side-act2-drognan-tome#objective:obj-fetch', itemId: 'quest/sun_cult_tome' });
    expect(FROZEN_V28.quests.filter(row => row.id !== tomeQuest))
      .toEqual(FROZEN_V27.quests.filter(row => row.id !== tomeQuest));
    const { quests: _quests28, items: _items28, drognan: _drognan28, ...rest28 } = FROZEN_V28;
    const { quests: _quests27, items: _items27, ...rest27 } = FROZEN_V27;
    expect(rest28).toEqual(rest27);
    expect(FROZEN_V28_ITEM_BASES).toBe(FROZEN_V27_ITEM_BASES);
  });
  it('retains the still-unsupported historical Nihlathak definition and no relic source', () => {
    expect(FROZEN_V28.quests.find(row => row.id === 'quests/side-act5-nihlathaks-treasure')).toEqual({
      id: 'quests/side-act5-nihlathaks-treasure', name: "Nihlathak's Treasure", type: 'side', actId: 'acts/act5',
      giver: 'npc/cain', description: 'Cain suspects Nihlathak hid a relic in the Pit of Acheron deep within the Halls of Anguish. Recover it.',
      objectives: [{ id: 'obj-fetch', type: 'fetch', itemId: 'quest/nihlathak_relic',
        areaId: 'areas/act5_halls_of_anguish', description: "Recover Nihlathak's relic." }],
      rewards: { xp: 12000, itemDrop: 'items/unique_amulet_endgame_q' } });
    expect(FROZEN_V28.items.some(row => row.id === 'quest/nihlathak_relic')).toBe(false);
    expect(Object.hasOwn(FROZEN_V28, 'nihlathak')).toBe(false);
  });
  it('leaves literal27 before the Drognan physical source', () => {
    expect(FROZEN_V27.drognan).toBeUndefined();
    expect(FROZEN_V27.items.some(row => row.id === tome.id)).toBe(false);
    expect(FROZEN_V27.quests.find(row => row.id === tomeQuest)?.objectives).toEqual([
      { id: 'obj-fetch', type: 'fetch', itemId: 'quest/sun_cult_tome', areaId: 'areas/act2_lost_city',
        description: 'Find the Sun-Cult Tome.' }]);
  });
  it('deeply freezes the new quest, catalog and source authority', () => {
    const quest = FROZEN_V28.quests.find(row => row.id === tomeQuest);
    for (const value of [FROZEN_V28, FROZEN_V28.quests, quest, quest?.objectives, quest?.objectives[0],
      quest?.rewards, FROZEN_V28.items, FROZEN_V28.items.find(row => row.id === tome.id), FROZEN_V28.drognan]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(FROZEN_V28.drognan ?? {}, 'source', 'future-source')).toBe(false);
    expect(FROZEN_V28.drognan?.source).toBe('quests/side-act2-drognan-tome#objective:obj-fetch');
  });
});
