import { monsters, subAreas } from '@/data/index';
import { resolveChallengeWavePlan, type WavePlan } from '@/engine/combat';
import type { CombatSnapshot, RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { applyReplayProfileToPlan } from '@/engine/map/replay-profile';
import { REGIONAL_BOUNTY_DOMAIN, regionalBountyState, type RegionalBountyDefinition,
  type RegionalBountyEntry, type RegionalBountyLedger } from '@/engine/map/regional-bounties';
import type { QuestProgressData } from '@/engine/types/save';
import type { ActiveRun } from './combatRunLifecycle';

type Progress = Readonly<Record<string, QuestProgressData>>;
type Recording = NonNullable<ActiveRun['recording']>;
type NativeResult = Pick<RecordedBattleResult['result'], 'winner' | 'playerTeam' | 'enemyTeam'>;
interface Authority {
  readonly definition: RegionalBountyDefinition;
  readonly accepted: { readonly quest: string; readonly claims: number };
  readonly origin: ActiveRun['origin'];
  readonly seed: number;
  readonly plan: WavePlan;
  readonly planSignature: string;
  readonly heroId: string;
  readonly row: QuestProgressData;
  readonly rowSignature: string;
  readonly entry: RegionalBountyEntry;
  readonly entrySignature: string;
  readonly next: number;
}
const issued = new WeakSet<ActiveRun>(), replayed = new WeakSet<ActiveRun>();
const authorities = new WeakMap<ActiveRun, Authority>();
const witnessBrand = Symbol('bountyNativeWitness');
/** Process-local native result identity; copied fields never supply authority. */
export interface BountyNativeWitness { readonly [witnessBrand]: true }
interface Witness {
  readonly run: ActiveRun;
  readonly index: number;
  readonly input: CombatSnapshot;
  readonly qualified: boolean;
  readonly outcomeSignature: string;
  readonly recording?: Recording;
}
const witnesses = new WeakMap<BountyNativeWitness, Witness>();

function uniqueIds(units: readonly CombatUnit[]): boolean { return new Set(units.map(unit => unit.id)).size === units.length; }
function heroAlive(units: readonly CombatUnit[], id: string): boolean {
  const heroes = units.filter(unit => unit.id === id || unit.kind === 'hero');
  return heroes.length === 1 && heroes[0]?.id === id && heroes[0].kind === 'hero' && heroes[0].side === 'player' &&
    heroes[0].summon !== true && heroes[0].summonOwnerId === undefined && heroes[0].ownerId === undefined && Number.isFinite(heroes[0].life) && heroes[0].life > 0;
}
function outcomeSignature(result: NativeResult): string {
  return JSON.stringify({ winner: result.winner, finalPlayerTeam: result.playerTeam, finalEnemyTeam: result.enemyTeam });
}
/** Issue once for an active accepted cycle and a freshly checked complete canonical manual plan. */
export function issueBountyRun(run: ActiveRun, options: { readonly challengeOrdinal: number; readonly fallbackArchetypeId: string },
  progress: Progress, bounties: RegionalBountyLedger): boolean {
  if (issued.has(run) || replayed.has(run)) return false;
  issued.add(run);
  if (run.origin.kind !== 'area' || run.origin.questEncounter !== undefined || run.origin.replayProfileId !== 'normal' ||
    run.replayProfileId !== 'normal' || run.mode !== 'manual' || !heroAlive([run.playerUnit], run.playerUnit.id)) return false;
  const definition = REGIONAL_BOUNTY_DOMAIN.find(candidate => candidate.area === run.plan.subAreaId && candidate.actId === `acts/act${String(run.act)}`);
  if (!definition || regionalBountyState(definition.quest, progress, bounties, REGIONAL_BOUNTY_DOMAIN) !== 'active') return false;
  const area = subAreas.find(candidate => candidate.id === definition.area && candidate.actId === definition.actId);
  if (!area) return false;
  // The ordinal is only the existing planner input. It never orders bounty cycles.
  const canonical = applyReplayProfileToPlan(resolveChallengeWavePlan({ subArea: area,
    fallbackArchetypeId: options.fallbackArchetypeId, fallbackLevel: area.areaLevel,
    seed: run.seed, challengeOrdinal: options.challengeOrdinal, mode: 'manual' }), 'normal',
  new Map(monsters.map(candidate => [candidate.id, candidate])));
  if (JSON.stringify(run.plan) !== JSON.stringify(canonical) || canonical.waves.length === 0 ||
    canonical.waves.some(wave => !wave.source || wave.spawns.length === 0 ||
      wave.spawns.some(spawn => !monsters.some(candidate => candidate.id === spawn.archetypeId)))) return false;
  const row = progress[definition.quest], entry = bounties[definition.quest];
  if (!row || !entry) return false;
  authorities.set(run, { definition, accepted: Object.freeze({ quest: definition.quest, claims: entry.claims }),
    origin: run.origin, seed: run.seed, plan: canonical, planSignature: JSON.stringify(canonical), heroId: run.playerUnit.id,
    row, rowSignature: JSON.stringify(row), entry, entrySignature: JSON.stringify(entry), next: 0 });
  return true;
}
/** Explicit replay permanently disqualifies this run, including failed staging and rollback. */
export function invalidateBountyReplay(run: ActiveRun): void { replayed.add(run); }
function current(run: ActiveRun): Authority | undefined {
  const value = authorities.get(run);
  return value && !replayed.has(run) && run.origin === value.origin && run.playerUnit.id === value.heroId &&
    run.playerUnit.kind === 'hero' && run.playerUnit.side === 'player' && run.seed === value.seed &&
    run.replayProfileId === 'normal' && `acts/act${String(run.act)}` === value.definition.actId && run.mode === 'manual' &&
    JSON.stringify(run.plan) === value.planSignature ? value : undefined;
}
/** Capture original native result values before naming callbacks or public playback can mutate them. */
export function captureBountyNativeWitness(run: ActiveRun, index: number, input: CombatSnapshot,
  result: NativeResult): BountyNativeWitness | undefined {
  const authority = current(run), wave = authority?.plan.waves[index];
  if (!authority || !wave) return undefined;
  const originals = input.enemyTeam;
  const qualified = input.seed === ((authority.seed ^ ((index + 1) * 0x9e3779b1)) >>> 0) &&
    (input.difficulty === undefined || input.difficulty === 'normal') && result.winner === 'player' &&
    uniqueIds([...input.playerTeam, ...originals]) && uniqueIds([...result.playerTeam, ...result.enemyTeam]) &&
    heroAlive(input.playerTeam, authority.heroId) && heroAlive(result.playerTeam, authority.heroId) &&
    originals.length === wave.spawns.length && result.enemyTeam.length === originals.length && originals.every((enemy, position) => {
      const spawn = wave.spawns[position], finals = result.enemyTeam.filter(unit => unit.id === enemy.id), final = finals[0];
      return spawn !== undefined && enemy.side === 'enemy' && enemy.kind === 'monster' && enemy.summon !== true &&
        enemy.summonOwnerId === undefined && enemy.ownerId === undefined && enemy.monsterArchetypeId === spawn.archetypeId &&
        enemy.level === spawn.level && enemy.tier === spawn.tier && Number.isFinite(enemy.life) && enemy.life > 0 &&
        finals.length === 1 && final?.side === 'enemy' && final.kind === 'monster' && final.summon !== true &&
        final.summonOwnerId === undefined && final.ownerId === undefined && final.monsterArchetypeId === spawn.archetypeId &&
        final.level === spawn.level && final.tier === spawn.tier && Number.isFinite(final.life) && final.life <= 0;
    });
  const token: BountyNativeWitness = Object.freeze({ [witnessBrand]: true as const });
  witnesses.set(token, { run, index, input, qualified, outcomeSignature: outcomeSignature(result) });
  return token;
}
/** Bind once to the exact staged recording; later field copies authorize no recording. */
export function bindBountyWitness(token: BountyNativeWitness, recording: Recording): void {
  const value = witnesses.get(token);
  if (!value || value.recording) throw new Error('Invalid bounty witness binding');
  witnesses.set(token, { ...value, recording });
}
/** Receipt admission validates process-local identity independently of victory eligibility. */
export function isBountyWitnessBound(token: BountyNativeWitness, run: ActiveRun, index: number, input: CombatSnapshot,
  recording: Recording): boolean {
  const value = witnesses.get(token);
  return value !== undefined && value.run === run && value.index === index && value.input === input && value.recording === recording;
}
/** Store-only projection supplied by the accepted native recorded-wave receipt. */
export interface BountyWaveBinding {
  readonly candidateRun: ActiveRun;
  readonly heroId: string;
  readonly targetWaveIdx: number;
  readonly engineInput: CombatSnapshot;
  readonly recording: Recording;
  readonly bountyWitness?: BountyNativeWitness;
}
/** Prepare without advancing; only accepted settlement may commit the consecutive original wave. */
export function prepareBountyAdvance(binding: BountyWaveBinding, progress: Progress, bounties: RegionalBountyLedger):
  { readonly definition: RegionalBountyDefinition; readonly row: QuestProgressData; readonly entry: RegionalBountyEntry;
    readonly final: boolean; readonly commit: () => void; readonly checkCommitted: () => void } | undefined {
  const run = binding.candidateRun, authority = current(run), token = binding.bountyWitness;
  const value = token ? witnesses.get(token) : undefined;
  if (!authority || !token || !value?.qualified || !isBountyWitnessBound(token, run, binding.targetWaveIdx, binding.engineInput, binding.recording) ||
    binding.heroId !== authority.heroId || binding.targetWaveIdx !== authority.next ||
    JSON.stringify(binding.recording.outcome) !== value.outcomeSignature || progress[authority.accepted.quest] !== authority.row ||
    JSON.stringify(authority.row) !== authority.rowSignature || bounties[authority.definition.quest] !== authority.entry ||
    JSON.stringify(authority.entry) !== authority.entrySignature || authority.entry.claims !== authority.accepted.claims ||
    regionalBountyState(authority.definition.quest, progress, bounties, REGIONAL_BOUNTY_DOMAIN) !== 'active') return undefined;
  const advanced = { ...authority, next: authority.next + 1 };
  return Object.freeze({ definition: authority.definition, row: authority.row, entry: authority.entry,
    final: advanced.next === authority.plan.waves.length,
    commit: () => {
      if (current(run) !== authority || JSON.stringify(binding.recording.outcome) !== value.outcomeSignature ||
        JSON.stringify(authority.row) !== authority.rowSignature || JSON.stringify(authority.entry) !== authority.entrySignature) {
        throw new Error('Bounty run changed during settlement');
      }
      authorities.set(run, advanced);
    },
    checkCommitted: () => {
      if (current(run) !== advanced || JSON.stringify(binding.recording.outcome) !== value.outcomeSignature) {
        throw new Error('Bounty run changed during publication');
      }
    } });
}
/** Restore only the private sequence; issuance and replay disqualification survive rollback. */
export function captureBountyAuthorityRollback(run: ActiveRun): () => void {
  const previous = authorities.get(run);
  return () => { if (previous) authorities.set(run, previous); else authorities.delete(run); };
}
