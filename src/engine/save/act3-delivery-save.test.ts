import { describe, expect, it } from 'vitest';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';
import { deriveStats } from '../progression/stats';

const questId = 'quests/act3-lam-esens-tome';
const source = `${questId}#objective:obj-find-tome`;
function sample(state: 'owned' | 'consumed' = 'owned') {
  const coreStats = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
  return buildSave({ timestamp: 1000,
    player: { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
      level: 1, coreStats, derivedStats: deriveStats(coreStats, 1), statusEffects: [], cooldowns: [], skills: [],
      comboOrder: [], alive: true, turnOrder: 0, experience: 0, experienceToNextLevel: 100,
      statPoints: 3, skillPoints: 7, equipment: [] },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 42 },
      questItems: { [source]: { itemId: 'quest/lam_esens_tome', state } } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 3, currentSubAreaId: 'areas/act3-kurast-bazaar', discoveredAreas: [], clearedSubAreas: [],
      questProgress: { [questId]: { id: questId, status: state === 'consumed' ? 'completed' : 'inProgress',
        objectives: { 'obj-find-tome': true, 'obj-deliver': state === 'consumed' }, rewardClaimed: false } } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  });
}

describe('v15 actual delivery receipts and frozen v14 boundary', () => {
  it.each(['owned', 'consumed'] as const)('roundtrips the exact %s source with no points or XP granted', state => {
    const input = sample(state);
    expect(input.version).toBe(15);
    expect(decodeSave(input)).toEqual(input);
    expect(decodeSave(toJsonSafe(input))).toEqual(input);
  });

  it('rejects a consumed item with no hand-in and an item without its own recovery flag', () => {
    const input = sample('consumed');
    const objectives = { 'obj-find-tome': true, 'obj-deliver': false };
    const malformed = { ...input, map: { ...input.map, questProgress: { [questId]: {
      id: questId, status: 'inProgress', rewardClaimed: false, objectives } } } };
    expect(() => decodeSave(malformed)).toThrow(/hand-in/);
    objectives['obj-find-tome'] = false;
    expect(() => decodeSave(malformed)).toThrow(/objective source/);
  });

  it('adds only empty action receipts after frozen14 and preserves legacy quest history without items', () => {
    const latest = sample('consumed');
    const { questReceipts: _receipts, ...map } = latest.map;
    const input = { ...latest, version: 14, inventory: { ...latest.inventory, questItems: {} }, map };
    const before = structuredClone(input);
    expect(decodeSave(input)).toEqual({ ...input, version: 15, map: { ...map, questReceipts: {} } });
    expect(input).toEqual(before);
    expect(() => decodeSave({ ...input, inventory: latest.inventory })).toThrow(/v14/);
    expect(() => decodeSave({ ...input, map: { ...map, questReceipts: {} } })).toThrow(/historical map/);
  });

  it.each([undefined, null, new Map(), new Date(), { 'quests/act3-guardian#action:break-compelling-orb': true }])(
    'refuses malformed or as-yet undefined current action receipts before normalization (%j)', questReceipts => {
      const input = sample();
      expect(() => decodeSave({ ...input, map: { ...input.map, questReceipts } })).toThrow(/questReceipts/);
    }
  );
});
