import { describe, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { endgameDefinition } from '@/data/loaders/endgame';
import { prepareEndgameAttempt, captureEndgameWave, advanceEndgameWave } from './runtime';
import { emptyEndgameState } from './state';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { buildMonsterUnit } from '../combat/monster-factory';
import { runBattle } from '../combat/combat';
import { createRng, hashSeed } from '../rng';
import type { CombatUnit } from '../combat/types';

function prepare(modifierId = 'ashen', attemptOrdinal = 0) {
  return prepareEndgameAttempt({ heroId: 'hero', modifierId,
    state: { ...emptyEndgameState(), attemptOrdinal }, campaign: campaignEvidence() });
}
function units(attempt: ReturnType<typeof prepare>['progress']) {
  const wave = attempt.plan.waves[attempt.nextWaveIndex];
  if (!wave) throw new Error('Missing test wave');
  return wave.spawns.map((spawn, index) => {
    const def = monsters.find(row => row.id === spawn.archetypeId);
    if (!def) throw new Error('Missing authored monster');
    return buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, rng: createRng(index + 1),
      id: `wave${String(attempt.nextWaveIndex)}-${String(index)}` });
  });
}
function hero(): CombatUnit {
  const unit = units(prepare().progress)[0];
  if (!unit) throw new Error('Missing native unit fixture');
  // Decisive authority fixture: override both Attack representations copied from the monster.
  return { ...unit, id: 'hero', kind: 'hero', side: 'player', life: 1_000_000,
    attackRange: [1_000_000, 1_000_000],
    stats: { ...unit.stats, life: 1_000_000, lifeMax: 1_000_000, attack: 1_000_000,
      attackSpeed: 1000, physDodge: 0, magicDodge: 0 }, skillOrder: [] };
}
function winningOutcome(enemies: readonly CombatUnit[]) {
  return { winner: 'player', finalPlayerTeam: [hero()], finalEnemyTeam: enemies.map(unit => ({ ...unit, life: 0 })) };
}

describe('D14 immutable admission and plan', () => {
  it('requires actual campaign evidence and refuses unknown choices and ordinal exhaustion before mutation', () => {
    const input = { heroId: 'hero', modifierId: 'ashen', state: emptyEndgameState(), campaign: campaignEvidence() };
    const before = structuredClone(input);
    expect(() => prepareEndgameAttempt({ ...input, campaign: { questProgress: {}, questReceipts: {}, questItems: {} } })).toThrow('locked');
    expect(() => prepareEndgameAttempt({ ...input, modifierId: 'unknown' })).toThrow('modifier');
    expect(() => prepareEndgameAttempt({ ...input, heroId: '' })).toThrow('hero');
    expect(() => prepare('ashen', Number.MAX_SAFE_INTEGER)).toThrow('ordinal');
    expect(input).toEqual(before);
  });
  it('binds canonical hero/dungeon/modifier/ordinal seed and leaves campaign namespaces absent', () => {
    const a = prepare(), b = prepare(), next = prepare('ashen', 1), other = prepare('glacial');
    expect(a).toEqual(b);
    expect(a.progress.context.seed).toBe(hashSeed(JSON.stringify(['endgame-run-v1', 'hero',
      'endgame/worldstone-remnant', 'ashen', 0])));
    expect(a.progress.context.seed).not.toBe(next.progress.context.seed);
    expect(a.progress.context.seed).not.toBe(other.progress.context.seed);
    expect(a.stateAfterEntry).toEqual({ ...emptyEndgameState(), attemptOrdinal: 1 });
    expect(a.progress.plan.origin).toBe(a.progress.context);
    expect(a.progress.plan.mode).toBe('manual');
    expect(a.progress.plan.replayProfileId).toBeUndefined();
    expect(a.progress.plan.questSourceProjection).toBeUndefined();
    expect(a.progress.plan.waves.every(wave => wave.source === undefined &&
      wave.spawns.every(spawn => spawn.level === 90 && spawn.chapterBoss === undefined && spawn.eliteAffix === undefined))).toBe(true);
    expect(Object.isFrozen(a.progress.plan.waves[0]?.spawns[0])).toBe(true);
    expect(a.progress.plan.waves.map(wave => wave.spawns.length)).toEqual([4, 4, 4, 3]);
    expect(a.progress.plan.waves[3]?.spawns.map(spawn => spawn.tier)).toEqual(['boss', 'trash', 'trash']);
    expect(other.progress.plan.waves[1]?.spawns.map(spawn => spawn.archetypeId)).toEqual([
      'monsters/act5.death-mauler', 'monsters/act5.death-mauler', 'monsters/act5.frozen-terror', 'monsters/act5.frozen-terror'
    ]);
  });
});

