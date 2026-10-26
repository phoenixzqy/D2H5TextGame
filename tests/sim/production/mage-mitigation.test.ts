import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { RecordedBattleEvent, RecordedBattleResult } from '@/engine/combat/combat';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { recordMageMitigationSeed, inspectMageMitigationBattle, compareMageMitigationRuns,
  verifyMageMitigationDeterminism, summarizeMageMitigationRuns } from './mage-mitigation-runner';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture } from './mage-mastery-fixture';
import { MAGE_MITIGATION_CASES, MAGE_MITIGATION_RECIPE, buildMageMitigationFixture,
  assertMageMitigationFixture, parseMageMitigationRecipe, type MageMitigationFixture } from './mage-mitigation-fixture';

const sourceHash = '71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1';
const sourceBytesHash = 'af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c';
const cases = ['d00-m00', 'd65-m00', 'd00-m23', 'd65-m23'] as const;
const rehash = (fixture: MageMitigationFixture): MageMitigationFixture => {
  const { hash: _hash, ...body } = fixture;
  return { ...body, hash: mageJsonHash(body) };
};

describe('closed synthetic Defense/MR counterfactuals', () => {
  it('anchors to the exact logical and serialized Mastery0 source', () => {
    const source = buildMageMasteryFixture(0);
    expect(source.hash).toBe(sourceHash);
    expect(createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex')).toBe(sourceBytesHash);
    expect(Object.keys(MAGE_MITIGATION_CASES)).toEqual(cases);
  });

  it.each(cases)('changes only enemy Defense/MR in %s and never mutates the source', caseId => {
    const source = buildMageMasteryFixture(0), before = JSON.stringify(source);
    const fixture = buildMageMitigationFixture(caseId), values = MAGE_MITIGATION_CASES[caseId];
    expect(fixture.recipe).toEqual({ ...MAGE_MITIGATION_RECIPE, caseId });
    expect(fixture.source).toEqual({ hash: sourceHash, sha256: sourceBytesHash });
    const expected = structuredClone(source.snapshot);
    for (const enemy of expected.enemyTeam) Object.assign(enemy.stats, values);
    expect(fixture.snapshot).toEqual(expected);
    expect(fixture.allocation).toEqual(source.allocation);
    expect(fixture.overrides).toEqual(source.snapshot.enemyTeam.flatMap(enemy =>
      (['defense', 'magicResist'] as const).flatMap(field => values[field] === enemy.stats[field] ? [] :
        [{ unitId: enemy.id, field, before: enemy.stats[field], after: values[field] }])));
    expect(fixture.overrides).toHaveLength(caseId === 'd65-m23' ? 0 : caseId === 'd00-m00' ? 16 : 8);
    expect(() => assertMageMitigationFixture(fixture, caseId)).not.toThrow();
    expect(buildMageMitigationFixture(caseId)).toEqual(fixture);
    expect(JSON.stringify(source)).toBe(before);
  });

  it('refuses open recipe knobs, missing fields and unknown cases', () => {
    for (const caseId of ['', 'd01-m00', 0, null]) expect(() => buildMageMitigationFixture(caseId)).toThrow();
    for (const change of [{ level: 27 }, { defense: 99 }, { seedStart: 1 }, { sourceHash: 'wrong' },
      { caseId: 'd00-m22' }]) expect(() => parseMageMitigationRecipe({ ...MAGE_MITIGATION_RECIPE, caseId: cases[0], ...change })).toThrow();
    expect(() => parseMageMitigationRecipe(MAGE_MITIGATION_RECIPE)).toThrow();
  });

  it('rejects full-enemy semantic forgeries even after recomputing the wrapper hash', () => {
    const fixture = buildMageMitigationFixture('d00-m00'), enemy = fixture.snapshot.enemyTeam[0]!;
    const enemies = [
      { ...enemy, life: enemy.life + 1 }, { ...enemy, id: 'other' }, { ...enemy, skillOrder: [] },
      ...['lifeMax', 'attack', 'attackSpeed', 'defense', 'magicResist', 'physDodge', 'magicDodge'].map(field =>
        ({ ...enemy, stats: { ...enemy.stats, [field]: 999 } })),
      { ...enemy, stats: { ...enemy.stats, resistances: { ...enemy.stats.resistances, poison: 0 } } },
      { ...enemy, statuses: [{ id: 'chill', stacks: 1, remaining: 99, sourceId: 'synthetic-forgery' }] }
    ];
    for (const bad of enemies) expect(() => assertMageMitigationFixture(rehash({ ...fixture,
      snapshot: { ...fixture.snapshot, enemyTeam: [bad, ...fixture.snapshot.enemyTeam.slice(1)] } }), 'd00-m00')).toThrow();
    expect(() => assertMageMitigationFixture(rehash({ ...fixture, snapshot: { ...fixture.snapshot,
      enemyTeam: [...fixture.snapshot.enemyTeam].reverse() } }), 'd00-m00')).toThrow();
  });
});

describe('outer identity before actual battle recording', () => {
  it('rejects rehashed source, overrides, hero, allocation and unexpected case', () => {
    const fixture = buildMageMitigationFixture('d00-m00'), hero = fixture.snapshot.playerTeam[0]!;
    const bad = [
      { ...fixture, source: { ...fixture.source, hash: 'wrong' } },
      { ...fixture, source: { ...fixture.source, sha256: 'wrong' } },
      { ...fixture, overrides: fixture.overrides.slice(1) },
      { ...fixture, overrides: fixture.overrides.map(row => ({ ...row, before: 0 })) },
      { ...fixture, allocation: { ...fixture.allocation, statPointsUnspent: 0 } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, mana: 999 }] } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, skillLevels: {} }] } },
      { ...fixture, snapshot: { ...fixture.snapshot, act: 1 as const } }
    ];
    for (const value of bad) expect(() => recordMageMitigationSeed(rehash(value), 'd00-m00', 'elemental', 0)).toThrow();
    expect(() => recordMageMitigationSeed(fixture, 'd65-m23', 'elemental', 0)).toThrow();
    expect(() => recordMageMitigationSeed({ ...fixture, hash: 'wrong' }, 'd00-m00', 'elemental', 0)).toThrow();
  });

  it.each(cases)('preserves actual preparation, source-separated totals and complete zero-hit strata in %s', caseId => {
    const fixture = buildMageMitigationFixture(caseId), bytes = JSON.stringify(fixture);
    const run = recordMageMitigationSeed(fixture, caseId, 'elemental', 7);
    expect(run.caseId).toBe(caseId); expect(run.fixtureHash).toBe(fixture.hash);
    expect(run.source).toEqual(fixture.source); expect(run.overrides).toEqual(fixture.overrides);
    expect(run.preparation.startupPayment).toBe(22);
    expect(run.preparation.mages.map(mage => [mage.life, mage.stats.attack, mage.stats.defense])).toEqual(Array(4).fill([123, 45, 10]));
    expect(run.summary.strata).toHaveLength(8);
    expect(new Set(run.summary.strata.map(row => row.mageId)).size).toBe(4);
    for (const field of ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const) {
      expect(run.summary.strata.reduce((sum, row) => sum + row[field], 0)).toBe(run.summary.metrics.mages[field]);
    }
    expect(run.summary.metrics.player.loggedDamage).toBe(run.summary.metrics.hero.loggedDamage + run.summary.metrics.mages.loggedDamage);
    expect(run.summary.metrics.player.effectiveHpRemoved).toBe(run.summary.metrics.hero.effectiveHpRemoved + run.summary.metrics.mages.effectiveHpRemoved);
    expect(JSON.stringify(fixture)).toBe(bytes);
  });

  it('rejects invalid seeds, wrong payment/stats/type and malformed periodic damage', () => {
    const fixture = buildMageMitigationFixture('d65-m23');
    for (const seed of [-1, 1000, 0.5, NaN]) expect(() => recordMageMitigationSeed(fixture, 'd65-m23', 'elemental', seed)).toThrow();
    const run = recordMageMitigationSeed(fixture, 'd65-m23', 'elemental', 0);
    expect(() => inspectMageMitigationBattle(fixture, 'd65-m23', run.recorded, 'physical', 0)).toThrow(/type/);
    for (const mutation of ['payment', 'stats', 'dot'] as const) {
      const events = run.recorded.events.map(event => {
        if (mutation === 'payment' && event.kind === 'mana' && event.reason === 'cast') return { ...event, mana: event.mana + 1 };
        if (mutation === 'stats' && event.kind === 'summon') return { ...event, unit: { ...event.unit, stats: { ...event.unit.stats, attack: 99 } } };
        return event;
      });
      if (mutation === 'dot') events.unshift({ kind: 'dot', target: fixture.snapshot.playerTeam[0]!.id, amount: NaN, simClockMs: 0, uiDelayMs: 50 });
      expect(() => inspectMageMitigationBattle(fixture, 'd65-m23', { ...run.recorded, events }, 'elemental', 0)).toThrow();
    }
  });
});

