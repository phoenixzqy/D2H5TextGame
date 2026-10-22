import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture } from './mage-mastery-fixture';
import type { RecordedBattleEvent, RecordedBattleResult } from '@/engine/combat/combat';
import { recordMageComboSeed, inspectMageComboBattle, verifyMageComboDeterminism,
  compareMageComboRuns, compareMageComboControl, summarizeMageComboRuns } from './mage-combo-runner';
import { activeStatusView, applyStatus } from '@/engine/combat/status';
import { comboMultiplier } from '@/engine/combat/combo';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { MAGE_COMBO_CASES, MAGE_COMBO_RECIPE, buildMageComboFixture,
  assertMageComboFixture, parseMageComboRecipe, type MageComboFixture } from './mage-combo-fixture';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing combo test fixture value');
  return value;
}
const cases = ['none', 'chill', 'ignite', 'paralyze'] as const;
const types = ['physical', 'fire', 'cold', 'lightning', 'poison'] as const;
const rehash = (fixture: MageComboFixture): MageComboFixture => {
  const { hash: _hash, ...body } = fixture;
  return { ...body, hash: mageJsonHash(body) };
};

describe('closed synthetic initial target conditions', () => {
  it('anchors M0 bytes and reproduces the accepted neutral snapshot', () => {
    const source = buildMageMasteryFixture(0), fixture = buildMageComboFixture('none');
    expect(source.hash).toBe('71602dda8f66514f790d2070bfd9e7f59ddadb3c75da2d9f5d2e5bee5db751c1');
    expect(createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex'))
      .toBe('af425286b880f7aa328b2ea5fa9502ae6e15f8daec57d15beb51e604aa29631c');
    expect(mageJsonHash(fixture.snapshot)).toBe('97e3d6a84c77d895f442909da7bd4b13167a45c88f96be90bcd85c3981865661');
    expect(Object.keys(MAGE_COMBO_CASES)).toEqual(cases);
  });

  it.each(cases)('changes only neutral stats and the predeclared initial condition in %s', caseId => {
    const source = buildMageMasteryFixture(0), bytes = JSON.stringify(source), fixture = buildMageComboFixture(caseId);
    const expected = { ...structuredClone(source.snapshot), enemyTeam: source.snapshot.enemyTeam.map(enemy => ({
      ...structuredClone(enemy), stats: { ...structuredClone(enemy.stats), defense: 0, magicResist: 0,
        physDodge: 0.05, magicDodge: 0.05, resistances: { ...enemy.stats.resistances,
          physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0 } },
      statuses: caseId === 'none' ? [] : [{ id: caseId, stacks: 1, remaining: 6, appliedAtMs: 0,
        expiresAtMs: 6000, sourceId: 'diagnostic-mage-combo-condition' }]
    })) };
    expect(fixture.snapshot).toEqual(expected); expect(fixture.allocation).toEqual(source.allocation);
    expect(fixture.source).toEqual({ hash: source.hash, sha256: MAGE_COMBO_RECIPE.sourceBytesHash });
    expect(fixture.recipe).toEqual({ ...MAGE_COMBO_RECIPE, caseId });
    expect(fixture.overrides).toHaveLength(caseId === 'none' ? 32 : 40);
    expect(fixture.overrides.every(row => mageJsonHash(row.before) !== mageJsonHash(row.after))).toBe(true);
    expect(() => { assertMageComboFixture(fixture, caseId); }).not.toThrow();
    expect(buildMageComboFixture(caseId)).toEqual(fixture); expect(JSON.stringify(source)).toBe(bytes);
  });

  it('rejects custom case/window/build/seed and missing recipe inputs', () => {
    for (const caseId of ['', 'freeze', 'mixed', 0, null]) expect(() => buildMageComboFixture(caseId)).toThrow();
    for (const patch of [{ level: 27 }, { durationMs: 7000 }, { seed: 7 }, { sourceHash: 'wrong' }]) {
      expect(() => parseMageComboRecipe({ ...MAGE_COMBO_RECIPE, caseId: 'chill', ...patch })).toThrow();
    }
    expect(() => parseMageComboRecipe(MAGE_COMBO_RECIPE)).toThrow();
  });

  it('rejects rehashed condition, timing, stacks, source, payload, order and HP forgeries', () => {
    const fixture = buildMageComboFixture('chill'), enemy = required(fixture.snapshot.enemyTeam[0]), status = required(enemy.statuses[0]);
    for (const patch of [{ id: 'ignite' }, { stacks: 2 }, { remaining: 7 }, { appliedAtMs: 1 },
      { expiresAtMs: 6001 }, { sourceId: 'other' }, { dotPerStack: 1 }, { damageType: 'cold' as const }, { tags: ['chill'] as const }]) {
      const unit = { ...enemy, statuses: [{ ...status, ...patch }] };
      expect(() => { assertMageComboFixture(rehash({ ...fixture, snapshot: { ...fixture.snapshot,
        enemyTeam: [unit, ...fixture.snapshot.enemyTeam.slice(1)] } }), 'chill'); }).toThrow();
    }
    for (const enemyTeam of [[{ ...enemy, life: 999 }, ...fixture.snapshot.enemyTeam.slice(1)],
      fixture.snapshot.enemyTeam.slice(1), [...fixture.snapshot.enemyTeam].reverse()]) {
      expect(() => { assertMageComboFixture(rehash({ ...fixture, snapshot: { ...fixture.snapshot, enemyTeam } }), 'chill'); }).toThrow();
    }
    expect(() => { assertMageComboFixture(fixture, 'none'); }).toThrow();
  });
});

describe('independent target-combo literal oracles', () => {
  const literals = { none: [[45, 67], [45, 67], [45, 67], [45, 67], [45, 67]],
    chill: [[49, 74], [45, 67], [45, 67], [58, 87], [45, 67]],
    ignite: [[56, 84], [45, 67], [45, 67], [45, 67], [51, 77]],
    paralyze: [[45, 67], [54, 81], [45, 67], [45, 67], [45, 67]] } as const;
  it.each(cases)('uses real status activity/combo/damage before and at expiry in %s', caseId => {
    for (const target of [required(buildMageComboFixture(caseId).snapshot.enemyTeam[0]), required(buildMageComboFixture(caseId).snapshot.enemyTeam[3])]) {
      for (const at of [0, 5999, 6000, 6001]) for (const [index, type] of types.entries()) for (const crit of [false, true]) {
        const active = activeStatusView(target, at), comboMult = comboMultiplier(active, type);
        const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult, type,
          critChance: crit ? 1 : 0, critMult: 1.5, ignoreDodge: true, defenderDodge: 0.05,
          defenderArmor: 0, defenderMagicResist: 0, defenderResistances: target.stats.resistances };
        expect(active.statuses.length).toBe(caseId === 'none' || at >= 6000 ? 0 : 1);
        expect(resolveDamage(input, createRng(7)).final).toBe(required(literals[at >= 6000 ? 'none' : caseId][index])[crit ? 1 : 0]);
      }
    }
  });

  it('keeps D06 mitigated cross-checks and authored short paralyze distinct from the diagnostic window', () => {
    for (const [caseId, type, expected] of [['chill', 'lightning', 38], ['ignite', 'poison', 26], ['paralyze', 'fire', 28]] as const) {
      const target = required(buildMageComboFixture(caseId).snapshot.enemyTeam[0]);
      expect(resolveDamage({ baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0,
        comboMult: comboMultiplier(activeStatusView(target, 0), type), type, critChance: 0, critMult: 1.5,
        ignoreDodge: true, defenderDodge: 0.05, defenderArmor: 12, defenderMagicResist: 5,
        defenderResistances: { ...target.stats.resistances, [type]: 25 } }, createRng(7)).final).toBe(expected);
    }
    const target = required(buildMageComboFixture('none').snapshot.enemyTeam[0]);
    const natural = applyStatus(target, { id: 'paralyze', sourceId: 'literal', simClockMs: 0 }, createRng(7));
    expect(natural.statuses.find(status => status.id === 'paralyze')?.expiresAtMs).toBe(1000);
    expect(activeStatusView(natural, 1940).statuses.some(status => status.id === 'paralyze')).toBe(false);
    expect(natural.statuses.some(status => status.id === 'paralyze-cd')).toBe(true);
  });

  it('passes exact strict hit and crit boundaries to the resolver for every bolt type', () => {
    const target = required(buildMageComboFixture('none').snapshot.enemyTeam[0]);
    const threshold = 0.7999999999999999;
    for (const type of types) {
      const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
        critChance: 0.05, critMult: 1.5, defenderDodge: 0.05, defenderArmor: 0,
        defenderMagicResist: 0, defenderResistances: target.stats.resistances };
      for (const hit of [threshold - Number.EPSILON, threshold, threshold + Number.EPSILON, 0.8]) {
        const seen: number[] = [], rolls = [hit, 0.5];
        const out = resolveDamage(input, { ...createRng(7), chance: probability => {
          seen.push(probability); return required(rolls.shift()) < probability;
        } });
        expect(out.hit).toBe(hit < threshold); expect(seen).toEqual(hit < threshold ? [threshold, 0.05] : [threshold]);
        if (!out.hit) expect(out.final).toBe(0);
      }
      for (const crit of [0.05 - Number.EPSILON, 0.05, 0.05 + Number.EPSILON]) {
        const rolls = [0, crit];
        expect(resolveDamage(input, { ...createRng(7), chance: probability => required(rolls.shift()) < probability }).crit).toBe(crit < 0.05);
      }
    }
  });
});

