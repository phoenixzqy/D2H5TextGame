import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestProgressData } from '../types/save';

/** Finite source contracts for the three protected Act IV quest victories. */
export const ACT4_ENCOUNTERS = [
  { questId: 'quests/act4-fallen-angel', objectiveId: 'obj-kill-izual', areaId: 'areas/act4-plains-of-despair',
    proof: 'quests/act4-fallen-angel#action:izual-victory', source: { kind: 'bossEncounter', encounterId: 'act4-pod-izual' },
    members: ['monsters/act4.izual', 'monsters/act4.oblivion-knight', 'monsters/act4.oblivion-knight'], prerequisites: [] },
  { questId: 'quests/act4-hellforge', objectiveId: 'obj-kill-hephasto', areaId: 'areas/act4-river-of-flame',
    proof: 'quests/act4-hellforge#action:hephasto-victory', source: { kind: 'bossEncounter', encounterId: 'act4-rof-hephasto' },
    members: ['monsters/act4.mega-demon', 'monsters/act4.pit-lord', 'monsters/act4.pit-lord', 'monsters/act4.pit-lord'], prerequisites: [] },
  { questId: 'quests/act4-terrors-end', objectiveId: 'obj-kill-diablo', areaId: 'areas/act4-chaos-sanctuary',
    proof: 'quests/act4-terrors-end#action:diablo-victory', source: { kind: 'chapterBoss', archetypeId: 'monsters/act4.diablo' },
    members: ['monsters/act4.diablo'], prerequisites: ['obj-seal-1', 'obj-seal-2', 'obj-seal-3'] }
] as const;
for (const contract of ACT4_ENCOUNTERS) {
  Object.freeze(contract.source); Object.freeze(contract.members); Object.freeze(contract.prerequisites); Object.freeze(contract);
}
Object.freeze(ACT4_ENCOUNTERS);
export const HEPHASTO_PROOF = 'quests/act4-hellforge#action:hephasto-victory';
export type Act4EncounterContract = typeof ACT4_ENCOUNTERS[number];
export interface Act4Encounter {
  readonly contract: Act4EncounterContract;
  readonly originalMemberIds: readonly string[];
}

/** Copy canonical original identities before simulation; source metadata alone cannot settle credit. */
export function captureAct4Encounter(act: number, areaId: string, wave: WaveSpec,
  enemies: readonly CombatUnit[]): Act4Encounter | undefined {
  const contract = ACT4_ENCOUNTERS.find(row => row.areaId === areaId);
  if (act !== 4 || !contract || wave.waveTier !== 'boss' || !wave.source ||
    wave.source.kind !== contract.source.kind || wave.spawns.length !== contract.members.length ||
    enemies.length !== contract.members.length || new Set(enemies.map(unit => unit.id)).size !== enemies.length) return undefined;
  const chapter = contract.source.kind === 'chapterBoss';
  if (chapter ? wave.presentation?.isActBoss !== true || wave.source.kind !== 'chapterBoss' ||
    wave.source.archetypeId !== contract.members[0]
    : wave.presentation?.isActBoss === true || wave.source.kind !== 'bossEncounter' ||
      wave.source.encounterId !== contract.source.encounterId) return undefined;
  const tier = chapter ? 'chapter-boss' : 'boss';
  if (!contract.members.every((archetype, index) => {
    const spawn = wave.spawns[index], unit = enemies[index];
    return spawn?.archetypeId === archetype && spawn.tier === tier &&
      (chapter ? spawn.chapterBoss?.archetypeId === archetype && spawn.encounterId === undefined
        : spawn.chapterBoss === undefined && spawn.encounterId === contract.source.encounterId) &&
      unit?.id.length && unit.side === 'enemy' && unit.kind === 'monster' && unit.tier === tier &&
      unit.monsterArchetypeId === archetype && Number.isFinite(unit.life) && unit.life > 0;
  })) return undefined;
  return Object.freeze({ contract, originalMemberIds: Object.freeze(enemies.map(unit => unit.id)) });
}

/** Requires every original member dead and the original hero alive in an accepted win. */
export function hasOriginalAct4Victory(encounter: Act4Encounter, heroId: string,
  outcome: { readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[];
    readonly finalEnemyTeam: readonly CombatUnit[] }): boolean {
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === heroId), hero = heroes[0];
  if (outcome.winner !== 'player' || heroes.length !== 1 || hero?.side !== 'player' || hero.kind !== 'hero' ||
    !Number.isFinite(hero.life) || hero.life <= 0 || encounter.originalMemberIds.length !== encounter.contract.members.length ||
    new Set(encounter.originalMemberIds).size !== encounter.originalMemberIds.length) return false;
  return encounter.originalMemberIds.every((id, index) => {
    const matches = outcome.finalEnemyTeam.filter(unit => unit.id === id), unit = matches[0];
    return matches.length === 1 && unit?.side === 'enemy' && unit.kind === 'monster' &&
      unit.tier === (encounter.contract.source.kind === 'chapterBoss' ? 'chapter-boss' : 'boss') &&
      unit.monsterArchetypeId === encounter.contract.members[index] && Number.isFinite(unit.life) && unit.life <= 0;
  });
}

/** Pre-event eligibility never banks an early kill; completed unclaimed history needs a new victory. */
export function isAct4AdmissionEligible(contract: Act4EncounterContract,
  progress: Readonly<Record<string, QuestProgressData>>): boolean {
  const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!record(progress)) return false;
  const row: unknown = Object.hasOwn(progress, contract.questId) ? progress[contract.questId] : undefined;
  const objectives = [...contract.prerequisites, contract.objectiveId,
    ...(contract.questId === 'quests/act4-hellforge' ? ['obj-shatter'] : [])];
  return record(row) && Object.hasOwn(row, 'id') && row.id === contract.questId && row.rewardClaimed !== true &&
    Object.hasOwn(row, 'status') && (row.status === 'inProgress' || row.status === 'completed') &&
    Object.hasOwn(row, 'objectives') && record(row.objectives) &&
    objectives.every(id => Object.hasOwn(row.objectives as object, id) &&
      typeof (row.objectives as Record<string, unknown>)[id] === 'boolean') &&
    contract.prerequisites.every(id => (row.objectives as Record<string, unknown>)[id] === true) &&
    (row.status !== 'completed' || objectives.every(id => (row.objectives as Record<string, unknown>)[id] === true));
}
