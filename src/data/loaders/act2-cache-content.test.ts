import { describe, expect, it } from 'vitest';
import { loadQuests } from './quests';
import { loadQuestItems, questItemSource } from './quest-items';
import enQuests from '@/i18n/locales/en/quests.json';
import zhQuests from '@/i18n/locales/zh-CN/quests.json';
import enInventory from '@/i18n/locales/en/inventory.json';
import zhInventory from '@/i18n/locales/zh-CN/inventory.json';

// Expected authored contracts are independent of the runtime family records.
const caches = [
  { quest: 'quests/side-act2-summoners-secret', slug: 'act2-summoners-secret', giver: 'npc/atma',
    objective: 'obj-find', item: 'quest/horazon_lockbox', itemSlug: 'horazon_lockbox', localeKey: 'horazonLockbox',
    area: 'areas/act2-arcane-sanctuary', target: 'objects/horazon_lockbox_cache', xp: 5000,
    uniqueId: 'items/unique/manald-heal', ilvl: 23, names: { en: 'Manald Heal', 'zh-CN': '玛那之疗' } },
  { quest: 'quests/side-act2-lost-caravan', slug: 'act2-lost-caravan', giver: 'npc/elzix',
    objective: 'obj-find-box', item: 'quest/elzix_strongbox', itemSlug: 'elzix_strongbox', localeKey: 'elzixStrongbox',
    area: 'areas/act2-far-oasis', target: 'objects/elzix_strongbox_cache', xp: 3000,
    uniqueId: 'items/unique/eye-of-etlich', ilvl: 18, names: { en: 'The Eye of Etlich', 'zh-CN': '埃特利希之眼' } }
] as const;
const locales = { en: { quests: enQuests, inventory: enInventory }, 'zh-CN': { quests: zhQuests, inventory: zhInventory } };

describe.each(caches)('$quest retained-cache authored contract', entry => {
  it('uses one real fetch object and only its exact XP/unique Claim, without new gates', () => {
    const matching = loadQuests().filter(row => row.id === entry.quest);
    expect(matching).toHaveLength(1);
    const quest = matching[0];
    expect(quest).toMatchObject({ type: 'side', actId: 'acts/act2', giver: entry.giver });
    const description = quest?.objectives[0]?.description;
    expect(description).toEqual(expect.any(String));
    expect(quest?.objectives).toEqual([{ id: entry.objective, type: 'fetch', itemId: entry.item,
      areaId: entry.area, targetId: entry.target, description }]);
    expect(quest?.rewards).toEqual({ xp: entry.xp, itemDrop: { uniqueId: entry.uniqueId, ilvl: entry.ilvl }, wishstones: 10 });
    expect(quest).not.toHaveProperty('prerequisites');
    expect(quest).not.toHaveProperty('unlocks');
    expect(quest).not.toHaveProperty('objectiveStages');
  });

  it('authors exactly one owned retained tool with its objective source and no Read/consume effect', () => {
    const matching = loadQuestItems().filter(item => item.id === entry.item);
    expect(matching).toHaveLength(1);
    const item = matching[0];
    expect(item).toEqual({ id: entry.item, sourceQuestId: entry.quest, kind: 'tool',
      sourceObjectiveId: entry.objective, nameKey: `inventory:questItems.${entry.localeKey}.name`,
      descKey: `inventory:questItems.${entry.localeKey}.description` });
    if (!item) throw new Error('Missing authored retained-cache tool');
    expect(questItemSource(item)).toBe(`${entry.quest}#objective:${entry.objective}`);
  });

  it.each(['en', 'zh-CN'] as const)('provides named Recover/retention/separate Claim copy in %s', locale => {
    const { quests, inventory } = locales[locale];
    const journal = quests.byId[entry.slug];
    const tool = quests.areaObjects.tools[entry.itemSlug];
    const proof = inventory.questItems[entry.localeKey];
    expect(journal.desc).toContain(entry.names[locale]);
    expect(proof.description).toContain(entry.names[locale]);
    expect(tool.ready).toContain(entry.names[locale]);
    expect(tool.name).toBe(proof.name);
    for (const text of [journal.desc, journal.obj1, tool.ready, tool.owned, tool.unavailable, proof.description]) {
      expect(text).not.toMatch(/areas\/|objects\/|items\/|questItems\.|unique_.*_random|ilvl|undefined/);
    }
    expect(locale === 'en' ? journal.desc.includes('separately in Quests') : journal.desc.includes('任务日志中单独领取')).toBe(true);
    expect(locale === 'en' ? proof.description.includes('stays with you') : proof.description.includes('仍会保留')).toBe(true);
  });
});
