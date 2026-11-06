// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import Ajv2020, { type AnySchema, type ValidateFunction } from 'ajv/dist/2020';

const root = fileURLToPath(new URL('../../', import.meta.url));
let server: ViteDevServer | undefined;
let cache: string;
let comparisons = 0;
function devServer(): ViteDevServer {
  if (!server) throw new Error('Vite setup did not complete');
  return server;
}
beforeAll(async () => {
  cache = mkdtempSync(path.join(tmpdir(), 'd2-authored-precompile-'));
  console.info(`Task-owned Vite cache: ${cache}`);
  server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), cacheDir: cache,
    server: { watch: null, hmr: false }, logLevel: 'error' });
});
afterAll(async () => {
  await server?.close();
  if (cache) { rmSync(cache, { recursive: true }); expect(existsSync(cache)).toBe(false); }
  console.info(`Generated authored-schema comparisons: ${String(comparisons)}`);
});

it('compiles authored data outside the browser loader modules', async () => {
  for (const name of ['quests', 'materials', 'socket-effects', 'recruitment', 'quest-items', 'counted-quest-items']) {
    const result = await devServer().transformRequest(`/src/data/loaders/${name}.ts`);
    expect(result?.code).toBeTruthy();
    expect(result?.code).not.toContain('ajv.compile(');
  }
  const factory = await devServer().transformRequest('/src/data/authored-validators.ts');
  expect(factory?.code).toBeTruthy();
  expect(factory?.code).not.toContain('ajv.compile(');
});

