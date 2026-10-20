import { describe, expect, it } from 'vitest';
import { loadQuests } from '../loaders/quests';
import { loadAwardPools } from '../loaders/loot';
import { rollUniqueItem } from '@/engine/loot/rollItem';
import { createRng } from '@/engine/rng';

describe('authored Andariel explicit quest reward', () => {
  it('selects one eligible named unique without a second quest treasure-class award', () => {
    const quest = loadQuests().find(row => row.id === 'quests/act1-sisters-to-the-slaughter');
    expect(quest?.rewards).toEqual({
      xp: 8000, skillPoints: 0,
      itemDrop: { uniqueId: 'items/unique/coif-of-glory', ilvl: 19 }
    });
    expect(quest).toMatchObject({
      type: 'main', actId: 'acts/act1', giver: 'npc/cain', order: 6, unlocks: 'acts/act2',
      objectives: [{ id: 'obj-kill-andariel', type: 'kill-boss',
        targetId: 'monsters/act1.andariel', areaId: 'areas/act1-catacombs' }]
    });
    const item = rollUniqueItem({ uniqueId: 'items/unique/coif-of-glory', ilvl: 19 },
      loadAwardPools(), createRng(7019));
    expect(item).toMatchObject({ uniqueId: 'items/unique/coif-of-glory',
      baseId: 'items/base/helm-skull-cap', rarity: 'unique', ilvl: 19 });
  });
});
