import { beforeAll, describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data';
import { loadQuests } from './quests';
import { loadQuestItems, questItemSource } from './quest-items';
import i18n from '@/i18n';

const questId = 'quests/side-act1-pandemonium-cow-rumor';
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

it('preserves the two Cow objective and recipe identities in a real bounded Dark Wood chain', () => {
  const quest = loadQuests().find(row => row.id === questId);
  expect(quest).toMatchObject({ name: 'Whispers of the Cow King', type: 'side', actId: 'acts/act1', giver: 'npc/akara' });
  expect(quest?.objectives).toEqual([
    { id: 'obj-find-leg', type: 'fetch', itemId: 'quest/wirts_leg', areaId: 'areas/act1-dark-wood',
      targetId: 'objects/wirts_remains', description: "Recover Wirt's Leg from his remains after clearing the Dark Wood on Normal." },
    { id: 'obj-open-portal', type: 'transmute', recipe: 'moo_moo_portal',
      description: "At Akara, transmute Wirt's Leg and the bound portal Tome using the retained Horadric Cube." }
  ]);
  expect(quest?.rewards).toEqual({ xp: 6000, wishstones: 10 });
  expect(quest?.description).toContain('Cow King');
  expect(quest?.description).toContain('Claim');
  expect(quest?.description).not.toMatch(/Secret Cow Level|farm|act1_tristram|secret_cow_level/i);
});

it('loads only two bound portal ingredients with distinct real source identities and one consumer', () => {
  const items = loadQuestItems().filter(row => row.sourceQuestId === questId);
  expect(items).toEqual([
    { id: 'quest/wirts_leg', kind: 'portalIngredient', sourceQuestId: questId, sourceObjectiveId: 'obj-find-leg',
      requiresAreaClear: true, consumeActionId: 'actions/act1-open-cow-portal',
      nameKey: 'inventory:questItems.wirtsLeg.name', descKey: 'inventory:questItems.wirtsLeg.desc' },
    { id: 'quest/cow_portal_tome', kind: 'portalIngredient', sourceQuestId: questId,
      sourceActionId: 'actions/act1-receive-cow-tome', consumeActionId: 'actions/act1-open-cow-portal',
      nameKey: 'inventory:questItems.cowPortalTome.name', descKey: 'inventory:questItems.cowPortalTome.desc' }
  ]);
  expect(items.map(questItemSource)).toEqual([
    `${questId}#objective:obj-find-leg`, `${questId}#action:receive-portal-tome`
  ]);
});

it('authors one level13 boss-and-two-bovine encounter without adding an area or changing ordinary Dark Wood waves', () => {
  expect(subAreas).toHaveLength(29);
  const host = subAreas.find(row => row.id === 'areas/act1-dark-wood');
  expect(host?.actId).toBe('acts/act1');
  expect(host?.questEncounters?.filter(row => row.id === 'act1-dw-cow-king')).toEqual([
    { id: 'act1-dw-cow-king', level: 13, lootTable: 'loot/mini-act1', monsters: [
      { archetypeId: 'monsters/act1.cow-king', count: 1, boss: true },
      { archetypeId: 'monsters/act1.hell-bovine', count: 2 }
    ] }
  ]);
  expect(host?.waves).toHaveLength(5);
});

it('clones every numeric and behavior field of the approved templates under only new Cow names and IDs', () => {
  for (const [id, templateId, name] of [
    ['monsters/act1.hell-bovine', 'monsters/act1.brute', 'monsters.hellBovine'],
    ['monsters/act1.cow-king', 'monsters/act1.treehead-woodfist', 'monsters.cowKing']
  ] as const) {
    const template = monsters.find(row => row.id === templateId);
    expect(template).toBeDefined();
    expect(monsters.filter(row => row.id === id)).toEqual([{ ...template, id, name }]);
  }
});

describe.each(['en', 'zh-CN'] as const)('Cow player copy %s', locale => {
  it('explains explicit ingredients, retained Cube, real one-wave fight and separate Claim', () => {
    expect(i18n.t('questItems.wirtsLeg.name', { ns: 'inventory', lng: locale })).toBe(locale === 'en' ? "Wirt's Leg" : '维特之脚');
    expect(i18n.t('questItems.cowPortalTome.name', { ns: 'inventory', lng: locale })).toBe(locale === 'en' ? 'Bound Portal Tome' : '绑定传送之书');
    expect(i18n.t('cowKing', { ns: 'monsters', lng: locale })).toBe(locale === 'en' ? 'Cow King' : '奶牛王');
    expect(i18n.t('hellBovine', { ns: 'monsters', lng: locale })).toBe(locale === 'en' ? 'Hell Bovine' : '地狱奶牛');
    const description = i18n.t('byId.act1-pandemonium-cow-rumor.desc', { ns: 'quests', lng: locale });
    expect(description).toContain(locale === 'en' ? 'Dark Wood' : '黑暗森林');
    expect(description).toContain(locale === 'en' ? 'Akara' : '阿卡拉');
    expect(description).toContain(locale === 'en' ? 'Horadric Cube' : '赫拉迪克方块');
    expect(description).toContain(locale === 'en' ? '6,000 XP' : '6,000经验值');
    for (const key of ['need-leg', 'need-tome', 'need-cube', 'ready-to-open', 'portal-open', 'victorious', 'claimed']) {
      const text = i18n.t(`cow.stage.${key}`, { ns: 'quests', lng: locale });
      expect(text).not.toBe(`cow.stage.${key}`);
      expect(text).not.toMatch(/quests\/|quest\/|actions\/|undefined/);
    }
    expect(i18n.t('cow.stage.portal-open', { ns: 'quests', lng: locale })).toContain(locale === 'en' ? 'before claiming' : '领取奖励前');
    expect(i18n.t('cow.stage.claimed', { ns: 'quests', lng: locale })).toContain(locale === 'en' ? 'closed' : '关闭');
    expect(i18n.t('cow.retry', { ns: 'quests', lng: locale })).toContain(locale === 'en' ? 'retry' : '重试');
    expect(description).not.toMatch(/Secret Cow Level|秘密奶牛关|farm|可反复/);
  });
});
