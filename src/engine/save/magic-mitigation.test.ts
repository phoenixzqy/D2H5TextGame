import { withoutV17Fields, withV17Defaults } from '../../../tests/helpers/save-fixtures';
import { describe, expect, it } from 'vitest';
import { deriveStats } from '../progression/stats';
import type { DerivedStats } from '../types/attributes';
import type { Player, Mercenary } from '../types/entities';
import { CURRENT_SAVE_VERSION } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';
import { runMigrations } from './migrate';

const core = { strength: 10, dexterity: 25, vitality: 10, energy: 35 };
function currentSave() {
  const player: Player = { id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'sorceress',
    level: 1, coreStats: core, derivedStats: { ...deriveStats(core, 1), life: 17, mana: 3 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
    experience: 5, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1, equipment: [] };
  const merc = (id: string): Mercenary => ({ ...player, id, type: 'mercenary', archetype: 'back', rarity: 'R' });
  return buildSave({ player, timestamp: 1000,
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 19 } },
    mercs: { ownedMercs: [merc('fielded'), merc('bench')], fieldedMercId: 'fielded', mercEquipment: {},
      mercProgress: { fielded: { experience: 9, experienceToNextLevel: 100 } } },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: ['act1.blood-moor'],
      clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: true, musicEnabled: true,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 13, activeMultiplier: 2 },
      gachaState: { currency: 3, ownedMercIds: [], pityCounter: 4 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  });
}
function oldStats(stats: DerivedStats) {
  const { magicResist: _removed, ...old } = stats as DerivedStats & { magicResist?: number };
  return old;
}
function legacySave(version = 8) {
  const save = withoutV17Fields(currentSave());
  const { questItems: _ledger, ...inventory } = save.inventory;
  const { questReceipts: _receipts, ...map } = save.map;
  return { ...save, inventory, map, version, player: { ...save.player, derivedStats: oldStats(save.player.derivedStats) },
    mercs: { ...save.mercs, ownedMercs: save.mercs.ownedMercs.map(m => ({ ...m, derivedStats: oldStats(m.derivedStats) })) } };
}

