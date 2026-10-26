import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { RecordedBattleEvent, RecordedBattleResult } from '@/engine/combat/combat';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { mageJsonHash } from './mage-balance-fixture';
import { buildMageMasteryFixture } from './mage-mastery-fixture';
import { MAGE_MIXED_RECIPE, parseMageMixedRecipe, buildMageMixedFixture,
  assertMageMixedFixture, type MageMixedFixture } from './mage-mixed-fixture';
import { recordMageMixedSeed, inspectMageMixedBattle, verifyMageMixedDeterminism,
  compareMageMixedRuns, summarizeMageMixedRuns } from './mage-mixed-runner';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing mixed test fixture value');
  return value;
}
function withEvents(recorded: RecordedBattleResult, events: RecordedBattleEvent[]): RecordedBattleResult {
  return { events, result: { ...recorded.result, events } };
}
function rehash(fixture: MageMixedFixture): MageMixedFixture {
  const { hash: _hash, ...body } = fixture;
  return { ...body, hash: mageJsonHash(body) };
}
const fields = ['attempts', 'crits', 'critDenominator', 'dodges', 'dodgeDenominator', 'loggedDamage', 'effectiveHpRemoved'] as const;

describe('closed authored mixed composition', () => {
  it('anchors retained M1 and changes only legal Skeleton allocation, slots and point accounting', () => {
    const source = buildMageMasteryFixture(1), fixture = buildMageMixedFixture(), hero = required(source.snapshot.playerTeam[0]);
    expect(source.hash).toBe('b9c2d4164de6da292d9b49062ef397a9a765b6f5c1401c07b252d949357b70bf');
    expect(createHash('sha256').update(JSON.stringify(source) + '\n').digest('hex'))
      .toBe('a4264e6c7583ad35dcdc719131fb54ea8755aae5f5b9e39fd76bca8f76c684a5');
    expect(fixture.snapshot).toEqual({ ...source.snapshot, playerTeam: [{ ...hero,
      skillLevels: { ...hero.skillLevels, 'necromancer.raise_skeleton': 6 },
      skillOrder: ['necromancer.raise_skeleton', 'necromancer.raise_skeletal_mage'] }] });
    expect(fixture.allocation).toEqual({ skillPointsSpent: 13, skillPointsUnspent: 14, statPointsUnspent: 125 });
    expect(fixture.overrides).toEqual([
      { field: 'snapshot.playerTeam.0.skillLevels.necromancer.raise_skeleton', before: 1, after: 6 },
      { field: 'snapshot.playerTeam.0.skillOrder', before: ['necromancer.raise_skeletal_mage'], after: ['necromancer.raise_skeleton', 'necromancer.raise_skeletal_mage'] },
      { field: 'allocation.skillPointsSpent', before: 8, after: 13 },
      { field: 'allocation.skillPointsUnspent', before: 19, after: 14 }
    ]);
    expect(fixture.source).toEqual({ hash: source.hash, sha256: MAGE_MIXED_RECIPE.sourceBytesHash });
    expect(fixture.snapshot.seed).toBe(0); expect(fixture.snapshot.enemyTeam).toEqual(source.snapshot.enemyTeam);
    expect(() => { assertMageMixedFixture(fixture); }).not.toThrow();
    expect(buildMageMixedFixture()).toEqual(fixture);
  });

  it('rejects recipe knobs and missing inputs', () => {
    expect(parseMageMixedRecipe(MAGE_MIXED_RECIPE)).toEqual(MAGE_MIXED_RECIPE);
    for (const input of [null, {}, { ...MAGE_MIXED_RECIPE, seed: 1 }, { ...MAGE_MIXED_RECIPE, skeletonRank: 7 },
      { ...MAGE_MIXED_RECIPE, sourceHash: 'wrong' }, { ...MAGE_MIXED_RECIPE, statuses: ['chill'] }]) {
      expect(() => parseMageMixedRecipe(input)).toThrow();
      expect(() => buildMageMixedFixture(input)).toThrow();
    }
  });

  it('rejects rehashed source, enemy, hero, allocation, inventory and initial-state forgeries', () => {
    const fixture = buildMageMixedFixture(), hero = required(fixture.snapshot.playerTeam[0]), enemy = required(fixture.snapshot.enemyTeam[0]);
    const values: MageMixedFixture[] = [
      { ...fixture, source: { ...fixture.source, hash: 'wrong' } }, { ...fixture, overrides: [] },
      { ...fixture, allocation: { ...fixture.allocation, skillPointsSpent: 12 } },
      ...[{ ...hero, mana: 999 }, { ...hero, skillOrder: [...hero.skillOrder].reverse() },
        { ...hero, skillLevels: { ...hero.skillLevels, 'necromancer.raise_skeleton': 7 } }, { ...hero, manaRegenExactCarry: '1' }]
        .map(unit => ({ ...fixture, snapshot: { ...fixture.snapshot, playerTeam: [unit] } })),
      ...[[{ ...enemy, life: 999 }, ...fixture.snapshot.enemyTeam.slice(1)], [...fixture.snapshot.enemyTeam].reverse(),
        [{ ...enemy, statuses: [{ id: 'chill', stacks: 1, remaining: 6, sourceId: hero.id }] }, ...fixture.snapshot.enemyTeam.slice(1)]]
        .map(enemyTeam => ({ ...fixture, snapshot: { ...fixture.snapshot, enemyTeam } }))
    ];
    for (const value of values) expect(() => recordMageMixedSeed(rehash(value), 'elemental', 0)).toThrow();
    for (const seed of [-1, 1000, 0.5, NaN, Infinity]) expect(() => recordMageMixedSeed(fixture, 'elemental', seed)).toThrow();
    expect(() => recordMageMixedSeed(fixture, 'unknown' as 'elemental', 0)).toThrow();
  });
});

