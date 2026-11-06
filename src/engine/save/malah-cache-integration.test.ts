import { describe, expect, it } from 'vitest';
import { withoutV32Fields } from '../../../tests/helpers/save-fixtures';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import type { QuestItemLedger } from '../types/save';
import { deriveStats } from '../progression/stats';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';

const malah = loadCountedQuestItems().find(row => row.key === 'malah');
if (!malah) throw new Error('Missing Malah save authority');
const definition = malah;
function fixture(raw: number, life = 7) {
  const fresh = createMockPlayer('Counted cache restoration', 'sorceress');
  const coreStats = { ...fresh.coreStats, vitality: raw };
  const bare = buildSave({ timestamp: 1000, player: { ...fresh, level: 13, coreStats,
    derivedStats: { ...deriveStats(coreStats, 13), life, mana: 5, lifeMax: 900, attack: 777 } },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { runeShards: 77, 'rune-shard': 0, gold: 123, opaque: 4 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  const questItems: QuestItemLedger = Object.fromEntries(definition.sources.map(source =>
    [source, { itemId: definition.itemId, state: 'consumed' as const }]));
  return { ...bare, inventory: { ...bare.inventory, questItems }, map: { ...bare.map,
    questProgress: { [definition.quest]: { id: definition.quest, status: 'completed' as const,
      rewardClaimed: true, objectives: { [definition.objective]: true } } } } };
}

describe('Malah through actual current save assembly and restoration', () => {
  it.each([[199, 614], [200, 616], [499, 915], [500, 916]])(
    'restores exact current capacity from raw%s through build/JSON/decode without healing', (raw, lifeMax) => {
      const input = fixture(raw), before = structuredClone(input);
      for (const output of [buildSave(input), decodeSave(input), decodeSave(toJsonSafe(input))]) {
        expect(output.player.derivedStats).toEqual({ ...input.player.derivedStats, lifeMax });
        expect(output.player.coreStats).toEqual(input.player.coreStats);
        expect(output.inventory).toEqual(input.inventory);
        expect(output.map).toEqual(input.map);
        expect(toJsonSafe(decodeSave(toJsonSafe(output)))).toEqual(toJsonSafe(output));
      }
      expect(input).toEqual(before);
    });

  it('clamps excess Life only downward through current build and JSON decode', () => {
    const input = fixture(500, 9999);
    for (const output of [buildSave(input), decodeSave(toJsonSafe(input))]) {
      expect(output.player.derivedStats).toEqual({ ...input.player.derivedStats, life: 916, lifeMax: 916 });
    }
  });

  it('leaves source-free claimed current and literal30 history inert without cache compensation', () => {
    const paid = fixture(500);
    const legacy = { ...paid, inventory: { ...paid.inventory, questItems: {} } };
    expect(buildSave(legacy)).toEqual(legacy);
    expect(toJsonSafe(decodeSave(legacy))).toEqual(toJsonSafe(legacy));
    expect(toJsonSafe(decodeSave({ ...withoutV32Fields(legacy), version: 30 }))).toEqual(toJsonSafe(legacy));
  });

  it('rejects malformed participating input before cache reads or normalization', () => {
    const input = fixture(500), row = input.map.questProgress[definition.quest];
    let reads = 0;
    Object.defineProperty(row, 'rewardClaimed', { enumerable: true, get() { reads++; return true; } });
    expect(() => buildSave(input)).toThrow('Invalid');
    expect(() => decodeSave(input)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
});
