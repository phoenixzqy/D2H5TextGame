import { withoutV24Fields, withV24Defaults } from '../../../tests/helpers/save-fixtures';
/** Constructed save/Claim boundaries; no earned gameplay or historical replay. */
import { afterEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { buildSave, toJsonSafe } from '@/engine/save/serialize';
import { decodeSave, validateFrozenV22Save, validateSave } from '@/engine/save/validate';
import { runMigrations } from '@/engine/save/migrate';
import { COUNTESS } from '@/engine/map/countess-admission';
import { useMapStore } from '@/stores/mapStore';
import { canClaim, claimQuestReward } from '@/features/quests/claimReward';

function fixture(rewardClaimed = false) {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Countess save boundary', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: COUNTESS.area, discoveredAreas: [], clearedSubAreas: [],
      questProgress: { [COUNTESS.quest]: { id: COUNTESS.quest, status: 'completed', rewardClaimed,
        objectives: { [COUNTESS.objective]: true } } }, questReceipts: { [COUNTESS.receipt]: true } },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
afterEach(() => { useMapStore.getState().reset(); });

describe('Countess current proof and frozen predecessor boundaries', () => {
  it.each([false, true])('roundtrips a coherent native24 Countess graph with claimed=%s', claimed => {
    const save = fixture(claimed), before = structuredClone(save);
    expect(validateSave(toJsonSafe(save))).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    expect(save).toEqual(before);
  });
  it.each(['missing-row', 'wrong-id', 'in-progress', 'missing-objective', 'false-objective'] as const)(
    'refuses a Countess receipt with %s', fault => {
      const save = fixture(), row = save.map.questProgress[COUNTESS.quest];
      if (!row) throw new Error('Missing fixture row');
      const progress = fault === 'missing-row' ? {} : { [COUNTESS.quest]: {
        ...row, ...(fault === 'wrong-id' ? { id: 'quests/act1-den-of-evil' } : {}),
        ...(fault === 'in-progress' ? { status: 'inProgress' as const } : {}),
        objectives: fault === 'missing-objective' ? {} : { ...row.objectives,
          [COUNTESS.objective]: fault !== 'false-objective' }
      } };
      expect(() => validateSave({ ...save, map: { ...save.map, questProgress: progress } })).toThrow('Invalid save');
    });
  it('refuses even a coherent current Countess graph when labelled literal22', () => {
    const save = { ...withoutV24Fields(fixture()), version: 22 as const }, before = structuredClone(save);
    expect(() => validateFrozenV22Save(save)).toThrow('Invalid save');
    expect(() => runMigrations(save, 23)).toThrow('Invalid save');
    expect(() => decodeSave(save)).toThrow('Invalid save');
    expect(save).toEqual(before);
  });
  it.each([false, true])('preserves sparse completed legacy Countess rows with claimed=%s and grants no proof', claimed => {
    const save = withoutV24Fields(fixture(claimed)), row = save.map.questProgress[COUNTESS.quest];
    if (!row) throw new Error('Missing fixture row');
    const old = { ...save, version: 22 as const, map: { ...save.map, questReceipts: {},
      questProgress: { [COUNTESS.quest]: { ...row, objectives: {} } } } }, before = structuredClone(old);
    expect(decodeSave(old)).toEqual(withV24Defaults(old));
    expect(old).toEqual(before);
  });
  it('does not complete the protected objective through a generic matching monster kill', () => {
    const row = { id: COUNTESS.quest, status: 'inProgress' as const, rewardClaimed: false,
      objectives: { [COUNTESS.objective]: false } };
    useMapStore.setState({ currentAct: 1, currentSubAreaId: COUNTESS.area,
      questProgress: { [COUNTESS.quest]: row }, questReceipts: {} });
    const before = structuredClone(useMapStore.getState().questProgress);
    useMapStore.getState().recordMonsterKills({ actId: COUNTESS.act, areaId: COUNTESS.area,
      archetypeIds: [COUNTESS.archetype] });
    expect(useMapStore.getState().questProgress).toEqual(before);
  });
  it('requires own true Countess proof at both first-Claim boundaries', () => {
    const save = fixture();
    useMapStore.setState({ questProgress: save.map.questProgress, questReceipts: {} });
    expect(canClaim(COUNTESS.quest)).toBe(false);
    expect(claimQuestReward(COUNTESS.quest)).toBe('not-completed');
    useMapStore.setState({ questReceipts: save.map.questReceipts });
    expect(canClaim(COUNTESS.quest)).toBe(true);
  });
});
