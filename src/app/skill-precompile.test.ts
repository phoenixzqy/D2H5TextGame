// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import schema from '../data/schema/skill.schema.json';

const root = fileURLToPath(new URL('../../', import.meta.url));
let server: ViteDevServer | undefined;
let cache: string;
function devServer(): ViteDevServer {
  if (!server) throw new Error('Vite setup did not complete');
  return server;
}
beforeAll(async () => {
  cache = mkdtempSync(path.join(tmpdir(), 'd2-skill-precompile-'));
  console.info(`Task-owned Vite cache: ${cache}`);
  server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), cacheDir: cache,
    server: { watch: null, hmr: false }, logLevel: 'error' });
});
afterAll(async () => {
  await server?.close();
  if (cache) { rmSync(cache, { recursive: true }); expect(existsSync(cache)).toBe(false); }
});

it('serves the browser skill factory without runtime schema compilation', async () => {
  const transformed = await devServer().transformRequest('/src/engine/skills/skill-validator.ts');
  expect(transformed?.code).toBeTruthy();
  expect(transformed?.code).not.toContain('ajv.compile(schema)');
});

it('matches original admissions and complete errors for every authored row and malformed variants', async () => {
  const generated = await devServer().ssrLoadModule('virtual:d2-skill-validator') as { default: ValidateFunction };
  const original = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
  const directory = path.join(root, 'src/data/skills');
  const rows: Record<string, unknown>[] = [];
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
    const data: unknown = JSON.parse(readFileSync(path.join(directory, name), 'utf8'));
    if (!Array.isArray(data)) throw new Error('Expected authored skill array');
    for (const row of data as unknown[]) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Expected authored skill object');
      rows.push(row as Record<string, unknown>);
    }
  }
  const mutations: unknown[] = rows.flatMap(row => [
    { ...row, cooldown: -1 }, { ...row, unknownField: true },
    { ...row, cost: { mana: -1 } }, { ...row, minLevel: '1' }
  ]);
  mutations.push(null, [], 0, 'skill', true, {}, { id: null }, { id: [] }, { id: 1 });
  for (const row of [...rows, ...mutations]) {
    const before = structuredClone(row), admitted = original(row), errors = structuredClone(original.errors);
    expect(generated.default(row)).toBe(admitted);
    expect(generated.default.errors).toEqual(errors);
    expect(row).toEqual(before);
  }
  expect(rows.length).toBeGreaterThan(200);
}, 30000);

it('checks changed tuning again and resets errors after a valid row', async () => {
  const generated = await devServer().ssrLoadModule('virtual:d2-skill-validator') as { default: ValidateFunction };
  const catalog: unknown = JSON.parse(readFileSync(path.join(root, 'src/data/skills/amazon.json'), 'utf8'));
  if (!Array.isArray(catalog)) throw new Error('Expected Amazon skills');
  const row = structuredClone(catalog[0]) as Record<string, unknown>;
  expect(generated.default(row)).toBe(true);
  const cooldown = row.cooldown;
  row.cooldown = -1;
  expect(generated.default(row)).toBe(false);
  expect(generated.default.errors).not.toBeNull();
  row.cooldown = cooldown;
  expect(generated.default(row)).toBe(true);
  expect(generated.default.errors).toBeNull();
});