describe('independent mixed-army preparation and damage oracles', () => {
  it('records two real batch payments, six complete units, global IDs and local Mage element order', () => {
    const fixture = buildMageMixedFixture(), bytes = JSON.stringify(fixture), run = recordMageMixedSeed(fixture, 'elemental', 7);
    const summons = run.preparation.summons, owner = 'player-mage-mastery-audit';
    expect(run.preparation.paymentMana).toEqual([172, 150]);
    expect(summons.map(unit => unit.id)).toEqual(['skeleton-1', 'skeleton-2', 'skeletal_mage-3', 'skeletal_mage-4', 'skeletal_mage-5', 'skeletal_mage-6'].map(suffix => `${owner}-summon-${suffix}`));
    expect(summons.map(unit => unit.gridPosition)).toEqual([{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 1 }, { row: 0, col: 0 }, { row: 0, col: 2 }]);
    for (const [index, unit] of summons.entries()) {
      const skeleton = index < 2, hp = (skeleton ? 162 : 123) * (1 + .04);
      expect(unit).toMatchObject({ kind: 'summon', summon: true, side: 'player', level: 26, life: hp, mana: 0,
        summonOwnerId: owner, summonTemplateId: skeleton ? 'skeleton' : 'skeletal_mage',
        statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false });
      expect(unit.stats).toEqual({ life: hp, lifeMax: hp, mana: 0, manaMax: 0,
        attack: (skeleton ? 35 : 45) * (1 + .02), defense: (skeleton ? 19 : 10) * (1 + .01),
        magicResist: 0, attackSpeed: 70, critChance: .05, critDamage: 1.5, physDodge: .05,
        magicDodge: skeleton ? .05 : .09, magicFind: 0, goldFind: 0,
        resistances: { physical: 0, fire: skeleton ? 0 : 10, cold: skeleton ? 0 : 10,
          lightning: skeleton ? 0 : 10, poison: skeleton ? 0 : 10, arcane: 0 } });
    }
    expect(run.summary.units.map(unit => [unit.family, unit.type])).toEqual([
      ['skeleton', 'physical'], ['skeleton', 'physical'], ['mage', 'fire'], ['mage', 'cold'], ['mage', 'lightning'], ['mage', 'poison']]);
    expect(run.recorded.events.filter(event => event.kind === 'mana' && (event.reason === 'cast' || event.reason === 'summon-refund')).map(event => event.kind === 'mana' ? [event.mana, event.simClockMs] : null)).toEqual([[172, 0], [150, 0]]);
    for (const unit of run.summary.units) expect(unit.firstActionMs === null || unit.firstActionMs >= 1940).toBe(true);
    expect(JSON.stringify(fixture)).toBe(bytes);
  });

  it('freezes both-species landed values independently of measured target exposure', () => {
    const fixture = buildMageMixedFixture();
    const types = ['physical', 'fire', 'cold', 'lightning', 'poison'] as const;
    for (const [targetIndex, literals] of [[0, [[1, 1], [1, 2], [22, 44], [22, 44], [1, 1]]], [3, [[1, 2], [1, 2], [10, 27], [10, 27], [1, 2]]]] as const) {
      const target = required(fixture.snapshot.enemyTeam[targetIndex]);
      for (const [index, type] of types.entries()) for (const crit of [false, true]) {
        expect(resolveDamage({ baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
          critChance: crit ? 1 : 0, critMult: 1.5, ignoreDodge: true, defenderDodge: .05,
          defenderArmor: target.stats.defense, defenderMagicResist: target.stats.magicResist,
          defenderResistances: target.stats.resistances }, createRng(7)).final).toBe(required(literals[index])[crit ? 1 : 0]);
      }
      for (const crit of [false, true]) expect(resolveDamage({ baseMin: 35, baseMax: 35, flatBonus: 0,
        increasedPct: 0, comboMult: 1, type: 'physical', critChance: crit ? 1 : 0, critMult: 1.5,
        ignoreDodge: true, defenderDodge: .05, defenderArmor: 65, defenderMagicResist: 23,
        defenderResistances: target.stats.resistances }, createRng(7)).final).toBe(1);
    }
  });

  it('keeps strict hit and crit boundaries for every outgoing type', () => {
    const target = required(buildMageMixedFixture().snapshot.enemyTeam[0]);
    for (const type of ['physical', 'fire', 'cold', 'lightning', 'poison'] as const) {
      const input = { baseMin: 45, baseMax: 45, flatBonus: 0, increasedPct: 0, comboMult: 1, type,
        critChance: .05, critMult: 1.5, defenderDodge: .05, defenderArmor: 65,
        defenderMagicResist: 23, defenderResistances: target.stats.resistances };
      const threshold = .7999999999999999;
      for (const roll of [threshold - Number.EPSILON, threshold, threshold + Number.EPSILON]) {
        const rolls = [roll, .5], seen: number[] = [];
        const result = resolveDamage(input, { ...createRng(0), chance: chance => { seen.push(chance); return required(rolls.shift()) < chance; } });
        expect(result.hit).toBe(roll < threshold); expect(seen).toEqual(roll < threshold ? [threshold, .05] : [threshold]);
      }
      for (const roll of [.05 - Number.EPSILON, .05, .05 + Number.EPSILON]) {
        const rolls = [0, roll];
        expect(resolveDamage(input, { ...createRng(0), chance: chance => required(rolls.shift()) < chance }).crit).toBe(roll < .05);
      }
    }
  });
});

