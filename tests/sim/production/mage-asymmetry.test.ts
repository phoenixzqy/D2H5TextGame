import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { RecordedBattleEvent, RecordedBattleResult } from '@/engine/combat/combat';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { recordMageAsymmetrySeed, inspectMageAsymmetryBattle, compareMageAsymmetryRuns, compareMageAsymmetryControl,
  verifyMageAsymmetryDeterminism, summarizeMageAsymmetryRuns } from './mage-asymmetry-runner';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMitigationFixture } from './mage-mitigation-fixture';
import { MAGE_ASYMMETRY_CASES, MAGE_ASYMMETRY_RECIPE, buildMageAsymmetryFixture,
  assertMageAsymmetryFixture, parseMageAsymmetryRecipe, type MageAsymmetryFixture } from './mage-asymmetry-fixture';

const sourceHash = 'e3eb0805ba668583a8f2d26d986071aab9ede8d68c7cbe7a70702302c4d537dd';
const sourceBytesHash = '5efa93aa26fb17572bd5c4bd1ec4b99871cb20f12f0b4c6d4244e224be6bb2f2';
const cases = ['neutral', 'physical-resist', 'elemental-resist', 'physical-dodge', 'magical-dodge'] as const;
const types = ['physical', 'fire', 'cold', 'lightning', 'poison'] as const;
const rehash = (fixture: MageAsymmetryFixture): MageAsymmetryFixture => {
  const { hash: _hash, ...body } = fixture;
  return { ...body, hash: mageJsonHash(body) };
};

