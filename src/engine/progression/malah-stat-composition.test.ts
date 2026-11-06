import { describe, expect, it } from 'vitest';
import { composeEquippedPlayerStats, deriveEquippedPlayerStats, preparePlayerStatComposition } from './equipped-stats';
import { deriveStats } from './stats';
import type { QuestItemLedger, QuestProgressData } from '../types/save';

const QUEST = 'quests/side-act5-malahs-elixir';
const sources = Array.from({ length: 5 }, (_, i) => `${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`);
const domain = { key: 'malah' as const, quest: QUEST, objective: 'obj-collect',
  objectiveType: 'collect' as const, itemId: 'quest/frost_lichen', sink: 'claim' as const, sources };
const authority = { countedSources: [domain] };
const row: QuestProgressData = { id: QUEST, status: 'completed', rewardClaimed: true,
  objectives: { 'obj-collect': true } };
const ledger: QuestItemLedger = Object.fromEntries(sources.map(source =>
  [source, { itemId: domain.itemId, state: 'consumed' as const }]));
function hero(vitality: number) {
  const coreStats = { strength: 10, dexterity: 25, vitality, energy: 63 };
  return { coreStats, derivedStats: { ...deriveStats(coreStats, 13), life: 13, mana: 17 } };
}

describe('Malah shared post-soft-cap hero stat composition', () => {
  it.each([[199,199],[200,200],[499,349.5],[500,350]])(
    'adds ten after the ordinary soft cap at raw %s', (raw, ordinaryContribution) => {
      const owner = hero(raw), before = structuredClone(owner);
      const result = composeEquippedPlayerStats(owner, 13, {}, { [QUEST]: row }, ledger, {}, authority);
      expect(result.vitality).toEqual({ raw, equipment: 0, ordinarySheet: raw,
        ordinaryContribution, elixir: 10, sheet: raw + 10, formula: ordinaryContribution + 10 });
      expect(result.derivedStats.lifeMax).toBe(deriveStats(owner.coreStats, 13).lifeMax + 20);
      expect(result.derivedStats.life).toBe(13); expect(result.derivedStats.mana).toBe(17);
      expect(owner).toEqual(before);
      expect(deriveEquippedPlayerStats(owner, 13, {}, { [QUEST]: row }, ledger, {}, authority)).toEqual(result.derivedStats);
      expect(composeEquippedPlayerStats({ ...owner, derivedStats: result.derivedStats }, 13, {},
        { [QUEST]: row }, ledger, {}, authority)).toEqual(result);
    });

  it('caps ordinary equipment, composes flat Life then Golden Bird then Life percent, and never heals', () => {
    const owner = hero(500), progress = { [QUEST]: row,
      'quests/act3-golden-bird': { id: 'quests/act3-golden-bird', status: 'completed' as const,
        rewardClaimed: true, objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } } };
    const items: QuestItemLedger = { ...ledger,
      'quests/act3-golden-bird#objective:obj-find-figurine': { itemId: 'quest/jade_figurine', state: 'consumed' },
      'quests/act3-golden-bird#objective:obj-give-cain': { itemId: 'quest/golden_bird', state: 'consumed' },
      'quests/act3-golden-bird#reward:questItem': { itemId: 'items/potion_of_life_q', state: 'consumed' } };
    const result = preparePlayerStatComposition(owner, 13, progress, items, {}, authority)(
      { vitality: 20, life: 31, lifePct: .3 });
    expect(result.vitality).toEqual({ raw: 500, equipment: 20, ordinarySheet: 500,
      ordinaryContribution: 350, elixir: 10, sheet: 510, formula: 360 });
    expect(result.derivedStats.lifeMax).toBe((100 + 12 * 8 + 360 * 2 + 31 + 20) * 1.3);
    expect(result.derivedStats.life).toBe(13); expect(result.derivedStats.mana).toBe(17);
    const ordinary = preparePlayerStatComposition(owner, 13, progress, items, {}, {})(
      { vitality: 20, life: 31, lifePct: .3 });
    expect(result.derivedStats.lifeMax - ordinary.derivedStats.lifeMax).toBeCloseTo(26);
  });

  it('uses explicit historical absence without granting from source-free claimed flags', () => {
    const owner = hero(200);
    for (const context of [{}, { countedSources: [] }]) {
      const result = composeEquippedPlayerStats(owner, 13, {}, { [QUEST]: row }, ledger, {}, context);
      expect(result.vitality.elixir).toBe(0); expect(result.derivedStats).toEqual(owner.derivedStats);
    }
    expect(composeEquippedPlayerStats(owner, 13, {}, { [QUEST]: row }, {}, {}, authority).vitality.elixir).toBe(0);
  });

  it('pins scalar player and quest entitlements once for a prepared comparison', () => {
    const owner = hero(199), progress = structuredClone({ [QUEST]: row }), items = structuredClone(ledger);
    const compose = preparePlayerStatComposition(owner, 13, progress, items, {}, authority);
    owner.coreStats.vitality = 500;
    owner.derivedStats = { ...owner.derivedStats, life: 9999, mana: 9999 };
    Reflect.set(progress[QUEST], 'rewardClaimed', false);
    const source = sources[0]; if (!source) throw new Error('Missing fixture source');
    Reflect.deleteProperty(items, source);
    const result = compose({});
    expect(result.vitality).toMatchObject({ raw: 199, elixir: 10, sheet: 209, formula: 209 });
    expect(result.derivedStats.life).toBe(13); expect(result.derivedStats.mana).toBe(17);
  });

  it('clamps excess saved pools and rejects unsafe participating Life arithmetic', () => {
    const owner = hero(500);
    owner.derivedStats = { ...owner.derivedStats, life: 99999, mana: 99999 };
    const compose = preparePlayerStatComposition(owner, 13, { [QUEST]: row }, ledger, {}, authority);
    const result = compose({});
    expect(result.derivedStats.life).toBe(result.derivedStats.lifeMax);
    expect(result.derivedStats.mana).toBe(result.derivedStats.manaMax);
    expect(() => compose({ life: Number.MAX_SAFE_INTEGER })).toThrow(/Vitality|Life/);
    expect(() => compose({ lifePct: Number.MAX_SAFE_INTEGER })).toThrow(/Vitality|Life/);
  });
});
