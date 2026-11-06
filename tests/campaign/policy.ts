import type { CharacterClass } from '@/features/character/createMockPlayer';
import type { CoreStats } from '@/engine/types/attributes';
import type { PlayerAuraId } from '@/engine/types/auras';
import { campaignProfiles } from './profiles';
import profileRegistry from './profile-registry.json';

export interface CampaignProfile {
  readonly classId: CharacterClass;
  readonly targets: readonly { readonly id: string; readonly rank: number; readonly level: number }[];
  readonly priority: readonly string[];
  readonly priorityByArea?: Readonly<Record<string, readonly string[]>>;
  readonly statsPerLevel: CoreStats;
  /** Later five-point blocks may follow a new distribution without rewriting investment. */
  readonly statStages?: readonly { readonly level: number; readonly statsPerLevel: CoreStats }[];
  readonly weaponPolicy?: 'preserve-bow-fallback';
  /** Explicit physical role may trade defense for native basic-hit expectation. */
  readonly heroWeaponPolicy?: { readonly kind: 'physical-offense-v1'; readonly level: number };
  readonly ownedEquipmentPolicy?: 'owned-build-v1';
  readonly weaponAffinity?: 'throwing' | 'claw' | 'sword';
  readonly mercEquipmentPolicy?: 'monotone-fielded-v1';
  readonly mercWeaponPolicy?: 'physical-offense-v1';
  readonly capacityPolicy?: 'owned-shortlist-v2';
  readonly mercWeaponSocketPolicy?: 'owned-physical-offense-v1';
  readonly companionPolicy?: 'act2-prayer-v1';
  readonly survivalEquipmentPolicy?: 'act2-owned-v1';
  /** Hero armor tradeoffs before Act II, preserving entry attack/speed/Mana floors. */
  readonly earlySurvivalEquipmentPolicy?: 'owned-balanced-v1';
  readonly survivalRetrievalPolicy?: 'stash-room-v1';
  readonly socketPreparationPolicy?: 'owned-act2-defense-v1';
  readonly comboPolicy?: 'bow-volley-once-learned-v1' | 'bow-volley-at-target-v1' | 'bone-survival-curse-v1' | 'javelin-lightning-impale-v1' | 'javelin-pair-at-target-v1' | 'fire-meteor-ball-v1' | 'holy-bolt-at-target-v1';
  readonly drawRecoveryPolicy?: 'learned-offensive-curse-v1';
  readonly trainingDrawRecoveryPolicy?: 'learned-offensive-curse-v1';
  readonly cursePreferenceByArea?: Readonly<Record<string, readonly string[]>>;
  readonly progressionPolicy?: 'javelin-earned-v1';
  readonly skillResetPolicy?: 'double-throw-unlock-v1';
  readonly recoveryTrainingPolicy?: 'cleared-level-margin-v1';
  /** Opt-in post-Den farming retries, only with explicitly selected route recovery. */
  readonly acquisitionTrainingPolicy?: 'den-bounded-v1';
  readonly auraSelection?: { readonly id: 'paladin.might' | 'paladin.prayer'; readonly level: 2 };
  /** Ordered idle-boundary selections; the last eligible stage overrides the default. */
  readonly auraStages?: readonly { readonly id: PlayerAuraId; readonly level: number }[];
}
/** Settled training history authorizes one offensive retry and consecutive successful carry. */
export interface TrainingCurseRecovery {
  readonly policy: 'learned-offensive-curse-v1';
  readonly area: string;
  readonly triggerOrdinal: number;
}
export type CampaignPhase = 'intro' | 'act1' | 'act2' | 'act3' | 'act4' | 'act5';
export type CampaignRecoveryMode = 'none' | 'act1-training-v1';

/** Fail closed before character creation; recovery never silently changes old screens. */
export function campaignRecoveryMode(value: string | undefined): CampaignRecoveryMode {
  if (value === undefined || value === 'none') return 'none';
  if (value === 'act1-training-v1') return value;
  throw new Error('Unknown campaign recovery mode');
}
export interface CampaignWave {
  readonly phase: 'farm' | 'route';
  readonly area: string;
  readonly ordinal: number;
  readonly index: number;
  readonly outcome: 'victory' | 'defeat' | 'draw';
  readonly advance: 'next-wave' | 'victory' | 'defeat';
  readonly logicalMs: number;
  readonly xp: number;
  readonly items: number;
  readonly heroLife: number;
  readonly heroMana: number;
}
export type CampaignUnobservedWave = Omit<Pick<CampaignWave,
  'phase' | 'area' | 'ordinal' | 'index' | 'logicalMs' | 'xp' | 'items'>, 'logicalMs'> & {
    readonly logicalMs: number | null;
  };

/** Fail before gameplay for unspecified or unimplemented matrix cells. */
export function campaignRequest(phase: string | undefined, id: string | undefined) {
  if (phase !== 'intro' && phase !== 'act1' && phase !== 'act2' && phase !== 'act3' && phase !== 'act4' && phase !== 'act5') throw new Error('Unknown campaign phase');
  if (!id || !Object.hasOwn(profileRegistry, id)) throw new Error('Unimplemented campaign profile');
  return { phase, profile: campaignProfiles[id as keyof typeof campaignProfiles] };
}

/** Retain native income and known combat time; unknown combat time withholds throughput. */
export function campaignTotals(waves: readonly CampaignWave[], quests: readonly { xp: number; items: number }[] = [],
  unobserved: readonly CampaignUnobservedWave[] = []) {
  const played = [...waves, ...unobserved];
  if (waves.some(w => !Number.isFinite(w.logicalMs) || w.logicalMs < 0) ||
    unobserved.some(w => w.logicalMs !== null && (!Number.isFinite(w.logicalMs) || w.logicalMs < 0)))
    throw new Error('Invalid native campaign time');
  const combatMs = played.reduce((sum, w) => sum + (w.logicalMs ?? 0), 0);
  const unmeasuredWaves = unobserved.filter(w => w.logicalMs === null).length;
  const won = (w: CampaignWave) => w.outcome === 'victory' && w.heroLife > 0 && w.advance !== 'defeat';
  const waveEarnings = { xp: played.reduce((sum, w) => sum + w.xp, 0),
    items: played.reduce((sum, w) => sum + w.items, 0) };
  const questEarnings = { xp: quests.reduce((sum, q) => sum + q.xp, 0),
    items: quests.reduce((sum, q) => sum + q.items, 0) };
  const allEarned = { xp: waveEarnings.xp + questEarnings.xp, items: waveEarnings.items + questEarnings.items };
  return {
    playedWaves: played.length, unobservedWaves: unobserved.length, unmeasuredWaves, wonWaves: waves.filter(won).length,
    nonwins: waves.filter(w => !won(w)).length, combatMs,
    farmMs: played.filter(w => w.phase === 'farm').reduce((s, w) => s + (w.logicalMs ?? 0), 0),
    routeMs: played.filter(w => w.phase === 'route').reduce((s, w) => s + (w.logicalMs ?? 0), 0),
    nonwinMs: waves.filter(w => !won(w)).reduce((s, w) => s + w.logicalMs, 0),
    earnings: { waves: waveEarnings, quests: questEarnings, allEarned },
    allEarnedXpPerCombatHour: unmeasuredWaves === 0 && combatMs > 0 ? allEarned.xp * 3_600_000 / combatMs : null,
    completedChallenges: waves.filter(w => won(w) && w.advance === 'victory').length
  };
}