describe('closed synthetic resistance/dodge main effects', () => {
  it('anchors the exact outer and underlying M0 source bytes', () => {
    const source = buildMageMitigationFixture('d00-m00');
    expect(source.hash).toBe(sourceHash);
    expect(createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex')).toBe(sourceBytesHash);
    expect(source.source).toEqual({ hash: '71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1',
      sha256: 'af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c' });
    expect(Object.keys(MAGE_ASYMMETRY_CASES)).toEqual(cases);
  });

  it.each(cases)('changes only the declared resistance/dodge fields in %s', caseId => {
    const source = buildMageMitigationFixture('d00-m00'), before = JSON.stringify(source);
    const fixture = buildMageAsymmetryFixture(caseId), values = MAGE_ASYMMETRY_CASES[caseId];
    const expected = { ...structuredClone(source.snapshot), enemyTeam: source.snapshot.enemyTeam.map(enemy => ({
      ...structuredClone(enemy), stats: { ...structuredClone(enemy.stats), physDodge: values.physDodge, magicDodge: values.magicDodge,
        resistances: { ...enemy.stats.resistances, physical: values.physicalResist, fire: values.elementalResist,
          cold: values.elementalResist, lightning: values.elementalResist, poison: values.elementalResist } }
    })) };
    expect(fixture.recipe).toEqual({ ...MAGE_ASYMMETRY_RECIPE, caseId });
    expect(fixture.source).toEqual({ hash: sourceHash, sha256: sourceBytesHash, mastery: source.source });
    expect(fixture.snapshot).toEqual(expected); expect(fixture.allocation).toEqual(source.allocation);
    const overrides = source.snapshot.enemyTeam.flatMap((enemy, index) => {
      const stats = expected.enemyTeam[index]!.stats;
      return [...types.flatMap(type => enemy.stats.resistances[type] === stats.resistances[type] ? [] :
        [{ unitId: enemy.id, field: 'resistances.' + type, before: enemy.stats.resistances[type], after: stats.resistances[type] }]),
      ...(['physDodge', 'magicDodge'] as const).flatMap(field => enemy.stats[field] === stats[field] ? [] :
        [{ unitId: enemy.id, field, before: enemy.stats[field], after: stats[field] }])];
    });
    expect(fixture.overrides).toEqual(overrides);
    expect(fixture.overrides).toHaveLength([16, 18, 32, 24, 24][cases.indexOf(caseId)]!);
    expect(() => assertMageAsymmetryFixture(fixture, caseId)).not.toThrow();
    expect(buildMageAsymmetryFixture(caseId)).toEqual(fixture); expect(JSON.stringify(source)).toBe(before);
  });

  it('refuses extra/missing recipe knobs and unsupported cases', () => {
    for (const caseId of ['', 'mixed', 0, null]) expect(() => buildMageAsymmetryFixture(caseId)).toThrow();
    for (const patch of [{ level: 27 }, { resist: 25 }, { seed: 7 }, { sourceHash: 'wrong' }, { caseId: 'mixed' }]) {
      expect(() => parseMageAsymmetryRecipe({ ...MAGE_ASYMMETRY_RECIPE, caseId: cases[0], ...patch })).toThrow();
    }
    expect(() => parseMageAsymmetryRecipe(MAGE_ASYMMETRY_RECIPE)).toThrow();
  });

  it('rejects rehashed full-enemy forgeries including arcane and flat mitigation', () => {
    const fixture = buildMageAsymmetryFixture('neutral'), enemy = fixture.snapshot.enemyTeam[0]!;
    const bad = [{ ...enemy, life: 999 }, { ...enemy, id: 'other' }, { ...enemy, skillOrder: [] },
      ...['lifeMax', 'attack', 'attackSpeed', 'defense', 'magicResist', 'physDodge', 'magicDodge'].map(field =>
        ({ ...enemy, stats: { ...enemy.stats, [field]: 999 } })),
      ...[...types, 'arcane' as const].map(type => ({ ...enemy, stats: { ...enemy.stats,
        resistances: { ...enemy.stats.resistances, [type]: 99 } } })),
      { ...enemy, statuses: [{ id: 'chill', stacks: 1, remaining: 99, sourceId: 'synthetic-forgery' }] }];
    for (const unit of bad) expect(() => assertMageAsymmetryFixture(rehash({ ...fixture,
      snapshot: { ...fixture.snapshot, enemyTeam: [unit, ...fixture.snapshot.enemyTeam.slice(1)] } }), 'neutral')).toThrow();
    for (const enemyTeam of [fixture.snapshot.enemyTeam.slice(1), [...fixture.snapshot.enemyTeam].reverse()]) {
      expect(() => assertMageAsymmetryFixture(rehash({ ...fixture, snapshot: { ...fixture.snapshot, enemyTeam } }), 'neutral')).toThrow();
    }
  });
});

describe('outer identity before actual battle recording', () => {
  it('rejects rehashed source, overrides, hero, allocation and unexpected case', () => {
    const fixture = buildMageAsymmetryFixture('neutral'), hero = fixture.snapshot.playerTeam[0]!;
    const bad = [
      { ...fixture, source: { ...fixture.source, hash: 'wrong' } },
      { ...fixture, source: { ...fixture.source, sha256: 'wrong' } },
      { ...fixture, source: { ...fixture.source, mastery: { ...fixture.source.mastery, hash: 'wrong' } } },
      { ...fixture, overrides: fixture.overrides.slice(1) },
      { ...fixture, overrides: fixture.overrides.map(row => ({ ...row, before: 0 })) },
      { ...fixture, allocation: { ...fixture.allocation, statPointsUnspent: 0 } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, mana: 999 }] } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, skillLevels: {} }] } },
      { ...fixture, snapshot: { ...fixture.snapshot, act: 1 as const } }
    ];
    for (const value of bad) expect(() => recordMageAsymmetrySeed(rehash(value), 'neutral', 'elemental', 0)).toThrow();
    expect(() => recordMageAsymmetrySeed(fixture, 'physical-resist', 'elemental', 0)).toThrow();
    expect(() => recordMageAsymmetrySeed({ ...fixture, hash: 'wrong' }, 'neutral', 'elemental', 0)).toThrow();
  });

  it.each(cases)('preserves actual preparation, source-separated totals and complete zero-hit strata in %s', caseId => {
    const fixture = buildMageAsymmetryFixture(caseId), bytes = JSON.stringify(fixture);
    const run = recordMageAsymmetrySeed(fixture, caseId, 'elemental', 7);
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
    const fixture = buildMageAsymmetryFixture('physical-resist');
    for (const seed of [-1, 1000, 0.5, NaN]) expect(() => recordMageAsymmetrySeed(fixture, 'physical-resist', 'elemental', seed)).toThrow();
    const run = recordMageAsymmetrySeed(fixture, 'physical-resist', 'elemental', 0);
    expect(() => inspectMageAsymmetryBattle(fixture, 'physical-resist', run.recorded, 'physical', 0)).toThrow(/type/);
    for (const mutation of ['payment', 'stats', 'dot'] as const) {
      const events = run.recorded.events.map(event => {
        if (mutation === 'payment' && event.kind === 'mana' && event.reason === 'cast') return { ...event, mana: event.mana + 1 };
        if (mutation === 'stats' && event.kind === 'summon') return { ...event, unit: { ...event.unit, stats: { ...event.unit.stats, attack: 99 } } };
        return event;
      });
      if (mutation === 'dot') events.unshift({ kind: 'dot', target: fixture.snapshot.playerTeam[0]!.id, amount: NaN, simClockMs: 0, uiDelayMs: 50 });
      expect(() => inspectMageAsymmetryBattle(fixture, 'physical-resist',
        { events, result: { ...run.recorded.result, events } }, 'elemental', 0)).toThrow();
    }
  });
});


