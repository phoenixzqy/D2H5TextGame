import { describe, expect, it } from 'vitest';
import { buildMageRankFixture, MAGE_RANK_RECIPE, parseMageRankRecipe } from './mage-rank-fixture';
import { inspectMageRankBattle, recordMageRankSeed, compareMageRankRuns, summarizeMageRankRuns, verifyMageRankDeterminism, type MageRankSummary } from './mage-rank-runner';
import type { BattleEvent, RecordedBattleResult } from '@/engine/combat/combat';

describe('unearned common-level Mage rank audit fixtures', () => {
  it.each([[1, 2, 31], [6, 7, 26], [20, 21, 12]])('legally allocates rank%i with %i spent and %i unspent points', (rank, spent, unspent) => {
    const fixture = buildMageRankFixture(rank);
    expect(fixture.recipe).toEqual({ ...MAGE_RANK_RECIPE, mageRank: rank });
    expect(fixture.allocation).toEqual({ skillPointsSpent: spent, skillPointsUnspent: unspent, statPointsUnspent: 155 });
    expect(fixture.snapshot.playerTeam).toHaveLength(1);
    expect(fixture.snapshot.playerTeam[0]).toMatchObject({ kind: 'hero', level: 32, life: 378, mana: 211,
      stats: { lifeMax: 378, manaMax: 211, attack: 84, defense: 113, attackSpeed: 125 },
      skillLevels: { 'necromancer.raise_skeleton': 1, 'necromancer.raise_skeletal_mage': rank },
      skillOrder: ['necromancer.raise_skeletal_mage'], equippedWeapon: {} });
    expect(fixture.snapshot.skeletonMastery).toBeUndefined();
    expect(fixture.snapshot.enemyTeam).toHaveLength(8);
    expect(fixture.snapshot.enemyTeam.reduce((total, unit) => total + unit.life, 0)).toBe(330);
    expect(buildMageRankFixture(rank)).toEqual(fixture);
  });

  it.each([0, 21, 1.5, NaN])('rejects invalid rank %s', rank => {
    expect(() => buildMageRankFixture(rank)).toThrow('Invalid Mage rank recipe');
  });

  it('rejects changes to level, seed grid, Mastery or injected equipment', () => {
    for (const change of [{ level: 31 }, { seedCount: 999 }, { masteryRank: 1 }, { equipment: { head: 'cap' } }, { extra: true }]) {
      expect(() => parseMageRankRecipe({ ...MAGE_RANK_RECIPE, mageRank: 6, ...change })).toThrow('Invalid Mage rank recipe');
    }
  });

  it('keeps hero statistics and authored enemy inputs identical across ranks', () => {
    const low = buildMageRankFixture(1), high = buildMageRankFixture(20);
    expect(low.snapshot.playerTeam[0]?.stats).toEqual(high.snapshot.playerTeam[0]?.stats);
    expect(low.snapshot.enemyTeam).toEqual(high.snapshot.enemyTeam);
    expect(low.hash).not.toBe(high.hash);
  });
});

