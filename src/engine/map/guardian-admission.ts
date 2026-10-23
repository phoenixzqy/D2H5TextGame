import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';

export const GUARDIAN_QUEST_ID = 'quests/act3-guardian';
export const GUARDIAN_ORB_SOURCE = `${GUARDIAN_QUEST_ID}#action:break-compelling-orb` as const;
export const MEPHISTO_AREA_ID = 'areas/act3-durance-of-hate';
const ARCHETYPE_ID = 'monsters/act3.mephisto';

/** Copied canonical origin and original unit identity retained by the recording binding. */
export interface GuardianEncounter {
  readonly actId: 'acts/act3';
  readonly areaId: typeof MEPHISTO_AREA_ID;
  readonly archetypeId: typeof ARCHETYPE_ID;
  readonly originalBossId: string;
}

/** Capture canonical chapter provenance before simulation; synthetic lookalikes supply no proof. */
export function captureGuardianEncounter(act: number, areaId: string, wave: WaveSpec,
  enemies: readonly CombatUnit[]): GuardianEncounter | undefined {
  const spawn = wave.spawns[0], original = enemies[0];
  if (act !== 3 || areaId !== MEPHISTO_AREA_ID || wave.waveTier !== 'boss' ||
    wave.presentation?.isActBoss !== true || wave.source?.kind !== 'chapterBoss' ||
    wave.source.archetypeId !== ARCHETYPE_ID || wave.spawns.length !== 1 || enemies.length !== 1 ||
    spawn?.archetypeId !== ARCHETYPE_ID || spawn.chapterBoss?.archetypeId !== ARCHETYPE_ID ||
    spawn.encounterId !== undefined || spawn.tier !== 'chapter-boss' ||
    original?.monsterArchetypeId !== ARCHETYPE_ID || original.side !== 'enemy' ||
    original.kind !== 'monster' || original.tier !== 'chapter-boss' || original.id.length === 0 ||
    !Number.isFinite(original.life) || original.life <= 0) return undefined;
  return Object.freeze({ actId: 'acts/act3', areaId: MEPHISTO_AREA_ID,
    archetypeId: ARCHETYPE_ID, originalBossId: original.id });
}

/** Actual accepted settlement authority belongs to the caller, never to a dead snapshot alone. */
export function hasOriginalGuardianVictory(encounter: GuardianEncounter, heroId: string,
  outcome: { readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[];
    readonly finalEnemyTeam: readonly CombatUnit[] }): boolean {
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === heroId);
  const bosses = outcome.finalEnemyTeam.filter(unit => unit.id === encounter.originalBossId);
  const hero = heroes[0], boss = bosses[0];
  return outcome.winner === 'player' &&
    heroes.length === 1 && hero?.side === 'player' && hero.kind === 'hero' &&
    Number.isFinite(hero.life) && hero.life > 0 && bosses.length === 1 &&
    boss?.side === 'enemy' && boss.kind === 'monster' && boss.tier === 'chapter-boss' &&
    boss.monsterArchetypeId === ARCHETYPE_ID && Number.isFinite(boss.life) && boss.life <= 0;
}

/** Pre-event tracked progress and the real Orb graph are both required; this checks progress only. */
export function isGuardianAdmissionEligible(progress: Readonly<Record<string, QuestProgressData>>,
  receipts: QuestActionReceipts): boolean {
  const record = (value: unknown): value is Record<string, unknown> => value !== null &&
    typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!record(progress) || !record(receipts)) return false;
  const row: unknown = Object.hasOwn(progress, GUARDIAN_QUEST_ID) ? progress[GUARDIAN_QUEST_ID] : undefined;
  return record(row) && Object.hasOwn(row, 'id') && row.id === GUARDIAN_QUEST_ID &&
    Object.hasOwn(row, 'status') && row.status === 'inProgress' && row.rewardClaimed !== true &&
    Object.hasOwn(row, 'objectives') && record(row.objectives) &&
    Object.hasOwn(row.objectives, 'obj-kill-mephisto') && row.objectives['obj-kill-mephisto'] === false &&
    Object.hasOwn(receipts, GUARDIAN_ORB_SOURCE) && receipts[GUARDIAN_ORB_SOURCE] === true;
}