it('precompiles the remaining startup data loaders before browser module evaluation', async () => {
  for (const name of ['quest-actions', 'quest-rewards', 'quest-table-rewards', 'classes',
    'act5-runtime', 'cow-runtime', 'endgame', 'replay-profiles', 'anya-vendor', 'material-recipes']) {
    const result = await devServer().transformRequest(`/src/data/loaders/${name}.ts`);
    expect(result?.code).toBeTruthy();
    expect(result?.code).not.toMatch(/\.compile(?:<[^>]+>)?\(/);
  }
});

it('precompiles reset policy with its original first-error configuration', async () => {
  const result = await devServer().transformRequest('/src/data/loaders/respec.ts');
  expect(result?.code).toBeTruthy();
  expect(result?.code).not.toMatch(/\.compile(?:<[^>]+>)?\(/);
});

it('precompiles kill XP policy before browser module evaluation', async () => {
  const result = await devServer().transformRequest('/src/data/loaders/kill-xp.ts');
  expect(result?.code).toBeTruthy();
  expect(result?.code).not.toMatch(/\.compile(?:<[^>]+>)?\(/);
});

it('precompiles combat policies and presentation contracts before browser module evaluation', async () => {
  const paths = ["src/engine/combat/mitigation-definition.ts", "src/engine/combat/plague-definition.ts", "src/engine/combat/chill-definition.ts", "src/engine/combat/recovery-definition.ts", "src/engine/combat/mana-burn-definition.ts", "src/engine/combat/damage-delivery.ts", "src/engine/skills/skeletal-mage-signatures.ts", "src/engine/skills/assassin-traps.ts", "src/engine/skills/blood-golem.ts", "src/engine/skills/necromancer-summon-definition.ts", "src/engine/skills/assassin-shadow-skills.ts", "src/engine/skills/blood-raven.ts", "src/engine/skills/druid-summon-definition.ts", "src/engine/skills/fire-golem.ts", "src/engine/skills/amazon-summon-definition.ts", "src/engine/skills/assassin-summon-definition.ts", "src/engine/skills/assassin-charges.ts", "src/engine/skills/assassin-flight.ts", "src/ui/imageOverrides.ts", "src/features/quests/faraContract.ts", "src/features/quests/anyaContract.ts"];
  for (const file of paths) {
    const result = await devServer().transformRequest('/' + file);
    expect(result?.code).toBeTruthy();
    expect(result?.code).not.toMatch(/\.compile(?:<[^>]+>)?\(/);
  }
});

const cases = [
  ['quests', 'quest', ['quests/main.json', 'quests/side.json'], false],
  ['materials', 'materials', ['items/materials.json'], false],
  ['economy', 'material-economy', ['loot/material-economy.json'], false],
  ['gems', 'gem-effects', ['items/gem-effects.json'], false],
  ['rune', 'rune', ['items/runes.json'], true],
  ['runeword', 'runeword', ['items/runewords.json'], true],
  ['banner', 'banner', ['gacha/banner-config.json'], false],
  ['mercs', 'merc', ['gacha/mercenaries.json'], false],
  ['questItems', 'quest-item', ['quests/items.json'], false],
  ['countedItems', 'counted-quest-item', ['quests/counted-items.json'], false],
  ['questActions', 'quest-action', ['quests/actions.json'], false],
  ['questUnique', 'quest-unique-profile', ['quest-rewards/act3-gidbinn-ring-v1.json'], false],
  ['questTable', 'quest-table-profile', ['quest-rewards/act4-jamella-perfect-gem-v1.json'], false],
  ['classes', 'class', ['classes/amazon.json', 'classes/assassin.json', 'classes/barbarian.json',
    'classes/druid.json', 'classes/necromancer.json', 'classes/paladin.json', 'classes/sorceress.json'], false],
  ['act5', 'act5-runtime', ['quests/act5-runtime.json'], false],
  ['cow', 'cow-runtime', ['quests/cow-runtime.json'], false],
  ['endgame', 'endgame', ['endgame/worldstone-remnant.json'], false],
  ['replay', 'replay-profiles', ['maps/replay-profiles.json'], false],
  ['anya', 'anya-vendor', ['vendors/anya-uniques-v1.json'], false],
  ['recipes', 'material-recipes', ['items/material-recipes.json'], false],
  ['respec', 'respec', ['respec.json'], false],
  ['killXp', 'kill-xp', ['progression/kill-xp.json'], false],
  ['mitigation', 'mitigation', ['combat/mitigation.json'], false],
  ['plague', 'plague', ['combat/plague.json'], false],
  ['chill', 'chill', ['combat/chill.json'], false],
  ['recovery', 'recovery', ['combat/recovery.json'], false],
  ['manaBurn', 'mana-burn', ['combat/mana-burn.json'], false],
  ['damageDelivery', 'damage-delivery', ['combat/damage-delivery.json'], false],
  ['mageSignatures', 'skeletal-mage-signatures', ['summons/skeletal-mage-signatures.json'], false],
  ['traps', 'assassin-traps', ['combat/assassin-traps.json'], false],
  ['bloodGolem', 'blood-golem', ['summons/blood-golem.json'], false],
  ['necromancerSummons', 'necromancer-summons', ['summons/necromancer.json'], false],
  ['shadowSkills', 'assassin-shadow-skills', ['summons/assassin-shadow-skills.json'], false],
  ['monsters', 'monster', ['monsters/act1.json'], true],
  ['druidSummons', 'druid-summons', ['summons/druid.json'], false],
  ['fireGolem', 'fire-golem', ['summons/fire-golem.json'], false],
  ['amazonSummons', 'amazon-summons', ['summons/amazon.json'], false],
  ['assassinSummons', 'assassin-summons', ['summons/assassin.json'], false],
  ['charges', 'assassin-charges', ['combat/assassin-charges.json'], false],
  ['flight', 'assassin-flight', ['combat/assassin-flight.json'], false],
  ['imageOverrides', 'image-overrides', ['image-overrides.json'], false],
  ['dialogue', 'dialogue', ['dialogue/act2/fara.json', 'dialogue/act5/anya.json'], false]
] as const;

it.each(cases)('preserves %s admissions, complete errors, metadata and fresh input checks', async (name, schemaName, files, each) => {
  const firstError = name === 'respec';
  const generated = await devServer().ssrLoadModule(firstError
    ? 'virtual:d2-authored-first-error-validators' : 'virtual:d2-authored-validators') as Record<string, ValidateFunction>;
  const registries = await devServer().ssrLoadModule('/src/data/authored-schemas.ts') as {
    authoredSchemas: Record<string, AnySchema>; authoredFirstErrorSchemas: Record<string, AnySchema>
  };
  const registry = firstError ? registries.authoredFirstErrorSchemas : registries.authoredSchemas;
  const rawSchema: unknown = JSON.parse(readFileSync(path.join(root, `src/data/schema/${schemaName}.schema.json`), 'utf8'));
  const schema = (name === 'mercs' ? { type: 'array', minItems: 1, items: rawSchema } : rawSchema) as AnySchema;
  expect(registry[name]).toEqual(schema);
  const validate = generated[name];
  if (!validate) throw new Error(`Missing generated validator: ${name}`);
  expect(validate.schema).toBe(registry[name]);
  const original = new Ajv2020(firstError ? { strict: true } : { strict: true, allErrors: true }).compile(schema);
  const values: unknown[] = [];
  for (const file of files) {
    const data: unknown = JSON.parse(readFileSync(path.join(root, 'src/data', file), 'utf8'));
    if (each) { if (!Array.isArray(data)) throw new Error('Expected catalog rows'); values.push(...data as unknown[]); }
    else values.push(data);
  }
  const malformed: unknown[] = [null, [], {}, 0, true, 'invalid'];
  for (const value of values) {
    if (Array.isArray(value)) {
      const items = value as unknown[];
      malformed.push([...items, null], items.map(() => ({})));
    } else if (value && typeof value === 'object') {
      malformed.push({ ...value, id: false, extraField: true });
      for (const key of Object.keys(value)) malformed.push({ ...value, [key]: null });
    }
  }
  for (const value of [...values, ...malformed]) {
    const before = structuredClone(value), admitted = original(value), errors = structuredClone(original.errors);
    expect(validate(value)).toBe(admitted);
    expect(validate.errors).toEqual(errors);
    expect(value).toEqual(before);
    comparisons++;
  }
  const mutable = structuredClone(values[0]);
  expect(validate(mutable)).toBe(true);
  if (Array.isArray(mutable)) mutable.push(null);
  else {
    const shape = schema as { required?: readonly string[]; const?: Record<string, unknown> };
    const required = shape.required?.[0] ?? Object.keys(shape.const ?? {})[0];
    if (!required || !mutable || typeof mutable !== 'object') throw new Error('Expected required object field');
    (mutable as Record<string, unknown>)[required] = null;
  }
  expect(original(mutable)).toBe(false);
  expect(validate(mutable)).toBe(false);
  expect(validate.errors).toEqual(original.errors);
  comparisons++;
  for (const value of values) {
    expect(validate(null)).toBe(false);
    expect(validate.errors).not.toBeNull();
    expect(validate(value)).toBe(true);
    expect(validate.errors).toBeNull();
  }
}, 30000);

it.each(['virtual:d2-authored-validators', 'virtual:d2-authored-first-error-validators'])(
  'resolves %s through real development HTTP imports', async id => {
    const vite = devServer();
    if (!vite.httpServer?.listening) await vite.listen(0);
    const address = vite.httpServer?.address();
    if (!address || typeof address === 'string') throw new Error('Missing development listener');
    const origin = `http://localhost:${String(address.port)}`;
    // Resolve the importing application module first, as the browser does.
    // Directly loading an unregistered virtual module omits its graph imports.
    const importer = await fetch(origin + '/src/data/authored-validators.ts');
    expect(importer.status).toBe(200);
    const response = await fetch(`${origin}/@id/__x00__${id}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('export');
  }, 30000);
