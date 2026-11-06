import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../types/save';
import type { CombatUnit } from '../combat/types';
import type { WaveSpec } from '../combat/sub-area-run';

/** Durable source identities only; each historical caller supplies its own authority. */
export interface CowQuestDomain {
  readonly quest: string; readonly legObjective: string; readonly portalObjective: string;
  readonly legSource: string; readonly legItemId: string; readonly tomeSource: string; readonly tomeItemId: string;
  readonly openProof: string; readonly victoryProof: string; readonly cubeSource: string; readonly cubeItemId: string;
}
const quest = 'quests/side-act1-pandemonium-cow-rumor';
export const COW_DOMAIN: CowQuestDomain = Object.freeze({ quest, legObjective: 'obj-find-leg', portalObjective: 'obj-open-portal',
  legSource: `${quest}#objective:obj-find-leg`, legItemId: 'quest/wirts_leg',
  tomeSource: `${quest}#action:receive-portal-tome`, tomeItemId: 'quest/cow_portal_tome',
  openProof: `${quest}#action:open-cow-portal`, victoryProof: `${quest}#action:cow-king-victory`,
  cubeSource: 'quests/act2-horadric-staff#objective:obj-cube', cubeItemId: 'quest/horadric_cube' });
/** Routing identities do not grant source or reward authority. */
export const COW = Object.freeze({ ...COW_DOMAIN, act: 'acts/act1', area: 'areas/act1-dark-wood',
  encounter: 'act1-dw-cow-king', king: 'monsters/act1.cow-king', bovine: 'monsters/act1.hell-bovine',
  level: 13, lootTable: 'loot/mini-act1', npc: 'npc/akara', target: 'objects/wirts_remains', recipe: 'moo_moo_portal',
  receiveAction: 'actions/act1-receive-cow-tome', openAction: 'actions/act1-open-cow-portal' } as const);

function record(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Reflect.ownKeys(value).every(key => {
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value');
  });
}
function own(value: Record<string, unknown>, key: string): unknown { return Object.getOwnPropertyDescriptor(value, key)?.value as unknown; }
function keys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function canonicalDomain(domain: unknown): domain is CowQuestDomain {
  return record(domain) && keys(domain, Object.keys(COW_DOMAIN)) && Object.entries(COW_DOMAIN).every(([key, value]) => own(domain, key) === value);
}
function row(progress: Record<string, unknown>, domain: CowQuestDomain): QuestProgressData | undefined {
  const value = own(progress, domain.quest);
  if (!record(value) || !keys(value, ['id', 'status', 'objectives'], ['rewardClaimed']) || own(value, 'id') !== domain.quest ||
    (own(value, 'status') !== 'inProgress' && own(value, 'status') !== 'completed') ||
    Object.hasOwn(value, 'rewardClaimed') && typeof own(value, 'rewardClaimed') !== 'boolean') return undefined;
  const objectives = own(value, 'objectives');
  const ids = [domain.legObjective, domain.portalObjective];
  if (!record(objectives) || !keys(objectives, own(value, 'status') === 'completed' ? [] : ids, ids) ||
    !Object.keys(objectives).every(id => typeof own(objectives, id) === 'boolean') ||
    own(value, 'status') === 'inProgress' && own(value, 'rewardClaimed') === true) return undefined;
  return value as unknown as QuestProgressData;
}
function entry(value: unknown, itemId: string): value is { itemId: string; state: 'owned' | 'consumed' } {
  return record(value) && keys(value, ['itemId', 'state']) && own(value, 'itemId') === itemId &&
    (own(value, 'state') === 'owned' || own(value, 'state') === 'consumed');
}

