import { withoutV24Fields } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { buildSave } from './serialize';
import { decodeSave } from './validate';
import { runMigrations } from './migrate';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CURRENT_SAVE_VERSION } from '../types/save';

function sample() {
  return buildSave({ player: createMockPlayer('Reset', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 7 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false, combatSpeed: 1, autoCombat: false },
      idleState: { lastOnline: 0, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 0, col: 0 }, mercPosition: { row: 0, col: 1 }, summonPositions: [] }, timestamp: 123 });
}

describe('v21 durable reset allowances', () => {
  it('creates three independent free uses and retains exhausted counters through JSON', () => {
    expect(CURRENT_SAVE_VERSION).toBe(24);
    const save = sample(); expect(save.player.respecsRemaining).toEqual({ stat: 3, skill: 3 });
    const spent = { ...save, player: { ...save.player, respecsRemaining: { stat: 1, skill: 0 } } };
    expect(decodeSave(JSON.parse(JSON.stringify(spent))).player.respecsRemaining).toEqual({ stat: 1, skill: 0 });
  });
  it('migrates v20 without changing earned state or permitting future counters in history', () => {
    const current = sample(); const { respecsRemaining: _counts, ...player } = current.player;
    const old = { ...withoutV24Fields(current), version: 20, player }; const before = structuredClone(old);
    const next = decodeSave(old);
    expect(next).toEqual({ ...current, player: { ...next.player, respecsRemaining: { stat: 3, skill: 3 } } });
    expect(old).toEqual(before);
    expect(() => decodeSave({ ...old, player: { ...player, respecsRemaining: { stat: 0, skill: 0 } } })).toThrow();
    const reserved = { ...old, player: { ...player, respecsRemaining: undefined } };
    expect(() => runMigrations(reserved)).toThrow();
  });
  it.each([undefined, null, {}, { stat: 3, skill: 4 }, { stat: -1, skill: 0 }, { stat: 1, skill: 1.5 }])('rejects present corrupt current counts %j', value => {
    const save = sample(); expect(() => decodeSave({ ...save, player: { ...save.player, respecsRemaining: value } })).toThrow();
  });
});
