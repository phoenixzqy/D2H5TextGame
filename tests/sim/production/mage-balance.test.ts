import { describe, expect, it } from 'vitest';
import { buildMageBalanceFixture, MAGE_SCREEN_RECIPE, parseMageScreenRecipe } from './mage-balance-fixture';
import { compareMageScreens, measureMageBattle, runMageScreen, type MageScreenProvenance } from './mage-balance-runner';
import type { BattleEvent, RecordedBattleResult } from '@/engine/combat/combat';

describe('Mage physical/elemental screen fixture', () => {
  it('uses legal rank6 allocation, ordinary full resources and the fixed authored encounter', () => {
    const fixture = buildMageBalanceFixture();
    const hero = fixture.snapshot.playerTeam[0];
    expect(fixture.recipe.origin).toBe('unearned-imported-build');
    expect(fixture.recipe.combatSeeds).toEqual([7, 991]);
    expect(fixture.snapshot.playerTeam).toHaveLength(1);
    expect(hero).toMatchObject({ kind: 'hero', level: 30, life: 362, mana: 203,
      skillOrder: ['necromancer.raise_skeletal_mage'],
      skillLevels: { 'necromancer.raise_skeleton': 1, 'necromancer.raise_skeletal_mage': 6 },
      equippedWeapon: {}, stats: { lifeMax: 362, manaMax: 203, attack: 80, defense: 107, attackSpeed: 125 } });
    expect(fixture.allocation).toEqual({ skillPointsSpent: 7, skillPointsUnspent: 24, statPointsUnspent: 145 });
    expect(fixture.snapshot.skeletonMastery).toBeUndefined();
    expect(fixture.snapshot.enemyTeam).toHaveLength(8);
    expect(fixture.snapshot.enemyTeam.every(unit => unit.kind === 'monster' && unit.level === 2)).toBe(true);
    expect(buildMageBalanceFixture()).toEqual(fixture);
    expect(fixture.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    { ...MAGE_SCREEN_RECIPE, mageRank: 7 },
    { ...MAGE_SCREEN_RECIPE, level: 11 },
    { ...MAGE_SCREEN_RECIPE, combatSeeds: [7, 7] },
    { ...MAGE_SCREEN_RECIPE, equipment: { head: 'survival-cap' } },
    { ...MAGE_SCREEN_RECIPE, heroStats: { attack: 1000000 } }
  ])('rejects a changed or injected screen recipe: %j', recipe => {
    expect(() => parseMageScreenRecipe(recipe)).toThrow('Invalid Mage screen recipe');
  });

  it('copies recipes without sharing mutable caller state', () => {
    const input = structuredClone(MAGE_SCREEN_RECIPE);
    const parsed = parseMageScreenRecipe(input);
    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
    expect(parsed.combatSeeds).not.toBe(input.combatSeeds);
  });
});

const provenance: MageScreenProvenance = {
  revision: 'proposed-test', sourceHash: 'proposed-source', dataHash: 'same-data',
  driverHash: 'same-driver', toolHash: 'same-tool', fixtureBytesHash: 'same-fixture-bytes'
};

describe('Mage screen measurement contracts (synthetic event inputs)', () => {
  function sample(winner: 'player' | 'enemy' | null, durationMs: number) {
    const snapshot = buildMageBalanceFixture().snapshot;
    const target = snapshot.enemyTeam[0];
    const hero = snapshot.playerTeam[0];
    if (!target || !hero) throw new Error('Missing authored test units');
    const enemy = { ...target, life: 10, stats: { ...target.stats, lifeMax: 10 } };
    const enemies = [enemy];
    const events: BattleEvent[] = [
      { kind: 'damage', source: hero.id, target: target.id, amount: 8, crit: true, dodged: false, damageType: 'physical' },
      { kind: 'heal', target: target.id, amount: 5 },
      { kind: 'damage', source: hero.id, target: target.id, amount: 20, crit: false, dodged: false, damageType: 'physical' },
      { kind: 'damage', source: hero.id, target: target.id, amount: 0, crit: false, dodged: true, damageType: 'physical' },
      { kind: 'end', winner }
    ];
    const recorded: RecordedBattleResult = {
      events: events.map(event => ({ ...event, simClockMs: durationMs, uiDelayMs: 50 })),
      result: { events, winner, rounds: 1, playerTeam: [hero], enemyTeam: [{ ...enemy, life: 0 }] }
    };
    return { snapshot: { ...snapshot, enemyTeam: enemies }, recorded, hero, enemy };
  }

  it('separates logged overkill from effective HP removed, honoring intervening healing', () => {
    const { snapshot, recorded } = sample('player', 2000);
    const measured = measureMageBattle(snapshot, recorded);
    expect(measured.player).toMatchObject({ loggedDamage: 28, effectiveHpRemoved: 15,
      attempts: 3, crits: 1, critDenominator: 2, dodges: 1, dodgeDenominator: 3,
      loggedDps: 14, effectiveDps: 7.5 });
    expect(measured.hero).toEqual(measured.player);
    expect(measured.mages.loggedDamage).toBe(0);
    expect(measured).toMatchObject({ outcome: 'victory', durationMs: 2000, successfulTtkMs: 2000 });
  });

  it.each([['enemy', 'defeat'], [null, 'draw']] as const)('censors %s instead of reporting a successful 60s kill', (winner, outcome) => {
    const { snapshot, recorded } = sample(winner, 60000);
    const measured = measureMageBattle(snapshot, recorded);
    expect(measured).toMatchObject({ outcome, durationMs: 60000, successfulTtkMs: null });
  });

  it('reports undefined throughput as null for zero logical duration', () => {
    const { snapshot, recorded } = sample('player', 0);
    expect(measureMageBattle(snapshot, recorded).player).toMatchObject({ loggedDps: null, effectiveDps: null });
  });

  it('counts HP orbs before later effective damage without pretending they are damage', () => {
    const { snapshot, recorded, hero, enemy } = sample('player', 2000);
    const events: BattleEvent[] = [
      { kind: 'damage', source: enemy.id, target: hero.id, amount: 30, crit: false, dodged: false, damageType: 'physical' },
      { kind: 'orb', target: hero.id, orb: { kind: 'hp', restorePct: 0.05 } },
      { kind: 'damage', source: enemy.id, target: hero.id, amount: 1000, crit: false, dodged: false, damageType: 'physical' },
      { kind: 'death', target: hero.id }, { kind: 'end', winner: 'enemy' }
    ];
    const battle = { ...recorded, events: events.map(event => ({ ...event, simClockMs: 2000, uiDelayMs: 50 })),
      result: { ...recorded.result, events, winner: 'enemy' as const, playerTeam: [{ ...hero, life: 0 }], enemyTeam: [enemy] } };
    expect(measureMageBattle(snapshot, battle)).toMatchObject({ heroDied: true,
      enemy: { loggedDamage: 1030, effectiveHpRemoved: 380 } });
  });

  it('rejects an event stream whose reconstructed HP disagrees with final state', () => {
    const { snapshot, recorded, enemy } = sample('player', 2000);
    const inconsistent = { ...recorded, result: { ...recorded.result, enemyTeam: [{ ...enemy, life: 1 }] } };
    expect(() => measureMageBattle(snapshot, inconsistent)).toThrow('HP does not reconcile');
  });
});

describe('closed Mage screen engine consumer', () => {
  it('records both seeds with plain/recorded, A/A, A/B/A and preserved-input checks', () => {
    const fixture = buildMageBalanceFixture();
    const before = JSON.stringify(fixture);
    const screen = runMageScreen(fixture, 'elemental', provenance);
    expect(JSON.stringify(fixture)).toBe(before);
    expect(screen.runs.map(run => run.seed)).toEqual([7, 991]);
    expect(screen.checks).toEqual({ plainRecorded: true, repeatAA: true, returnABA: true, inputPreserved: true });
    for (const run of screen.runs) {
      expect(run.preparation.mages).toHaveLength(4);
      expect(run.preparation.startupPayment).toBe(22);
      expect(run.mageDamageTypes).toEqual([['fire'], ['cold'], ['lightning'], ['poison']]);
      expect(run.recorded.events.length).toBeGreaterThan(10);
      expect(run.metrics.mages.attempts).toBeGreaterThan(0);
      expect(run.inputHash).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(() => runMageScreen(fixture, 'physical', provenance)).toThrow('Mage damage type');
  });

  it('rejects mislabeled/mismatched pairs rather than diffing unrelated runs', () => {
    const candidate = runMageScreen(buildMageBalanceFixture(), 'elemental', provenance);
    // Contract-only copy: this is never evidence of a physical gameplay run.
    const baseline = { ...structuredClone(candidate), mode: 'physical' as const,
      provenance: { ...provenance, revision: 'physical-test', sourceHash: 'physical-source' } };
    expect(compareMageScreens(baseline, candidate)).toHaveLength(2);
    for (const key of ['dataHash', 'driverHash', 'toolHash', 'fixtureBytesHash'] as const) {
      expect(() => compareMageScreens({ ...baseline, provenance: { ...baseline.provenance, [key]: 'different' } }, candidate))
        .toThrow('Mismatched Mage screen');
    }
    expect(() => compareMageScreens(baseline, { ...candidate, fixtureHash: 'different' })).toThrow('Mismatched Mage screen');
    expect(() => compareMageScreens(baseline, { ...candidate, runs: [...candidate.runs].reverse() })).toThrow('Mismatched Mage screen');
    expect(() => compareMageScreens(baseline, { ...candidate, runs: candidate.runs.map(run => ({ ...run, inputHash: 'different' })) }))
      .toThrow('Mismatched Mage screen');
  });
});
