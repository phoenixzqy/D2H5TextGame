/** Constructed native authority states; actual thaw/Talk/Claim are covered by public tests. */
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { ANYA, ANYA_DOMAIN } from '../map/anya-quest';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
import { MIGRATIONS } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV31Save, validateSave } from './validate';
function sample() {
  const built = buildSave({ timestamp: 1000, player: createMockPlayer('Anya save authority', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { opaque: 93 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 5, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  return { ...built, map: { ...built.map }, inventory: { ...built.inventory },
    player: { ...built.player, derivedStats: { ...built.player.derivedStats } } };
}
function earned(claimed: boolean, purchases: readonly ('frostburn-gauntlet' | 'waterwalk')[] = []) {
  const save = sample(), p = ANYA.prerequisite;
  save.map.questProgress = {
    [p.quest]: { id: p.quest, status: 'completed', rewardClaimed: false,
      objectives: Object.fromEntries(p.objectiveIds.map(id => [id, true])) },
    [ANYA.quest]: { id: ANYA.quest, status: 'completed', rewardClaimed: claimed, objectives: { [ANYA.objective]: true } }
  };
  save.map.questReceipts = { [p.inspectProof]: true, [p.potionSource]: true, [p.thawProof]: true,
    [ANYA.proof]: true, ...Object.fromEntries(purchases.map(id => [ANYA.tradeProofs[id], true as const])) };
  save.inventory.questItems = { [p.potionSource]: { itemId: p.potionItemId, state: 'consumed' } };
  save.inventory.questServices = claimed ? { [ANYA.serviceSource]: { serviceId: 'personalize_item', state: 'available' } } : {};
  save.player.derivedStats.resistances = deriveEquippedPlayerStats(save.player, save.player.level, {},
    save.map.questProgress, save.inventory.questItems, save.map.questReceipts).resistances;
  return save;
}
describe('unpublished32 Anya authority and historical separation', () => {
  it.each([{ purchases: [] }, { purchases: ['frostburn-gauntlet'] }, { purchases: ['waterwalk'] },
    { purchases: ['frostburn-gauntlet', 'waterwalk'] }] as const)(
    'roundtrips paid lifetime stock subset $purchases independently of item ownership', ({ purchases }) => {
      const save = earned(true, purchases), before = structuredClone(save);
      expect(validateSave(save)).toEqual(toJsonSafe(save));
      expect(decodeSave(toJsonSafe(save))).toEqual(save);
      expect(buildSave(save)).toEqual(save); expect(save).toEqual(before);
      expect(save.inventory.backpack).toEqual([]);
    });
  it('retains the Talk-before-Claim state and consumed side personalization history', () => {
    const talked = earned(false);
    expect(decodeSave(toJsonSafe(talked))).toEqual(talked);
    const paid = earned(true);
    paid.inventory.questServices = { [ANYA.serviceSource]: { serviceId: 'personalize_item', state: 'consumed', targetItemId: 'salvaged-unique' } };
    expect(decodeSave(toJsonSafe(paid))).toEqual(paid);
  });
  it.each(['missing-talk', 'missing-service', 'wrong-service', 'missing-thaw', 'wrong-potion', 'unclaimed-stock', 'extra-proof'] as const)(
    'refuses contradictory %s at raw, builder and decoder boundaries', fault => {
      const save = earned(true, ['waterwalk']);
      if (fault === 'missing-talk') Reflect.deleteProperty(save.map.questReceipts, ANYA.proof);
      if (fault === 'missing-service') save.inventory.questServices = {};
      if (fault === 'wrong-service') Reflect.set(save.inventory.questServices, ANYA.serviceSource, { serviceId: 'socket_item', state: 'available' });
      if (fault === 'missing-thaw') Reflect.deleteProperty(save.map.questReceipts, ANYA.prerequisite.thawProof);
      if (fault === 'wrong-potion') Reflect.set(save.inventory.questItems, ANYA.prerequisite.potionSource, { itemId: 'forged', state: 'consumed' });
      if (fault === 'unclaimed-stock') Reflect.set(save.map.questProgress[ANYA.quest] ?? {}, 'rewardClaimed', false);
      if (fault === 'extra-proof') Reflect.set(save.map.questReceipts, `${ANYA.quest}#trade:forged`, true);
      expect(() => validateSave(save)).toThrow('Invalid');
      expect(() => buildSave(save)).toThrow('Invalid');
      expect(() => decodeSave(save)).toThrow('Invalid');
    });
  it.each([ANYA.proof, ...Object.values(ANYA.tradeProofs)])('literal31 refuses future receipt %s before migration', proof => {
    const save = earned(true, ['frostburn-gauntlet', 'waterwalk']);
    const old = { ...withoutV32Fields(save), version: 31 as const };
    old.map.questReceipts = { ...old.map.questReceipts }; Reflect.set(old.map.questReceipts, proof, true);
    expect(() => validateFrozenV31Save(old)).toThrow('Invalid');
    expect(() => MIGRATIONS[32]?.(old)).toThrow('Invalid');
    expect(() => decodeSave(old)).toThrow('Invalid');
  });
  it('preserves source-free claimed legacy side flags without resistance, catalog or backfill', () => {
    const save = sample();
    save.map.questProgress = { [ANYA.quest]: { id: ANYA.quest, status: 'completed', rewardClaimed: true,
      objectives: { [ANYA.objective]: true } } };
    const old = { ...withoutV32Fields(save), version: 31 as const }, before = structuredClone(old);
    expect(validateFrozenV31Save(old)).toEqual(toJsonSafe(old));
    expect(decodeSave(old)).toEqual(withV32Defaults(old));
    expect(old).toEqual(before);
    expect(deriveEquippedPlayerStats(save.player, save.player.level, {}, save.map.questProgress).resistances.fire).toBe(0);
  });
  it('only omitted stat authority uses live Anya; supplied historical absence disables it', () => {
    const save = earned(true);
    const compose = (authority?: Parameters<typeof deriveEquippedPlayerStats>[6]) => deriveEquippedPlayerStats(
      save.player, save.player.level, {}, save.map.questProgress, save.inventory.questItems, save.map.questReceipts, authority).resistances;
    expect(compose().fire).toBe(10); expect(compose({ anya: ANYA_DOMAIN }).fire).toBe(10);
    expect(compose({}).fire).toBe(0); expect(compose({ countedSources: [] }).fire).toBe(0);
  });
  it.each(['talk', 'stock', 'service'] as const)('rejects own %s getter before reading it', fault => {
    const save = earned(true, ['waterwalk']); let reads = 0;
    Object.defineProperty(fault === 'service' ? save.inventory.questServices : save.map.questReceipts,
      fault === 'talk' ? ANYA.proof : fault === 'stock' ? ANYA.tradeProofs.waterwalk : ANYA.serviceSource,
      { enumerable: true, get() { reads++; return true; } });
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid'); expect(reads).toBe(0);
  });
});
