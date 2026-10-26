import { describe, expect, it } from 'vitest';
import type { RecordedBattleEvent, RecordedBattleResult } from '@/engine/combat/combat';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { mageJsonHash } from './mage-balance-fixture';
import { measureMageBattle } from './mage-balance-runner';
import { buildMageMasteryFixture, MAGE_MASTERY_RECIPE, parseMageMasteryRecipe, type MageMasteryFixture } from './mage-mastery-fixture';
import { compareMageMasteryRuns, inspectMageMasteryBattle, recordMageMasterySeed, summarizeMageMasteryRuns, verifyMageMasteryDeterminism } from './mage-mastery-runner';

const literals = [
  { rank: 0, spent: 7, unspent: 20, life: 123, attack: 45, defense: 10, base: 45, flayer: 22, horror: 10 },
  { rank: 1, spent: 8, unspent: 19, life: 127.92, attack: 45.9, defense: 10.1, base: 45, flayer: 22, horror: 10 },
  { rank: 19, spent: 26, unspent: 1, life: 216.48, attack: 62.1, defense: 11.9, base: 62, flayer: 39, horror: 23 },
  { rank: 20, spent: 27, unspent: 0, life: 221.4, attack: 62.99999999999999, defense: 12, base: 62, flayer: 39, horror: 23 }
] as const;
const rehash = (fixture: MageMasteryFixture): MageMasteryFixture => ({ ...fixture,
  hash: mageJsonHash({ recipe: fixture.recipe, snapshot: fixture.snapshot, allocation: fixture.allocation }) });

describe('closed unearned near-level Mage Mastery family', () => {
  it.each(literals)('allocates legal Mastery$rank without spending core stats or equipping gear', row => {
    const fixture = buildMageMasteryFixture(row.rank), hero = fixture.snapshot.playerTeam[0]!;
    expect(fixture.recipe).toEqual({ ...MAGE_MASTERY_RECIPE, masteryRank: row.rank });
    expect(fixture.allocation).toEqual({ skillPointsSpent: row.spent, skillPointsUnspent: row.unspent, statPointsUnspent: 125 });
    expect(hero.stats).toMatchObject({ lifeMax: 330, manaMax: 187, attack: 72, defense: 95, attackSpeed: 125 });
    expect([hero.life, hero.mana, hero.level]).toEqual([330, 187, 26]);
    expect(hero.equippedWeapon).toEqual({});
    expect(hero.skillOrder).toEqual(['necromancer.raise_skeletal_mage']);
    expect(fixture.snapshot.playerTeam).toHaveLength(1);
    if (row.rank === 0) expect(fixture.snapshot.skeletonMastery).toBeUndefined();
    else expect(fixture.snapshot.skeletonMastery).toMatchObject({ sourceHeroId: hero.id, rank: row.rank, maxRank: 20 });
  });

  it('uses exactly the authored effective-L24 six-Flayer/two-Horror ordinary encounter', () => {
    const fixture = buildMageMasteryFixture(0), enemies = fixture.snapshot.enemyTeam;
    expect(fixture.snapshot.act).toBe(2);
    expect(enemies).toHaveLength(8);
    expect(enemies.filter(unit => unit.id.includes('undead-flayer'))).toHaveLength(6);
    expect(enemies.filter(unit => unit.id.includes('horror-mage'))).toHaveLength(2);
    for (const enemy of enemies) {
      expect(enemy.level).toBe(24); expect(enemy.tier).toBe('trash');
      expect(enemy.stats).toMatchObject({ defense: 65, magicResist: 23, physDodge: 0.05, magicDodge: 0.05 });
      expect(enemy.life).toBe(enemy.stats.lifeMax);
      expect(enemy.stats.resistances).toMatchObject(enemy.id.includes('undead-flayer') ?
        { physical: 25, poison: 75 } : { cold: 25, lightning: 25 });
    }
    for (const rank of [1, 19, 20]) expect(buildMageMasteryFixture(rank).snapshot.enemyTeam).toEqual(enemies);
    expect(buildMageMasteryFixture(0)).toEqual(fixture);
  });

  it('refuses ranks outside the four reviewed cells and open recipe fields', () => {
    for (const rank of [-1, 2, 18, 21, 0.5, NaN, Infinity]) expect(() => buildMageMasteryFixture(rank)).toThrow();
    for (const change of [{ level: 27 }, { equipment: 'sword' }, { areaId: 'areas/act1-blood-moor' },
      { seedStart: 1 }, { seedCount: 999 }, { attack: 999 }, { combatSeeds: [7] }]) {
      expect(() => parseMageMasteryRecipe({ ...MAGE_MASTERY_RECIPE, masteryRank: 0, ...change })).toThrow();
    }
  });

  it('rejects recomputed-hash missing prerequisite, overspent ranks, custom stats and Mastery projection forgeries', () => {
    const fixture = buildMageMasteryFixture(20), hero = fixture.snapshot.playerTeam[0]!;
    const badHeroes = [
      { ...hero, skillLevels: { 'necromancer.raise_skeletal_mage': 6, 'necromancer.skeleton_mastery': 20 } },
      { ...hero, skillLevels: { ...hero.skillLevels, 'necromancer.raise_skeleton': 20 } },
      { ...hero, stats: { ...hero.stats, attack: 999 } }
    ];
    for (const bad of badHeroes) expect(() => recordMageMasterySeed(rehash({ ...fixture,
      snapshot: { ...fixture.snapshot, playerTeam: [bad] } }), 'elemental', 0)).toThrow(/authored hero/);
    const projection = fixture.snapshot.skeletonMastery!;
    for (const bad of [undefined, { ...projection, sourceHeroId: 'other-owner' },
      { ...projection, summonAttackPct: projection.summonAttackPct * 2 }]) {
      const snapshot = { ...fixture.snapshot };
      if (bad) snapshot.skeletonMastery = bad;
      else delete snapshot.skeletonMastery;
      expect(() => recordMageMasterySeed(rehash({ ...fixture, snapshot }), 'elemental', 0)).toThrow(/projection/);
    }
    expect(() => recordMageMasterySeed(rehash({ ...fixture,
      allocation: { ...fixture.allocation, skillPointsUnspent: 1 } }), 'elemental', 0)).toThrow(/allocation/);
  });
});

