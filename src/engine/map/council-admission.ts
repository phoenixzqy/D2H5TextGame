import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestProgressData } from '../types/save';

export const COUNCIL_QUEST_ID = 'quests/act3-khalims-will';
export const COUNCIL_RECEIPT_SOURCE = `${COUNCIL_QUEST_ID}#action:council-victory` as const;
export const COUNCIL_AREA_ID = 'areas/act3-travincal';
const ENCOUNTER_ID = 'act3-travincal-council';
const ARCHETYPE_ID = 'monsters/act3.infector';
const OBJECTIVES = ['obj-heart', 'obj-brain', 'obj-eye', 'obj-flail', 'obj-transmute'] as const;

/** Private copied origin and member identities, retained by the original wave binding. */
export interface CouncilEncounter {
  readonly actId: 'acts/act3';
  readonly areaId: typeof COUNCIL_AREA_ID;
  readonly encounterId: typeof ENCOUNTER_ID;
  readonly originalMemberIds: readonly string[];
  readonly historicalRecovery: boolean;
}

/** Capture only the exact authored three-member encounter, before any live publication. */
export function captureCouncilEncounter(act: number, areaId: string, wave: WaveSpec,
  enemies: readonly CombatUnit[], historicalRecovery = false): CouncilEncounter | undefined {
  if (act !== 3 || areaId !== COUNCIL_AREA_ID || wave.waveTier !== 'boss' ||
    wave.presentation?.isActBoss === true || wave.source?.kind !== 'bossEncounter' ||
    wave.source.encounterId !== ENCOUNTER_ID || wave.spawns.length !== 3 || enemies.length !== 3 ||
    !wave.spawns.every((spawn, index) => {
      const original = enemies[index];
      return spawn.encounterId === ENCOUNTER_ID && spawn.archetypeId === ARCHETYPE_ID &&
        spawn.tier === 'boss' && spawn.chapterBoss === undefined && original?.kind === 'monster' &&
        original.side === 'enemy' && original.tier === 'boss' && original.monsterArchetypeId === ARCHETYPE_ID &&
        Number.isFinite(original.life) && original.life > 0 &&
        original.id.length > 0 && enemies.filter(unit => unit.id === original.id).length === 1;
    })) return undefined;
  return Object.freeze({ actId: 'acts/act3', areaId: COUNCIL_AREA_ID, encounterId: ENCOUNTER_ID,
    originalMemberIds: Object.freeze(enemies.map(unit => unit.id)), historicalRecovery });
}

/** The accepted receipt/settlement authority stays with the caller; a dead snapshot alone grants nothing. */
export function hasOriginalCouncilVictory(encounter: CouncilEncounter, heroId: string,
  outcome: { readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[];
    readonly finalEnemyTeam: readonly CombatUnit[] }): boolean {
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === heroId);
  if (outcome.winner !== 'player' || encounter.originalMemberIds.length !== 3 ||
    new Set(encounter.originalMemberIds).size !== 3 || heroes.length !== 1 ||
    heroes[0]?.side !== 'player' || heroes[0].kind !== 'hero' || !Number.isFinite(heroes[0].life) || heroes[0].life <= 0) return false;
  return encounter.originalMemberIds.every(id => {
    const matches = outcome.finalEnemyTeam.filter(unit => unit.id === id);
    const final = matches[0];
    return matches.length === 1 && final?.side === 'enemy' && final.kind === 'monster' &&
      final.tier === 'boss' && final.monsterArchetypeId === ARCHETYPE_ID &&
      Number.isFinite(final.life) && final.life <= 0;
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** Progress can permit an actual future encounter; it never supplies proof by itself. */
export function isCouncilAdmissionEligible(progress: Readonly<Record<string, QuestProgressData>>,
  historicalRecovery = false): boolean {
  const row: unknown = Object.hasOwn(progress, COUNCIL_QUEST_ID) ? progress[COUNCIL_QUEST_ID] : undefined;
  if (!record(row) || !Object.hasOwn(row, 'id') || row.id !== COUNCIL_QUEST_ID ||
    !Object.hasOwn(row, 'status') || !Object.hasOwn(row, 'objectives') || !record(row.objectives)) return false;
  const objectives = row.objectives;
  if (!OBJECTIVES.every(id => Object.hasOwn(objectives, id) && typeof objectives[id] === 'boolean')) return false;
  if (historicalRecovery) return row.status === 'completed' && Object.hasOwn(row, 'rewardClaimed') &&
    row.rewardClaimed === true && OBJECTIVES.every(id => Object.hasOwn(objectives, id) && objectives[id] === true);
  return row.status === 'inProgress' && row.rewardClaimed !== true &&
    objectives['obj-transmute'] !== true;
}

/** A persisted proof may outlive assembly/Claim; historical import never creates it. */
export function isCouncilReceiptProgress(progress: Readonly<Record<string, QuestProgressData>>): boolean {
  if (isCouncilAdmissionEligible(progress)) return true;
  const row = progress[COUNCIL_QUEST_ID];
  return Object.hasOwn(progress, COUNCIL_QUEST_ID) && row?.id === COUNCIL_QUEST_ID &&
    row.status === 'completed' && OBJECTIVES.every(id => Object.hasOwn(row.objectives, id) && row.objectives[id] === true);
}
