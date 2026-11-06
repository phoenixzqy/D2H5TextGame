import type { CombatSnapshot, RecordedBattleResult } from '@/engine/combat/combat';
import { COW, captureCowEncounter, hasOriginalCowVictory } from '@/engine/map/cow-quest';
import type { ActiveRun } from './combatRunLifecycle';

type Recording = NonNullable<ActiveRun['recording']>;
type NativeResult = Pick<RecordedBattleResult['result'], 'winner' | 'playerTeam' | 'enemyTeam'>;
const brand = Symbol('cowNativeWitness');
/** Process-local native outcome authority; copied fields confer no authority. */
export interface CowNativeWitness { readonly [brand]: true }
interface Witness {
  readonly run: ActiveRun;
  readonly index: number;
  readonly input: CombatSnapshot;
  readonly qualified: boolean;
  readonly signature: string;
  readonly recording?: Recording;
}
const witnesses = new WeakMap<CowNativeWitness, Witness>();

/** Capture actual native values before display callbacks or playback can change them. */
export function captureCowNativeWitness(run: ActiveRun, index: number, input: CombatSnapshot,
  result: NativeResult): CowNativeWitness | undefined {
  if (run.origin.kind !== 'area' || run.origin.questEncounter !== COW.encounter) return undefined;
  const wave = run.plan.waves[index];
  const encounter = wave && captureCowEncounter(run.act, run.plan.subAreaId, wave, input.playerTeam, input.enemyTeam);
  if (!encounter || index !== 0 || run.plan.waves.length !== 1 || run.mode !== 'manual' ||
    run.origin.replayProfileId !== 'normal' || run.replayProfileId !== 'normal') return undefined;
  const outcome = { winner: result.winner, finalPlayerTeam: result.playerTeam, finalEnemyTeam: result.enemyTeam };
  const token: CowNativeWitness = Object.freeze({ [brand]: true as const });
  witnesses.set(token, { run, index, input, qualified: hasOriginalCowVictory(encounter, outcome), signature: JSON.stringify(outcome) });
  return token;
}
/** Bind once to the exact recording staged from the witnessed native result. */
export function bindCowNativeWitness(token: CowNativeWitness, recording: Recording): void {
  const value = witnesses.get(token);
  if (!value || value.recording) throw new Error('Invalid Cow native witness binding');
  witnesses.set(token, { ...value, recording });
}
/** Receipt admission validates process-local identity independently of native victory. */
export function isCowNativeWitnessBound(token: CowNativeWitness, run: ActiveRun, index: number,
  input: CombatSnapshot, recording: Recording): boolean {
  const value = witnesses.get(token);
  return value !== undefined && value.run === run && value.index === index && value.input === input && value.recording === recording;
}
/** Only an unchanged actual native victory can authorize Cow income or its proof. */
export function hasCowNativeVictory(binding: {
  readonly cowNativeWitness?: CowNativeWitness;
  readonly candidateRun: ActiveRun;
  readonly targetWaveIdx: number;
  readonly engineInput: CombatSnapshot;
  readonly recording: Recording;
}): boolean {
  const token = binding.cowNativeWitness, value = token && witnesses.get(token);
  return token !== undefined && value !== undefined && value.qualified &&
    isCowNativeWitnessBound(token, binding.candidateRun, binding.targetWaveIdx, binding.engineInput, binding.recording) &&
    JSON.stringify(binding.recording.outcome) === value.signature;
}