describe('independently expected pairs and within-domain contrasts', () => {
  it('retains raw startup preparation and rejects control gameplay mutations without changing either run', () => {
    const fixture = buildMageComboFixture('ignite');
    const neutral = recordMageComboSeed(buildMageComboFixture('none'), 'none', 'elemental', 7);
    const actual = recordMageComboSeed(fixture, 'ignite', 'elemental', 7);
    const bytes = JSON.stringify({ neutral, actual });
    expect(actual.preparation.events).toEqual(actual.recorded.events.filter(event => event.simClockMs === 0));
    expect(neutral.preparation.events).toEqual(neutral.recorded.events.filter(event => event.simClockMs === 0));
    expect(compareMageComboControl(neutral, actual, fixture, 'ignite', 'elemental').seed).toBe(7);
    const preparation = actual.preparation;
    for (const patch of [
      { ...preparation, startupPayment: 21 },
      { ...preparation, mages: preparation.mages.map((mage, i) => i === 0 ? { ...mage, mana: mage.mana + 1 } : mage) },
      { ...preparation, events: preparation.events.map(event => event.kind === 'action'
        ? { ...event, skillId: 'fixture.changed-startup' } : event) },
      { ...preparation, events: preparation.events.map(event => event.kind === 'mana'
        ? { ...event, mana: event.mana + 1 } : event) },
      { ...preparation, events: preparation.events.map(event => event.kind === 'summon'
        ? { ...event, owner: 'fixture.changed-owner' } : event) },
      { ...preparation, events: preparation.events.map(event => event.kind === 'summon'
        ? { ...event, simClockMs: 1 } : event) },
      { ...preparation, events: [...preparation.events].reverse() },
      { ...preparation, events: preparation.events.filter(event => event.kind !== 'summon') }
    ]) {
      expect(() => compareMageComboControl(neutral, { ...actual, preparation: patch }, fixture, 'ignite', 'elemental'))
        .toThrow('Mage combo control seed/preparation');
    }
    expect(JSON.stringify({ neutral, actual })).toBe(bytes);
  });

  it('rejects shared wrong pair metadata and separately validates both control fixtures', () => {
    const control = buildMageComboFixture('none'), fixture = buildMageComboFixture('ignite');
    const none = recordMageComboSeed(control, 'none', 'elemental', 7), actual = recordMageComboSeed(fixture, 'ignite', 'elemental', 7);
    const before = { ...actual, mode: 'physical' as const }; // Metadata probe, not a physical measurement.
    expect(compareMageComboRuns(before, actual, fixture, 'ignite').seed).toBe(7);
    expect(compareMageComboControl(none, actual, fixture, 'ignite', 'elemental')).toMatchObject({
      caseId: 'ignite', mode: 'elemental', neutralFixtureHash: control.hash, fixtureHash: fixture.hash });
    for (const patch of [{ caseId: 'chill' as const }, { fixtureHash: 'wrong' }, { inputHash: 'wrong' },
      { source: { ...actual.source, hash: 'wrong' } }, { source: { ...actual.source, sha256: 'wrong' } },
      { overrides: [] }, { seed: -1 }, { masteryRank: 1 as const }]) {
      expect(() => compareMageComboRuns({ ...before, ...patch }, { ...actual, ...patch }, fixture, 'ignite')).toThrow();
      expect(() => compareMageComboControl({ ...none, ...patch }, { ...actual, ...patch }, fixture, 'ignite', 'elemental')).toThrow();
    }
    expect(() => compareMageComboControl(actual, none, fixture, 'ignite', 'elemental')).toThrow();
    expect(() => compareMageComboControl(none, actual, fixture, 'chill', 'elemental')).toThrow();
    expect(() => compareMageComboControl(none, actual, fixture, 'ignite', 'physical')).toThrow();
    expect(() => compareMageComboRuns(before, { ...actual, seed: 8 }, fixture, 'ignite')).toThrow();
    expect(() => compareMageComboRuns(before, { ...actual, preparation: { ...actual.preparation, startupPayment: 21 } }, fixture, 'ignite')).toThrow();
  });

  it('rejects source, hero, allocation, inventory, domain and seed forgeries before recording', () => {
    const fixture = buildMageComboFixture('none'), hero = required(fixture.snapshot.playerTeam[0]);
    for (const value of [{ ...fixture, source: { ...fixture.source, hash: 'wrong' } }, { ...fixture, overrides: [] },
      { ...fixture, allocation: { ...fixture.allocation, statPointsUnspent: 0 } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, mana: 999 }] } },
      { ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [{ ...hero, skillLevels: {} }] } }]) {
      expect(() => recordMageComboSeed(rehash(value), 'none', 'elemental', 0)).toThrow();
    }
    for (const seed of [-1, 1000, 0.5, NaN]) expect(() => recordMageComboSeed(fixture, 'none', 'elemental', seed)).toThrow();
    const run = recordMageComboSeed(fixture, 'none', 'elemental', 0);
    expect(() => inspectMageComboBattle(fixture, 'none', run.recorded, 'physical', 0)).toThrow();
  });

  it('censors failed/drawn TTK and keeps successful-only nearest-rank quantiles', () => {
    const summary = recordMageComboSeed(buildMageComboFixture('none'), 'none', 'elemental', 0).summary;
    const censored = ['defeat', 'draw'].map(outcome => ({ ...summary, metrics: { ...summary.metrics, outcome, successfulTtkMs: null } }));
    expect(summarizeMageComboRuns(censored).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
    const wins = [1000, 2000, 3000, 4000].map(successfulTtkMs => ({ ...summary, metrics: { ...summary.metrics, outcome: 'victory', successfulTtkMs } }));
    expect(summarizeMageComboRuns([...censored, ...wins]).successfulTtkMs).toEqual({ count: 4, p50: 2000, p95: 4000 });
    expect(summarizeMageComboRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });
});

