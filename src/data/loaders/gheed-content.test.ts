import { beforeAll, describe, expect, it } from 'vitest';
import { dialogues } from '@/data';
import { validateGameData } from '@/data/loader';
import dialogueSchema from '@/data/schema/dialogue.schema.json';
import type { DialogueDoc } from './dialogue';
import { loadQuests } from './quests';
import { loadCountedQuestItems } from './counted-quest-items';
import { loadTownNpcs } from './towns';
import i18n from '@/i18n';

const questId = 'quests/side-act1-gheeds-gamble';
const sources = Array.from({ length: 5 }, (_, i) => `${questId}#objective:obj-gamble-5:source:lot-${String(i + 1)}`);
const placements = sources.map((source, i) => ({ source, targetId: `objects/gheed_salvage_lot_${String(i + 1)}` }));
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

it('preserves Gheed identities with exactly five physical finds and the XP/shard payment', () => {
  const rows = loadQuests().filter(row => row.id === questId);
  expect(rows).toHaveLength(1);
  const quest = rows[0];
  expect(quest).toMatchObject({ name: "Gheed's Salvage Deal", type: 'side', actId: 'acts/act1', giver: 'npc/gheed' });
  expect(quest?.objectives).toEqual([{ id: 'obj-gamble-5', type: 'collect', itemId: 'quest/gheed_salvage_lot',
    areaId: 'areas/act1-cold-plains', count: 5, description: 'Recover 5 distinct Gheed salvage lots in the Cold Plains on Normal.' }]);
  expect(quest?.rewards).toEqual({ xp: 1000, gemShards: 1, wishstones: 10 });
  for (const key of ['prerequisites', 'objectiveStages', 'unlocks']) expect(quest).not.toHaveProperty(key);
  expect(quest?.description).not.toMatch(/gold|gambl|magic|hire/i);
});

it('loads the exact five-source finite tuple without adding a vendor or gear definition', () => {
  const definition = loadCountedQuestItems().find(row => row.quest === questId);
  expect(definition).toEqual({ key: 'gheed', quest: questId, objective: 'obj-gamble-5', objectiveType: 'collect',
    itemId: 'quest/gheed_salvage_lot', sink: 'claim', actId: 'acts/act1', areaId: 'areas/act1-cold-plains',
    npc: 'npc/gheed', nameKey: 'inventory:questItems.counted.gheed.name', descKey: 'inventory:questItems.counted.gheed.desc',
    placements, sources });
});

it('keeps Gheed in the real town roster with a truthful schema-valid conversation and no obsolete services', () => {
  const docs = dialogues.filter(doc => doc.id === 'dialogue/act1/gheed');
  expect(docs).toHaveLength(1);
  const doc = validateGameData<DialogueDoc>(dialogueSchema.$id, docs[0]);
  expect(doc.npcId).toBe('gheed');
  expect(doc.services).toEqual([]);
  expect(doc.questBranches).toEqual([]);
  expect(doc.greetings).toEqual([{ text: 'Gheed, at your service. I see value where others see scraps. Recover my five marked lots in the Cold Plains, then Claim your payment in Quests.' }]);
  expect(loadTownNpcs(1).filter(npc => npc.id === 'npc/gheed')).toEqual([
    { id: 'npc/gheed', portraitId: 'gheed', nameKey: 'town.npc.gheed' }
  ]);
});

describe.each(['en', 'zh-CN'] as const)('Gheed authored copy %s', locale => {
  it('resolves actual title, source, reward and greeting leaves without purchase promises', () => {
    expect(i18n.t('byId.act1-gheeds-gamble.name', { ns: 'quests', lng: locale })).toBe(locale === 'en' ? "Gheed's Salvage Deal" : '基德的寻宝交易');
    expect(i18n.t('town.npc.gheed', { ns: 'town', lng: locale })).toBe(locale === 'en' ? 'Gheed' : '基德');
    expect(i18n.t('questItems.counted.gheed.name', { ns: 'inventory', lng: locale })).toBe(locale === 'en' ? "Gheed's Salvage Lot" : '基德的遗货');
    expect(i18n.t('byId.act1-gheeds-gamble.obj1', { ns: 'quests', lng: locale })).toBe(locale === 'en'
      ? 'Recover 5 distinct Gheed salvage lots in the Cold Plains on Normal.' : '在普通难度的冰冷之原取回5包不同的基德遗货。');
    const description = i18n.t('byId.act1-gheeds-gamble.desc', { ns: 'quests', lng: locale });
    expect(description).toContain(locale === 'en' ? '1,000 XP and 1 Gem Shard' : '1,000经验值与1枚宝石碎片');
    const itemDescription = i18n.t('questItems.counted.gheed.desc', { ns: 'inventory', lng: locale });
    expect(itemDescription).toContain(locale === 'en' ? 'Recovering a lot grants no immediate reward.' : '取回遗货不会立即发放奖励。');
    const greeting = i18n.t('dialogue.greetings.gheed', { ns: 'town', lng: locale });
    for (const text of [description, itemDescription, greeting]) {
      expect(text).toContain(locale === 'en' ? 'Cold Plains' : '冰冷之原');
      expect(text).toContain(locale === 'en' ? 'Quests' : '任务界面');
      expect(text).not.toMatch(/gold|gambl|hire|potion|金币|赌博|雇佣|药水|吉德|questItems\.|dialogue\.|undefined/i);
    }
  });
});
