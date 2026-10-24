import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave, validateSocketSave } from './validate';

function sample(claimed = true) {
  const campaign = campaignEvidence();
  return buildSave({ player: createMockPlayer('Title owner', 'sorceress'), timestamp: 1000,
    endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: claimed },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {}, questItems: campaign.questItems },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: campaign.questProgress, questReceipts: campaign.questReceipts },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
describe('current-only achievement title save ownership', () => {
  it('round trips a claimed Riftwalker without adding campaign title entitlements', () => {
    const base = sample(), save = { ...base, map: { ...base.map, selectedTitle: 'titles/worldstone-adapt' } };
    expect(validateSave(save)).toEqual(toJsonSafe(save));
    expect(decodeSave(toJsonSafe(save))).toEqual(save);
    expect(validateSave(save).map.questTitles).toEqual({});
  });
  it('keeps current title ownership separate from merely eligible clear counts', () => {
    const base = sample(false);
    expect(() => validateSave({ ...base, map: { ...base.map, selectedTitle: 'titles/worldstone-adapt' } })).toThrow();
    expect(validateSave(base).map.selectedTitle).toBeNull();
  });
  it('keeps historical v19 closed to the new title', () => {
    const { endgame: _state, ...old } = sample();
    expect(() => validateSocketSave({ ...old, version: 19, map: { ...old.map, selectedTitle: 'titles/worldstone-adapt' } }))
      .toThrow('selected title');
    expect(validateSocketSave({ ...old, version: 19 }).map.selectedTitle).toBeNull();
  });
  it.each(['titles/unknown', 'titles/worldstone-adapt '])('refuses unknown current title %s', selectedTitle => {
    const base = sample();
    expect(() => validateSave({ ...base, map: { ...base.map, selectedTitle } })).toThrow();
  });
  it('does not widen the campaign title map or infer a new title from it', () => {
    const base = sample();
    expect(() => validateSave({ ...base, map: { ...base.map, questTitles: { 'titles/worldstone-adapt': true } } })).toThrow();
  });
});