describe('independent damage and probability literals', () => {
  it.each(cases)('matches base45 noncrit/crit literals against both species in %s', caseId => {
    const fixture = buildMageAsymmetryFixture(caseId);
    for (const enemy of [fixture.snapshot.enemyTeam[0]!, fixture.snapshot.enemyTeam[3]!]) {
      for (const type of types) for (const crit of [false, true]) {
        const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
          critChance: crit ? 1 : 0, critMult: 1.5, ignoreDodge: true,
          defenderDodge: type === 'physical' ? enemy.stats.physDodge : enemy.stats.magicDodge,
          defenderArmor: enemy.stats.defense, defenderMagicResist: enemy.stats.magicResist, defenderResistances: enemy.stats.resistances };
        const expected = enemy.stats.resistances[type] === 75 ? (crit ? 16 : 11) : (crit ? 67 : 45);
        expect(resolveDamage(input, createRng(7))).toMatchObject({ final: expected, crit, dodged: false });
      }
    }
  });

  it('passes exact IEEE hit and crit thresholds, accepting only below each boundary', () => {
    expect(0.85 - 0.05).toBe(0.7999999999999999); expect(0.85 - 0.35).toBe(0.5);
    for (const caseId of cases) for (const type of types) {
      const enemy = buildMageAsymmetryFixture(caseId).snapshot.enemyTeam[0]!;
      const defenderDodge = type === 'physical' ? enemy.stats.physDodge : enemy.stats.magicDodge;
      const threshold = defenderDodge === 0.05 ? 0.7999999999999999 : 0.5;
      const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
        critChance: 0.05, critMult: 1.5, defenderDodge, defenderArmor: 0, defenderMagicResist: 0, defenderResistances: enemy.stats.resistances };
      for (const hitRoll of [threshold - Number.EPSILON, threshold, threshold + Number.EPSILON, 0.8]) {
        const probabilities: number[] = [], rolls = [hitRoll, 0.5];
        const outcome = resolveDamage(input, { ...createRng(7), chance: probability => {
          probabilities.push(probability); return rolls.shift()! < probability;
        } });
        expect(outcome.hit).toBe(hitRoll < threshold); expect(outcome.dodged).toBe(hitRoll >= threshold);
        expect(probabilities).toEqual(hitRoll < threshold ? [threshold, 0.05] : [threshold]);
        if (!outcome.hit) expect(outcome.final).toBe(0);
      }
      for (const critRoll of [0.05 - Number.EPSILON, 0.05, 0.05 + Number.EPSILON]) {
        const rolls = [0, critRoll];
        expect(resolveDamage(input, { ...createRng(7), chance: probability => rolls.shift()! < probability }).crit).toBe(critRoll < 0.05);
      }
    }
  });
});

