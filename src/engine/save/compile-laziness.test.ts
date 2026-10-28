/**
 * Conditional regression candidate; intended destination:
 * src/engine/save/compile-laziness.test.ts.
 * No production helpers run before the observed validation-module import.
 */
import { describe, expect, it, vi } from 'vitest';
import type { ValidateFunction } from 'ajv';
import type { SaveCurrent } from '../types/save';

/** Constructed empty native24 payload: no earned quest/replay/item entitlements. */
function currentSave(): SaveCurrent {
  return {
    version: 24,
    timestamp: 1000,
    player: {
      id: 'compile-regression', name: 'Compile regression', type: 'player', team: 'player',
      class: 'sorceress', level: 1,
      coreStats: { strength: 10, dexterity: 25, vitality: 10, energy: 35 },
      derivedStats: {
        life: 40, lifeMax: 40, mana: 35, manaMax: 35, attack: 10, defense: 0,
        magicResist: 0, attackSpeed: 1, critChance: 0, critDamage: 1.5,
        physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
        resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 }
      },
      statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true,
      turnOrder: 0, experience: 0, experienceToNextLevel: 100,
      statPoints: 0, skillPoints: 0, equipment: [], respecsRemaining: { stat: 3, skill: 3 }
    },
    inventory: {
      backpack: [], stash: [], equipped: {}, currencies: {}, questItems: {},
      questServices: {}, legacyGearQuarantine: [], materials: {},
      socketQuarantine: [], materialActionOrdinal: 0
    },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: {
      currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [],
      questProgress: {}, questReceipts: {}, questTitles: {}, questDifficulties: {},
      selectedTitle: null, selectedDifficulty: 'normal', nightmareClearedSubAreas: [],
      hellClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0, hell: 0 }
    },
    endgame: {
      attemptOrdinal: 0, clearCounts: { ashen: 0, glacial: 0 }, achievementRewardClaimed: false
    },
    meta: {
      settings: {
        locale: 'zh-CN', stealthMode: false, soundEnabled: false, musicEnabled: false,
        combatSpeed: 1, autoCombat: false
      },
      idleState: {
        lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1
      },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 }
    },
    formation: {
      playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: []
    }
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function synchronousError(action: () => unknown): Error {
  try {
    action();
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('Expected the save boundary to throw synchronously');
}

describe('save structural schema compilation', () => {
  it('defers unused save versions and reuses real compiled code without caching validation outcomes', async () => {
    vi.resetModules();
    const { default: Ajv } = await import('ajv');
    // Default spy behavior calls the original method. No schema/compiler replacement.
    const compile = vi.spyOn(Ajv.prototype, 'compile');
    try {
      // Type-only imports and the inline fixture above cannot warm this module.
      const { validateSave } = await import('./validate');
      const saveCompilations = () => compile.mock.calls.flatMap(([schema], index) => {
        const candidate: unknown = schema;
        // Only the root properties.version distinguishes save schemas; no schema-ID,
        // nested version, Ajv instance, import count or unrelated compiler assumptions.
        if (!record(candidate) || !record(candidate.properties) ||
          !Object.hasOwn(candidate.properties, 'version')) return [];
        return [{ schema: candidate, version: candidate.properties.version,
          result: compile.mock.results[index] }];
      });
      const saveCompilationsAtImport = saveCompilations();

      const fixture = currentSave();
      const input = { ...fixture, player: { ...fixture.player }, timestamp: 'invalid' as unknown };
      const beforeFirstFailure = structuredClone(input);
      const firstError = synchronousError(() => validateSave(input));
      expect(firstError.message).toMatch(/^Invalid save:/);
      expect(firstError.message).toContain('timestamp');
      expect(firstError.message).toContain('must be number');
      expect(input).toEqual(beforeFirstFailure);

      const currentCompilations = () => saveCompilations().filter(call =>
        record(call.version) && call.version.const === 24);
      const currentCalls = currentCompilations();
      expect(currentCalls).toHaveLength(1);
      const first = currentCalls[0];
      if (!first || first.result?.type !== 'return') {
        throw new Error('Expected one real synchronous save-schema compilation');
      }
      const compiled = first.result.value as ValidateFunction;
      expect(compiled).toBeTypeOf('function');
      expect(compiled.schema).toBe(first.schema);
      expect(compiled.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ instancePath: '/timestamp', keyword: 'type' })
      ]));

      input.timestamp = 1000;
      expect(validateSave(input)).toEqual(input);
      expect(compiled.errors).toBeNull();

      // Mutate the same previously accepted object: results must never be memoized.
      input.player.level = 0;
      const beforeSecondFailure = structuredClone(input);
      const secondError = synchronousError(() => validateSave(input));
      expect(secondError.message).toMatch(/^Invalid save:/);
      expect(secondError.message).toContain('level');
      expect(secondError.message).toContain('>= 1');
      expect(input).toEqual(beforeSecondFailure);
      expect(compiled.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ instancePath: '/player/level', keyword: 'minimum' })
      ]));
      expect(compiled.errors).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ instancePath: '/timestamp' })
      ]));

      input.player.level = 1;
      expect(validateSave(input)).toEqual(input);
      expect(compiled.errors).toBeNull();
      expect(currentCompilations()[0]?.result?.value).toBe(compiled);
      // Establish fixture/real-validator behavior before the import resource contract.
      expect(saveCompilationsAtImport).toEqual([]);
      expect(saveCompilations().map(call => call.version)).toEqual([{ const: 24 }]);
      expect(saveCompilations()).toHaveLength(1);
    } finally {
      compile.mockRestore();
      vi.resetModules();
    }
  });
});
