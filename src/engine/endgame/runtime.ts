import { endgameDefinition } from '../../data/loaders/endgame';
import type { MonsterSpawn, WavePlan } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import { inferKind } from '../combat/types';
import type { MaterialLedger } from '../loot/materials';
import { hashSeed } from '../rng';
import { hasEndgameAccess, readEndgameState, type EndgameCampaignEvidence } from './state';
import type { EndgameModifierId, EndgameState } from './types';

export interface EndgameRunContext {
  readonly kind: 'endgame';
  readonly dungeonId: 'endgame/worldstone-remnant';
  readonly modifierId: EndgameModifierId;
  readonly attemptOrdinal: number;
  readonly seed: number;
}
export interface EndgameWavePlan extends WavePlan {
  readonly origin: EndgameRunContext;
  readonly mode: 'manual';
  readonly seed: number;
}
export interface EndgameProgress {
  readonly context: EndgameRunContext;
  readonly heroId: string;
  readonly plan: EndgameWavePlan;
  readonly nextWaveIndex: number;
  readonly status: 'active' | 'failed' | 'completed';
}
// Identity seals reject copied/serialized partial sequences. These weak handles
// neither retain runs nor establish a committed entry or an accepted recording.
const issuedProgress = new WeakSet<EndgameProgress>();
const issuedBindings = new WeakSet<EndgameWaveBinding>();
function issueProgress(value: EndgameProgress): EndgameProgress {
  const progress = Object.freeze(value);
  issuedProgress.add(progress);
  return progress;
}

/** Prepare immutable native inputs and a next-ordinal proposal, without publishing either. */
export function prepareEndgameAttempt(input: {
  readonly heroId: string; readonly modifierId: string; readonly state: unknown;
  readonly campaign: EndgameCampaignEvidence;
}): { readonly progress: EndgameProgress; readonly stateAfterEntry: EndgameState } {
  const state = readEndgameState(input.state, input.campaign);
  if (!hasEndgameAccess(input.campaign)) throw new Error('Endgame locked');
  if (typeof input.heroId !== 'string' || input.heroId.length === 0) throw new Error('Invalid endgame hero');
  const modifier = endgameDefinition.modifiers.find(row => row.id === input.modifierId);
  if (!modifier) throw new Error('Unknown endgame modifier');
  if (state.attemptOrdinal === Number.MAX_SAFE_INTEGER) throw new Error('Endgame ordinal exhausted');
  const context: EndgameRunContext = Object.freeze({ kind: 'endgame', dungeonId: endgameDefinition.id,
    modifierId: modifier.id, attemptOrdinal: state.attemptOrdinal, seed: hashSeed(JSON.stringify([
      'endgame-run-v1', input.heroId, endgameDefinition.id, modifier.id, state.attemptOrdinal
    ])) });
  const waves = endgameDefinition.waves.map(wave => {
    const indices = new Map<string, number>();
    const spawns: MonsterSpawn[] = wave.spawns.flatMap(row => {
      const archetypeId = row.kind === 'modifier' ? modifier.archetypeId : row.archetypeId;
      return Array.from({ length: row.count }, () => {
        const index = indices.get(archetypeId) ?? 0;
        indices.set(archetypeId, index + 1);
        return Object.freeze({ archetypeId, tier: row.tier, level: endgameDefinition.monsterLevel, index });
      });
    });
    return Object.freeze({ id: wave.id, waveTier: spawns.some(row => row.tier === 'boss') ? 'boss' as const : 'trash' as const,
      spawns: Object.freeze(spawns) });
  });
  const plan: EndgameWavePlan = Object.freeze({ origin: context, subAreaId: context.dungeonId,
    waves: Object.freeze(waves), defaultLootTable: endgameDefinition.defaultLootTable, mode: 'manual', seed: context.seed });
  return Object.freeze({ progress: issueProgress({ context, heroId: input.heroId, plan, nextWaveIndex: 0, status: 'active' }),
    stateAfterEntry: Object.freeze({ ...state, attemptOrdinal: state.attemptOrdinal + 1 }) });
}

interface OriginalMember {
  readonly id: string; readonly archetypeId: string; readonly tier: 'trash' | 'boss'; readonly level: number;
}
export interface EndgameWaveBinding {
  readonly progress: EndgameProgress;
  readonly originalMembers: readonly OriginalMember[];
}

