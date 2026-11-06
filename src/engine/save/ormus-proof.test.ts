/** Constructed save authority; this does not establish an earned area clear. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ORMUS } from '../map/ormus-quest';
import { ACT5_ENCOUNTERS } from '../map/act5-admission';
import type { QuestProgressData } from '../types/save';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { withoutV24Fields, withoutV32Fields } from '../../../tests/helpers/save-fixtures';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateFrozenV23Save, validateFrozenV24Save,
  validateQuestActionReceipts, validateQuestItemLedger } from './validate';

const row = (done = false): QuestProgressData => ({ id: ORMUS.quest,
  status: done ? 'completed' : 'inProgress', rewardClaimed: false,
  objectives: { [ORMUS.first]: true, [ORMUS.talk]: done } });
function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Ormus proof', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 3, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function proven(done = false) {
  const save = sample();
  return { ...save, map: { ...save.map, questProgress: { [ORMUS.quest]: row(done) },
    questReceipts: { [ORMUS.proof]: true as const } } };
}
describe('live25 Ormus proof admission', () => {
  it.each([false, true])('round trips the reciprocal graph before/after Talk (done=%s)', done => {
    const save = proven(done), before = structuredClone(save);
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    expect(validateQuestActionReceipts(save.map.questReceipts, save.map.questProgress)).toEqual(save.map.questReceipts);
    expect(validateQuestItemLedger({}, save.map.questProgress, save.map.questReceipts)).toEqual({});
    expect(save).toEqual(before);
  });
  it.each([false, true])('preserves proofless sparse completed history (claimed=%s)', rewardClaimed => {
    const base = sample(), progress = { [ORMUS.quest]: { id: ORMUS.quest, status: 'completed', objectives: {}, rewardClaimed } };
    const save = { ...base, map: { ...base.map, questProgress: progress } };
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    const legacy = { ...withoutV32Fields(save), version: 24 };
    expect(validateFrozenV24Save(legacy)).toEqual(toJsonSafe(legacy));
    expect(decodeSave(legacy).map.questProgress).toEqual(progress);
    expect(decodeSave(legacy).map.questReceipts).toEqual({});
  });
  it.each([false, true])('literal23/24 reject the new proof before migration (v23=%s)', v23 => {
    const base = proven(), old = v23 ? { ...withoutV24Fields(base), version: 23 } : { ...withoutV32Fields(base), version: 24 };
    expect(() => v23 ? validateFrozenV23Save(old) : validateFrozenV24Save(old)).toThrow();
    expect(() => decodeSave(old)).toThrow();
  });
  it('refuses orphan, mismatched and contradictory proof-bearing rows', () => {
    const base = proven();
    for (const progress of [{}, { [ORMUS.quest]: { ...row(), id: 'other' } },
      { [ORMUS.quest]: { ...row(), objectives: {} } },
      { [ORMUS.quest]: { ...row(), status: 'completed' } },
      { [ORMUS.quest]: { ...row(true), status: 'inProgress' } },
      { [ORMUS.quest]: { ...row(), rewardClaimed: true } }]) {
      expect(() => validateSave({ ...base, map: { ...base.map, questProgress: progress } })).toThrow();
      expect(() => validateQuestActionReceipts(base.map.questReceipts, progress)).toThrow();
    }
  });
  it.each(['accessor', 'hidden', 'false', 'undefined', 'symbol'] as const)('rejects %s proof data without evaluating getters', kind => {
    let invoked = false;
    const receipts = kind === 'symbol' ? { [Symbol('proof')]: true } : Object.defineProperty({}, ORMUS.proof,
      kind === 'accessor' ? { enumerable: true, get: () => { invoked = true; return true; } }
        : { enumerable: kind !== 'hidden', value: kind === 'false' ? false : kind === 'undefined' ? undefined : true });
    const progress = { [ORMUS.quest]: row() };
    expect(() => validateQuestActionReceipts(receipts, progress)).toThrow();
    expect(() => validateQuestItemLedger({}, progress, receipts)).toThrow();
    expect(invoked).toBe(false);
  });
  it('refuses accessor canonical identity and source flags before evaluating them', () => {
    for (const field of ['id', 'status', 'objectives', 'rewardClaimed', ORMUS.first]) {
      let invoked = false;
      const current = row(), target = field === ORMUS.first ? current.objectives : current;
      Object.defineProperty(target, field, { enumerable: true, get: () => { invoked = true; return true; } });
      expect(() => validateQuestActionReceipts({ [ORMUS.proof]: true }, { [ORMUS.quest]: current })).toThrow();
      expect(invoked).toBe(false);
    }
  });
  it('coexists with qualified Hell, achievement, endgame and service authority', () => {
    const base = proven(true), campaign = campaignEvidence(), serviceId = 'quests/side-act5-larzuks-sockets';
    const siegeId = 'quests/act5-siege-on-harrogath', siege = ACT5_ENCOUNTERS.find(entry => entry.questId === siegeId);
    if (!siege) throw new Error('Missing canonical siege source');
    const save = { ...base, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
      inventory: { ...base.inventory, questServices: { [`${serviceId}#reward:service`]: { serviceId: 'socket_item', state: 'available' } } },
      map: { ...base.map, currentAct: 5, questProgress: { ...base.map.questProgress, ...campaign.questProgress,
        [siegeId]: { id: siegeId, status: 'completed', rewardClaimed: false, objectives: { [siege.objectiveId]: true } },
        [serviceId]: { id: serviceId, status: 'completed', rewardClaimed: true, objectives: { 'obj-bring-item': true } } },
        questReceipts: { ...base.map.questReceipts, ...campaign.questReceipts, [siege.proof]: true },
        questDifficulties: { 'difficulty/nightmare': true }, selectedDifficulty: 'hell', selectedTitle: 'titles/worldstone-adapt',
        hellClearedSubAreas: ['areas/act1-blood-moor'], challengeOrdinals: { normal: 0, nightmare: 0, hell: 3 } } };
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(save).map.questReceipts[ORMUS.proof]).toBe(true);
  });
});
