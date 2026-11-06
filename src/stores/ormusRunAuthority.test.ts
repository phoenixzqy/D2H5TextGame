/** Constructed native-boundary witnesses, not earned combat/balance evidence. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engine from '@/engine/combat/combat';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { monsters, subAreas } from '@/data/index';
import { resolveChallengeWavePlan, buildMonsterUnit } from '@/engine/combat';
import { applyReplayProfileToPlan } from '@/engine/map/replay-profile';
import { ORMUS } from '@/engine/map/ormus-quest';
import { createRng } from '@/engine/rng';
import type { CombatSnapshot, RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { QuestProgressData } from '@/engine/types/save';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedWave } from './recordedWaveStaging';
import { issueOrmusRun, captureOrmusNativeWitness, bindOrmusWitness, isOrmusWitnessBound,
  prepareOrmusAdvance, invalidateOrmusReplay, captureOrmusAuthorityRollback } from './ormusRunAuthority';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Ormus authority fixture');
  return value;
}
const area = required(subAreas.find(entry => entry.id === ORMUS.area));
const fallback = required(monsters.find(entry => entry.id.startsWith('monsters/act3.')));
function fixture() {
  const normal = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: fallback.id,
    fallbackLevel: area.areaLevel, seed: 7, challengeOrdinal: 0, mode: 'manual' });
  const plan = applyReplayProfileToPlan(normal, 'normal', new Map(monsters.map(entry => [entry.id, entry])));
  const body = buildMonsterUnit({ def: fallback, level: 32, tier: 'trash', rng: createRng(7) });
  const hero: CombatUnit = { ...body, id: 'hero', side: 'player', kind: 'hero' };
  const run: ActiveRun = { origin: Object.freeze({ kind: 'area', replayProfileId: 'normal' }),
    plan, act: 3, seed: 7, mode: 'manual', replayProfileId: 'normal', playerUnit: hero,
    carryPlayerTeam: [hero], waveIdx: 0, waveElapsedMs: 0 };
  const row: QuestProgressData = { id: ORMUS.quest, status: 'inProgress', rewardClaimed: false, objectives: {} };
  const progress = { [ORMUS.quest]: row };
  return { run, row, progress };
}
function issue(f: ReturnType<typeof fixture>) {
  return issueOrmusRun(f.run, { challengeOrdinal: 0, fallbackArchetypeId: fallback.id }, f.progress, {});
}
function wave(f: ReturnType<typeof fixture>, index: number, mutate?: (result: NativeResult) => void, mutateInput?: (input: CombatSnapshot) => void) {
  const spawns = f.run.plan.waves[index]?.spawns;
  if (!spawns) throw new Error('Missing wave');
  const rng = createRng(index + 1);
  const enemies = spawns.map(spawn => {
    const def = monsters.find(entry => entry.id === spawn.archetypeId);
    if (!def) throw new Error('Missing canonical monster');
    return buildMonsterUnit({ def, level: spawn.level, tier: spawn.tier, index: spawn.index, rng });
  });
  const engineInput: CombatSnapshot = Object.freeze({ seed: (f.run.seed ^ ((index + 1) * 0x9e3779b1)) >>> 0,
    playerTeam: [f.run.playerUnit], enemyTeam: enemies });
  const result: NativeResult = { winner: 'player', playerTeam: structuredClone(engineInput.playerTeam),
    enemyTeam: enemies.map(enemy => ({ ...enemy, life: 0 })) };
  mutate?.(result);
  mutateInput?.(engineInput);
  const witness = captureOrmusNativeWitness(f.run, index, engineInput, result);
  const recording = Object.freeze({ outcome: { winner: result.winner, finalPlayerTeam: result.playerTeam,
    finalEnemyTeam: result.enemyTeam }, events: [] });
  if (witness) bindOrmusWitness(witness, recording);
  return { candidateRun: f.run, heroId: 'hero', targetWaveIdx: index, engineInput, recording,
    ...(witness ? { ormusWitness: witness } : {}) };
}
type NativeResult = { -readonly [Key in keyof Pick<RecordedBattleResult['result'], 'winner' | 'playerTeam' | 'enemyTeam'>]: RecordedBattleResult['result'][Key] };
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); });

describe('private Ormus native run authority', () => {
  it('accepts only the complete ordered canonical sequence, advancing once at settlement', () => {
    const f = fixture(); expect(issue(f)).toBe(true);
    for (let index = 0; index < f.run.plan.waves.length; index++) {
      const binding = wave(f, index);
      const accepted = prepareOrmusAdvance(binding, f.progress, {});
      expect(accepted?.final).toBe(index === f.run.plan.waves.length - 1);
      expect(accepted?.row).toBe(f.row);
      expect(prepareOrmusAdvance(binding, f.progress, {})).toBeDefined();
      accepted?.commit();
      expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    }
    expect(f.row.objectives).toEqual({});
  });
  it('does not skip to a later wave or borrow a witness from another run/input/recording', () => {
    const f = fixture(), other = fixture(); issue(f); issue(other);
    expect(prepareOrmusAdvance(wave(f, 1), f.progress, {})).toBeUndefined();
    const binding = wave(f, 0), witness = required(binding.ormusWitness);
    expect(isOrmusWitnessBound(witness, f.run, 0, binding.engineInput, binding.recording)).toBe(true);
    expect(isOrmusWitnessBound({ ...witness }, f.run, 0, binding.engineInput, binding.recording)).toBe(false);
    for (const changed of [{ ...binding, candidateRun: other.run },
      { ...binding, engineInput: structuredClone(binding.engineInput) },
      { ...binding, recording: { ...binding.recording } }]) {
      expect(prepareOrmusAdvance(changed, f.progress, {})).toBeUndefined();
    }
  });
  it.each(['defeat', 'draw', 'hero-dead', 'hero-summon', 'hero-missing', 'hero-duplicate',
    'enemy-alive', 'enemy-missing', 'enemy-summon', 'enemy-duplicate', 'enemy-substitution'])(
    'never admits a %s native result', mode => {
      const f = fixture(); issue(f);
      const binding = wave(f, 0, result => {
        const hero = required(result.playerTeam[0]), enemy = required(result.enemyTeam[0]);
        if (mode === 'defeat') result.winner = 'enemy';
        if (mode === 'draw') result.winner = null;
        if (mode === 'hero-dead') Object.assign(hero, { life: 0 });
        if (mode === 'hero-summon') Object.assign(hero, { kind: 'summon' });
        if (mode === 'hero-missing') result.playerTeam = [];
        if (mode === 'hero-duplicate') result.playerTeam = [hero, hero];
        if (mode === 'enemy-alive') Object.assign(enemy, { life: 1 });
        if (mode === 'enemy-missing') result.enemyTeam = [];
        if (mode === 'enemy-summon') Object.assign(enemy, { kind: 'summon' });
        if (mode === 'enemy-duplicate') result.enemyTeam = [...result.enemyTeam, enemy];
        if (mode === 'enemy-substitution') Object.assign(enemy, { monsterArchetypeId: 'monsters/act1.fallen' });
      });
      expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    });
  it.each(['idle', 'nightmare', 'hell', 'act', 'area', 'synthetic', 'shortened', 'untracked', 'claimed'])(
    'never issues a %s run', mode => {
      const f = fixture();
      if (mode === 'idle') Object.assign(f.run, { mode: 'idle' });
      if (mode === 'nightmare' || mode === 'hell') Object.assign(f.run, { origin: Object.freeze({ kind: 'area', replayProfileId: mode }) });
      if (mode === 'act') Object.assign(f.run, { act: 2 });
      if (mode === 'area') Object.assign(f.run, { plan: { ...f.run.plan, subAreaId: 'areas/act3-spider-forest' } });
      if (mode === 'synthetic') Object.assign(f.run, { plan: { ...f.run.plan, mode: 'synthetic' } });
      if (mode === 'shortened') Object.assign(f.run, { plan: { ...f.run.plan, waves: f.run.plan.waves.slice(0, 1) } });
      if (mode === 'untracked') Reflect.deleteProperty(f.progress, ORMUS.quest);
      if (mode === 'claimed') Object.assign(f.row, { status: 'completed', rewardClaimed: true });
      expect(issue(f)).toBe(false);
    });
  it.each(['hero-input', 'hero-terminal', 'enemy-input', 'enemy-terminal'])(
    'rejects ownerId on an original %s body', target => {
      const f = fixture(); issue(f);
      const own = (team: readonly CombatUnit[]) => { Object.assign(required(team[0]), { ownerId: 'summoner' }); };
      const binding = wave(f, 0, result => {
        if (target === 'hero-terminal') own(result.playerTeam);
        if (target === 'enemy-terminal') own(result.enemyTeam);
      }, input => {
        if (target === 'hero-input') own(input.playerTeam);
        if (target === 'enemy-input') own(input.enemyTeam);
      });
      expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    });
  it('refuses to advance when the original quest row mutates after preparation', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    const prepared = required(prepareOrmusAdvance(binding, f.progress, {}));
    Object.assign(f.row.objectives, { [ORMUS.talk]: true });
    expect(() => { prepared.commit(); }).toThrow('Ormus run changed during settlement');
    Reflect.deleteProperty(f.row.objectives, ORMUS.talk);
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeDefined();
  });
  it('refuses a run seed changed after native capture', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeDefined();
    Object.assign(f.run, { seed: 0 });
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
  });
  it('refuses a native witness with another wave seed', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    const engineInput = { ...binding.engineInput, seed: 0 }, out = binding.recording.outcome;
    const token = captureOrmusNativeWitness(f.run, 0, engineInput, { winner: out.winner,
      playerTeam: out.finalPlayerTeam, enemyTeam: out.finalEnemyTeam });
    if (token) bindOrmusWitness(token, binding.recording);
    expect(prepareOrmusAdvance({ ...binding, engineInput, ...(token ? { ormusWitness: token } : {}) }, f.progress, {})).toBeUndefined();
  });
  it('keeps replay ineligibility through rollback and attempted reissuance', () => {
    const f = fixture(); issue(f); const restore = captureOrmusAuthorityRollback(f.run);
    const binding = wave(f, 0); invalidateOrmusReplay(f.run); restore();
    expect(issue(f)).toBe(false);
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    expect(wave(f, 0).ormusWitness).toBeUndefined();
  });
  it('restores accepted hidden sequence after settlement failure', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0), restore = captureOrmusAuthorityRollback(f.run);
    prepareOrmusAdvance(binding, f.progress, {})?.commit();
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    restore(); expect(prepareOrmusAdvance(binding, f.progress, {})).toBeDefined();
  });
  it('rejects in-place plan, original row and public outcome mutations', () => {
    for (const target of ['plan', 'row', 'outcome']) {
      const f = fixture(); issue(f); const binding = wave(f, 0);
      if (target === 'plan') Object.assign(required(f.run.plan.waves[0]), { id: 'replacement' });
      if (target === 'row') Object.assign(f.row.objectives, { [ORMUS.talk]: true });
      if (target === 'outcome') Object.assign(required(binding.recording.outcome.finalEnemyTeam[0]), { life: 1 });
      expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
    }
  });
});

describe('recorded staging captures Ormus native witness before naming callbacks', () => {
  function staging(f: ReturnType<typeof fixture>, resolveDisplayName = (unit: CombatUnit) => unit.name) {
    const baseline = wave(f, 0);
    const staged = stageRecordedWave({ snapshot: baseline.engineInput, waveIdx: 0,
      totalWaves: f.run.plan.waves.length, subAreaRunId: ORMUS.area, replayProfileId: 'normal',
      defaults: { currentWave: 0, totalWaves: 0, subAreaRunId: null,
        runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } },
      resolveDisplayName, ...{ ormusRun: f.run } });
    return { candidateRun: f.run, heroId: 'hero', targetWaveIdx: 0, engineInput: staged.engineInput,
      recording: staged.recording, ormusWitness: required(staged.ormusWitness) };
  }
  it('binds a real native first-wave victory to its exact private input/recording', () => {
    const f = fixture();
    // BUG436: this constructed hero inherits an explicit monster attack range.
    // Match it to the intended overpowering hit; scalar Attack cannot replace it.
    Object.assign(f.run.playerUnit, { life: 1_000_000, skillOrder: [], attackRange: [1_000_000, 1_000_000],
      stats: { ...f.run.playerUnit.stats, lifeMax: 1_000_000, attack: 1_000_000 } });
    issue(f);
    const binding = staging(f);
    expect(binding.recording.outcome.winner).toBe('player');
    expect(binding.recording.outcome.finalEnemyTeam.every(unit => unit.life === 0)).toBe(true);
    expect(binding.ormusWitness).toBeDefined();
    expect(prepareOrmusAdvance(binding, f.progress, {})?.final).toBe(false);
  });
  it('refuses a native defeat forged into a victory by the naming callback', () => {
    const f = fixture(); Object.assign(f.run.playerUnit, { life: 1 }); issue(f);
    const native = engine.runBattleRecorded;
    let captured: ReturnType<typeof native> | undefined;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementation((...args) => { captured = native(...args); return captured; });
    const binding = staging(f, unit => {
      if (!captured) throw new Error('Naming ran before native simulation');
      Object.assign(captured.result, { winner: 'player' });
      for (const body of captured.result.playerTeam) Object.assign(body, { life: 1 });
      for (const body of captured.result.enemyTeam) Object.assign(body, { life: 0 });
      return unit.name;
    });
    expect(binding.recording.outcome.winner).toBe('player');
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
  });
  it('refuses in-place mutation of a real native victory during naming', () => {
    const f = fixture();
    Object.assign(f.run.playerUnit, { life: 1_000_000, skillOrder: [], attackRange: [1_000_000, 1_000_000],
      stats: { ...f.run.playerUnit.stats, lifeMax: 1_000_000, attack: 1_000_000 } }); issue(f);
    const native = engine.runBattleRecorded;
    let captured: ReturnType<typeof native> | undefined;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementation((...args) => {
      captured = native(...args);
      expect(captured.result.winner).toBe('player');
      expect(captured.result.enemyTeam.every(unit => unit.life === 0)).toBe(true);
      return captured;
    });
    const binding = staging(f, unit => { if (captured?.result.enemyTeam[0]) Object.assign(captured.result.enemyTeam[0], { life: 1 }); return unit.name; });
    expect(binding.ormusWitness).toBeDefined();
    expect(prepareOrmusAdvance(binding, f.progress, {})).toBeUndefined();
  });
});