describe('censoring, strata and outer comparison', () => {
  it('keeps synthetic overkill/zero-hit strata separate from actual engine observations', () => {
    const fixture = buildMageAsymmetryFixture('neutral');
    const actual = recordMageAsymmetrySeed(fixture, 'neutral', 'elemental', 0);
    const hero = fixture.snapshot.playerTeam[0]!, target = fixture.snapshot.enemyTeam[0]!, mages = actual.preparation.mages;
    const events: RecordedBattleEvent[] = [...actual.preparation.events,
      { kind: 'damage', source: hero.id, target: target.id, damageType: 'physical', amount: 100, crit: false, dodged: false, simClockMs: 1000, uiDelayMs: 50 },
      { kind: 'damage', source: mages[0]!.id, target: target.id, damageType: 'fire', amount: 500, crit: false, dodged: false, simClockMs: 1940, uiDelayMs: 50 },
      { kind: 'end', winner: null, simClockMs: 2000, uiDelayMs: 50 }];
    const recorded: RecordedBattleResult = { events, result: { events, winner: null, rounds: 1,
      playerTeam: [{ ...hero, mana: 165 }, ...mages], enemyTeam: fixture.snapshot.enemyTeam.map(unit => ({ ...unit, life: unit.id === target.id ? 0 : unit.life })) } };
    const row = inspectMageAsymmetryBattle(fixture, 'neutral', recorded, 'elemental', 0).summary;
    expect(row.strata[0]).toMatchObject({ attempts: 1, landed: 1, loggedDamage: 500, effectiveHpRemoved: 325, noncritValues: { '500': 1 }, critValues: {} });
    expect(row.strata.slice(1).every(value => value.attempts === 0 && value.loggedDamage === 0)).toBe(true);
    expect(row.metrics.player.effectiveHpRemoved).toBe(425); expect(row.metrics.successfulTtkMs).toBeNull();
  });

  it('checks bounded determinism without registry resets and keeps successful-only nearest-rank quantiles', () => {
    const fixture = buildMageAsymmetryFixture('neutral');
    expect(verifyMageAsymmetryDeterminism(fixture, 'neutral', 'elemental')).toEqual({ repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
    const summary = recordMageAsymmetrySeed(fixture, 'neutral', 'elemental', 0).summary;
    const censored = ['defeat', 'draw'].map(outcome => ({ ...summary, metrics: { ...summary.metrics, outcome, successfulTtkMs: null } }));
    expect(summarizeMageAsymmetryRuns(censored).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
    const victories = [1000, 2000, 3000, 4000].map(successfulTtkMs => ({ ...summary, metrics: { ...summary.metrics, outcome: 'victory', successfulTtkMs } }));
    expect(summarizeMageAsymmetryRuns([...censored, ...victories]).successfulTtkMs).toEqual({ count: 4, p50: 2000, p95: 4000 });
    expect(summarizeMageAsymmetryRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });

  it('rejects shared-wrong outer pair identity against external expectations', () => {
    const fixture = buildMageAsymmetryFixture('neutral'), actual = recordMageAsymmetrySeed(fixture, 'neutral', 'elemental', 0);
    // Synthetic comparator metadata probe; physical execution is independently measured in its real Git domain.
    const before = { ...actual, mode: 'physical' as const };
    expect(compareMageAsymmetryRuns(before, actual, fixture, 'neutral').seed).toBe(0);
    for (const patch of [{ caseId: 'physical-resist' as const }, { source: { ...actual.source, hash: 'wrong' } },
      { source: { ...actual.source, sha256: 'wrong' } }, { overrides: [] }, { fixtureHash: 'wrong' },
      { inputHash: 'wrong' }, { seed: -1 }, { masteryRank: 1 as const }]) {
      expect(() => compareMageAsymmetryRuns({ ...before, ...patch }, { ...actual, ...patch }, fixture, 'neutral')).toThrow();
    }
    expect(() => compareMageAsymmetryRuns(before, { ...actual, seed: 1 }, fixture, 'neutral')).toThrow();
    expect(() => compareMageAsymmetryRuns(before, { ...actual, preparation: { ...actual.preparation, startupPayment: 21 } }, fixture, 'neutral')).toThrow();
  });
});

describe('within-domain intervention versus neutral', () => {
  it('accepts different fixture/input hashes at the same seed and rejects wrong expected identities', () => {
    const neutralFixture = buildMageAsymmetryFixture('neutral'), fixture = buildMageAsymmetryFixture('magical-dodge');
    const neutral = recordMageAsymmetrySeed(neutralFixture, 'neutral', 'elemental', 7);
    const treatment = recordMageAsymmetrySeed(fixture, 'magical-dodge', 'elemental', 7);
    expect(neutral.fixtureHash).not.toBe(treatment.fixtureHash); expect(neutral.inputHash).not.toBe(treatment.inputHash);
    const compared = compareMageAsymmetryControl(neutral, treatment, fixture, 'magical-dodge', 'elemental');
    expect(compared).toMatchObject({ caseId: 'magical-dodge', mode: 'elemental', seed: 7,
      neutralFixtureHash: neutralFixture.hash, fixtureHash: fixture.hash, before: neutral.summary, after: treatment.summary });
    for (const patch of [{ mode: 'physical' as const }, { caseId: 'physical-dodge' as const }, { fixtureHash: 'wrong' },
      { inputHash: 'wrong' }, { source: { ...neutral.source, hash: 'wrong' } }, { overrides: [] }]) {
      expect(() => compareMageAsymmetryControl({ ...neutral, ...patch }, { ...treatment, ...patch }, fixture, 'magical-dodge', 'elemental')).toThrow();
    }
    expect(() => compareMageAsymmetryControl(neutral, { ...treatment, seed: 8 }, fixture, 'magical-dodge', 'elemental')).toThrow();
    expect(() => compareMageAsymmetryControl(neutral, treatment, fixture, 'physical-dodge', 'elemental')).toThrow();
    expect(() => compareMageAsymmetryControl(treatment, neutral, fixture, 'magical-dodge', 'elemental')).toThrow();
  });
});
