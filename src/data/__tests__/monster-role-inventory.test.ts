import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { monsters } from '../index';
import { getSkill, loadDefaultSkills } from '../../engine/skills/registry';

interface InventoryRow {
  readonly id: string;
  readonly definition: { readonly path: string; readonly pointer: string };
  readonly contexts: readonly { readonly path: string; readonly pointer: string }[];
  readonly skills: readonly string[];
  readonly canonicalAliases: readonly string[];
  readonly numeric: { readonly attack: readonly number[] | null; readonly attackGrowth: readonly number[] | null;
    readonly status: string; readonly acceptance: string };
  readonly action: { readonly status: string };
  readonly contextCoverage: { readonly nativePlanner: string; readonly quests: string };
  readonly chapterOverride: { readonly rationale: string };
}
// Documentation is runtime test input, not a huge inferred JSON union in tsc.
const inventory = JSON.parse(readFileSync(path.resolve('docs/plans/monster-role-inventory.json'), 'utf8')) as {
  readonly version: number; readonly rows: readonly InventoryRow[];
};
const rows = inventory.rows;
describe('monster role inventory source integrity', () => {
  it('covers exactly every bundled definition once', () => {
    expect(inventory.version).toBe(1);
    expect(rows).toHaveLength(111);
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
    expect(rows.map(row => row.id).sort()).toEqual(monsters.map(row => row.id).sort());
  });
  it('keeps current numeric and action fields synchronized without granting balance acceptance', () => {
    loadDefaultSkills();
    for (const row of rows) {
      expect(row.canonicalAliases).toEqual(row.skills.map(id => getSkill(id)?.id));
      const def = monsters.find(candidate => candidate.id === row.id);
      if (!def) throw new Error('Missing row');
      expect(row.skills).toEqual(def.skills);
      expect(row.numeric.attack).toEqual(def.attack ?? null);
      expect(row.numeric.attackGrowth).toEqual(def.attackGrowth ?? null);
      expect(row.numeric.status).toBe(def.attack ? 'authored' : 'pending');
      expect(Boolean(def.attack)).toBe(Boolean(def.attackGrowth));
      expect(row.numeric.acceptance).toBe('unaccepted');
      expect(['ordinary', 'explicit-basic', 'generic-first', 'generic-later', 'fallback-open', 'spell-covered'])
        .toContain(row.action.status);
      expect(row.contextCoverage.nativePlanner).toBe('pending');
      expect(row.contextCoverage.quests).toBe('pending');
      expect(row.chapterOverride.rationale.length).toBeGreaterThan(20);
    }
  });
  it('resolves every definition and literal authored reference by JSON pointer', () => {
    const cache = new Map<string, unknown>();
    for (const row of rows) {
      for (const ref of [row.definition, ...row.contexts]) {
        expect(ref.path.startsWith('src/data/')).toBe(true);
        expect(ref.path.split('/')).not.toContain('..');
        let value: unknown = cache.get(ref.path);
        if (!cache.has(ref.path)) {
          value = JSON.parse(readFileSync(path.resolve(ref.path), 'utf8'));
          cache.set(ref.path, value);
        }
        for (const key of ref.pointer.split('/').slice(1)) {
          if (typeof value !== 'object' || value === null) throw new Error('Broken inventory pointer');
          value = Reflect.get(value, key.replace(/~1/g, '/').replace(/~0/g, '~'));
        }
        if (ref === row.definition) expect(value).toMatchObject({ id: row.id });
        else expect(value).toBe(row.id);
      }
    }
  });
});
