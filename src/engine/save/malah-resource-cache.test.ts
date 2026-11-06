import { describe, expect, it } from 'vitest';
import { buildSave } from './serialize';
import { repairMalahResourceCache } from './equipment-rate-cache';
import { deriveStats } from '../progression/stats';
import type { QuestItemLedger } from '../types/save';

const QUEST = 'quests/side-act5-malahs-elixir';
const domain = { key: 'malah' as const, quest: QUEST, objective: 'obj-collect',
  objectiveType: 'collect' as const, itemId: 'quest/frost_lichen', sink: 'claim' as const,
  sources: Array.from({ length: 5 }, (_, i) => `${QUEST}#objective:obj-collect:source:lichen-${String(i + 1)}`) };
const authority = { countedSources: [domain] };
function save(life = 13) {
  const coreStats = { strength: 10, dexterity: 25, vitality: 500, energy: 63 };
  const bare = buildSave({ timestamp: 1000, player: { id: 'hero', name: 'Hero', type: 'player', team: 'player',
    class: 'sorceress', level: 13, coreStats, derivedStats: { ...deriveStats(coreStats, 13),
      life, mana: 17, lifeMax: 900, attack: 777 }, statusEffects: [], cooldowns: [], skills: [], comboOrder: [],
    alive: true, turnOrder: 0, experience: 0, experienceToNextLevel: 1, statPoints: 7, skillPoints: 0, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { runeShards: 99, gold: 80, opaque: 71 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'zh-CN', stealthMode: false, soundEnabled: true, musicEnabled: true,
      combatSpeed: 1, autoCombat: true }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 },
    gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  const questItems: QuestItemLedger = Object.fromEntries(domain.sources.map(source =>
    [source, { itemId: domain.itemId, state: 'consumed' as const }]));
  return { ...bare, inventory: { ...bare.inventory, questItems }, map: { ...bare.map,
    questProgress: { [QUEST]: { id: QUEST, status: 'completed' as const, rewardClaimed: true,
      objectives: { 'obj-collect': true } } } } };
}

describe('qualified current Malah Life cache repair', () => {
  it('repairs only Life capacity without healing or changing source/raw/wallet/other cache data', () => {
    const input = save(), before = structuredClone(input);
    const output = repairMalahResourceCache(input, authority);
    expect(output).toEqual({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, lifeMax: 916 } } });
    expect(input).toEqual(before);
    expect(output.inventory).toBe(input.inventory); expect(output.map).toBe(input.map);
    expect(repairMalahResourceCache(output, authority)).toBe(output);
  });

  it('clamps excess Life downward and preserves actual Mana', () => {
    const output = repairMalahResourceCache(save(9999), authority);
    expect(output.player.derivedStats).toMatchObject({ life: 916, lifeMax: 916, mana: 17 });
  });

  it('preserves explicit historical absence and source-free legacy/partial/unclaimed data exactly', () => {
    const input = save();
    expect(repairMalahResourceCache(input, {})).toBe(input);
    expect(repairMalahResourceCache(input, { countedSources: [] })).toBe(input);
    const legacy = { ...input, inventory: { ...input.inventory, questItems: {} } };
    expect(repairMalahResourceCache(legacy, authority)).toBe(legacy);
    const source = domain.sources[0]; if (!source) throw new Error('Missing fixture source');
    const entry = input.inventory.questItems[source]; if (!entry) throw new Error('Missing fixture entry');
    const partial = { ...input, inventory: { ...input.inventory, questItems: { [source]: entry } } };
    expect(repairMalahResourceCache(partial, authority)).toBe(partial);
    const unclaimed = { ...input, map: { ...input.map, questProgress: { [QUEST]: {
      ...input.map.questProgress[QUEST], rewardClaimed: false } } } };
    expect(repairMalahResourceCache(unclaimed, authority)).toBe(unclaimed);
  });
});
