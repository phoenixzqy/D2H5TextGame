// @vitest-environment node
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createServer, type ViteDevServer } from 'vite';
import Ajv, { type AnySchema, type ValidateFunction } from 'ajv';
import type { PrecompiledSaveSchema } from '../engine/save/schema-validator';
import type { SaveCurrent } from '../engine/types/save';

const root = fileURLToPath(new URL('../../', import.meta.url));
let server: ViteDevServer | undefined;
let cache: string;
let comparisons = 0;
beforeAll(async () => {
  cache = mkdtempSync(path.join(tmpdir(), 'd2-save-precompile-'));
  console.info(`Task-owned Vite cache: ${cache}`);
  server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), cacheDir: cache,
    server: { watch: null, hmr: false }, logLevel: 'error' });
});
afterAll(async () => {
  await server?.close();
  console.info(`Generated save-schema comparisons: ${String(comparisons)}`);
  if (cache) { rmSync(cache, { recursive: true }); expect(existsSync(cache)).toBe(false); }
});

it('compiles the selected native schemas outside the browser save module', async () => {
  if (!server) throw new Error('Vite setup did not complete');
  const result = await server.transformRequest('/src/engine/save/validate.ts');
  expect(result?.code).toBeTruthy();
  expect(result?.code).not.toContain('ajv.compile(');
});

function currentSave(): SaveCurrent {
  return {
    version: 33,
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
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {}, recruitmentProgress: {} },
    map: {
      bounties: {},
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
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 },
      recruitmentState: { srPityCounter: 0, totalPulls: 0, history: [] }
    },
    formation: {
      playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: []
    }
  };
}


type BrowserFactory = (ajv: Ajv, schema: AnySchema, key?: PrecompiledSaveSchema) => () => ValidateFunction;
async function browserFactory(): Promise<BrowserFactory> {
  if (!server) throw new Error('Vite setup did not complete');
  const result = await server.transformRequest('/src/engine/save/schema-validator.ts');
  if (!result) throw new Error('Missing transformed browser factory');
  expect(result.code).toContain('virtual:d2-save-validators');
  const generated = await server.ssrLoadModule('virtual:d2-save-validators') as Record<string, ValidateFunction>;
  // Execute the actual browser factory with its actual generated-module namespace.
  const body = result.code.replace(/^import \* as compiled from [^;]+;/m, '')
    .replace('export function lazySaveValidator', 'function lazySaveValidator');
  const instantiate = runInNewContext('(compiled) => {' + body + '\nreturn lazySaveValidator;}') as
    (compiled: Record<string, ValidateFunction>) => BrowserFactory;
  return instantiate(generated);
}

it.each(['current33', 'frozen32', 'ledger'] as const)(
  'preserves %s errors, input, metadata and checks after mutation without browser compilation', async key => {
    if (!server) throw new Error('Vite setup did not complete');
    await server.ssrLoadModule('/src/engine/save/validate.ts');
    const { precompiledSaveSchemas } = await server.ssrLoadModule('/src/engine/save/schema-validator.ts') as {
      precompiledSaveSchemas: Record<PrecompiledSaveSchema, AnySchema>
    };
    const schema = precompiledSaveSchemas[key];
    const original = new Ajv({ strictNumbers: true }).compile(schema);
    const ajv = new Ajv({ strictNumbers: true }), compile = vi.spyOn(ajv, 'compile');
    const get = (await browserFactory())(ajv, schema, key);
    const validate = get();
    expect(get()).toBe(validate);
    expect(validate.schema).toBe(schema);
    const save = currentSave();
    const valid: Record<string, unknown> = key === 'ledger'
      ? { questItems: { 'fixture-source': { itemId: 'fixture-item', state: 'owned' } },
        questProgress: { 'fixture-quest': { id: 'fixture-quest', status: 'inProgress', objectives: { find: true } } } }
      : { ...save, version: key === 'current33' ? 33 : 32 };
    expect(original(valid)).toBe(true);
    const compare = (value: unknown) => {
      const before = structuredClone(value), admitted = original(value), errors = structuredClone(original.errors);
      expect(validate(value)).toBe(admitted);
      expect(validate.errors).toEqual(errors);
      expect(value).toEqual(before);
      comparisons++;
    };
    for (const value of [valid, null, [], {}, 0, true, 'invalid', NaN, Infinity, new Map(), new Set()]) compare(value);
    // Corrupt every nested fixture property, including required numeric/boolean/enum fields.
    function corrupt(node: Record<string, unknown>, path: string[]) {
      for (const [field, value] of Object.entries(node)) {
        const parts = [...path, field];
        for (const replacement of [null, undefined, NaN, Infinity, [], {}, 'invalid', -1]) {
          const candidate = structuredClone(valid);
          let target = candidate;
          for (const part of path) target = target[part] as Record<string, unknown>;
          target[field] = replacement;
          compare(candidate);
        }
        const missing = structuredClone(valid);
        let target = missing;
        for (const part of path) target = target[part] as Record<string, unknown>;
        Reflect.deleteProperty(target, field);
        compare(missing);
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          corrupt(value as Record<string, unknown>, parts);
        }
      }
    }
    corrupt(valid, []);
    expect(validate(valid)).toBe(true);
    // Reusing the same previously admitted object must never cache its admission.
    const field = key === 'ledger' ? 'questItems' : 'version';
    valid[field] = null;
    expect(validate(valid)).toBe(false);
    expect(validate.errors).toEqual((original(valid), original.errors));
    expect(validate(currentSave())).toBe(key === 'current33');
    if (key === 'current33') expect(validate.errors).toBeNull();
    expect(compile).not.toHaveBeenCalled();
    compile.mockRestore();
  }, 30000);

it('keeps unselected historical schemas lazy with the caller compiler and schema identity', async () => {
  const schema = { type: 'number' }, ajv = new Ajv({ strictNumbers: true });
  const compile = vi.spyOn(ajv, 'compile');
  const get = (await browserFactory())(ajv, schema);
  expect(compile).not.toHaveBeenCalled();
  const check = get();
  expect(check.schema).toBe(schema);
  expect(check(3)).toBe(true);
  expect(check(NaN)).toBe(false);
  expect(get()).toBe(check);
  expect(compile).toHaveBeenCalledTimes(1);
  compile.mockRestore();
});

it('resolves generated save validators through real development HTTP imports', async () => {
  if (!server) throw new Error('Vite setup did not complete');
  if (!server.httpServer?.listening) await server.listen(0);
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Missing development listener');
  const origin = `http://localhost:${String(address.port)}`;
  // Register the virtual dependency through its normal application importer.
  const importer = await fetch(origin + '/src/engine/save/schema-validator.ts');
  expect(importer.status).toBe(200);
  const response = await fetch(origin + '/@id/__x00__virtual:d2-save-validators');
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('export');
  const generated = server.moduleGraph.getModuleById('\0virtual:d2-save-validators');
  if (!generated) throw new Error('Missing generated validator module');
  const dependencies = [...generated.importedModules].map(module => module.url);
  expect(dependencies).not.toContain('/src/engine');
  expect(dependencies).not.toContain('/src/data');
}, 30000);