/** Required explicit authority: an absent historical domain never consults live definitions. */
export function validateCowQuestGraph(progress: unknown, items: unknown, receipts: unknown, domain: CowQuestDomain | undefined): void {
  if (!record(progress) || !record(items) || !record(receipts)) throw new Error('Invalid save: Cow maps require own JSON records');
  if (domain !== undefined && !canonicalDomain(domain)) throw new Error('Invalid save: changed Cow domain');
  const allowedItems = [COW.legSource, COW.tomeSource], allowedReceipts = [COW.tomeSource, COW.openProof, COW.victoryProof];
  if (Object.keys(items).some(source => source.startsWith(`${COW.quest}#`) && !allowedItems.includes(source)) ||
    Object.keys(receipts).some(source => source.startsWith(`${COW.quest}#`) && !allowedReceipts.includes(source))) throw new Error('Invalid save: unknown Cow source');
  const present = [...allowedItems.filter(source => Object.hasOwn(items, source)), ...allowedReceipts.filter(source => Object.hasOwn(receipts, source))];
  if (present.length === 0) return;
  if (domain === undefined) throw new Error('Invalid save: Cow source outside historical domain');
  const tracked = row(progress, domain);
  if (!tracked) throw new Error('Invalid save: Cow source requires canonical tracked row');
  for (const proof of allowedReceipts) if (Object.hasOwn(receipts, proof) && own(receipts, proof) !== true) throw new Error('Invalid save: Cow receipt must be true');
  const leg = own(items, domain.legSource), tome = own(items, domain.tomeSource);
  const hasLeg = Object.hasOwn(items, domain.legSource), hasTome = Object.hasOwn(items, domain.tomeSource);
  const received = Object.hasOwn(receipts, domain.tomeSource), opened = Object.hasOwn(receipts, domain.openProof), won = Object.hasOwn(receipts, domain.victoryProof);
  if (hasLeg && (!entry(leg, domain.legItemId) || tracked.objectives[domain.legObjective] !== true) ||
    hasTome && !entry(tome, domain.tomeItemId) || received !== hasTome || hasTome && !hasLeg) throw new Error('Invalid save: Cow ingredient source mismatch');
  if (!hasLeg) throw new Error('Invalid save: Cow proof requires recovered Leg');
  if (!entry(leg, domain.legItemId)) throw new Error('Invalid save: malformed Cow Leg');
  const consumed = leg.state === 'consumed' || entry(tome, domain.tomeItemId) && tome.state === 'consumed';
  if (opened || consumed || won) {
    const cube = own(items, domain.cubeSource);
    if (!opened || !received || leg.state !== 'consumed' || !entry(tome, domain.tomeItemId) || tome.state !== 'consumed' ||
      tracked.status !== 'completed' || tracked.objectives[domain.portalObjective] !== true ||
      !entry(cube, domain.cubeItemId) || cube.state !== 'owned') throw new Error('Invalid save: Cow portal requires consumed ingredients and retained Cube');
  } else if (leg.state !== 'owned' || hasTome && (!entry(tome, domain.tomeItemId) || tome.state !== 'owned')) {
    throw new Error('Invalid save: Cow unconsumed source mismatch');
  }
}
export function canEarnCowLeg(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger, receipts: QuestActionReceipts): boolean {
  try { validateCowQuestGraph(progress, items, receipts, COW_DOMAIN); return row(progress, COW_DOMAIN) !== undefined && !Object.hasOwn(items, COW.legSource); }
  catch { return false; }
}
export function isCowAdmissionEligible(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: CowQuestDomain = COW_DOMAIN): boolean {
  try { validateCowQuestGraph(progress, items, receipts, domain); return Object.hasOwn(receipts, domain.openProof) && !Object.hasOwn(receipts, domain.victoryProof); }
  catch { return false; }
}
export function hasCowCompletion(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  receipts: QuestActionReceipts, domain: CowQuestDomain = COW_DOMAIN): boolean {
  try { validateCowQuestGraph(progress, items, receipts, domain); return Object.hasOwn(receipts, domain.victoryProof); }
  catch { return false; }
}