describe('bounded rank audit recording contracts', () => {
  it.each([[1, 1], [2, 2], [3, 3], [6, 4], [9, 5], [12, 6], [15, 7], [18, 8], [20, 8]])('observes rank%i cap%i and preserves ordinary inputs', (rank, cap) => {
    const fixture = buildMageRankFixture(rank), before = JSON.stringify(fixture);
    const run = recordMageRankSeed(fixture, 'elemental', 0);
    expect(JSON.stringify(fixture)).toBe(before);
    expect(run.preparation.mages).toHaveLength(cap);
    expect(run.preparation.startupPayment).toBe(22);
    expect(run.summary.metrics.player.effectiveHpRemoved + run.summary.metrics.periodic.againstEnemies.effectiveHpRemoved).toBe(330);
    expect(run.summary.metrics.outcome).toBe('victory');
    expect(run.summary.mages).toHaveLength(cap);
    expect(run.summary.mages.every(mage => mage.attacks >= 0)).toBe(true);
    expect(() => inspectMageRankBattle(fixture, run.recorded, 'physical', 0)).toThrow('Mage rank bolt type');
  });

  it('retains non-acting registered Mages without forcing attacks before combat ends (synthetic contract)', () => {
    const fixture = buildMageRankFixture(20), run = recordMageRankSeed(fixture, 'elemental', 0);
    const hero = fixture.snapshot.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const at = (event: BattleEvent) => ({ ...event, simClockMs: 1000, uiDelayMs: 50 });
    const ending: BattleEvent[] = fixture.snapshot.enemyTeam.flatMap(enemy => [
      { kind: 'damage', source: hero.id, target: enemy.id, amount: enemy.life, crit: false, dodged: false, damageType: 'physical' },
      { kind: 'death', target: enemy.id }
    ]);
    ending.push({ kind: 'end', winner: 'player' });
    const recorded: RecordedBattleResult = { events: [...run.preparation.events, ...ending.map(at)],
      result: { ...run.recorded.result, winner: 'player', events: [],
        playerTeam: [{ ...hero, mana: hero.mana - 22 }, ...run.preparation.mages],
        enemyTeam: fixture.snapshot.enemyTeam.map(enemy => ({ ...enemy, life: 0 })) } };
    const inspected = inspectMageRankBattle(fixture, recorded, 'elemental', 0);
    expect(inspected.summary.mages).toHaveLength(8);
    expect(inspected.summary.mages.every(mage => mage.firstActionMs === null && mage.attacks === 0)).toBe(true);
    expect(inspected.summary.nonActingMages).toBe(8);
  });

  it('rejects wrong bolt attribution, missing registration and a changed fixture hash', () => {
    const fixture = buildMageRankFixture(6), run = recordMageRankSeed(fixture, 'elemental', 0);
    const mageId = run.preparation.mages[0]?.id;
    const wrong = { ...run.recorded, events: run.recorded.events.map(event =>
      event.kind === 'damage' && event.source === mageId ? { ...event, damageType: 'physical' as const } : event) };
    expect(() => inspectMageRankBattle(fixture, wrong, 'elemental', 0)).toThrow('Mage rank bolt type');
    const missing = { ...run.recorded, events: run.recorded.events.filter(event => !(event.kind === 'summon' && event.unit.id === mageId)) };
    expect(() => inspectMageRankBattle(fixture, missing, 'elemental', 0)).toThrow('Mage rank preparation');
    expect(() => recordMageRankSeed({ ...fixture, hash: 'different' }, 'elemental', 0)).toThrow('Mage rank fixture hash');
  });

  it('validates both literal fresh cycles F/C/L/P/F/C/L/P (synthetic direct-event contract)', () => {
    const fixture = buildMageRankFixture(20), run = recordMageRankSeed(fixture, 'elemental', 0);
    const hero = fixture.snapshot.playerTeam[0], target = fixture.snapshot.enemyTeam[0];
    if (!hero || !target) throw new Error('Missing fixture units');
    const cycle = ['fire', 'cold', 'lightning', 'poison', 'fire', 'cold', 'lightning', 'poison'] as const;
    const attacks: BattleEvent[] = run.preparation.mages.map((mage, index) => ({
      kind: 'damage', source: mage.id, target: target.id, amount: 1, crit: false, dodged: false, damageType: cycle[index] ?? 'physical' }));
    const ending: BattleEvent[] = fixture.snapshot.enemyTeam.flatMap(enemy => [
      { kind: 'damage', source: hero.id, target: enemy.id, amount: enemy.life - (enemy.id === target.id ? 8 : 0), crit: false, dodged: false, damageType: 'physical' },
      { kind: 'death', target: enemy.id }
    ]);
    ending.push({ kind: 'end', winner: 'player' });
    const recorded: RecordedBattleResult = { events: [...run.preparation.events, ...[...attacks, ...ending].map(event => ({ ...event, simClockMs: 1940, uiDelayMs: 50 }))],
      result: { ...run.recorded.result, winner: 'player', events: [], playerTeam: [{ ...hero, mana: hero.mana - 22 }, ...run.preparation.mages],
        enemyTeam: fixture.snapshot.enemyTeam.map(enemy => ({ ...enemy, life: 0 })) } };
    expect(inspectMageRankBattle(fixture, recorded, 'elemental', 0).summary.mages.map(mage => mage.attacks)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    const wrong = { ...recorded, events: recorded.events.map(event => event.kind === 'damage' && event.source === run.preparation.mages[4]?.id
      ? { ...event, damageType: 'cold' as const } : event) };
    expect(() => inspectMageRankBattle(fixture, wrong, 'elemental', 0)).toThrow('Mage rank bolt type');
  });

  it('checks bounded repeat/plain parity without reset and rejects seeds outside the retained grid', () => {
    const fixture = buildMageRankFixture(1);
    expect(verifyMageRankDeterminism(fixture, 'elemental', true)).toEqual({ repeatAA: true, returnABA: true, plainRecorded: true, inputPreserved: true });
    for (const seed of [-1, 1000, 0.5, NaN]) expect(() => recordMageRankSeed(fixture, 'elemental', seed)).toThrow('Invalid Mage rank seed');
  });

  it('compares only matching seeds, fixtures, preparation and common surviving first cadence', () => {
    const fixture = buildMageRankFixture(6), run = recordMageRankSeed(fixture, 'elemental', 0);
    // Pair-shape contract only; this copy is never a historical physical measurement.
    expect(compareMageRankRuns(run, run)).toEqual({ seed: 0, before: run.summary, after: run.summary });
    expect(() => compareMageRankRuns(run, { ...run, seed: 1 })).toThrow('Mismatched Mage rank pair');
    expect(() => compareMageRankRuns(run, { ...run, inputHash: 'different' })).toThrow('Mismatched Mage rank pair');
    expect(() => compareMageRankRuns(run, { ...run, preparation: { ...run.preparation, startupPayment: 0 } })).toThrow('Mismatched Mage rank pair');
    const changed = { ...run, summary: { ...run.summary, mages: run.summary.mages.map(mage => ({ ...mage, firstActionMs: 1941 })) } };
    expect(() => compareMageRankRuns(run, changed)).toThrow('Mismatched Mage rank pair');
  });

  it('summarizes successful TTK using explicit censored denominators and nearest-rank quantiles', () => {
    const run = recordMageRankSeed(buildMageRankFixture(1), 'elemental', 0);
    const rows: MageRankSummary[] = [1000, 3000, 2000, 4000].map(time => ({ ...run.summary, metrics: { ...run.summary.metrics, durationMs: time, successfulTtkMs: time } }));
    rows.push({ ...run.summary, metrics: { ...run.summary.metrics, outcome: 'draw', durationMs: 60000, successfulTtkMs: null } });
    rows.push({ ...run.summary, metrics: { ...run.summary.metrics, outcome: 'defeat', heroDied: true, durationMs: 60000, successfulTtkMs: null } });
    const summary = summarizeMageRankRuns(rows);
    expect(summary).toMatchObject({ count: 6, outcomes: { victory: 4, defeat: 1, draw: 1 }, heroDeaths: 1,
      successfulTtkMs: { count: 4, p50: 2000, p95: 4000 } });
    expect(summarizeMageRankRuns([]).successfulTtkMs).toEqual({ count: 0, p50: null, p95: null });
  });
});