describe('source-separated mixed recording contracts', () => {
  it('reconciles family/per-unit/species counters with explicit zero rows', () => {
    const run = recordMageMixedSeed(buildMageMixedFixture(), 'elemental', 0), summary = run.summary;
    expect(summary.units).toHaveLength(6); expect(summary.strata).toHaveLength(12);
    for (const field of fields) {
      expect(summary.metrics.player[field]).toBe(summary.metrics.hero[field] + summary.metrics.skeletons[field] + summary.metrics.mages[field]);
      for (const family of ['skeleton', 'mage'] as const) {
        const actual = summary.units.filter(unit => unit.family === family).reduce((sum, unit) => sum + unit.damage[field], 0);
        expect(actual).toBe(summary.metrics[family === 'mage' ? 'mages' : 'skeletons'][field]);
      }
      expect(summary.strata.reduce((sum, row) => sum + row[field], 0)).toBe(summary.metrics.skeletons[field] + summary.metrics.mages[field]);
    }
    expect(summary.strata.every(row => row.critDenominator === row.landed && row.dodgeDenominator === row.attempts)).toBe(true);
  });

  it('checks actual production hits against independent damage arithmetic and observed combos', () => {
    const fixture = buildMageMixedFixture(), run = recordMageMixedSeed(fixture, 'elemental', 7);
    const statuses = new Map(fixture.snapshot.enemyTeam.map(unit => [unit.id, unit.statuses]));
    let observed = 0, chilledLightning = 0;
    for (const event of run.recorded.events) {
      if (event.kind === 'status-state') statuses.set(event.target, event.statuses);
      if (event.kind !== 'damage') continue;
      const source = run.summary.units.find(unit => unit.id === event.source);
      if (!source) continue;
      const target = required(fixture.snapshot.enemyTeam.find(unit => unit.id === event.target));
      const active = required(statuses.get(target.id)).filter(status =>
        (status.appliedAtMs === undefined || status.appliedAtMs <= event.simClockMs) &&
        (status.expiresAtMs === undefined || event.simClockMs < status.expiresAtMs));
      const has = (id: string) => active.some(status => status.id === id);
      let multiplier = 1;
      if (has('chill') && event.damageType === 'lightning') { multiplier *= 1.3; chilledLightning++; }
      if (has('chill') && event.damageType === 'physical') multiplier *= 1.1;
      if (has('ignite') && event.damageType === 'physical') multiplier *= 1.25;
      if (has('ignite') && event.damageType === 'poison') multiplier *= 1.15;
      if (has('paralyze') && event.damageType === 'fire') multiplier *= 1.2;
      const poisonStacks = active.find(status => status.id === 'poison')?.stacks ?? 0;
      if (poisonStacks >= 3 && event.damageType === 'poison') multiplier *= 1 + .15 * poisonStacks;
      const type = required((['physical', 'fire', 'cold', 'lightning', 'poison'] as const).find(type => type === event.damageType));
      const resistance = target.stats.resistances[type];
      const mitigation = ['cold', 'lightning', 'arcane'].includes(event.damageType) ? target.stats.magicResist : target.stats.defense;
      const damage = Math.max(1, Math.floor((source.family === 'skeleton' ? 35 : 45) * multiplier *
        (event.crit ? 1.5 : 1) * (1 - Math.max(-100, Math.min(75, resistance)) / 100) - mitigation));
      expect(event.amount).toBe(event.dodged ? 0 : damage);
      observed++;
    }
    expect(observed).toBeGreaterThan(0);
    expect(chilledLightning).toBeGreaterThan(0);
    expect(run.summary.metrics.mages.effectiveHpRemoved).toBeGreaterThan(0);
  });

  it('replays shared-target overkill/heal/orb/death and keeps nonacting summons', () => {
    const fixture = buildMageMixedFixture(), actual = recordMageMixedSeed(fixture, 'elemental', 0);
    const hero = required(fixture.snapshot.playerTeam[0]), target = required(fixture.snapshot.enemyTeam[0]);
    const skeleton = required(actual.preparation.summons[0]), mage = required(actual.preparation.summons[2]);
    const hit = (source: string, at: number, amount: number, crit = false, dodged = false): RecordedBattleEvent => ({ kind: 'damage', source, target: target.id,
      damageType: source === mage.id ? 'fire' : 'physical', amount, crit, dodged, simClockMs: at, uiDelayMs: 50 });
    const events: RecordedBattleEvent[] = [...actual.preparation.events, hit(hero.id, 1000, 100), hit(skeleton.id, 1940.25, 80), hit(mage.id, 1940.5, 100),
      { kind: 'heal', target: target.id, amount: 50, simClockMs: 2000, uiDelayMs: 50 },
      { kind: 'orb', target: target.id, orb: { kind: 'hp', restorePct: .5 }, simClockMs: 3000, uiDelayMs: 50 },
      hit(mage.id, 5999, 80, true), hit(mage.id, 6000, 0, false, true), hit(mage.id, 6001, 500),
      { kind: 'death', target: target.id, simClockMs: 6001, uiDelayMs: 50 },
      { kind: 'death', target: required(actual.preparation.summons[5]).id, simClockMs: 6001, uiDelayMs: 50 },
      { kind: 'end', winner: null, simClockMs: 6002, uiDelayMs: 50 }];
    const recorded: RecordedBattleResult = { events, result: { events, winner: null, rounds: 1,
      playerTeam: [{ ...hero, mana: 150 }, ...actual.preparation.summons.slice(0, 5)],
      enemyTeam: fixture.snapshot.enemyTeam.map(unit => ({ ...unit, life: unit.id === target.id ? 0 : unit.life })) } };
    const summary = inspectMageMixedBattle(fixture, recorded, 'elemental', 0).summary;
    expect(summary.metrics.hero.effectiveHpRemoved).toBe(100); expect(summary.metrics.skeletons.effectiveHpRemoved).toBe(80);
    expect(summary.metrics.mages).toMatchObject({ loggedDamage: 680, effectiveHpRemoved: 507, attempts: 4, crits: 1, critDenominator: 3, dodges: 1, dodgeDenominator: 4 });
    expect(summary.metrics.player.effectiveHpRemoved).toBe(687);
    expect(summary.strata.find(row => row.id === mage.id && row.species === 'flayer')).toMatchObject({
      attempts: 4, noncritValues: { '100': 1, '500': 1 }, critValues: { '80': 1 } });
    expect(summary.strata.filter(row => row.id !== mage.id && row.id !== skeleton.id).every(row => row.attempts === 0)).toBe(true);
    expect(summary.units.filter(unit => unit.deathEvents === 1)).toHaveLength(1);
    expect(summary.units.every(unit => unit.finalLife !== null || unit.deathEvents > 0)).toBe(true);
    expect(summary.metrics.successfulTtkMs).toBeNull();
  });

  it('rejects preparation, bolt, clock, unsupported enemy condition and malformed periodic forgeries', () => {
    const fixture = buildMageMixedFixture(), actual = recordMageMixedSeed(fixture, 'elemental', 0), enemy = required(fixture.snapshot.enemyTeam[0]);
    const invalid: [RecordedBattleEvent, RegExp][] = [[{ kind: 'status', target: enemy.id, statusId: 'chill', simClockMs: 0, uiDelayMs: 50 }, /unsupported enemy condition/],
      [{ kind: 'dot', target: enemy.id, amount: NaN, simClockMs: 0, uiDelayMs: 50 }, /Invalid Mage screen periodic damage/]];
    for (const [extra, reason] of invalid) {
      const events = [...actual.recorded.events, extra].sort((a, b) => a.simClockMs - b.simClockMs);
      expect(() => inspectMageMixedBattle(fixture, withEvents(actual.recorded, events), 'elemental', 0)).toThrow(reason);
    }
    for (const simClockMs of [-1, NaN, Infinity]) {
      const events = actual.recorded.events.map((event, index) => index === 0 ? { ...event, simClockMs } : event);
      expect(() => inspectMageMixedBattle(fixture, withEvents(actual.recorded, events), 'elemental', 0)).toThrow(/clock/);
    }
    const events = actual.recorded.events.map(event => event.kind === 'mana' && event.reason === 'cast' ? { ...event, mana: 151 } : event);
    expect(() => inspectMageMixedBattle(fixture, withEvents(actual.recorded, events), 'elemental', 0)).toThrow(/payments/);
    expect(() => inspectMageMixedBattle(fixture, actual.recorded, 'physical', 0)).toThrow(/bolt type/);
    const forged = actual.recorded.events.map(event => event.kind === 'summon' ? { ...event, unit: { ...event.unit, mana: 1 } } : event);
    expect(() => inspectMageMixedBattle(fixture, withEvents(actual.recorded, forged), 'elemental', 0)).toThrow(/registrations/);
    const decreasing = actual.recorded.events.map((event, index) => index === actual.recorded.events.length - 1 ? { ...event, simClockMs: 0 } : event);
    expect(() => inspectMageMixedBattle(fixture, withEvents(actual.recorded, decreasing), 'elemental', 0)).toThrow(/clock/);
  });

  it('requires independently expected pair metadata, seed and preparation', () => {
    const fixture = buildMageMixedFixture(), after = recordMageMixedSeed(fixture, 'elemental', 7);
    const before = { ...after, mode: 'physical' as const }; // Metadata probe only, not a physical measurement.
    expect(compareMageMixedRuns(before, after, fixture).seed).toBe(7);
    for (const patch of [{ fixtureHash: 'wrong' }, { inputHash: 'wrong' }, { seed: -1 }, { overrides: [] },
      { source: { ...after.source, hash: 'wrong' } }, { source: { ...after.source, sha256: 'wrong' } },
      { preparation: { ...after.preparation, paymentMana: [172, 151] } }]) {
      expect(() => compareMageMixedRuns({ ...before, ...patch }, { ...after, ...patch }, fixture)).toThrow();
    }
    expect(() => compareMageMixedRuns(after, after, fixture)).toThrow();
    expect(() => compareMageMixedRuns(before, { ...after, seed: 8 }, fixture)).toThrow();
  });

  it('keeps deterministic recordings and successful-only nearest-rank TTK', () => {
    const fixture = buildMageMixedFixture();
    expect(verifyMageMixedDeterminism(fixture, 'elemental')).toEqual({ repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
    const summary = recordMageMixedSeed(fixture, 'elemental', 0).summary;
    const losses = ['defeat', 'draw'].map(outcome => ({ ...summary, metrics: { ...summary.metrics, outcome, successfulTtkMs: null } }));
    expect(summarizeMageMixedRuns(losses).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
    const wins = [1000, 2000, 3000, 4000].map(successfulTtkMs => ({ ...summary, metrics: { ...summary.metrics, outcome: 'victory', successfulTtkMs } }));
    expect(summarizeMageMixedRuns([...losses, ...wins]).successfulTtkMs).toEqual({ count: 4, p50: 2000, p95: 4000 });
    expect(summarizeMageMixedRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });
});
