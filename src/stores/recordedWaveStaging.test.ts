import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engine from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { stageRecordedWave, type RecordedWaveStagingInput } from './recordedWaveStaging';

function unit(id: string, side: 'player' | 'enemy'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    stats: { life: 100, lifeMax: 100, mana: 35, manaMax: 50, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    life: 100, mana: 35, statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [],
    gridPosition: { row: 1, col: 1 }, summonGridPositions: [{ row: 0, col: 1 }],
    enraged: false, summonedAdds: false };
}
function input(): RecordedWaveStagingInput {
  return { snapshot: { seed: 7, playerTeam: [unit('hero', 'player')], enemyTeam: [unit('enemy', 'enemy')] },
    waveIdx: 1, totalWaves: 3, subAreaRunId: 'fixture-run',
    defaults: { currentWave: 9, totalWaves: 9, subAreaRunId: 'old-run',
      runRewards: { items: [], runeShards: 3, runes: 2, gems: 1, wishstones: 4, materials: { 'runes/el': 2, 'gems/ruby/chipped': 1 } } },
    resolveDisplayName: value => `localized:${value.id}` };
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing staging fixture');
  return value;
}
function expectFrozenTree(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectFrozenTree(child);
}
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); });

describe('owned recorded-wave staging', () => {
  it.each(['normal', 'nightmare'] as const)('captures immutable %s run difficulty over contradictory input', difficulty => {
    const source = input(), hero = required(source.snapshot.playerTeam[0]), target = required(source.snapshot.enemyTeam[0]);
    const held = (appliedAtMs: number) => ({ id: 'stun', stacks: 1, remaining: -1, sourceId: 'fixture', appliedAtMs });
    const snapshot: engine.CombatSnapshot = { ...source.snapshot,
      difficulty: difficulty === 'normal' ? 'nightmare' : 'normal',
      playerTeam: [{ ...hero, skillOrder: ['sorceress.static_field'], staticFieldRank: 1,
        statuses: [held(1701)] }],
      enemyTeam: [{ ...target, life: 34, statuses: [held(0)] }] };
    const original = structuredClone(snapshot);
    const staged = stageRecordedWave({ ...source, replayProfileId: difficulty, snapshot });
    expect(staged.engineInput.difficulty).toBe(difficulty);
    expect(staged.recording.replayProfileId).toBe(difficulty);
    expect(staged.recording.outcome.finalEnemyTeam[0]?.life).toBe(difficulty === 'normal' ? 26 : 33);
    expect(snapshot).toEqual(original);
    Object.assign(snapshot, { difficulty });
    expect(staged.engineInput.difficulty).toBe(difficulty);
    expect(Object.isFrozen(staged.engineInput)).toBe(true);
  });

  it('passes its exact retained immutable input to the real engine with equivalent recording', () => {
    const source = input();
    const expected = engine.runBattleRecorded(source.snapshot);
    const simulation = vi.spyOn(engine, 'runBattleRecorded');
    const staged = stageRecordedWave(source);
    expect(simulation).toHaveBeenCalledTimes(1);
    expect(simulation.mock.calls[0]?.[0]).toBe(staged.engineInput);
    expect(staged.engineInput).toEqual(source.snapshot);
    expect(staged.engineInput).not.toBe(source.snapshot);
    expectFrozenTree(staged.engineInput);
    expect(staged.recording.events).toEqual(expected.events);
    expect(staged.recording.outcome).toEqual({ winner: expected.result.winner,
      finalPlayerTeam: expected.result.playerTeam, finalEnemyTeam: expected.result.enemyTeam });
    expect(staged.publication.recordedEvents).toBe(staged.recording.events);
    expect(staged.publication.outcome).toBe(staged.recording.outcome);
    expect(staged.elapsedMs).toBe(expected.events.at(-1)?.simClockMs);
    expect(staged.attestation).toBeNull();
  });

  it('owns every input subtree without freezing caller units, stats, carry or formation', () => {
    const source = input(); const before = structuredClone(source.snapshot);
    const staged = stageRecordedWave(source);
    const hero = required(source.snapshot.playerTeam[0]);
    const captured = required(staged.engineInput.playerTeam[0]);
    expect(captured).not.toBe(hero);
    expect(captured.stats).not.toBe(hero.stats);
    expect(captured.stats.resistances).not.toBe(hero.stats.resistances);
    expect(captured.statuses).not.toBe(hero.statuses);
    expect(captured.cooldowns).not.toBe(hero.cooldowns);
    expect(captured.skillOrder).not.toBe(hero.skillOrder);
    expect(captured.summonGridPositions).not.toBe(hero.summonGridPositions);
    for (const caller of [source.snapshot, source.snapshot.playerTeam, hero, hero.stats,
      hero.stats.resistances, hero.statuses, hero.cooldowns, hero.skillOrder, hero.summonGridPositions]) {
      expect(Object.isFrozen(caller)).toBe(false);
    }
    Object.assign(hero, { life: 1, mana: 0 });
    Object.assign(hero.stats.resistances, { fire: 71 });
    Object.assign(hero.cooldowns, { changed: 100 });
    Object.assign(required(hero.summonGridPositions), { 0: { row: 2, col: 2 } });
    expect(staged.engineInput).toEqual(before);
    expect(() => Object.assign(captured.stats, { life: 1 })).toThrow(TypeError);
    expect(() => Object.assign(captured.cooldowns, { changed: 1 })).toThrow(TypeError);
  });

  it.each([undefined, NaN, Infinity, -Infinity, -0])('copies literal optional/nonfinite value %s without JSON coercion', value => {
    const source = input();
    const realResult = engine.runBattleRecorded(source.snapshot);
    const snapshot = { ...source.snapshot };
    Object.assign(snapshot, { maxRounds: value });
    const simulation = vi.spyOn(engine, 'runBattleRecorded').mockReturnValueOnce(realResult);
    const staged = stageRecordedWave({ ...source, snapshot });
    expect(Object.prototype.hasOwnProperty.call(staged.engineInput, 'maxRounds')).toBe(true);
    expect(Object.is(staged.engineInput.maxRounds, value)).toBe(true);
    expect(simulation.mock.calls[0]?.[0]).toBe(staged.engineInput);
    expect(Object.prototype.hasOwnProperty.call(snapshot, 'maxRounds')).toBe(true);
    expect(Object.is(snapshot.maxRounds, value)).toBe(true);
  });

  it.each(['mightAura', 'meditationAura', 'skeletonMastery', 'ironGolem'] as const)(
    'copies and freezes optional %s rather than retaining configuration', key => {
      const projections = {
        mightAura: { selectedAuraId: 'paladin.might' as const, sourceHeroId: 'hero', rank: 1,
          maxRank: 20, physicalDamagePct: 0.1, attackPct: 0.1 },
        meditationAura: { selectedAuraId: 'paladin.meditation' as const, sourceHeroId: 'hero', rank: 1,
          maxRank: 20, sourceBaselinePerSecond: 1, manaRegenPctPerRank: 0.1 },
        skeletonMastery: { sourceHeroId: 'hero', rank: 1, maxRank: 20,
          summonLifePct: 0.1, summonAttackPct: 0.1, summonDefensePct: 0.1 },
        ironGolem: { sourceHeroId: 'hero', sourceItemId: 'selected', life: 12.5, attack: 3.25, defense: 4.5 }
      };
      const source = input();
      const staged = stageRecordedWave({ ...source, snapshot: { ...source.snapshot, [key]: projections[key] } });
      expect(staged.engineInput[key]).toEqual(projections[key]);
      expect(staged.engineInput[key]).not.toBe(projections[key]);
      expect(Object.isFrozen(staged.engineInput[key])).toBe(true);
      expect(Object.isFrozen(projections[key])).toBe(false);
    });

  it('retains exact successful Iron attestation and resolves names of newly spawned units', () => {
    const source = input(); const hero = required(source.snapshot.playerTeam[0]);
    const snapshot = { ...source.snapshot,
      playerTeam: [{ ...hero, skillOrder: ['necromancer.iron_golem'],
        skillLevels: { 'necromancer.iron_golem': 6, 'necromancer.blood_golem': 1 } }],
      ironGolem: { sourceHeroId: 'hero', sourceItemId: 'selected', life: 0, attack: 8, defense: 0 } };
    const actualEngine = engine.runBattleRecorded;
    let actual: engine.RecordedBattleResult | undefined;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(value => {
      actual = actualEngine(value); return actual;
    });
    const name = vi.fn(source.resolveDisplayName);
    const staged = stageRecordedWave({ ...source, snapshot, resolveDisplayName: name });
    const recorded = required(actual);
    const summon = required(recorded.events.find(event => event.kind === 'summon'));
    expect(staged.attestation).toBe(recorded.result.ironGolemPreparation);
    expect(staged.attestation).toEqual({ sourceHeroId: 'hero', sourceItemId: 'selected',
      skillId: 'necromancer.iron_golem', spawnedUnitId: summon.unit.id, paidMp: 35 });
    expect(summon.unit.stats.attack).toBe(54);
    expect(staged.publication.unitNameMap.get(summon.unit.id)).toBe(`localized:${summon.unit.id}`);
    expect(name).toHaveBeenCalledWith(recorded.result.playerTeam.find(value => value.id === summon.unit.id));
    expect('resolveDisplayName' in staged).toBe(false);
  });

  it('captures intro, boss identity, presentation, lock and reward reset in one complete publication', () => {
    const source = input(); const boss = { unitId: 'enemy', archetypeId: 'fixture-boss' };
    const presentation = { kind: 'trash' as const };
    const staged = stageRecordedWave({ ...source, chapterBoss: boss,
      bossIntro: { bossArchetypeId: 'fixture-boss' }, wavePresentation: presentation,
      ironGolemReplayLocked: true, resetRunRewards: true });
    expect(staged.publication).toMatchObject({ currentWave: 2, totalWaves: 3, subAreaRunId: 'fixture-run',
      ironGolemReplayLocked: true, runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } });
    expect(staged.publication.runRewards).not.toBe(source.defaults.runRewards);
    expect(staged.publication.currentWavePresentation).toBe(presentation);
    expect(staged.recording.chapterBoss).toEqual(boss);
    expect(staged.recording.events[0]).toEqual({ kind: 'message', messageKey: 'combat:bossIntro',
      params: { boss: 'localized:enemy' }, simClockMs: 0, uiDelayMs: 1200 });
    expect(staged.recording.events.at(-1)?.simClockMs).toBe(staged.elapsedMs);
    expect(staged.publication.recordedEvents).toBe(staged.recording.events);
    expect(source.defaults.runRewards.runeShards).toBe(3);
  });

  it('retains captured rewards and unlocked/default metadata for an ordinary wave', () => {
    const source = input(); const staged = stageRecordedWave(source);
    expect(staged.publication.runRewards).toBe(source.defaults.runRewards);
    expect(staged.publication.ironGolemReplayLocked).toBe(false);
    expect(staged.publication.currentWavePresentation).toBeNull();
    expect(staged.recording.chapterBoss).toBeUndefined();
    expect(staged.recording.events[0]?.kind).not.toBe('message');
  });

  it.each(['engine', 'names', 'invalid-terminal'] as const)('propagates %s failure without changing caller input', fault => {
    const source = input(); const before = structuredClone(source.snapshot); const failure = new Error(fault);
    if (fault === 'engine') vi.spyOn(engine, 'runBattleRecorded').mockImplementationOnce(() => { throw failure; });
    const attempt = fault === 'names' ? { ...source, resolveDisplayName: () => { throw failure; } } : source;
    if (fault === 'invalid-terminal') {
      const actual = engine.runBattleRecorded(source.snapshot);
      vi.spyOn(engine, 'runBattleRecorded').mockReturnValueOnce({ ...actual, events: [] });
    }
    expect(() => stageRecordedWave(attempt)).toThrow(fault === 'invalid-terminal'
      ? 'Recorded battle must end with a valid terminal simulation clock' : failure);
    expect(source.snapshot).toEqual(before);
    expect(Object.isFrozen(source.snapshot)).toBe(false);
  });
});