describe('mitigation literals and bounded interpretation', () => {
  it.each(cases)('matches independently frozen base45 noncrit/crit/dodge resolver literals in %s', caseId => {
    const fixture = buildMageMitigationFixture(caseId), values = MAGE_MITIGATION_CASES[caseId];
    for (const enemy of [fixture.snapshot.enemyTeam[0]!, fixture.snapshot.enemyTeam[3]!]) {
      const flayer = enemy.id.includes('undead-flayer');
      const noncrit = { physical: flayer ? [33, 1] : [45, 1], fire: [45, 1], poison: flayer ? [11, 1] : [45, 1],
        cold: flayer ? [45, 22] : [33, 10], lightning: flayer ? [45, 22] : [33, 10] };
      const critical = { physical: flayer ? [50, 1] : [67, 2], fire: [67, 2], poison: flayer ? [16, 1] : [67, 2],
        cold: flayer ? [67, 44] : [50, 27], lightning: flayer ? [67, 44] : [50, 27] };
      for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison'] as const) {
        for (const crit of [false, true]) {
          const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
            critChance: crit ? 1 : 0, critMult: 1.5, ignoreDodge: true, defenderDodge: 0.05,
            defenderArmor: values.defense, defenderMagicResist: values.magicResist, defenderResistances: enemy.stats.resistances };
          const actual = resolveDamage(input, createRng(7));
          const index = type === 'cold' || type === 'lightning' ? Number(values.magicResist !== 0) : Number(values.defense !== 0);
          expect(actual.final).toBe((crit ? critical : noncrit)[type][index]); expect(actual.crit).toBe(crit);
          expect(resolveDamage({ ...input, ignoreDodge: false, hitChance: 0 }, { ...createRng(7), chance: () => false }).final).toBe(0);
        }
      }
    }
  });

  it('keeps synthetic overkill/zero-hit strata separate from actual engine observations', () => {
    const fixture = buildMageMitigationFixture('d00-m00');
    const actual = recordMageMitigationSeed(fixture, 'd00-m00', 'elemental', 0);
    const hero = fixture.snapshot.playerTeam[0]!, target = fixture.snapshot.enemyTeam[0]!, mages = actual.preparation.mages;
    const events: RecordedBattleEvent[] = [...actual.preparation.events,
      { kind: 'damage', source: hero.id, target: target.id, damageType: 'physical', amount: 100, crit: false, dodged: false, simClockMs: 1000, uiDelayMs: 50 },
      { kind: 'damage', source: mages[0]!.id, target: target.id, damageType: 'fire', amount: 500, crit: false, dodged: false, simClockMs: 1940, uiDelayMs: 50 },
      { kind: 'end', winner: null, simClockMs: 2000, uiDelayMs: 50 }];
    const recorded: RecordedBattleResult = { events, result: { events, winner: null, rounds: 1,
      playerTeam: [{ ...hero, mana: 165 }, ...mages], enemyTeam: fixture.snapshot.enemyTeam.map(unit => ({ ...unit, life: unit.id === target.id ? 0 : unit.life })) } };
    const row = inspectMageMitigationBattle(fixture, 'd00-m00', recorded, 'elemental', 0).summary;
    expect(row.strata[0]).toMatchObject({ attempts: 1, landed: 1, loggedDamage: 500, effectiveHpRemoved: 325, noncritValues: { '500': 1 }, critValues: {} });
    expect(row.strata.slice(1).every(value => value.attempts === 0 && value.loggedDamage === 0)).toBe(true);
    expect(row.metrics.player.effectiveHpRemoved).toBe(425); expect(row.metrics.successfulTtkMs).toBeNull();
  });

  it('checks bounded determinism without registry resets and keeps successful-only nearest-rank quantiles', () => {
    const fixture = buildMageMitigationFixture('d00-m00');
    expect(verifyMageMitigationDeterminism(fixture, 'd00-m00', 'elemental')).toEqual({ repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
    const summary = recordMageMitigationSeed(fixture, 'd00-m00', 'elemental', 0).summary;
    const censored = ['defeat', 'draw'].map(outcome => ({ ...summary, metrics: { ...summary.metrics, outcome, successfulTtkMs: null } }));
    expect(summarizeMageMitigationRuns(censored).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
    const victories = [1000, 2000, 3000, 4000].map(successfulTtkMs => ({ ...summary, metrics: { ...summary.metrics, outcome: 'victory', successfulTtkMs } }));
    expect(summarizeMageMitigationRuns([...censored, ...victories]).successfulTtkMs).toEqual({ count: 4, p50: 2000, p95: 4000 });
    expect(summarizeMageMitigationRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });

  it('rejects shared-wrong outer pair identity against external expectations', () => {
    const fixture = buildMageMitigationFixture('d00-m00'), actual = recordMageMitigationSeed(fixture, 'd00-m00', 'elemental', 0);
    // Synthetic comparator metadata probe; physical execution is independently measured in its real Git domain.
    const before = { ...actual, mode: 'physical' as const };
    expect(compareMageMitigationRuns(before, actual, fixture, 'd00-m00').seed).toBe(0);
    for (const patch of [{ caseId: 'd65-m23' as const }, { source: { ...actual.source, hash: 'wrong' } },
      { source: { ...actual.source, sha256: 'wrong' } }, { overrides: [] }, { fixtureHash: 'wrong' },
      { inputHash: 'wrong' }, { seed: -1 }, { masteryRank: 1 as const }]) {
      expect(() => compareMageMitigationRuns({ ...before, ...patch }, { ...actual, ...patch }, fixture, 'd00-m00')).toThrow();
    }
    expect(() => compareMageMitigationRuns(before, { ...actual, seed: 1 }, fixture, 'd00-m00')).toThrow();
    expect(() => compareMageMitigationRuns(before, { ...actual, preparation: { ...actual.preparation, startupPayment: 21 } }, fixture, 'd00-m00')).toThrow();
  });
});
