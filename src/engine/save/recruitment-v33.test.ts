import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercPool } from '@/data/loaders/mercs';
import { createRng } from '../rng';
import { createRecruitmentState, planRecruitment } from '../gacha/recruitment-state';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV32Save, validateSave } from './validate';
import { migrateSaveV33 } from './migrate-v33';
import { readRecruitmentSaveFields, rejectPreRecruitmentState } from './recruitment-state';

function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Recruitment save contract', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 137, opaque: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 3, ownedMercIds: [], pityCounter: 89 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}
function oldSample() {
  const save = sample(), meta = { ...save.meta }, mercs = { ...save.mercs };
  Reflect.deleteProperty(meta, 'recruitmentState'); Reflect.deleteProperty(mercs, 'recruitmentProgress');
  return { ...save, version: 32 as const, meta, mercs };
}
describe('version33 recruitment ownership', () => {
  it('builds current defaults and roundtrips without changing legacy pity, currency or inventory', () => {
    const save = sample(); expect(save.version).toBe(33);
    expect(readRecruitmentSaveFields(save)).toEqual({ recruitmentState: { srPityCounter: 0, totalPulls: 0, history: [] }, recruitmentProgress: {} });
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(validateSave(save)).toEqual(toJsonSafe(save));
  });
  it('migrates literal32 by adding only empty new fields and preserves the source', () => {
    const old = oldSample(), before = structuredClone(old), migrated = migrateSaveV33(old);
    expect(validateFrozenV32Save(old)).toEqual(toJsonSafe(old));
    expect(migrated).toEqual({ ...old, version: 33,
      meta: { ...old.meta, recruitmentState: { srPityCounter: 0, totalPulls: 0, history: [] } },
      mercs: { ...old.mercs, recruitmentProgress: {} } });
    expect(toJsonSafe(decodeSave(toJsonSafe(old)))).toEqual(toJsonSafe(migrated));
    expect(old).toEqual(before);
  });
  it('roundtrips actual planned counters, duplicate receipts and shard progress', () => {
    const save = sample(), rules = loadMercPool().banner;
    const plan = planRecruitment(createRng(7), rules, createRecruitmentState(89), {},
      new Set(Object.values(rules.pool).flat()), 10, 1234);
    Reflect.set(save.meta.gachaState, 'pityCounter', plan.state.pityCounter);
    const { pityCounter: _pity, ...history } = plan.state;
    Reflect.set(save.meta, 'recruitmentState', history); Reflect.set(save.mercs, 'recruitmentProgress', plan.progress);
    expect(toJsonSafe(decodeSave(toJsonSafe(save)))).toEqual(toJsonSafe(save));
    expect(buildSave(save)).toEqual(save);
  });
  it.each(['state', 'progress'] as const)('rejects wholly missing %s in native input but defaults absent trusted builder input', key => {
    const save = sample(), container = key === 'state' ? save.meta : save.mercs;
    Reflect.deleteProperty(container, key === 'state' ? 'recruitmentState' : 'recruitmentProgress');
    expect(() => validateSave(save)).toThrow('Invalid');
    expect(() => decodeSave(save)).toThrow('Invalid');
    expect(() => buildSave(save)).not.toThrow();
  });
  it.each(['undefined', 'hidden', 'inherited', 'accessor'])(
    'rejects %s current fields at raw, decode and builder boundaries', fault => {
      const save = sample(); let reads = 0;
      if (fault === 'undefined') Reflect.set(save.meta, 'recruitmentState', undefined);
      if (fault === 'hidden') Object.defineProperty(save.meta, 'recruitmentState', { value: {}, enumerable: false });
      if (fault === 'inherited') { Reflect.deleteProperty(save.meta, 'recruitmentState'); Object.setPrototypeOf(save.meta, { recruitmentState: {} }); }
      if (fault === 'accessor') Object.defineProperty(save.meta, 'recruitmentState', { enumerable: true, get() { reads++; return {}; } });
      expect(() => validateSave(save)).toThrow('Invalid'); expect(() => decodeSave(save)).toThrow('Invalid');
      expect(() => buildSave(save)).toThrow('Invalid'); expect(reads).toBe(0);
    });
  it.each(['meta', 'mercs'] as const)('refuses future %s state in literal32 before any migration', target => {
    const old = oldSample();
    Reflect.set(target === 'meta' ? old.meta : old.mercs,
      target === 'meta' ? 'recruitmentState' : 'recruitmentProgress', undefined);
    expect(() => { rejectPreRecruitmentState(old); }).toThrow('Invalid');
    expect(() => migrateSaveV33(old)).toThrow('Invalid');
    expect(() => decodeSave(old)).toThrow('Invalid');
  });
  it.each([1, 7, 17, 24, 31, 32])('rejects hidden or inherited future state in historical version%s', version => {
    const container = Object.create({ recruitmentState: undefined }) as object;
    const old = version === 1 ? Object.assign(container, { version }) : { version, meta: container };
    expect(() => { rejectPreRecruitmentState(old); }).toThrow('Invalid');
    const hidden = { version, mercs: {} };
    Object.defineProperty(hidden.mercs, 'recruitmentProgress', { value: undefined });
    expect(() => { rejectPreRecruitmentState(hidden); }).toThrow('Invalid');
  });
});