describe('actual Mage Mastery observations', () => {
  it.each(literals)('applies Mastery$rank once at registration and preserves exact attack-time floor', row => {
    const fixture = buildMageMasteryFixture(row.rank), before = JSON.stringify(fixture);
    const run = recordMageMasterySeed(fixture, 'elemental', 0);
    expect(run.preparation.startupPayment).toBe(22);
    expect(run.preparation.mages).toHaveLength(4);
    for (const mage of run.preparation.mages) {
      expect(mage.life).toBeCloseTo(row.life, 10); expect(mage.stats.lifeMax).toBeCloseTo(row.life, 10);
      expect(mage.stats.attack).toBeCloseTo(row.attack, 10); expect(mage.stats.defense).toBeCloseTo(row.defense, 10);
      if (row.rank === 20) expect(mage.stats.attack).toBe(62.99999999999999);
      expect(Math.floor(mage.stats.attack)).toBe(row.base);
      expect(mage.stats.attackSpeed).toBe(70); expect(mage.stats.magicDodge).toBeCloseTo(0.09, 12);
    }
    expect(run.summary.mages.every(mage => mage.firstActionMs === null || mage.firstActionMs >= 1940)).toBe(true);
    expect(run.summary.metrics.mana.entry).toBe(187);
    expect(JSON.stringify(fixture)).toBe(before);
    // Static no-status resolver oracles, separately labeled from actual battle hits.
    for (const enemy of [fixture.snapshot.enemyTeam.find(unit => unit.id.includes('undead-flayer'))!, fixture.snapshot.enemyTeam.find(unit => unit.id.includes('horror-mage'))!]) {
      for (const type of ['fire', 'cold', 'lightning', 'poison'] as const) {
        const actual = resolveDamage({ baseMin: row.base, baseMax: row.base, flatBonus: 0,
          increasedPct: 0, comboMult: 1, type, critChance: 0, critMult: 1.5, ignoreDodge: true,
          defenderDodge: enemy.stats.magicDodge, defenderArmor: enemy.stats.defense,
          defenderMagicResist: enemy.stats.magicResist, defenderResistances: enemy.stats.resistances }, createRng(7));
        expect(actual.final).toBe(type === 'fire' || type === 'poison' ? 1 : enemy.id.includes('undead-flayer') ? row.flayer : row.horror);
        expect(actual.crit).toBe(false); expect(actual.dodged).toBe(false);
      }
    }
  });

  it('preserves A/A, A/B/A and plain/recorded parity without registry resets', () => {
    expect(verifyMageMasteryDeterminism(buildMageMasteryFixture(20), 'elemental')).toEqual({
      repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
  });

  it('rejects invalid seeds, stale hashes and a physical label for actual elemental bolts', () => {
    const fixture = buildMageMasteryFixture(0);
    for (const seed of [-1, 1000, 0.1, NaN]) expect(() => recordMageMasterySeed(fixture, 'elemental', seed)).toThrow(/seed/);
    expect(() => recordMageMasterySeed({ ...fixture, hash: 'stale' }, 'elemental', 0)).toThrow(/hash/);
    const run = recordMageMasterySeed(fixture, 'elemental', 0);
    expect(() => inspectMageMasteryBattle(fixture, run.recorded, 'physical', 0)).toThrow(/bolt type/);
  });

  it('refuses wrong registration stats, payment and elemental attribution', () => {
    const fixture = buildMageMasteryFixture(20), run = recordMageMasterySeed(fixture, 'elemental', 0);
    for (const mutation of ['double-mastery', 'wrong-owner', 'payment', 'type'] as const) {
      const events = run.recorded.events.map(event => {
        if (event.kind === 'summon' && mutation === 'double-mastery') return { ...event, unit: { ...event.unit,
          stats: { ...event.unit.stats, attack: event.unit.stats.attack * 1.4 } } };
        if (event.kind === 'summon' && mutation === 'wrong-owner') return { ...event, owner: 'other-owner' };
        if (event.kind === 'mana' && event.reason === 'cast' && mutation === 'payment') return { ...event, mana: event.mana + 1 };
        if (event.kind === 'damage' && event.source !== fixture.snapshot.playerTeam[0]!.id &&
          event.source.startsWith('player') && mutation === 'type') return { ...event, damageType: 'arcane' };
        return event;
      });
      expect(() => inspectMageMasteryBattle(fixture, { ...run.recorded, events }, 'elemental', 0)).toThrow();
    }
  });

  it('keeps observed orphan-transaction death events distinct from absence and direct kill attribution', () => {
    const fixture = buildMageMasteryFixture(0), actual = recordMageMasterySeed(fixture, 'elemental', 0);
    const hero = fixture.snapshot.playerTeam[0]!, mages = actual.preparation.mages;
    const events: RecordedBattleEvent[] = [...actual.preparation.events,
      { kind: 'status', target: hero.id, statusId: 'chill', simClockMs: 0, uiDelayMs: 50 },
      { kind: 'stunned', target: mages[0]!.id, simClockMs: 500, uiDelayMs: 50 },
      ...[hero, ...mages].map(unit => ({ kind: 'death' as const, target: unit.id, simClockMs: 1000, uiDelayMs: 50 })),
      { kind: 'end', winner: 'enemy', simClockMs: 1000, uiDelayMs: 50 }];
    const recorded: RecordedBattleResult = { events, result: { events, winner: 'enemy', rounds: 1,
      playerTeam: [{ ...hero, life: 0, mana: 165 }, ...mages.map(mage => ({ ...mage, life: 0 }))], enemyTeam: fixture.snapshot.enemyTeam } };
    const run = inspectMageMasteryBattle(fixture, recorded, 'elemental', 0);
    expect(run.summary.mageDeathEvents).toBe(4); expect(run.summary.absentWithoutDeath).toBe(0);
    expect(run.summary.nonActingMages).toBe(4); expect(run.summary.metrics.mages.attempts).toBe(0);
    expect(run.summary.metrics.successfulTtkMs).toBeNull();
    expect(run.summary.controls).toEqual([
      { kind: 'status', target: hero.id, statusId: 'chill', atMs: 0 },
      { kind: 'stunned', target: mages[0]!.id, statusId: null, atMs: 500 }
    ]); // Synthetic source-unavailable control contract, not an actual engine observation.
    const absent = inspectMageMasteryBattle(fixture, { events: [
      ...actual.preparation.events, { kind: 'end', winner: null, simClockMs: 1000, uiDelayMs: 50 }
    ], result: { ...recorded.result, winner: null, playerTeam: [{ ...hero, mana: 165 }] } }, 'elemental', 0);
    expect(absent.summary.mageDeathEvents).toBe(0); expect(absent.summary.absentWithoutDeath).toBe(4);
  });

  it('allows controlled first-action divergence but rejects mismatched paired seed/input/preparation', () => {
    const fixture = buildMageMasteryFixture(0), run = recordMageMasterySeed(fixture, 'elemental', 0);
    const delayed = { ...run, summary: { ...run.summary,
      mages: run.summary.mages.map(mage => ({ ...mage, firstActionMs: mage.firstActionMs === null ? null : mage.firstActionMs + 1000 })) } };
    expect(compareMageMasteryRuns(run, delayed).seed).toBe(0); // Synthetic comparator contract, not engine evidence.
    for (const bad of [{ ...run, seed: 1 }, { ...run, inputHash: 'wrong' },
      { ...run, preparation: { ...run.preparation, startupPayment: 21 } }]) expect(() => compareMageMasteryRuns(run, bad)).toThrow(/pair/);
    const events = run.recorded.events.map(event => event.kind === 'action' && event.actor === run.preparation.mages[0]!.id ?
      { ...event, simClockMs: 1 } : event);
    expect(() => inspectMageMasteryBattle(fixture, { ...run.recorded, events }, 'elemental', 0)).toThrow(/early action/);
  });

  it('censors defeat/draw, retains empty-success denominators and uses nearest-rank even quantiles', () => {
    const summary = recordMageMasterySeed(buildMageMasteryFixture(0), 'elemental', 0).summary;
    const defeat = { ...summary, metrics: { ...summary.metrics, outcome: 'defeat', heroDied: true, successfulTtkMs: null } };
    const draw = { ...summary, metrics: { ...summary.metrics, outcome: 'draw', heroDied: false, successfulTtkMs: null } };
    expect(summarizeMageMasteryRuns([defeat, draw])).toMatchObject({ count: 2,
      outcomes: { victory: 0, defeat: 1, draw: 1 }, heroDeaths: 1, successfulTtkMs: { count: 0, p50: null, p95: null } });
    const victories = [1000, 2000, 3000, 4000].map(successfulTtkMs => ({ ...summary,
      metrics: { ...summary.metrics, outcome: 'victory', heroDied: false, successfulTtkMs } }));
    expect(summarizeMageMasteryRuns([...victories, defeat, draw]).successfulTtkMs).toEqual({ count: 4, p50: 2000, p95: 4000 });
    expect(summarizeMageMasteryRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });

  it('refuses malformed periodic damage in the shared direct and periodic meter', () => {
    const fixture = buildMageMasteryFixture(0), run = recordMageMasterySeed(fixture, 'elemental', 0);
    const dot: RecordedBattleEvent = { kind: 'dot', target: fixture.snapshot.playerTeam[0]!.id, amount: -1, simClockMs: 0, uiDelayMs: 50 };
    expect(() => measureMageBattle(fixture.snapshot, { ...run.recorded, events: [dot, ...run.recorded.events] }))
      .toThrow('Invalid Mage screen periodic damage');
  });
});
