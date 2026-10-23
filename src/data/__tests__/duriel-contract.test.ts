import { describe, expect, it } from 'vitest';
import quests from '../quests/main.json';
import monsters from '../monsters/act2.json';
import areas from '../maps/sub-areas/act2.json';
import { loadQuests } from '../loaders/quests';
import { loadTreasureClasses } from '../loaders/loot';

const questId = 'quests/act2-seven-tombs';
const cache = { tableId: 'loot/duriel-q', ilvl: 32, picks: 5 };

/** Exercise the real loader, restoring the authored reward descriptor on every path. */
function withLootTable(value: unknown, check: () => void): void {
  const quest = quests.quests.find(row => row.id === questId);
  if (!quest) throw new Error('Missing Seven Tombs quest');
  const descriptor = Object.getOwnPropertyDescriptor(quest, 'rewards');
  if (!descriptor) throw new Error('Missing Seven Tombs rewards');
  try {
    Object.defineProperty(quest, 'rewards', { ...descriptor, value: { xp: 12000, lootTable: value } });
    check();
  } finally { Object.defineProperty(quest, 'rewards', descriptor); }
}

describe('Duriel authored quest contract', () => {
  it('binds the existing ordered objectives to the canonical boss and tomb', () => {
    const quest = loadQuests().find(row => row.id === questId);
    expect(quest?.objectives.map(objective => objective.id)).toEqual(['obj-open-tomb', 'obj-kill-duriel']);
    expect(quest?.objectives[0]).toMatchObject({ type: 'interact', targetId: 'objects/tal_rasha_orifice',
      itemRequired: 'quest/horadric_staff', areaId: 'areas/act2-tomb-of-tal-rasha' });
    expect(quest?.objectives[1]).toMatchObject({ type: 'kill-boss', targetId: 'monsters/act2.duriel',
      areaId: 'areas/act2-tomb-of-tal-rasha' });
    expect(quest).toMatchObject({ giver: 'npc/jerhyn', actId: 'acts/act2', order: 11, unlocks: 'acts/act3' });
    expect(quest?.prerequisites).toBeUndefined();
    expect(monsters.find(monster => monster.id === 'monsters/act2.duriel')).toBeDefined();
    const tomb = areas.find(area => area.id === 'areas/act2-tomb-of-tal-rasha');
    expect(tomb?.bossEncounter?.monsters).toContainEqual({ archetypeId: 'monsters/act2.duriel', count: 1, boss: true });
    expect(tomb?.chapterBoss?.dropTable).toBe('loot/act2-boss');
  });

  it('loads the actual five-pick quest cache without changing the ordinary boss table', () => {
    expect(loadQuests().find(row => row.id === questId)?.rewards).toEqual({ xp: 12000, lootTable: cache });
    const tables = loadTreasureClasses();
    expect(tables.has(cache.tableId)).toBe(true);
    expect(tables.has('loot/act2-boss')).toBe(true);
  });

  it.each([cache, { tableId: 'loot/a.0_-', ilvl: 1, picks: 1 },
    { tableId: 'loot/9', ilvl: 1000, picks: 1000 }, 'loot/duriel-q'])(
    'accepts explicit cache parameters and preserved legacy syntax: %j', reward => {
      withLootTable(reward, () => {
        expect(loadQuests().find(row => row.id === questId)?.rewards?.lootTable).toEqual(reward);
      });
    });

  it.each([
    null, [], true, 1, {}, { tableId: cache.tableId },
    { ilvl: 32, picks: 5 }, { tableId: cache.tableId, picks: 5 }, { tableId: cache.tableId, ilvl: 32 },
    { ...cache, tableId: '' }, { ...cache, tableId: 'loot/' }, { ...cache, tableId: 'loot/-bad' },
    { ...cache, tableId: 'loot/Duriel-q' }, { ...cache, tableId: 'loot/a/b' },
    { ...cache, tableId: '../loot/duriel-q' }, { ...cache, tableId: 'items/duriel-q' },
    { ...cache, tableId: 1 }, { ...cache, ilvl: 0 }, { ...cache, ilvl: -1 },
    { ...cache, ilvl: 1.5 }, { ...cache, ilvl: '32' }, { ...cache, ilvl: null },
    { ...cache, picks: 0 }, { ...cache, picks: -1 }, { ...cache, picks: 1.5 },
    { ...cache, picks: '5' }, { ...cache, picks: null }, { ...cache, extra: true },
    { ...cache, uniqueId: 'items/unique/coif-of-glory' }
  ])('rejects malformed cache data at the real loader boundary: %j', reward => {
    withLootTable(reward, () => { expect(() => loadQuests()).toThrow('quests/main.json'); });
  });
});
