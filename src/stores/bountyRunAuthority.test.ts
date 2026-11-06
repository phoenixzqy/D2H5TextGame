/** Constructed native-boundary witnesses, not earned combat/balance evidence. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engine from '@/engine/combat/combat';
import { stageRecordedWave } from './recordedWaveStaging';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { monsters, subAreas } from '@/data/index';
import { resolveChallengeWavePlan, buildMonsterUnit } from '@/engine/combat';
import { applyReplayProfileToPlan } from '@/engine/map/replay-profile';
import { REGIONAL_BOUNTY_DOMAIN } from '@/engine/map/regional-bounties';
import { createRng } from '@/engine/rng';
import type { CombatSnapshot, RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { QuestProgressData } from '@/engine/types/save';
import type { ActiveRun } from './combatRunLifecycle';
import { issueBountyRun, captureBountyNativeWitness, bindBountyWitness, isBountyWitnessBound,
  prepareBountyAdvance, invalidateBountyReplay, captureBountyAuthorityRollback } from './bountyRunAuthority';

const BOUNTY = REGIONAL_BOUNTY_DOMAIN[0];
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Bounty authority fixture');
  return value;
}
const area = required(subAreas.find(entry => entry.id === BOUNTY.area));
const fallback = required(monsters.find(entry => entry.id.startsWith('monsters/act1.')));
function fixture() {
  const normal = resolveChallengeWavePlan({ subArea: area, fallbackArchetypeId: fallback.id,
    fallbackLevel: area.areaLevel, seed: 7, challengeOrdinal: 0, mode: 'manual' });
  const plan = applyReplayProfileToPlan(normal, 'normal', new Map(monsters.map(entry => [entry.id, entry])));
  const body = buildMonsterUnit({ def: fallback, level: 32, tier: 'trash', rng: createRng(7) });
  const hero: CombatUnit = { ...body, id: 'hero', side: 'player', kind: 'hero' };
  const run: ActiveRun = { origin: Object.freeze({ kind: 'area', replayProfileId: 'normal' }),
    plan, act: 1, seed: 7, mode: 'manual', replayProfileId: 'normal', playerUnit: hero,
    carryPlayerTeam: [hero], waveIdx: 0, waveElapsedMs: 0 };
  const row: QuestProgressData = { id: BOUNTY.quest, status: 'inProgress', rewardClaimed: false, objectives: { [BOUNTY.objective]: false } };
  const progress = { [BOUNTY.quest]: row };
  const entry = { claims: 0, victoryOrdinal: 0 };
  const bounties = { [BOUNTY.quest]: entry };
  return { run, row, progress, entry, bounties };
}
function issue(f: ReturnType<typeof fixture>) {
  return issueBountyRun(f.run, { challengeOrdinal: 0, fallbackArchetypeId: fallback.id }, f.progress, f.bounties);
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
  const witness = captureBountyNativeWitness(f.run, index, engineInput, result);
  const recording = Object.freeze({ outcome: { winner: result.winner, finalPlayerTeam: result.playerTeam,
    finalEnemyTeam: result.enemyTeam }, events: [] });
  if (witness) bindBountyWitness(witness, recording);
  return { candidateRun: f.run, heroId: 'hero', targetWaveIdx: index, engineInput, recording,
    ...(witness ? { bountyWitness: witness } : {}) };
}
type NativeResult = { -readonly [Key in keyof Pick<RecordedBattleResult['result'], 'winner' | 'playerTeam' | 'enemyTeam'>]: RecordedBattleResult['result'][Key] };
beforeEach(() => { loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); });

describe('private Bounty native run authority', () => {
  it('accepts only the complete ordered canonical sequence, advancing once at settlement', () => {
    const f = fixture(); expect(issue(f)).toBe(true);
    for (let index = 0; index < f.run.plan.waves.length; index++) {
      const binding = wave(f, index);
      const accepted = prepareBountyAdvance(binding, f.progress, f.bounties);
      expect(accepted?.final).toBe(index === f.run.plan.waves.length - 1);
      expect(accepted?.row).toBe(f.row);
      expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeDefined();
      accepted?.commit();
      expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    }
    expect(f.row.objectives).toEqual({ [BOUNTY.objective]: false });
  });
  it('does not skip to a later wave or borrow a witness from another run/input/recording', () => {
    const f = fixture(), other = fixture(); issue(f); issue(other);
    expect(prepareBountyAdvance(wave(f, 1), f.progress, f.bounties)).toBeUndefined();
    const binding = wave(f, 0), witness = required(binding.bountyWitness);
    expect(isBountyWitnessBound(witness, f.run, 0, binding.engineInput, binding.recording)).toBe(true);
    expect(isBountyWitnessBound({ ...witness }, f.run, 0, binding.engineInput, binding.recording)).toBe(false);
    for (const changed of [{ ...binding, candidateRun: other.run },
      { ...binding, engineInput: structuredClone(binding.engineInput) },
      { ...binding, recording: { ...binding.recording } }]) {
      expect(prepareBountyAdvance(changed, f.progress, f.bounties)).toBeUndefined();
    }
  });
  it.each(['defeat', 'draw', 'hero-dead', 'hero-summon', 'hero-missing', 'hero-duplicate',
    'enemy-alive', 'enemy-missing', 'enemy-summon', 'enemy-duplicate', 'enemy-substitution', 'enemy-extra', 'enemy-dummy'])(
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
        if (mode === 'enemy-substitution') Object.assign(enemy, { monsterArchetypeId: 'monsters/act5.impossible' });
        if (mode === 'enemy-extra') result.enemyTeam = [...result.enemyTeam, { ...enemy, id: 'foreign-extra' }];
        if (mode === 'enemy-dummy') Object.assign(enemy, { kind: 'dummy' });
      });
      expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    });
  it.each(['idle', 'nightmare', 'hell', 'act', 'area', 'synthetic', 'shortened', 'untracked', 'claimed', 'encounter', 'unaccepted', 'input-profile'])(
    'never issues a %s run', mode => {
      const f = fixture();
      if (mode === 'idle') Object.assign(f.run, { mode: 'idle' });
      if (mode === 'nightmare' || mode === 'hell') Object.assign(f.run, { origin: Object.freeze({ kind: 'area', replayProfileId: mode }) });
      if (mode === 'act') Object.assign(f.run, { act: 2 });
      if (mode === 'encounter') Object.assign(f.run, { origin: Object.freeze({ kind: 'area', replayProfileId: 'normal', questEncounter: 'countess-cellar' }) });
      if (mode === 'unaccepted') Reflect.deleteProperty(f.bounties, BOUNTY.quest);
      if (mode === 'input-profile') Object.assign(f.run, { replayProfileId: 'hell' });
      if (mode === 'area') Object.assign(f.run, { plan: { ...f.run.plan, subAreaId: 'areas/act3-spider-forest' } });
      if (mode === 'synthetic') Object.assign(f.run, { plan: { ...f.run.plan, mode: 'synthetic' } });
      if (mode === 'shortened') Object.assign(f.run, { plan: { ...f.run.plan, waves: f.run.plan.waves.slice(0, 1) } });
      if (mode === 'untracked') Reflect.deleteProperty(f.progress, BOUNTY.quest);
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
      expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    });
  it('refuses to advance when the original quest row mutates after preparation', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    const prepared = required(prepareBountyAdvance(binding, f.progress, f.bounties));
    Object.assign(f.row.objectives, { [BOUNTY.objective]: true });
    expect(() => { prepared.commit(); }).toThrow('Bounty run changed during settlement');
    Reflect.set(f.row.objectives, BOUNTY.objective, false);
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeDefined();
  });
  it('refuses a run seed changed after native capture', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeDefined();
    Object.assign(f.run, { seed: 0 });
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
  });
  it('refuses a native witness with another wave seed', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    const engineInput = { ...binding.engineInput, seed: 0 }, out = binding.recording.outcome;
    const token = captureBountyNativeWitness(f.run, 0, engineInput, { winner: out.winner,
      playerTeam: out.finalPlayerTeam, enemyTeam: out.finalEnemyTeam });
    if (token) bindBountyWitness(token, binding.recording);
    expect(prepareBountyAdvance({ ...binding, engineInput, ...(token ? { bountyWitness: token } : {}) }, f.progress, f.bounties)).toBeUndefined();
  });
  it('keeps replay ineligibility through rollback and attempted reissuance', () => {
    const f = fixture(); issue(f); const restore = captureBountyAuthorityRollback(f.run);
    const binding = wave(f, 0); invalidateBountyReplay(f.run); restore();
    expect(issue(f)).toBe(false);
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    expect(wave(f, 0).bountyWitness).toBeUndefined();
  });
  it('restores accepted hidden sequence after settlement failure', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0), restore = captureBountyAuthorityRollback(f.run);
    prepareBountyAdvance(binding, f.progress, f.bounties)?.commit();
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    restore(); expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeDefined();
  });
  it('rejects in-place plan, original row and public outcome mutations', () => {
    for (const target of ['plan', 'row', 'entry', 'outcome']) {
      const f = fixture(); issue(f); const binding = wave(f, 0);
      if (target === 'plan') Object.assign(required(f.run.plan.waves[0]), { id: 'replacement' });
      if (target === 'row') Object.assign(f.row.objectives, { [BOUNTY.objective]: true });
      if (target === 'entry') Object.assign(f.entry, { claims: 1, victoryOrdinal: 1 });
      if (target === 'outcome') Object.assign(required(binding.recording.outcome.finalEnemyTeam[0]), { life: 1 });
      expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
    }
  });
  it('cannot fill a repeated claims1 cycle with the previous claims0 witness', () => {
    const f = fixture(); issue(f); const binding = wave(f, 0);
    Object.assign(f.entry, { claims: 1, victoryOrdinal: 1 });
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
  });
  it('keeps failed issuance consumed through rollback and later acceptance', () => {
    const f = fixture(); Reflect.deleteProperty(f.bounties, BOUNTY.quest);
    const restore = captureBountyAuthorityRollback(f.run); expect(issue(f)).toBe(false);
    f.bounties[BOUNTY.quest] = f.entry; restore(); expect(issue(f)).toBe(false);
    expect(wave(f, 0).bountyWitness).toBeUndefined();
  });

});


describe('recorded staging captures Bounty native witness before naming callbacks', () => {
  function staging(f: ReturnType<typeof fixture>, resolveDisplayName = (unit: CombatUnit) => unit.name) {
    const baseline = wave(f, 0);
    const staged = stageRecordedWave({ snapshot: baseline.engineInput, waveIdx: 0,
      totalWaves: f.run.plan.waves.length, subAreaRunId: BOUNTY.area, replayProfileId: 'normal',
      defaults: { currentWave: 0, totalWaves: 0, subAreaRunId: null,
        runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} } },
      resolveDisplayName, ...{ bountyRun: f.run } });
    return { candidateRun: f.run, heroId: 'hero', targetWaveIdx: 0, engineInput: staged.engineInput,
      recording: staged.recording, bountyWitness: required(staged.bountyWitness) };
  }
  it('binds a real native first-wave victory to its exact private input/recording', () => {
    const f = fixture();
    Object.assign(f.run.playerUnit, { life: 1_000_000, skillOrder: [],
      stats: { ...f.run.playerUnit.stats, lifeMax: 1_000_000, attack: 1_000_000 } });
    issue(f);
    const binding = staging(f);
    expect(binding.bountyWitness).toBeDefined();
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)?.final).toBe(false);
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
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
  });
  it('refuses in-place mutation of a real native victory during naming', () => {
    const f = fixture();
    Object.assign(f.run.playerUnit, { life: 1_000_000, skillOrder: [],
      stats: { ...f.run.playerUnit.stats, lifeMax: 1_000_000, attack: 1_000_000 } }); issue(f);
    const native = engine.runBattleRecorded;
    let captured: ReturnType<typeof native> | undefined;
    vi.spyOn(engine, 'runBattleRecorded').mockImplementation((...args) => { captured = native(...args); return captured; });
    const binding = staging(f, unit => { if (captured?.result.enemyTeam[0]) Object.assign(captured.result.enemyTeam[0], { life: 1 }); return unit.name; });
    expect(binding.bountyWitness).toBeDefined();
    expect(prepareBountyAdvance(binding, f.progress, f.bounties)).toBeUndefined();
  });
});
