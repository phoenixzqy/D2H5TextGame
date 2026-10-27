import { act5Runtime } from '../../data/loaders/act5-runtime';
import type { WaveSpec, WaveSource } from '../combat/sub-area-run';
import type { CombatUnit, MonsterTier } from '../combat/types';
import type { QuestProgressData } from '../types/save';

interface Member { readonly archetypeId: string; readonly tier: MonsterTier; readonly encounterId?: string }
export interface Act5EncounterContract {
  readonly questId: string; readonly objectiveId: string; readonly areaId: string; readonly proof: string;
  readonly source: WaveSource; readonly members: readonly Member[]; readonly prerequisites: readonly string[];
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
/** Finite authored original-source contracts; role order is Talic, Korlic, Madawc. */
export const ACT5_RUNTIME = act5Runtime;
export const ACT5_ENCOUNTERS = ACT5_RUNTIME.encounters as readonly Act5EncounterContract[];
export const EVE_QUEST = 'quests/act5-eve-of-destruction';
export const PRISON_QUEST = 'quests/act5-prison-of-ice';
export const RESCUE_QUEST = 'quests/act5-rescue-on-mount-arreat';
export const THRONE_PROOF = `${EVE_QUEST}#action:throne-waves-victory`;
export interface Act5Encounter {
  readonly contract: Act5EncounterContract; readonly originalMemberIds: readonly string[];
}
/** Copy exact original source/member identities before simulation, never from event counters. */
export function captureAct5Encounter(act: number, areaId: string, wave: WaveSpec,
  enemies: readonly CombatUnit[]): Act5Encounter | undefined {
  const contract = ACT5_ENCOUNTERS.find(row => row.areaId === areaId);
  if (act !== 5 || !contract || !sameSource(wave.source, contract.source) || wave.waveTier !== 'boss') return undefined;
  return capture(contract, wave, enemies);
}
/** Capture one of the first five original Throne waves, including every original companion. */
export function captureAct5ThroneWave(act: number, areaId: string, wave: WaveSpec,
  enemies: readonly CombatUnit[]): (Act5Encounter & { readonly ordinal: number }) | undefined {
  if (act !== 5 || areaId !== 'areas/act5-throne-of-destruction' || wave.waveTier !== 'elite') return undefined;
  const ordinal = ACT5_RUNTIME.throneWaves.slice(0, 5).findIndex(row => sameSource(wave.source,
    { kind: 'wave', waveId: row.waveId, encounterIds: row.encounterIds }));
  const row = ACT5_RUNTIME.throneWaves[ordinal];
  if (!row) return undefined;
  const contract: Act5EncounterContract = { questId: EVE_QUEST, objectiveId: 'obj-throne-waves', areaId,
    proof: THRONE_PROOF, source: { kind: 'wave', waveId: row.waveId, encounterIds: row.encounterIds },
    members: row.members as readonly Member[], prerequisites: [] };
  const captured = capture(deepFreeze(contract), wave, enemies);
  return captured ? Object.freeze({ ...captured, ordinal: ordinal + 1 }) : undefined;
}
function sameSource(actual: WaveSource | undefined, expected: WaveSource): boolean {
  if (actual?.kind !== expected.kind) return false;
  if (expected.kind === 'chapterBoss') return actual.kind === 'chapterBoss' && actual.archetypeId === expected.archetypeId;
  if (expected.kind === 'bossEncounter') return actual.kind === 'bossEncounter' && actual.encounterId === expected.encounterId;
  return expected.kind === 'wave' && actual.kind === 'wave' && actual.waveId === expected.waveId && actual.encounterIds.length === expected.encounterIds.length &&
    actual.encounterIds.every((id, index) => id === expected.encounterIds[index]);
}
function capture(contract: Act5EncounterContract, wave: WaveSpec, enemies: readonly CombatUnit[]): Act5Encounter | undefined {
  const chapter = contract.source.kind === 'chapterBoss';
  if (wave.spawns.length !== contract.members.length || enemies.length !== contract.members.length ||
    new Set(enemies.map(unit => unit.id)).size !== enemies.length ||
    (chapter ? wave.presentation?.isActBoss !== true : wave.presentation?.isActBoss === true) ||
    !contract.members.every((member, index) => {
      const spawn = wave.spawns[index], unit = enemies[index];
      const encounter = contract.source.kind === 'bossEncounter' ? contract.source.encounterId : member.encounterId;
      return spawn?.archetypeId === member.archetypeId && spawn.tier === member.tier &&
        (chapter ? spawn.chapterBoss?.archetypeId === member.archetypeId && spawn.encounterId === undefined
          : spawn.chapterBoss === undefined && spawn.encounterId === encounter) &&
        unit?.id.length && unit.side === 'enemy' && unit.kind === 'monster' && unit.tier === member.tier &&
        unit.monsterArchetypeId === member.archetypeId && Number.isFinite(unit.life) && unit.life > 0;
    })) return undefined;
  return Object.freeze({ contract, originalMemberIds: Object.freeze(enemies.map(unit => unit.id)) });
}
/** Accepted actual win requires all captured original enemies dead and original hero alive. */
export function hasOriginalAct5Victory(encounter: Act5Encounter, heroId: string,
  outcome: { readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[];
    readonly finalEnemyTeam: readonly CombatUnit[] }): boolean {
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === heroId), hero = heroes[0];
  return outcome.winner === 'player' && heroes.length === 1 && hero?.side === 'player' && hero.kind === 'hero' &&
    Number.isFinite(hero.life) && hero.life > 0 && encounter.originalMemberIds.length === encounter.contract.members.length &&
    new Set(encounter.originalMemberIds).size === encounter.originalMemberIds.length && encounter.originalMemberIds.every((id, index) => {
      const matches = outcome.finalEnemyTeam.filter(unit => unit.id === id), unit = matches[0], member = encounter.contract.members[index];
      return matches.length === 1 && unit?.side === 'enemy' && unit.kind === 'monster' && unit.tier === member?.tier &&
        unit.monsterArchetypeId === member.archetypeId && Number.isFinite(unit.life) && unit.life <= 0;
    });
}
/** Pre-event tracked source eligibility; completed unclaimed history still needs actual new proof. */
export function isAct5AdmissionEligible(contract: Act5EncounterContract,
  progress: Readonly<Record<string, QuestProgressData>>): boolean {
  const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!record(progress)) return false;
  const row: unknown = Object.hasOwn(progress, contract.questId) ? progress[contract.questId] : undefined;
  const objectives = contract.questId === PRISON_QUEST ? ['obj-find-anya', 'obj-thaw', 'obj-kill-nihlathak']
    : contract.questId === EVE_QUEST ? ['obj-throne-waves', 'obj-kill-baal'] : [contract.objectiveId];
  return record(row) && Object.hasOwn(row, 'id') && row.id === contract.questId && row.rewardClaimed !== true &&
    Object.hasOwn(row, 'status') && (row.status === 'inProgress' || row.status === 'completed') &&
    Object.hasOwn(row, 'objectives') && record(row.objectives) && objectives.every(id =>
      Object.hasOwn(row.objectives as object, id) && typeof (row.objectives as Record<string, unknown>)[id] === 'boolean') &&
    contract.prerequisites.every(id => (row.objectives as Record<string, unknown>)[id] === true) &&
    (row.status !== 'completed' || objectives.every(id => (row.objectives as Record<string, unknown>)[id] === true));
}
