import { describe, expect, it } from 'vitest';
import sorceress from '../../../src/data/classes/sorceress.json';
import barbarian from '../../../src/data/classes/barbarian.json';
import act1 from '../../../src/data/maps/sub-areas/act1.json';
import {
  fingerprintEntries,
  fingerprintFixture,
  parseFixture,
  parseRunProvenance
} from './fixture';

const references = { classes: [sorceress, barbarian], areas: act1 };
const example = {
  fixtureVersion: 1,
  id: 'fresh-sorceress-blood-moor-v1',
  origin: {
    kind: 'new-character',
    classId: 'sorceress',
    name: 'SimSorceress',
    policy: 'production-creation-defaults'
  },
  scenario: {
    act: 1,
    subAreaId: 'areas/act1-blood-moor',
    mode: 'manual',
    challengeOrdinal: 0,
    idleEliteMisses: 0
  },
  clockEpochMs: 1792454400000,
  seeds: [1],
  mercPolicy: 'none',
  summonPolicy: 'production-default'
};

describe('fresh production fixture boundary', () => {
  it('accepts a recipe referencing real production class and area data without mutation', () => {
    const input = structuredClone(example);
    expect(parseFixture(input, references)).toEqual(example);
    expect(input).toEqual(example);
    expect(parseFixture(input, references)).not.toBe(input);
  });

  it.each([
    { ...example, fixtureVersion: 2 },
    { ...example, origin: { ...example.origin, classId: 'unknown' } },
    { ...example, origin: { ...example.origin, classId: 'classes/sorceress' } },
    { ...example, origin: { ...example.origin, level: 90 } },
    { ...example, damage: 10000 },
    { ...example, scenario: { ...example.scenario, subAreaId: 'blood-moor' } },
    { ...example, scenario: { ...example.scenario, subAreaId: 'areas/unknown' } },
    { ...example, scenario: { ...example.scenario, act: 2 } },
    { ...example, scenario: { ...example.scenario, mode: 'idle' } },
    { ...example, scenario: { ...example.scenario, challengeOrdinal: 1 } },
    { ...example, scenario: { ...example.scenario, cleared: true } },
    { ...example, clockEpochMs: Number.MAX_SAFE_INTEGER + 1 },
    { ...example, clockEpochMs: Infinity },
    { ...example, seeds: [] },
    { ...example, seeds: [1, 1] },
    { ...example, seeds: [-1] },
    { ...example, seeds: [0.5] },
    { ...example, seeds: [2 ** 32] },
    { ...example, seeds: [NaN] },
    { ...example, seeds: Array.from({ length: 257 }, (_, i) => i) }
  ])('rejects malformed recipes, unsupported scope and progression overrides %#', (input) => {
    expect(() => parseFixture(input, references)).toThrow();
  });

  it('rejects a canonical area that is absent or belongs to a different act', () => {
    expect(() => parseFixture(example, { ...references, areas: [] })).toThrow();
    expect(() =>
      parseFixture(example, {
        ...references,
        areas: [{ id: 'areas/act1-blood-moor', actId: 'acts/act2' }]
      })
    ).toThrow();
  });

  it('accepts unsigned seed endpoints without coercing strings', () => {
    expect(parseFixture({ ...example, seeds: [0, 2 ** 32 - 1] }, references).seeds).toEqual([
      0, 4294967295
    ]);
    expect(() => parseFixture({ ...example, seeds: ['1'] }, references)).toThrow();
  });
});

describe('measurement provenance', () => {
  const entries = [
    { path: 'src/a.ts', bytes: new Uint8Array([0, 1, 255]) },
    { path: 'src/b.ts', bytes: new TextEncoder().encode('hello\nworld') }
  ] as const;

  it('hashes sorted relative paths and exact bytes regardless of enumeration order', () => {
    expect(fingerprintEntries(entries)).toMatch(/^[a-f0-9]{64}$/u);
    expect(fingerprintEntries([...entries].reverse())).toBe(fingerprintEntries(entries));
    expect(fingerprintEntries([{ path: 'a', bytes: new TextEncoder().encode('bc') }])).not.toBe(
      fingerprintEntries([{ path: 'ab', bytes: new TextEncoder().encode('c') }])
    );
    expect(
      fingerprintEntries([{ path: 'renamed.ts', bytes: entries[0].bytes }, entries[1]])
    ).not.toBe(fingerprintEntries(entries));
    expect(
      fingerprintEntries([{ path: 'src/a.ts', bytes: new Uint8Array([0, 2, 255]) }, entries[1]])
    ).not.toBe(fingerprintEntries(entries));
  });

  it.each(['/absolute', '../escape', 'src/../a', 'src\\a', './a', 'a//b', 'C:/a', ''])(
    'rejects noncanonical fingerprint paths %s',
    (path) => {
      expect(() => fingerprintEntries([{ path, bytes: new Uint8Array() }])).toThrow();
    }
  );

  it('rejects duplicate paths instead of hiding ambiguous inputs', () => {
    expect(() => fingerprintEntries([entries[0], entries[0]])).toThrow();
  });

  it('fingerprints fixture values canonically and changes with a seed or build recipe', () => {
    const fixture = parseFixture(example, references);
    const reordered = parseFixture(
      Object.fromEntries(
        Object.entries({
          ...example,
          origin: Object.fromEntries(Object.entries(example.origin).reverse()),
          scenario: Object.fromEntries(Object.entries(example.scenario).reverse())
        }).reverse()
      ),
      references
    );
    expect(fingerprintFixture(reordered)).toBe(fingerprintFixture(fixture));
    expect(fingerprintFixture(parseFixture({ ...example, seeds: [2] }, references))).not.toBe(
      fingerprintFixture(fixture)
    );
    expect(
      fingerprintFixture(
        parseFixture(
          { ...example, origin: { ...example.origin, classId: 'barbarian' } },
          references
        )
      )
    ).not.toBe(fingerprintFixture(fixture));
  });

  it('requires complete source, data, fixture and tool provenance', () => {
    const provenance = {
      sourceSha: 'a'.repeat(40),
      sourceTreeHash: 'b'.repeat(64),
      dataHash: 'c'.repeat(64),
      fixtureHash: 'd'.repeat(64),
      fixtureVersion: 1,
      nodeVersion: '24.21.0',
      vitestVersion: '1.6.1'
    };
    expect(parseRunProvenance(provenance)).toEqual(provenance);
    for (const key of Object.keys(provenance)) {
      const missing = Object.fromEntries(
        Object.entries(provenance).filter(([entryKey]) => entryKey !== key)
      );
      expect(() => parseRunProvenance(missing)).toThrow();
      expect(() => parseRunProvenance({ ...provenance, [key]: '' })).toThrow();
    }
    expect(() => parseRunProvenance({ ...provenance, sourceSha: 'unknown' })).toThrow();
    expect(() => parseRunProvenance({ ...provenance, nodeVersion: 'unknown' })).toThrow();
    expect(() => parseRunProvenance({ ...provenance, vitestVersion: 'unknown' })).toThrow();
  });
});