describe('D14 original ordered wave authority proposals', () => {
  it.each([
    { modifierId: 'ashen', materialId: 'gems/ruby/flawless' },
    { modifierId: 'glacial', materialId: 'gems/sapphire/flawless' }
  ])('uses real factories and four battles for $modifierId; only the last proposes its cache', ({ modifierId, materialId }) => {
    let { progress } = prepare(modifierId);
    const before = structuredClone(endgameDefinition);
    for (let index = 0; index < 4; index++) {
      const enemies = units(progress), player = hero();
      const binding = captureEndgameWave(progress, [player], enemies);
      const snapshot = { seed: progress.context.seed, act: 5 as const, playerTeam: [player], enemyTeam: enemies };
      const original = structuredClone(snapshot);
      const result = runBattle(snapshot);
      expect(result.winner).toBe('player');
      expect(snapshot).toEqual(original);
      const settled = advanceEndgameWave(progress, binding, {
        winner: result.winner, finalPlayerTeam: result.playerTeam, finalEnemyTeam: result.enemyTeam });
      expect(settled.progress.nextWaveIndex).toBe(index + 1);
      expect(settled.completion).toEqual(index === 3 ? {
        attemptOrdinal: 0, modifierId, materials: { [materialId]: 1 }
      } : undefined);
      expect(() => advanceEndgameWave(settled.progress, binding, winningOutcome(enemies))).toThrow();
      progress = settled.progress;
    }
    expect(progress.status).toBe('completed');
    expect(() => captureEndgameWave(progress, [hero()], [])).toThrow();
    expect(endgameDefinition).toEqual(before);
  });
  it('rejects missing, duplicate, dead, wrong-level and substituted originals at capture', () => {
    const { progress } = prepare(), enemies = units(progress), first = enemies[0];
    if (!first) throw new Error('Missing original');
    for (const invalid of [enemies.slice(1), [...enemies, first], [first, first, ...enemies.slice(2)],
      [{ ...first, life: 0 }, ...enemies.slice(1)], [{ ...first, level: 1 }, ...enemies.slice(1)],
      [{ ...first, monsterArchetypeId: 'monsters/act5.baal' }, ...enemies.slice(1)],
      [{ ...first, id: 'hero' }, ...enemies.slice(1)]]) {
      expect(() => captureEndgameWave(progress, [hero()], invalid)).toThrow();
    }
    expect(() => captureEndgameWave(progress, [{ ...hero(), id: 'other' }], enemies)).toThrow();
  });
  it('refuses stale and mixed-attempt/modifier bindings', () => {
    const a = prepare().progress, b = prepare('glacial').progress;
    const enemies = units(a), binding = captureEndgameWave(a, [hero()], enemies);
    expect(() => advanceEndgameWave(b, binding, winningOutcome(enemies))).toThrow();
    expect(() => advanceEndgameWave(prepare('ashen', 1).progress, binding, winningOutcome(enemies))).toThrow();
  });
  it('allows a bound enemy summon and keeps pure proposals repeatable without publishing rewards', () => {
    const { progress } = prepare(), enemies = units(progress), first = enemies[0];
    if (!first) throw new Error('Missing original');
    const binding = captureEndgameWave(progress, [hero()], enemies), outcome = winningOutcome(enemies);
    outcome.finalEnemyTeam.push({ ...first, id: 'enemy-summon', kind: 'summon', summonOwnerId: first.id, life: 0 });
    const firstProposal = advanceEndgameWave(progress, binding, outcome);
    expect(firstProposal.progress.status).toBe('active');
    expect(firstProposal.progress.nextWaveIndex).toBe(1);
    expect(firstProposal.completion).toBeUndefined();
    expect(advanceEndgameWave(progress, binding, outcome)).toEqual(firstProposal);
    expect(progress.nextWaveIndex).toBe(0);
  });
  it('rejects copied final-wave progress and manufactured bindings; partial progress cannot be imported', () => {
    const { progress } = prepare(), enemies = units(progress);
    const binding = captureEndgameWave(progress, [hero()], enemies);
    expect(() => captureEndgameWave({ ...progress, nextWaveIndex: 3 }, [hero()], units({ ...progress, nextWaveIndex: 3 }))).toThrow();
    expect(() => advanceEndgameWave(progress, { ...binding, originalMembers: [] }, winningOutcome(enemies))).toThrow();
    expect(() => captureEndgameWave(structuredClone(progress), [hero()], enemies)).toThrow();
  });
  it.each(['loss', 'draw', 'living-enemy', 'missing-enemy', 'duplicate-enemy', 'extra-original', 'dead-hero', 'substituted-hero'])(
    'ends %s without completing or proposing a cache', failure => {
      const { progress } = prepare(), enemies = units(progress), first = enemies[0];
      if (!first) throw new Error('Missing original');
      const binding = captureEndgameWave(progress, [hero()], enemies), valid = winningOutcome(enemies);
      const outcome = { ...valid,
        winner: failure === 'loss' ? 'enemy' : failure === 'draw' ? null : 'player',
        finalPlayerTeam: failure === 'dead-hero' ? [{ ...hero(), life: 0 }]
          : failure === 'substituted-hero' ? [{ ...hero(), id: 'other' }] : valid.finalPlayerTeam,
        finalEnemyTeam: failure === 'living-enemy' ? enemies
          : failure === 'missing-enemy' ? valid.finalEnemyTeam.slice(1)
            : failure === 'duplicate-enemy' ? [...valid.finalEnemyTeam, { ...first, life: 0 }]
              : failure === 'extra-original' ? [...valid.finalEnemyTeam, { ...first, id: 'other-wave-original', life: 0 }]
                : valid.finalEnemyTeam };
      const settled = advanceEndgameWave(progress, binding, outcome);
      expect(settled.progress.status).toBe('failed');
      expect(settled.progress.nextWaveIndex).toBe(0);
      expect(settled.completion).toBeUndefined();
      expect(() => captureEndgameWave(settled.progress, [hero()], enemies)).toThrow();
    });
});