/** Immutable original three-member witness; never saved or accepted without its recorded-wave binding. */
export interface CowEncounter {
  readonly actId: typeof COW.act; readonly areaId: typeof COW.area; readonly encounterId: typeof COW.encounter;
  readonly originalHeroId: string;
  readonly originalMemberIds: readonly [string, string, string];
}
function originalUnit(unit: CombatUnit | undefined, kind: 'hero' | 'monster', index = 0): unit is CombatUnit {
  return unit !== undefined && typeof unit.id === 'string' && unit.id.length > 0 && unit.kind === kind &&
    unit.side === (kind === 'hero' ? 'player' : 'enemy') && unit.summon !== true && unit.summonOwnerId === undefined &&
    unit.ownerId === undefined && Number.isFinite(unit.life) && (kind === 'hero' ||
      unit.monsterArchetypeId === (index === 0 ? COW.king : COW.bovine) && unit.tier === (index === 0 ? 'boss' : 'trash') && unit.level === COW.level);
}
/** Verify the exact fixed roster, order, tiers and private original identities before simulation. */
export function captureCowEncounter(act: number, areaId: string, wave: WaveSpec,
  playerTeam: readonly CombatUnit[], enemies: readonly CombatUnit[]): CowEncounter | undefined {
  const heroes = playerTeam.filter(unit => unit.kind === 'hero'), hero = heroes[0];
  const [king, bovine0, bovine1] = enemies;
  const ids = [...playerTeam, ...enemies].map(unit => unit.id);
  if (act !== 1 || areaId !== COW.area || wave.source?.kind !== 'questEncounter' || wave.source.encounterId !== COW.encounter ||
    wave.waveTier !== 'boss' || wave.lootTable !== COW.lootTable || wave.presentation?.isActBoss === true || wave.spawns.length !== 3 ||
    !wave.spawns.every((spawn, index) => spawn.encounterId === COW.encounter && spawn.archetypeId === (index === 0 ? COW.king : COW.bovine) &&
      spawn.tier === (index === 0 ? 'boss' : 'trash') && spawn.level === COW.level && spawn.index === (index === 0 ? 0 : index - 1) &&
      spawn.chapterBoss === undefined && spawn.eliteAffix === undefined) || heroes.length !== 1 || !originalUnit(hero, 'hero') || hero.life <= 0 ||
    enemies.length !== 3 || !king || !bovine0 || !bovine1 || !enemies.every((enemy, index) => originalUnit(enemy, 'monster', index) && enemy.life > 0) ||
    new Set(ids).size !== ids.length) return undefined;
  return Object.freeze({ actId: COW.act, areaId: COW.area, encounterId: COW.encounter, originalHeroId: hero.id,
    originalMemberIds: Object.freeze([king.id, bovine0.id, bovine1.id] as const) });
}
function cowSource(actId: string, areaId: string, encounterId: string): boolean { return actId === COW.act && areaId === COW.area && encounterId === COW.encounter; }
/** All original bodies, unchanged source identities, and a living original hero are required. */
export function hasOriginalCowVictory(encounter: CowEncounter, outcome: { readonly winner: string | null;
  readonly finalPlayerTeam: readonly CombatUnit[]; readonly finalEnemyTeam: readonly CombatUnit[] }): boolean {
  const members: readonly string[] = encounter.originalMemberIds;
  if (outcome.winner !== 'player' || outcome.finalEnemyTeam.length !== 3 || !cowSource(encounter.actId, encounter.areaId, encounter.encounterId) ||
    !Array.isArray(members as unknown) || members.length !== 3 || new Set([encounter.originalHeroId, ...members]).size !== 4) return false;
  const ids = [...outcome.finalPlayerTeam, ...outcome.finalEnemyTeam].map(unit => unit.id);
  if (new Set(ids).size !== ids.length || outcome.finalEnemyTeam.some(unit => unit.id === encounter.originalHeroId) ||
    outcome.finalPlayerTeam.some(unit => encounter.originalMemberIds.includes(unit.id))) return false;
  const heroes = outcome.finalPlayerTeam.filter(unit => unit.kind === 'hero'), hero = heroes[0];
  return heroes.length === 1 && hero?.id === encounter.originalHeroId && originalUnit(hero, 'hero') && hero.life > 0 &&
    encounter.originalMemberIds.every((id, index) => {
      const members = outcome.finalEnemyTeam.filter(unit => unit.id === id), member = members[0];
      return members.length === 1 && originalUnit(member, 'monster', index) && member.life <= 0;
    });
}