describe('real-clock initial condition exposure', () => {
  it.each(cases)('preserves preparation, direct source totals and zero exposure rows in %s', caseId => {
    const fixture = buildMageComboFixture(caseId), bytes = JSON.stringify(fixture);
    const run = recordMageComboSeed(fixture, caseId, 'elemental', 7);
    expect(run.fixtureHash).toBe(fixture.hash); expect(run.source).toEqual(fixture.source);
    expect(run.preparation.startupPayment).toBe(22);
    expect(run.preparation.mages.map(mage => [mage.life, mage.stats.attack, mage.stats.defense])).toEqual(Array(4).fill([123, 45, 10]));
    expect(run.summary.strata).toHaveLength(caseId === 'none' ? 8 : 16);
    expect(new Set(run.summary.strata.map(row => row.exposure))).toEqual(new Set(caseId === 'none' ? ['none'] : ['active', 'expired']));
    for (const field of ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const) {
      expect(run.summary.strata.reduce((sum, row) => sum + row[field], 0)).toBe(run.summary.metrics.mages[field]);
    }
    expect(run.summary.metrics.player.loggedDamage).toBe(run.summary.metrics.hero.loggedDamage + run.summary.metrics.mages.loggedDamage);
    expect(JSON.stringify(fixture)).toBe(bytes);
  });

  it('classifies equality as expired and replays overkill, healing, orbs, deaths and zero attempts', () => {
    const fixture = buildMageComboFixture('chill'), actual = recordMageComboSeed(fixture, 'chill', 'elemental', 0);
    const hero = required(fixture.snapshot.playerTeam[0]), target = required(fixture.snapshot.enemyTeam[0]), mages = actual.preparation.mages;
    const hit = (at: number, amount: number, crit = false, dodged = false): RecordedBattleEvent => ({ kind: 'damage',
      source: required(mages[0]).id, target: target.id, damageType: 'fire', amount, crit, dodged, simClockMs: at, uiDelayMs: 50 });
    const events: RecordedBattleEvent[] = [...actual.preparation.events,
      { ...hit(1000, 100), source: hero.id, damageType: 'physical' } as RecordedBattleEvent,
      hit(1940.5, 100), { kind: 'heal', target: target.id, amount: 50, simClockMs: 2000, uiDelayMs: 50 },
      { kind: 'orb', target: target.id, orb: { kind: 'hp', restorePct: 0.5 }, simClockMs: 3000, uiDelayMs: 50 },
      hit(5999, 80, true), hit(6000, 0, false, true), hit(6001, 500),
      { kind: 'death', target: target.id, simClockMs: 6001, uiDelayMs: 50 },
      { kind: 'death', target: required(mages[3]).id, simClockMs: 6001, uiDelayMs: 50 },
      { kind: 'end', winner: null, simClockMs: 6002, uiDelayMs: 50 }];
    const recorded: RecordedBattleResult = { events, result: { events, winner: null, rounds: 1,
      playerTeam: [{ ...hero, mana: 165 }, ...mages.slice(0, 3)],
      enemyTeam: fixture.snapshot.enemyTeam.map(unit => ({ ...unit, life: unit.id === target.id ? 0 : unit.life })) } };
    const summary = inspectMageComboBattle(fixture, 'chill', recorded, 'elemental', 0).summary;
    expect(summary.strata[0]).toMatchObject({ exposure: 'active', attempts: 2, landed: 2, crits: 1,
      loggedDamage: 180, effectiveHpRemoved: 180, noncritValues: { '100': 1 }, critValues: { '80': 1 } });
    expect(summary.strata[1]).toMatchObject({ exposure: 'expired', attempts: 2, landed: 1, dodges: 1,
      loggedDamage: 500, effectiveHpRemoved: 345, noncritValues: { '500': 1 } });
    expect(summary.strata.slice(2).every(row => row.attempts === 0)).toBe(true);
    expect(summary.mageDeathEvents).toBe(1); expect(summary.absentWithoutDeath).toBe(0);
    expect(summary.metrics.successfulTtkMs).toBeNull();
  });

  it('rejects unsupported enemy lifecycle events, invalid clocks and source-less DoT', () => {
    const fixture = buildMageComboFixture('paralyze'), actual = recordMageComboSeed(fixture, 'paralyze', 'elemental', 0);
    const target = required(fixture.snapshot.enemyTeam[0]);
    const bad: RecordedBattleEvent[] = [
      { kind: 'status', target: target.id, statusId: 'paralyze', simClockMs: 0, uiDelayMs: 50 },
      { kind: 'action', actor: target.id, skillId: null, simClockMs: 0, uiDelayMs: 50 },
      { kind: 'stunned', target: target.id, simClockMs: 6000, uiDelayMs: 50 },
      { kind: 'dot', target: target.id, amount: 1, simClockMs: 0, uiDelayMs: 50 }
    ];
    for (const event of bad) {
      const events = [...actual.recorded.events, event].sort((a, b) => a.simClockMs - b.simClockMs);
      expect(() => inspectMageComboBattle(fixture, 'paralyze', { ...actual.recorded, events }, 'elemental', 0)).toThrow();
    }
    for (const simClockMs of [-1, NaN, Infinity]) {
      const events = actual.recorded.events.map((event, index) => index === 0 ? { ...event, simClockMs } : event);
      expect(() => inspectMageComboBattle(fixture, 'paralyze', { ...actual.recorded, events }, 'elemental', 0)).toThrow();
    }
    expect(verifyMageComboDeterminism(fixture, 'paralyze', 'elemental')).toEqual({ repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
  });
});
