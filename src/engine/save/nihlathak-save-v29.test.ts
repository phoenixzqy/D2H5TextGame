import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed admission/migration evidence; no earned recovery or reward credit. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestItemLedger, type QuestProgressData } from '../types/save';
import { NIHLATHAK } from '../map/nihlathak-quest';
import { LIVE_ACT5_DOMAIN } from './act5-state';
import { FROZEN_V28 } from './frozen-v28';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV29Save, validateFrozenV28Save, validateQuestItemLedger } from './validate';

function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Nihlathak compatibility', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: NIHLATHAK.areaId, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function recovered(rewardClaimed = false) {
  const save = sample(), act5 = LIVE_ACT5_DOMAIN;
  const encounter = act5.encounters.find(row => row.questId === act5.prisonQuest);
  if (!encounter) throw new Error('Missing Prison encounter');
  const questItems: QuestItemLedger = { [NIHLATHAK.source]: { itemId: NIHLATHAK.itemId, state: 'owned' },
    [act5.potionSource]: { itemId: act5.potionItemId, state: 'consumed' } };
  const questProgress: Record<string, QuestProgressData> = {
    [NIHLATHAK.quest]: { id: NIHLATHAK.quest, status: 'completed', rewardClaimed, objectives: { [NIHLATHAK.objective]: true } },
    [act5.prisonQuest]: { id: act5.prisonQuest, status: 'completed', rewardClaimed: false,
      objectives: Object.fromEntries((act5.objectiveIds[act5.prisonQuest] ?? []).map(id => [id, true])) }
  };
  return { ...withoutV32Fields(save), version: 29 as const, inventory: { ...save.inventory, questItems },
    map: { ...withoutV32Fields(save).map, questProgress, questReceipts: Object.fromEntries(
      [act5.inspectProof, act5.potionSource, act5.thawProof, encounter.proof].map(source => [source, true as const])) } };
}
describe('native29 Nihlathak retained physical source authority', () => {
  it.each([false, true])('admits exact relic before/after side Claim (claimed=%s), without main Claim or Read', claimed => {
    const save = recovered(claimed), before = structuredClone(save);
    expect(validateFrozenV29Save(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(withV32Defaults(save)));
    expect(toJsonSafe(buildSave(save))).toEqual(toJsonSafe(withV32Defaults(save)));
    expect(validateQuestItemLedger(save.inventory.questItems, save.map.questProgress, save.map.questReceipts))
      .toEqual(save.inventory.questItems);
    expect(save).toEqual(before);
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'false-objective', 'missing-objective', 'extra-objective',
    'wrong-source', 'wrong-item', 'consumed', 'missing-main', 'missing-victory', 'missing-thaw', 'missing-potion'] as const)(
    'rejects contradictory %s graph at save and prospective item boundaries', fault => {
      const save = recovered(), row = save.map.questProgress[NIHLATHAK.quest], act5 = LIVE_ACT5_DOMAIN;
      if (!row) throw new Error('Missing side row');
      if (fault === 'missing-row') Reflect.deleteProperty(save.map.questProgress, NIHLATHAK.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'foreign');
      if (fault === 'in-progress') Reflect.set(row, 'status', 'inProgress');
      if (fault === 'false-objective') Reflect.set(row.objectives, NIHLATHAK.objective, false);
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, NIHLATHAK.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
      if (fault === 'wrong-source') { Reflect.deleteProperty(save.inventory.questItems, NIHLATHAK.source);
        Reflect.set(save.inventory.questItems, NIHLATHAK.source + '-future', { itemId: NIHLATHAK.itemId, state: 'owned' }); }
      if (fault === 'wrong-item') Reflect.set(save.inventory.questItems[NIHLATHAK.source] ?? {}, 'itemId', 'foreign');
      if (fault === 'consumed') Reflect.set(save.inventory.questItems[NIHLATHAK.source] ?? {}, 'state', 'consumed');
      if (fault === 'missing-main') Reflect.deleteProperty(save.map.questProgress, act5.prisonQuest);
      if (fault === 'missing-victory') for (const encounter of act5.encounters) {
        if (encounter.questId === act5.prisonQuest) Reflect.deleteProperty(save.map.questReceipts, encounter.proof);
      }
      if (fault === 'missing-thaw') Reflect.deleteProperty(save.map.questReceipts, act5.thawProof);
      if (fault === 'missing-potion') Reflect.deleteProperty(save.inventory.questItems, act5.potionSource);
      expect(() => validateFrozenV29Save(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
      expect(() => validateQuestItemLedger(save.inventory.questItems, save.map.questProgress, save.map.questReceipts)).toThrow('Invalid');
    });
  it.each(['source', 'item', 'row', 'objectives', 'objective', 'main-row', 'main-objective', 'potion', 'proof'] as const)(
    'rejects own %s getter without executing it', field => {
      const save = recovered(), row = save.map.questProgress[NIHLATHAK.quest], act5 = LIVE_ACT5_DOMAIN; let reads = 0;
      if (!row) throw new Error('Missing side row');
      const target = field === 'source' || field === 'potion' ? save.inventory.questItems
        : field === 'item' ? save.inventory.questItems[NIHLATHAK.source] : field === 'row' || field === 'main-row'
          ? save.map.questProgress : field === 'objectives' ? row : field === 'objective' ? row.objectives
            : field === 'main-objective' ? save.map.questProgress[act5.prisonQuest]?.objectives : save.map.questReceipts;
      const key = field === 'source' ? NIHLATHAK.source : field === 'potion' ? act5.potionSource : field === 'item' ? 'itemId'
        : field === 'row' ? NIHLATHAK.quest : field === 'main-row' ? act5.prisonQuest : field === 'objectives' ? 'objectives'
          : field === 'objective' ? NIHLATHAK.objective : field === 'main-objective' ? act5.thawObjective : act5.thawProof;
      if (!target) throw new Error('Missing descriptor fixture');
      Object.defineProperty(target, key, { configurable: true, enumerable: true, get() { reads++; return true; } });
      expect(() => validateFrozenV29Save(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
      expect(reads).toBe(0);
    });
  it.each(['hidden', 'symbol', 'inherited'] as const)('rejects %s source descriptors before normalization', fault => {
    const save = recovered(), items = save.inventory.questItems;
    if (fault === 'hidden') Object.defineProperty(items, NIHLATHAK.source, { enumerable: false });
    if (fault === 'symbol') Reflect.set(items, Symbol('source'), true);
    if (fault === 'inherited') { Reflect.deleteProperty(items, NIHLATHAK.source);
      Object.setPrototypeOf(items, { [NIHLATHAK.source]: { itemId: NIHLATHAK.itemId, state: 'owned' } }); }
    expect(() => validateFrozenV29Save(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
  });
});
describe('version-only28→29 preserves history without inference', () => {
  it('registers29 and validates actual28 before changing only the version', () => {
    expect(CURRENT_SAVE_VERSION).toBe(33);
    const migrate = MIGRATIONS[29]; if (!migrate) throw new Error('Missing29 migration');
    const input = { ...withoutV32Fields(sample()), version: 28 as const, historical: { keep: [7] } }, before = structuredClone(input);
    expect(validateFrozenV28Save(input)).toEqual(toJsonSafe(input));
    expect(migrate(input)).toEqual({ ...withoutV32Fields(input), version: 29 });
    expect(input).toEqual(before);
    expect(() => migrate({ ...input, timestamp: 'invalid' })).toThrow('Invalid');
    expect(() => migrate({ ...withoutV32Fields(recovered()), version: 28 })).toThrow('Invalid');
  });
  it.each([false, true])('preserves proofless completed historical side flags (claimed=%s)', claimed => {
    const save = sample(), input = { ...withoutV32Fields(save), version: 28 as const,
      map: { ...withoutV32Fields(save).map, questProgress: { [NIHLATHAK.quest]: { id: NIHLATHAK.quest,
        status: 'completed' as const, rewardClaimed: claimed, objectives: { [NIHLATHAK.objective]: true } } } } };
    const before = structuredClone(input), output = decodeSave(input);
    expect(toJsonSafe(output)).toEqual(toJsonSafe(withV32Defaults(input)));
    expect(output.inventory.questItems).toEqual({});
    expect(output.inventory.backpack).toEqual([]);
    expect(output.map.questReceipts).toEqual({});
    expect(input).toEqual(before);
  });
  it('rejects future relic input before28 migration can read its getter', () => {
    const input = { ...withoutV32Fields(sample()), version: 28 as const }; let reads = 0;
    Object.defineProperty(input.inventory.questItems, NIHLATHAK.source,
      { enumerable: true, get() { reads++; return { itemId: NIHLATHAK.itemId, state: 'owned' }; } });
    expect(() => validateFrozenV28Save(input)).toThrow('Invalid');
    expect(() => MIGRATIONS[29]?.(input)).toThrow('Invalid');
    expect(() => decodeSave(input)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it('preserves accepted Drognan ownership and points without adding Nihlathak source', () => {
    const base = sample(), domain = FROZEN_V28.drognan; if (!domain) throw new Error('Missing historical tome');
    const input = { ...withoutV32Fields(base), version: 28 as const, inventory: { ...base.inventory,
      questItems: { [domain.source]: { itemId: domain.itemId, state: 'owned' as const } } },
      map: { ...withoutV32Fields(base).map, questProgress: { [domain.quest]: { id: domain.quest, status: 'completed' as const,
        rewardClaimed: true, objectives: { [domain.objective]: true } } } } };
    const before = structuredClone(input);
    expect(validateFrozenV28Save(input)).toEqual(toJsonSafe(input));
    expect(toJsonSafe(decodeSave(input))).toEqual(toJsonSafe(withV32Defaults(input)));
    expect(input).toEqual(before);
  });
});
