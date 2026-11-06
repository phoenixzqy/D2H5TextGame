/** Constructed portal authority; these cases do not represent an earned campaign. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { COW } from '../map/cow-quest';
import { CURRENT_SAVE_VERSION, MIGRATIONS } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV31Save, validateSave } from './validate';
const quest = COW.quest;
function sample(claimed = false) {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Gheed save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { opaque: 7, gold: 93 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [],
      questProgress: { [quest]: { id: quest, status: 'completed',
        rewardClaimed: claimed, objectives: { [COW.legObjective]: true, [COW.portalObjective]: true } } } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}

function earned(stage: 'leg' | 'tome' | 'open' | 'win', claimed = false) {
  const save = sample(claimed);
  const items = { ...save.inventory.questItems };
  const receipts = { ...save.map.questReceipts };
  const progress = { ...save.map.questProgress };
  items[COW.legSource] = { itemId: COW.legItemId, state: 'owned' };
  if (stage !== 'leg') {
    items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'owned' };
    receipts[COW.tomeSource] = true;
  }
  if (stage === 'open' || stage === 'win') {
    items[COW.legSource] = { itemId: COW.legItemId, state: 'consumed' };
    items[COW.tomeSource] = { itemId: COW.tomeItemId, state: 'consumed' };
    items[COW.cubeSource] = { itemId: COW.cubeItemId, state: 'owned' };
    progress['quests/act2-horadric-staff'] = { id: 'quests/act2-horadric-staff', status: 'inProgress',
      rewardClaimed: false, objectives: { 'obj-cube': true, 'obj-amulet': false, 'obj-shaft': false, 'obj-transmute': false } };
    receipts[COW.openProof] = true;
  }
  if (stage === 'win') receipts[COW.victoryProof] = true;
  return { ...save, inventory: { ...save.inventory, questItems: items },
    map: { ...save.map, questProgress: progress, questReceipts: receipts } };
}
describe('unpublished32 finite Cow source graph admission', () => {
  it.each(['leg', 'tome', 'open', 'win'] as const)('roundtrips actual %s stage without changing actors or wallet', stage => {
    const save = earned(stage), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(buildSave(save).inventory.questItems).toEqual(save.inventory.questItems);
    expect(save).toEqual(before);
  });
  it.each([false, true])('preserves inert sparse completed history claimed=%s', claimed => {
    const save = sample(claimed);
    Reflect.set(save.map.questProgress[quest] ?? {}, 'objectives', {});
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save)).map.questReceipts).toEqual({});
  });
  it('lets a legacy claimed row retain an earned portal and victory without recreating fixed rewards', () => {
    const save = earned('win', true), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(buildSave(save).inventory.questItems).toEqual(save.inventory.questItems);
    expect(save).toEqual(before);
  });
  it.each(['missing-leg', 'missing-receive', 'missing-open', 'missing-cube', 'wrong-cube', 'one-consumed',
    'false-leg', 'false-portal', 'wrong-row', 'false-victory', 'unknown-item', 'unknown-proof'] as const)(
    'rejects %s at raw, builder and decoder boundaries without repairing input', fault => {
      const save = earned('win');
      if (fault === 'missing-leg') Reflect.deleteProperty(save.inventory.questItems, COW.legSource);
      if (fault === 'missing-receive') Reflect.deleteProperty(save.map.questReceipts, COW.tomeSource);
      if (fault === 'missing-open') Reflect.deleteProperty(save.map.questReceipts, COW.openProof);
      if (fault === 'missing-cube') Reflect.deleteProperty(save.inventory.questItems, COW.cubeSource);
      if (fault === 'wrong-cube') Reflect.set(save.inventory.questItems, COW.cubeSource, { itemId: COW.legItemId, state: 'owned' });
      if (fault === 'one-consumed') Reflect.set(save.inventory.questItems, COW.tomeSource, { itemId: COW.tomeItemId, state: 'owned' });
      if (fault === 'false-leg') Reflect.set(save.map.questProgress[quest]?.objectives ?? {}, COW.legObjective, false);
      if (fault === 'false-portal') Reflect.set(save.map.questProgress[quest]?.objectives ?? {}, COW.portalObjective, false);
      if (fault === 'wrong-row') Reflect.set(save.map.questProgress[quest] ?? {}, 'id', 'quests/forged');
      if (fault === 'false-victory') Reflect.set(save.map.questReceipts, COW.victoryProof, false);
      if (fault === 'unknown-item') Reflect.set(save.inventory.questItems, quest + '#objective:forged', { itemId: COW.legItemId, state: 'owned' });
      if (fault === 'unknown-proof') Reflect.set(save.map.questReceipts, quest + '#action:forged', true);
      const before = structuredClone(save);
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => buildSave(save)).toThrow('Invalid');
      expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid');
      expect(save).toEqual(before);
    });
  it.each(['item', 'receipt'] as const)('refuses %s getters without evaluation', kind => {
    const save = earned('win'); let reads = 0;
    Object.defineProperty(kind === 'item' ? save.inventory.questItems : save.map.questReceipts,
      kind === 'item' ? COW.legSource : COW.victoryProof, { enumerable: true, get() { reads++; return true; } });
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it.each(['leg', 'win'] as const)('literal31 and migration refuse future %s stage under old tag', stage => {
    const save = earned(stage), map = { ...save.map }; Reflect.deleteProperty(map, 'bounties');
    const old = { ...save, version: 31 as const, map }, before = structuredClone(old);
    expect(() => validateFrozenV31Save(old)).toThrow('Invalid');
    expect(() => decodeSave(toJsonSafe(old))).toThrow('Invalid');
    expect(() => MIGRATIONS[CURRENT_SAVE_VERSION]?.(old)).toThrow('Invalid');
    expect(old).toEqual(before);
  });
});
