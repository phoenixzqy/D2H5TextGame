import type { CountessQuestDomain } from '../save/quest-domain';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';
import { ACT1_QUEST_RECEIPTS } from './act1-quest-sources';
import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';

/** Finite source identity; authored JSON supplies the actual encounter and monster stats. */
export const COUNTESS = Object.freeze({
  quest: 'quests/act1-forgotten-tower', objective: 'obj-kill-countess',
  act: 'acts/act1', area: 'areas/act1-dark-wood', encounter: 'act1-dw-countess',
  archetype: 'monsters/act1.the-countess', level: 13, lootTable: 'loot/act1-boss',
  receipt: ACT1_QUEST_RECEIPTS.countessVictory
} as const);
type Progress = Readonly<Record<string, QuestProgressData>>;
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function canonicalRow(progress: Progress, domain: CountessQuestDomain = COUNTESS): QuestProgressData | undefined {
  const row: unknown = Object.hasOwn(progress, domain.quest) ? progress[domain.quest] : undefined;
  if (!record(row) || !['id', 'status', 'objectives'].every(key => Object.hasOwn(row, key)) ||
    row.id !== domain.quest || (row.status !== 'inProgress' && row.status !== 'completed') ||
    !record(row.objectives) ||
    (row.rewardClaimed !== undefined && typeof row.rewardClaimed !== 'boolean') ||
    (row.status === 'inProgress' && row.rewardClaimed === true)) return undefined;
  const flags = row.objectives;
  if (Object.hasOwn(flags, domain.objective)
    ? typeof flags[domain.objective] !== 'boolean'
    : row.status !== 'completed' || domain.objective in flags) return undefined;
  return row as unknown as QuestProgressData;
}

/** Missing-proof legacy rows may earn fresh proof; any own receipt blocks reentry. */
export function isCountessAdmissionEligible(progress: Progress, receipts: QuestActionReceipts): boolean {
  return canonicalRow(progress) !== undefined && !Object.hasOwn(receipts, COUNTESS.receipt);
}

/** A first Claim requires the canonical completed row, objective and own exact victory proof. */
export function hasCountessCompletion(progress: Progress, receipts: QuestActionReceipts, domain: CountessQuestDomain = COUNTESS): boolean {
  const row = canonicalRow(progress, domain);
  return row?.status === 'completed' && Object.hasOwn(row.objectives, domain.objective) &&
    row.objectives[domain.objective] === true && Object.hasOwn(receipts, domain.receipt) &&
    receipts[domain.receipt] === true;
}

/** Copied immutable identities; only the live wave binding may turn victory evidence into proof. */
export interface CountessEncounter {
  readonly actId: typeof COUNTESS.act;
  readonly areaId: typeof COUNTESS.area;
  readonly encounterId: typeof COUNTESS.encounter;
  readonly originalHeroId: string;
  readonly originalCountessId: string;
}
function countessSource(actId: string, areaId: string, encounterId: string): boolean {
  return actId === COUNTESS.act && areaId === COUNTESS.area && encounterId === COUNTESS.encounter;
}
function originalUnit(unit: CombatUnit | undefined, kind: 'hero' | 'monster'): unit is CombatUnit {
  return unit !== undefined && typeof unit.id === 'string' && unit.id.length > 0 &&
    unit.kind === kind && unit.summon !== true && unit.summonOwnerId === undefined &&
    unit.ownerId === undefined && Number.isFinite(unit.life) &&
    (kind === 'hero' ? unit.side === 'player' : unit.side === 'enemy' &&
      unit.monsterArchetypeId === COUNTESS.archetype && unit.tier === 'boss' && unit.level === COUNTESS.level);
}

/** Capture one canonical optional boss and exactly one living original hero before simulation. */
export function captureCountessEncounter(act: number, areaId: string, wave: WaveSpec,
  playerTeam: readonly CombatUnit[], enemies: readonly CombatUnit[]): CountessEncounter | undefined {
  const spawn = wave.spawns[0], countess = enemies[0];
  const heroes = playerTeam.filter(unit => unit.kind === 'hero');
  const hero = heroes[0];
  const ids = [...playerTeam, ...enemies].map(unit => unit.id);
  if (act !== 1 || areaId !== COUNTESS.area || wave.source?.kind !== 'questEncounter' ||
    wave.source.encounterId !== COUNTESS.encounter || wave.waveTier !== 'boss' ||
    wave.presentation?.isActBoss === true || wave.spawns.length !== 1 ||
    spawn?.encounterId !== COUNTESS.encounter || spawn.archetypeId !== COUNTESS.archetype ||
    spawn.tier !== 'boss' || spawn.level !== COUNTESS.level || spawn.index !== 0 ||
    spawn.chapterBoss !== undefined || spawn.eliteAffix !== undefined ||
    heroes.length !== 1 || !originalUnit(hero, 'hero') || hero.life <= 0 ||
    enemies.length !== 1 || !originalUnit(countess, 'monster') || countess.life <= 0 ||
    new Set(ids).size !== ids.length) return undefined;
  return Object.freeze({ actId: COUNTESS.act, areaId: COUNTESS.area, encounterId: COUNTESS.encounter,
    originalHeroId: hero.id, originalCountessId: countess.id });
}

/** Check original bodies only; caller still owns live receipt acceptance and transaction authority. */
export function hasOriginalCountessVictory(encounter: CountessEncounter, outcome: {
  readonly winner: string | null; readonly finalPlayerTeam: readonly CombatUnit[];
  readonly finalEnemyTeam: readonly CombatUnit[];
}): boolean {
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.id === encounter.originalHeroId);
  const enemies = outcome.finalEnemyTeam.filter(unit => unit.id === encounter.originalCountessId);
  const hero = heroes[0], countess = enemies[0];
  return outcome.winner === 'player' && countessSource(encounter.actId, encounter.areaId, encounter.encounterId) &&
    encounter.originalHeroId !== encounter.originalCountessId &&
    heroes.length === 1 && enemies.length === 1 &&
    !outcome.finalEnemyTeam.some(unit => unit.id === encounter.originalHeroId) &&
    !outcome.finalPlayerTeam.some(unit => unit.id === encounter.originalCountessId) &&
    originalUnit(hero, 'hero') && hero.life > 0 &&
    originalUnit(countess, 'monster') && countess.life <= 0;
}
