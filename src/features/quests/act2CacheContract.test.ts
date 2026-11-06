import { describe, expect, it } from 'vitest';
import sideDocument from '@/data/quests/side.json';
import itemDocument from '@/data/quests/items.json';
import { ACT2_CACHES } from '@/engine/map/act2-cache-quests';
import { captureAct2CacheAuthority, sameAct2CacheAuthority } from './act2CacheContract';

describe.each(['horazon', 'elzix'] as const)('cache %s authored authority', key => {
  const d = ACT2_CACHES[key];
  function row() {
    const result = sideDocument.quests.find(quest => quest.id === d.quest);
    if (!result) throw new Error('Missing authored cache'); return result;
  }
  it('pins the exact entire quest and retained tool, including displayed fields', () => {
    const before = captureAct2CacheAuthority(key), quest = row(), name = quest.name;
    expect(before.quest.rewards).toEqual({ xp: d.xp, itemDrop: { uniqueId: d.uniqueId, ilvl: d.ilvl }, wishstones: 10 });
    expect(before.item).toMatchObject({ kind: 'tool', sourceQuestId: d.quest, sourceObjectiveId: d.objective });
    try { Reflect.set(quest, 'name', `${name} changed`); expect(sameAct2CacheAuthority(before)).toBe(false); }
    finally { Reflect.set(quest, 'name', name); }
    expect(sameAct2CacheAuthority(before)).toBe(true);
  });
  it.each(['gold-zero', 'gold-positive', 'xp-extra', 'wrong-unique', 'wrong-ilvl', 'profile', 'service', 'extra-drop'] as const)(
    'rejects the entire %s bag rather than publishing a supported subset', fault => {
      const quest = row(), original = quest.rewards;
      const bag: Record<string, unknown> = structuredClone(original);
      if (fault === 'gold-zero' || fault === 'gold-positive') bag.gold = fault === 'gold-zero' ? 0 : 1;
      if (fault === 'xp-extra') bag.xp = d.xp + 1;
      if (fault === 'wrong-unique') bag.itemDrop = { uniqueId: ACT2_CACHES[key === 'horazon' ? 'elzix' : 'horazon'].uniqueId, ilvl: d.ilvl };
      if (fault === 'wrong-ilvl') bag.itemDrop = { uniqueId: d.uniqueId, ilvl: d.ilvl + 1 };
      if (fault === 'profile') bag.itemTableProfile = 'future-profile';
      if (fault === 'service') bag.service = 'future-service';
      if (fault === 'extra-drop') bag.itemDrop = { uniqueId: d.uniqueId, ilvl: d.ilvl, quantity: 2 };
      try { Reflect.set(quest, 'rewards', bag); expect(() => captureAct2CacheAuthority(key)).toThrow(); }
      finally { Reflect.set(quest, 'rewards', original); }
  });
  it.each(['quest', 'rewards', 'objective', 'item'] as const)('rejects a raw %s getter before loader evaluation', field => {
    const quest = row(), tool = itemDocument.items.find(item => item.id === d.itemId);
    if (!tool) throw new Error('Missing retained tool');
    const target = field === 'quest' ? sideDocument.quests : field === 'objective' ? quest.objectives[0] : field === 'item' ? tool : quest;
    const property = field === 'quest' ? String(sideDocument.quests.indexOf(quest)) : field === 'objective' ? 'areaId' : field === 'item' ? 'sourceQuestId' : 'rewards';
    if (!target) throw new Error('Missing objective');
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    if (!descriptor) throw new Error('Missing data descriptor'); let reads = 0;
    try {
      Object.defineProperty(target, property, { configurable: true, enumerable: true, get() { reads++; return descriptor.value as unknown; } });
      expect(() => captureAct2CacheAuthority(key)).toThrow(); expect(reads).toBe(0);
    } finally { Object.defineProperty(target, property, descriptor); }
  });
});