/** Capture exact original native members before simulation; this alone authorizes no settlement. */
export function captureEndgameWave(progress: EndgameProgress, players: readonly CombatUnit[],
  enemies: readonly CombatUnit[]): EndgameWaveBinding {
  if (!issuedProgress.has(progress)) throw new Error('Unknown endgame progress');
  const wave = progress.plan.waves[progress.nextWaveIndex];
  const heroes = players.filter(unit => unit.id === progress.heroId), hero = heroes[0];
  if (progress.status !== 'active' || !wave || heroes.length !== 1 || hero?.kind !== 'hero' ||
    hero.side !== 'player' || !Number.isFinite(hero.life) || hero.life <= 0 ||
    enemies.length !== wave.spawns.length ||
    new Set([...players, ...enemies].map(unit => unit.id)).size !== players.length + enemies.length ||
    !enemies.every((unit, index) => {
      const spawn = wave.spawns[index];
      return spawn !== undefined && unit.id.length > 0 && unit.side === 'enemy' && unit.kind === 'monster' &&
        unit.monsterArchetypeId === spawn.archetypeId && unit.tier === spawn.tier && unit.level === spawn.level &&
        Number.isFinite(unit.life) && unit.life > 0;
    })) throw new Error('Invalid original endgame wave');
  const originalMembers = enemies.map((unit, index) => {
    // The authored plan and the checks above restrict tiers and archetypes before capture.
    const spawn = wave.spawns[index];
    if (!spawn || (spawn.tier !== 'trash' && spawn.tier !== 'boss')) throw new Error('Invalid endgame member');
    return Object.freeze({ id: unit.id, archetypeId: spawn.archetypeId, tier: spawn.tier, level: spawn.level });
  });
  const binding = Object.freeze({ progress, originalMembers: Object.freeze(originalMembers) });
  issuedBindings.add(binding);
  return binding;
}

export interface EndgameWaveAdvance {
  readonly progress: EndgameProgress;
  readonly completion?: {
    readonly attemptOrdinal: number; readonly modifierId: EndgameModifierId; readonly materials: MaterialLedger;
  };
}

/**
 * Propose an ordered transition from original outcomes. No inventory, counter or
 * receipt is published here. The native caller must accept its actual recording
 * once and atomically publish this proposal with all other settlement changes.
 */
export function advanceEndgameWave(progress: EndgameProgress, binding: EndgameWaveBinding, outcome: {
  readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[]; readonly finalEnemyTeam: readonly CombatUnit[];
}): EndgameWaveAdvance {
  if (!issuedProgress.has(progress) || !issuedBindings.has(binding) || progress.status !== 'active' ||
    binding.progress !== progress) throw new Error('Stale endgame wave binding');
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === progress.heroId), hero = heroes[0];
  const originalOutcomes = outcome.finalEnemyTeam.filter(unit => inferKind(unit) !== 'summon');
  const won = outcome.winner === 'player' && heroes.length === 1 && hero?.kind === 'hero' && hero.side === 'player' &&
    Number.isFinite(hero.life) && hero.life > 0 && originalOutcomes.length === binding.originalMembers.length &&
    binding.originalMembers.every(member => {
      const matches = outcome.finalEnemyTeam.filter(unit => unit.id === member.id), unit = matches[0];
      return matches.length === 1 && unit?.side === 'enemy' && unit.kind === 'monster' && unit.tier === member.tier &&
        unit.monsterArchetypeId === member.archetypeId && unit.level === member.level && Number.isFinite(unit.life) && unit.life <= 0;
    });
  if (!won) return Object.freeze({ progress: issueProgress({ ...progress, status: 'failed' }) });
  const nextWaveIndex = progress.nextWaveIndex + 1, completed = nextWaveIndex === progress.plan.waves.length;
  const next = issueProgress({ ...progress, nextWaveIndex, status: completed ? 'completed' : 'active' });
  if (!completed) return Object.freeze({ progress: next });
  const modifier = endgameDefinition.modifiers.find(row => row.id === progress.context.modifierId);
  if (!modifier) throw new Error('Unknown endgame completion modifier');
  return Object.freeze({ progress: next, completion: Object.freeze({ attemptOrdinal: progress.context.attemptOrdinal,
    modifierId: modifier.id, materials: modifier.completionMaterials }) });
}
