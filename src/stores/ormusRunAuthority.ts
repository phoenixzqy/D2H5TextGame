import { monsters, subAreas } from '@/data/index';
import { resolveChallengeWavePlan, type WavePlan } from '@/engine/combat';
import type { CombatSnapshot, RecordedBattleResult } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { applyReplayProfileToPlan } from '@/engine/map/replay-profile';
import { ORMUS, canEarnOrmusClear } from '@/engine/map/ormus-quest';
import type { QuestActionReceipts, QuestProgressData } from '@/engine/types/save';
import type { ActiveRun } from './combatRunLifecycle';

type Progress = Readonly<Record<string, QuestProgressData>>;
type Recording = NonNullable<ActiveRun['recording']>;
type NativeResult = Pick<RecordedBattleResult['result'], 'winner' | 'playerTeam' | 'enemyTeam'>;
interface Authority {
  readonly origin: ActiveRun['origin'];
  readonly seed: number;
  readonly plan: WavePlan;
  readonly planSignature: string;
  readonly heroId: string;
  readonly row: QuestProgressData;
  readonly rowSignature: string;
  readonly next: number;
}
const issued = new WeakSet<ActiveRun>(), replayed = new WeakSet<ActiveRun>();
const authorities = new WeakMap<ActiveRun, Authority>();
const witnessBrand = Symbol('ormusNativeWitness');
/** Process-local native result identity; copying its fields supplies no authority. */
export interface OrmusNativeWitness { readonly [witnessBrand]: true }
interface Witness {
  readonly run: ActiveRun;
  readonly index: number;
  readonly input: CombatSnapshot;
  readonly qualified: boolean;
  readonly outcomeSignature: string;
  readonly recording?: Recording;
}
const witnesses = new WeakMap<OrmusNativeWitness, Witness>();

