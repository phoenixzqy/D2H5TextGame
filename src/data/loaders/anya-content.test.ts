import { beforeAll, describe, expect, it } from 'vitest';
import dialogue from '@/data/dialogue/act5/anya.json';
import catalog from '@/data/vendors/anya-uniques-v1.json';
import i18n from '@/i18n';
import { loadQuests } from './quests';

const questId = 'quests/side-act5-anyas-gift';
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});

it('authors the exact two finite ilvl66 uniques and fixed material prices, without random stock', () => {
  expect(catalog).toEqual({ id: 'vendors/anya_uniques', version: 1, entries: [
    { id: 'frostburn-gauntlet', uniqueId: 'items/unique/frostburn-gauntlet', ilvl: 66, stock: 1,
      costs: { materials: { 'materials/scrap': 40 }, currencies: { 'rune-shard': 2000 } } },
    { id: 'waterwalk', uniqueId: 'items/unique/waterwalk', ilvl: 66, stock: 1,
      costs: { materials: { 'materials/scrap': 40 }, currencies: { 'rune-shard': 2000 } } }
  ] });
});

it('preserves the whole Anya identity and reward bag while explaining separate direct protection and trades', () => {
  const rows = loadQuests().filter(row => row.id === questId); expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ name: "Anya's Gift", type: 'side', actId: 'acts/act5', giver: 'npc/anya',
    prerequisites: ['quests/act5-prison-of-ice'],
    rewards: { stat: { all_resist: 10 }, service: 'personalize_item', vendorUnlock: 'vendors/anya_uniques', wishstones: 10 },
    objectives: [{ id: 'obj-talk', type: 'talk', npcId: 'npc/anya', description: 'Speak with Anya in Harrogath after completing Prison of Ice and actually thawing her.' }] });
  expect(rows[0]?.description).toContain('+10'); expect(rows[0]?.description).toContain('Claim');
  expect(rows[0]?.description).toContain('40'); expect(rows[0]?.description).toContain('2000');
  expect(rows[0]?.description).not.toContain('scroll');
});

describe.each(['en', 'zh-CN'])('Anya content copy %s', locale => {
  it('resolves truthful source, separate rewards, stock, price, required level and confirmation text', () => {
    for (const leaf of ['name', 'desc', 'obj1']) {
      const key = `byId.act5-anyas-gift.${leaf}`;
      expect(i18n.exists(key, { ns: 'quests', lng: locale })).toBe(true);
      expect(i18n.t(key, { ns: 'quests', lng: locale })).not.toMatch(/byId\.|quests\/|undefined/);
    }
    expect(i18n.t('byId.act5-anyas-gift.desc', { ns: 'quests', lng: locale })).toContain('+10');
    for (const leaf of ['title', 'description', 'locked', 'price', 'owned', 'stock', 'requiredLevel', 'ready', 'soldOut',
      'insufficientMaterials', 'insufficientCurrency', 'backpackFull', 'unavailable', 'trade', 'confirmTitle', 'confirmation',
      'cancel', 'confirm', 'success', 'failed', 'staleSelection']) {
      const key = `anyaTrades.${leaf}`;
      expect(i18n.exists(key, { ns: 'town', lng: locale })).toBe(true);
      expect(i18n.t(key, { ns: 'town', lng: locale, name: 'Named gear', scrap: 40, shards: 2000, count: 1, level: 49 })).not.toMatch(/anyaTrades\.|undefined/);
    }
  });
});

it('keeps existing Anya dialogue identity, empty services and keyed English greeting with distinct scroll instructions', () => {
  expect(dialogue.id).toBe('dialogue/act5/anya'); expect(dialogue.npcId).toBe('anya'); expect(dialogue.services).toEqual([]);
  expect(dialogue.greetings).toHaveLength(1); expect(dialogue.greetings[0]?.textKey).toBe('town:dialogue.greetings.act5.anya');
  expect(dialogue.greetings[0]?.text).toContain('Scroll of Resistance');
  expect(dialogue.greetings[0]?.text).toContain('read in Inventory');
  expect(dialogue.greetings[0]?.text).toContain('direct +10');
  expect(dialogue.greetings[0]?.text).toContain('40 scrap');
});
