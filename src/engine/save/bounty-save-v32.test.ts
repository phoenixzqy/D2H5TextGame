/** Constructed durable states; earned native publication is tested separately. */
import { withV33Defaults, withoutV33Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { MIGRATIONS } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV31Save, validateSave } from './validate';

const ids = ['quests/bounty-act1-moor-cull', 'quests/bounty-act2-waste-cull',
  'quests/bounty-act3-forest-cull', 'quests/bounty-act4-steppes-cull',
  'quests/bounty-act5-foothills-cull'];
function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Bounty save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { opaque: 7, gold: 93 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function state(id: string, kind: 'active' | 'completed' | 'paid', claims = kind === 'paid' ? 1 : 0) {
  const save = sample();
  Reflect.set(save.map, 'bounties', { [id]: { claims, victoryOrdinal: claims + (kind === 'completed' ? 1 : 0) } });
  Reflect.set(save.map.questProgress, id, { id, status: kind === 'active' ? 'inProgress' : 'completed',
    rewardClaimed: kind === 'paid', objectives: { 'obj-cull': kind !== 'active' } });
  return save;
}
const first = ids[0] ?? '';
describe('unpublished32 bounty durable contract', () => {
  it('defaults only absent trusted builder input to the empty ledger', () => {
    expect(Object.getOwnPropertyDescriptor(sample().map, 'bounties')?.value).toEqual({});
    const save = sample();
    Reflect.set(save.map, 'bounties', undefined);
    expect(() => buildSave(save)).toThrow('Invalid');
  });
  for (const id of ids) {
    it.each(['active', 'completed', 'paid'] as const)('roundtrips exact %s graph ' + id, kind => {
      const save = state(id, kind), before = structuredClone(save);
      expect(validateSave(save)).toEqual(toJsonSafe(save));
      expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
      expect(buildSave(save).map).toEqual(save.map);
      expect(save).toEqual(before);
    });
  }
  it.each(['missing-ledger', 'missing-entry', 'missing-row', 'wrong-ordinal', 'fractional', 'negative', 'overflow',
    'extra-entry-field', 'unknown-key', 'wrong-objective', 'extra-row-field', 'paid-zero', 'exhausted-active'])(
    'rejects %s at raw, builder and decoder boundaries', fault => {
      const save = state(first, 'active');
      const entry = Object.getOwnPropertyDescriptor(save.map, 'bounties')?.value as Record<string, object>;
      if (fault === 'missing-ledger') Reflect.deleteProperty(save.map, 'bounties');
      if (fault === 'missing-entry') Reflect.deleteProperty(entry, first);
      if (fault === 'missing-row') Reflect.deleteProperty(save.map.questProgress, first);
      if (fault === 'wrong-ordinal') Reflect.set(entry[first] ?? {}, 'victoryOrdinal', 1);
      if (fault === 'fractional') Reflect.set(entry[first] ?? {}, 'claims', 0.5);
      if (fault === 'negative') Reflect.set(entry[first] ?? {}, 'claims', -1);
      if (fault === 'overflow') Reflect.set(entry[first] ?? {}, 'claims', 1000001);
      if (fault === 'extra-entry-field') Reflect.set(entry[first] ?? {}, 'extra', 1);
      if (fault === 'unknown-key') Reflect.set(entry, 'quests/bounty-forged', { claims: 0, victoryOrdinal: 0 });
      if (fault === 'wrong-objective') Reflect.set(save.map.questProgress[first] ?? {}, 'objectives', { forged: false });
      if (fault === 'extra-row-field') Reflect.set(save.map.questProgress[first] ?? {}, 'extra', true);
      if (fault === 'paid-zero') Reflect.set(save.map.questProgress, first,
        { id: first, status: 'completed', rewardClaimed: true, objectives: { 'obj-cull': true } });
      if (fault === 'exhausted-active') Reflect.set(entry, first, { claims: 1000000, victoryOrdinal: 1000000 });
      const before = structuredClone(save);
      expect(() => validateSave(save)).toThrow('Invalid');
      // Trusted builder may default a wholly absent field, but never erase its active row.
      expect(() => buildSave(save)).toThrow('Invalid');
      expect(() => decodeSave(toJsonSafe(save))).toThrow('Invalid');
      expect(save).toEqual(before);
    });
  it.each(['ledger', 'entry', 'counter', 'row', 'objective'] as const)('refuses %s getter without evaluation', kind => {
    const save = state(first, 'active'); let reads = 0;
    const ledger = Object.getOwnPropertyDescriptor(save.map, 'bounties')?.value as Record<string, object>;
    const row = save.map.questProgress[first];
    const target = kind === 'ledger' ? save.map : kind === 'entry' ? ledger : kind === 'counter' ? ledger[first]
      : kind === 'row' ? save.map.questProgress : row?.objectives;
    const key = kind === 'ledger' ? 'bounties' : kind === 'entry' || kind === 'row' ? first
      : kind === 'counter' ? 'claims' : 'obj-cull';
    Object.defineProperty(target ?? {}, key, { enumerable: true, get() { reads++; return 0; } });
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(reads).toBe(0);
  });
  it('migrates literal31 with only an empty ledger and refuses its future-field presence', () => {
    const current = withoutV33Fields(sample()), map = { ...current.map }; Reflect.deleteProperty(map, 'bounties');
    const old = { ...current, version: 31 as const, map }, before = structuredClone(old);
    expect(validateFrozenV31Save(old)).toEqual(toJsonSafe(old));
    expect(MIGRATIONS[32]?.(old)).toEqual({ ...old, version: 32, map: { ...map, bounties: {} } });
    expect(toJsonSafe(decodeSave(toJsonSafe(old)))).toEqual(toJsonSafe(withV33Defaults({ ...old, version: 32, map: { ...map, bounties: {} } })));
    expect(old).toEqual(before);
    const forged = { ...old, map: { ...map, bounties: {} } };
    expect(() => validateFrozenV31Save(forged)).toThrow('Invalid');
    expect(() => MIGRATIONS[32]?.(forged)).toThrow('Invalid');
  });
});