/** Issue once against a freshly regenerated complete canonical manual plan. Never persists. */
export function issueOrmusRun(run: ActiveRun, options: { readonly challengeOrdinal: number; readonly fallbackArchetypeId: string },
  progress: Progress, receipts: QuestActionReceipts): boolean {
  if (issued.has(run) || replayed.has(run)) return false;
  issued.add(run);
  if (run.origin.kind !== 'area' || run.origin.questEncounter !== undefined || run.origin.replayProfileId !== 'normal' ||
    run.replayProfileId !== 'normal' || run.act !== 3 || run.mode !== 'manual' || run.plan.subAreaId !== ORMUS.area ||
    !canEarnOrmusClear(progress, receipts)) return false;
  const area = subAreas.find(entry => entry.id === ORMUS.area && entry.actId === ORMUS.actId);
  if (!area || run.playerUnit.kind !== 'hero' || run.playerUnit.side !== 'player' ||
    !Number.isFinite(run.playerUnit.life) || run.playerUnit.life <= 0) return false;
  const canonical = applyReplayProfileToPlan(resolveChallengeWavePlan({ subArea: area,
    fallbackArchetypeId: options.fallbackArchetypeId, fallbackLevel: area.areaLevel,
    seed: run.seed, challengeOrdinal: options.challengeOrdinal, mode: 'manual' }), 'normal',
  new Map(monsters.map(entry => [entry.id, entry])));
  if (JSON.stringify(run.plan) !== JSON.stringify(canonical) || canonical.waves.length === 0 ||
    canonical.waves.some(wave => !wave.source || wave.spawns.length === 0 ||
      wave.spawns.some(spawn => !monsters.some(entry => entry.id === spawn.archetypeId)))) return false;
  const row = progress[ORMUS.quest];
  if (!row) return false;
  authorities.set(run, { origin: run.origin, seed: run.seed, plan: canonical, planSignature: JSON.stringify(canonical),
    heroId: run.playerUnit.id, row, rowSignature: JSON.stringify(row), next: 0 });
  return true;
}
/** Explicit replay permanently disqualifies this run, even if replay fails or a rollback follows. */
export function invalidateOrmusReplay(run: ActiveRun): void { replayed.add(run); }
function current(run: ActiveRun): Authority | undefined {
  const value = authorities.get(run);
  return value && !replayed.has(run) && run.origin === value.origin && run.playerUnit.id === value.heroId &&
    run.seed === value.seed && run.replayProfileId === 'normal' && run.act === 3 && run.mode === 'manual' &&
    JSON.stringify(run.plan) === value.planSignature ? value : undefined;
}
function uniqueIds(units: readonly CombatUnit[]): boolean { return new Set(units.map(unit => unit.id)).size === units.length; }
function heroAlive(units: readonly CombatUnit[], id: string): boolean {
  const heroes = units.filter(unit => unit.id === id || unit.kind === 'hero');
  return heroes.length === 1 && heroes[0]?.id === id && heroes[0].kind === 'hero' && heroes[0].side === 'player' &&
    heroes[0].summon !== true && heroes[0].summonOwnerId === undefined && heroes[0].ownerId === undefined && Number.isFinite(heroes[0].life) && heroes[0].life > 0;
}
function outcomeSignature(result: NativeResult): string {
  return JSON.stringify({ winner: result.winner, finalPlayerTeam: result.playerTeam, finalEnemyTeam: result.enemyTeam });
}
/** Capture owned native values before display-name callbacks or public playback can mutate them. */
export function captureOrmusNativeWitness(run: ActiveRun, index: number, input: CombatSnapshot, result: NativeResult): OrmusNativeWitness | undefined {
  const authority = current(run), wave = authority?.plan.waves[index];
  if (!authority || !wave) return undefined;
  const originals = input.enemyTeam;
  const qualified = input.seed === ((authority.seed ^ ((index + 1) * 0x9e3779b1)) >>> 0) &&
    (input.difficulty === undefined || input.difficulty === 'normal') && result.winner === 'player' &&
    uniqueIds([...input.playerTeam, ...originals]) && uniqueIds([...result.playerTeam, ...result.enemyTeam]) &&
    heroAlive(input.playerTeam, authority.heroId) && heroAlive(result.playerTeam, authority.heroId) &&
    originals.length === wave.spawns.length && originals.every((enemy, position) => {
      const spawn = wave.spawns[position], finals = result.enemyTeam.filter(unit => unit.id === enemy.id), final = finals[0];
      return spawn !== undefined && enemy.side === 'enemy' && enemy.kind === 'monster' && enemy.summon !== true &&
        enemy.summonOwnerId === undefined && enemy.ownerId === undefined && enemy.monsterArchetypeId === spawn.archetypeId &&
        enemy.level === spawn.level && enemy.tier === spawn.tier && Number.isFinite(enemy.life) && enemy.life > 0 &&
        finals.length === 1 && final?.side === 'enemy' && final.kind === 'monster' && final.summon !== true &&
        final.summonOwnerId === undefined && final.ownerId === undefined && final.monsterArchetypeId === spawn.archetypeId &&
        final.level === spawn.level && final.tier === spawn.tier && Number.isFinite(final.life) && final.life <= 0;
    });
  const token: OrmusNativeWitness = Object.freeze({ [witnessBrand]: true as const });
  witnesses.set(token, { run, index, input, qualified, outcomeSignature: outcomeSignature(result) });
  return token;
}
/** Bind once to the exact staged recording; later field copies cannot authorize a different recording. */
export function bindOrmusWitness(token: OrmusNativeWitness, recording: Recording): void {
  const value = witnesses.get(token);
  if (!value || value.recording) throw new Error('Invalid Ormus witness binding');
  witnesses.set(token, { ...value, recording });
}
/** Receipt binding validates identity independently of native victory eligibility. */
export function isOrmusWitnessBound(token: OrmusNativeWitness, run: ActiveRun, index: number, input: CombatSnapshot,
  recording: Recording): boolean {
  const value = witnesses.get(token);
  return value !== undefined && value.run === run && value.index === index && value.input === input && value.recording === recording;
}
/** Store-only settlement projection, supplied by the accepted recorded-wave receipt. */
export interface OrmusWaveBinding {
  readonly candidateRun: ActiveRun;
  readonly heroId: string;
  readonly targetWaveIdx: number;
  readonly engineInput: CombatSnapshot;
  readonly recording: Recording;
  readonly ormusWitness?: OrmusNativeWitness;
}
/** Prepare without advancing; only accepted settlement invokes commit after its effects succeed. */
export function prepareOrmusAdvance(binding: OrmusWaveBinding, progress: Progress, receipts: QuestActionReceipts):
  { readonly row: QuestProgressData; readonly final: boolean; readonly commit: () => void;
    readonly checkCommitted: () => void } | undefined {
  const run = binding.candidateRun, authority = current(run), token = binding.ormusWitness;
  const value = token ? witnesses.get(token) : undefined;
  if (!authority || !token || !value?.qualified || !isOrmusWitnessBound(token, run, binding.targetWaveIdx, binding.engineInput, binding.recording) ||
    binding.heroId !== authority.heroId || binding.targetWaveIdx !== authority.next ||
    JSON.stringify(binding.recording.outcome) !== value.outcomeSignature || progress[ORMUS.quest] !== authority.row ||
    JSON.stringify(authority.row) !== authority.rowSignature || !canEarnOrmusClear(progress, receipts)) return undefined;
  const advanced = { ...authority, next: authority.next + 1 };
  return Object.freeze({ row: authority.row, final: authority.next + 1 === authority.plan.waves.length,
    commit: () => {
      if (current(run) !== authority || JSON.stringify(binding.recording.outcome) !== value.outcomeSignature ||
        JSON.stringify(authority.row) !== authority.rowSignature) {
        throw new Error('Ormus run changed during settlement');
      }
      authorities.set(run, advanced);
    },
    checkCommitted: () => {
      if (current(run) !== advanced || JSON.stringify(binding.recording.outcome) !== value.outcomeSignature) {
        throw new Error('Ormus run changed during publication');
      }
    } });
}
/** Restore hidden sequence progress only; replay tombstones and issuance history survive. */
export function captureOrmusAuthorityRollback(run: ActiveRun): () => void {
  const previous = authorities.get(run);
  return () => { if (previous) authorities.set(run, previous); else authorities.delete(run); };
}
