import { beforeAll, describe, expect, it } from 'vitest';
import { dialogues } from '@/data';
import { validateGameData } from '@/data/loader';
import dialogueSchema from '@/data/schema/dialogue.schema.json';
import type { DialogueDoc } from './dialogue';
import { loadQuests } from './quests';
import { loadTownNpcs } from './towns';
import i18n from '@/i18n';
import enTown from '@/i18n/locales/en/town.json';
import zhTown from '@/i18n/locales/zh-CN/town.json';

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

it('preserves Fara Talk and Radament prerequisite with exactly one catalyst and no XP/service', () => {
  const rows = loadQuests().filter(row => row.id === 'quests/side-act2-fara-favored');
  expect(rows).toHaveLength(1);
  const quest = rows[0];
  expect(quest).toMatchObject({ name: "Fara's Favor", type: 'side', actId: 'acts/act2', giver: 'npc/fara',
    prerequisites: ['quests/act2-radaments-lair'] });
  expect(quest?.objectives).toEqual([{ id: 'obj-talk', type: 'talk', npcId: 'npc/fara', description: 'Speak with Fara.' }]);
  expect(quest?.rewards).toEqual({ gemShards: 1, wishstones: 10 });
  expect(quest).not.toHaveProperty('unlocks');
  expect(quest).not.toHaveProperty('objectiveStages');
  expect(quest?.description).not.toMatch(/repair|discount|sewer/i);
});

it('loads one real matching schema-valid Fara dialogue into the actual Act II town roster', () => {
  const matching = dialogues.filter(doc => doc.id === 'dialogue/act2/fara');
  expect(matching).toHaveLength(1);
  const doc = validateGameData<DialogueDoc>(dialogueSchema.$id, matching[0]);
  expect(doc.npcId).toBe('fara');
  expect(doc.services).toEqual([]);
  expect(doc.greetings.length).toBeGreaterThan(0);
  for (const greeting of doc.greetings) {
    expect(greeting.textKey).toBe('town:dialogue.greetings.act2.fara');
    expect(greeting.text).toEqual(expect.any(String));
    expect(greeting.text).toContain('Radament');
    expect(greeting.text).toMatch(/separately.*Quests/);
    expect(greeting.text).toContain('3 matching gems');
    expect(greeting.text).not.toMatch(/repair|discount|sewer/i);
  }
  expect(loadTownNpcs(2).filter(npc => npc.id === 'npc/fara')).toEqual([
    { id: 'npc/fara', portraitId: 'fara', nameKey: 'town.npc.fara' }
  ]);
  expect(loadTownNpcs(1).some(npc => npc.id === 'npc/fara')).toBe(false);
});

describe.each(['en', 'zh-CN'] as const)('Fara authored player copy %s', locale => {
  it('uses the flat NPC key and explains real Talk, separate one-shard Claim and supplied gem costs', () => {
    const town = locale === 'en' ? enTown : zhTown;
    expect(Object.hasOwn(town, 'town.npc.fara')).toBe(true);
    expect(i18n.t('town.npc.fara', { ns: 'town', lng: locale })).toBe(locale === 'en' ? 'Fara' : '法拉');
    const greeting = i18n.t('dialogue.greetings.act2.fara', { ns: 'town', lng: locale });
    const description = i18n.t('byId.act2-fara-favored.desc', { ns: 'quests', lng: locale });
    const objective = i18n.t('byId.act2-fara-favored.obj1', { ns: 'quests', lng: locale });
    expect(i18n.t('byId.act2-fara-favored.name', { ns: 'quests', lng: locale })).toBe(locale === 'en' ? "Fara's Favor" : '法拉的恩惠');
    for (const text of [greeting, description]) {
      expect(text).toContain(locale === 'en' ? 'Radament' : '拉达门特');
      expect(text).toContain(locale === 'en' ? '1 gem-shard' : '1 枚宝石碎片');
      expect(text).toContain(locale === 'en' ? 'separately in Quests' : '任务日志中单独领取');
      expect(text).toContain(locale === 'en' ? '3 matching gems' : '3 颗同种同品质宝石');
      expect(text).not.toMatch(/repair|discount|sewer|修理|折扣|下水道|town\.npc|dialogue\.|gemShards|undefined/i);
    }
    expect(objective).toBe(locale === 'en' ? 'Speak with Fara.' : '与法拉交谈。');
  });
});