describe('D04 v9 magic mitigation save boundary', () => {
  it.each([6, 7, 8])('adds MR0 for every actor in genuine legacy v%s alongside existing versioned migrations', version => {
    const legacy = legacySave(version);
    const { formation: _formation, ...withoutFormation } = legacy;
    const input = version === 6 ? withoutFormation : legacy;
    const original = structuredClone(input);
    const output = decodeSave(input);
    expect(input.player.derivedStats).not.toHaveProperty('magicResist');
    expect(input.mercs.ownedMercs.every(m => !Object.hasOwn(m.derivedStats, 'magicResist'))).toBe(true);
    expect(output).toEqual(withV17Defaults({ ...input, version: CURRENT_SAVE_VERSION,
      inventory: { ...input.inventory, questItems: {} },
      map: { ...input.map, questReceipts: {} },
      formation: version === 6 ? {
        playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 },
        summonPositions: [
          { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
          { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 },
          { row: 1, col: 2 }, { row: 0, col: 0 }
        ]
      } : legacy.formation,
      player: { ...input.player, derivedStats: { ...input.player.derivedStats, magicResist: 0 } },
      mercs: { ...input.mercs, ownedMercs: input.mercs.ownedMercs.map(m => ({ ...m,
        derivedStats: { ...m.derivedStats, magicResist: 0 } })) } }));
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(input).toEqual(original);
  });

  it('decodes frozen v9 nonzero MR to current for player, fielded and unfielded mercs without refill', () => {
    const base = withoutV17Fields(currentSave());
    const { questItems: _ledger, ...inventory } = base.inventory;
    const { questReceipts: _receipts, ...map } = base.map;
    const input = { ...base, inventory, map, version: 9, player: { ...base.player,
      derivedStats: { ...base.player.derivedStats, magicResist: 11 } },
      mercs: { ...base.mercs, ownedMercs: base.mercs.ownedMercs.map((m, i) => ({ ...m,
        derivedStats: { ...m.derivedStats, magicResist: 20 + i } })) } };
    expect(runMigrations(input, 9)).toBe(input);
    const expected = withV17Defaults({ ...input, version: CURRENT_SAVE_VERSION, inventory: { ...input.inventory, questItems: {} },
      map: { ...input.map, questReceipts: {} } });
    expect(decodeSave(input)).toEqual(expected);
    expect(decodeSave(toJsonSafe(decodeSave(input)))).toEqual(expected);
  });

  it.each([7, 8])('preserves valid historical MR extensions in v%s', version => {
    const input = legacySave(version);
    const withMR = { ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, magicResist: 17 } },
      mercs: { ...input.mercs, ownedMercs: input.mercs.ownedMercs.map(m => ({ ...m,
        derivedStats: { ...m.derivedStats, magicResist: 23 } })) } };
    expect(decodeSave(withMR)).toEqual(withV17Defaults({ ...withMR, version: CURRENT_SAVE_VERSION,
      inventory: { ...withMR.inventory, questItems: {} }, map: { ...withMR.map, questReceipts: {} } }));
  });

  it.each([7, 8])('rejects malformed historical MR before any v%s compatibility recomposition', version => {
    for (const bad of [undefined, null, '4', NaN, Infinity, -Infinity, -1]) {
      for (const target of ['player', 'merc'] as const) {
        const input = legacySave(version);
        // A proven old Amazon starter would otherwise rederive corrupt player stats.
        const player = { ...input.player, class: 'amazon', equipment: [{ id: 'starter-amazon-bow-123',
          baseId: 'items/base/weapon-bow', rarity: 'normal', level: 1, identified: true,
          equipped: true, equipSlot: 'weapon' }] };
        const source = { ...input, player: target === 'player'
          ? { ...player, derivedStats: { ...player.derivedStats, magicResist: bad } } : player,
          mercs: target === 'merc' ? { ...input.mercs, ownedMercs: input.mercs.ownedMercs.map(m => ({ ...m,
            derivedStats: { ...m.derivedStats, magicResist: bad } })) } : input.mercs };
        expect(() => decodeSave(source), `${target} MR ${String(bad)}`).toThrow('Invalid save');
      }
    }
  });

  it('preserves a valid MR extension through the proven v7 Amazon ownership transfer', () => {
    const input = legacySave(7);
    const source = { ...input, player: { ...input.player, class: 'amazon',
      derivedStats: { ...input.player.derivedStats, magicResist: 17 }, equipment: [
        { id: 'starter-amazon-bow-123', baseId: 'items/base/weapon-bow', rarity: 'normal',
          level: 1, identified: true, equipped: true, equipSlot: 'weapon' }
      ] } };
    const out = decodeSave(source);
    expect(out.player.derivedStats).toMatchObject({ magicResist: 17, life: 17, mana: 3 });
    expect(out.inventory.equipped.weapon?.baseId).toBe('items/base/weapon-bow-training');
    expect(out.player.equipment).toEqual([out.inventory.equipped.weapon]);
  });

  it('requires finite nonnegative MR on every current actor, including an unfielded merc', () => {
    for (const bad of [undefined, null, '4', NaN, Infinity, -Infinity, -1]) {
      const save = currentSave();
      expect(() => decodeSave({ ...save, player: { ...save.player,
        derivedStats: { ...save.player.derivedStats, magicResist: bad } } })).toThrow('Invalid save');
      expect(() => decodeSave({ ...save, mercs: { ...save.mercs,
        ownedMercs: save.mercs.ownedMercs.map(m => m.id === 'bench'
          ? { ...m, derivedStats: { ...m.derivedStats, magicResist: bad } } : m) } })).toThrow('Invalid save');
    }
  });
});
