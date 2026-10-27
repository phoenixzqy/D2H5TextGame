/** Constructed Countess contracts; original preimplementation RED retained in task evidence. */
import { describe, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createRng } from '@/engine/rng';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import type { WaveSpec } from '@/engine/combat/sub-area-run';
import type { CombatUnit } from '@/engine/combat/types';
import type { QuestActionReceipts, QuestProgressData } from '@/engine/types/save';
import {
  captureCountessEncounter,
  hasCountessCompletion,
  hasOriginalCountessVictory,
  isCountessAdmissionEligible,
} from '@/engine/map/countess-admission';

const QUEST = 'quests/act1-forgotten-tower';
const OBJECTIVE = 'obj-kill-countess';
const AREA = 'areas/act1-dark-wood';
const ENCOUNTER = 'act1-dw-countess';
const ARCHETYPE = 'monsters/act1.the-countess';
const PROOF = `${QUEST}#action:countess-victory`;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Countess admission fixture');
  return value;
}
function row(patch: Partial<QuestProgressData> = {}): QuestProgressData {
  return { id: QUEST, status: 'inProgress', rewardClaimed: false,
    objectives: { [OBJECTIVE]: false }, ...patch };
}
function progress(value: unknown): Readonly<Record<string, QuestProgressData>> {
  return { [QUEST]: value } as Readonly<Record<string, QuestProgressData>>;
}
function receipts(value: unknown): QuestActionReceipts { return value as QuestActionReceipts; }
function wave(): WaveSpec {
  return { id: 'constructed-countess', waveTier: 'boss',
    source: { kind: 'questEncounter', encounterId: ENCOUNTER }, lootTable: 'loot/act1-boss',
    spawns: [{ archetypeId: ARCHETYPE, encounterId: ENCOUNTER, tier: 'boss', level: 13, index: 0 }] };
}
function actors() {
  const countess = { ...buildMonsterUnit({ def: required(monsters.find(monster => monster.id === ARCHETYPE)),
    level: 13, tier: 'boss', rng: createRng(7), id: 'original-countess' }) };
  const { monsterArchetypeId: _archetype, ...heroBase } = countess;
  const hero: CombatUnit = { ...heroBase, id: 'original-hero', side: 'player', kind: 'hero',
    level: 15, life: 7 };
  const merc: CombatUnit = { ...hero, id: 'original-merc', kind: 'merc', life: 1 };
  return { hero, merc, countess };
}
function admitted() {
  const original = actors();
  const encounter = required(captureCountessEncounter(1, AREA, wave(),
    [original.hero, original.merc], [original.countess]));
  return { ...original, encounter,
    outcome: { winner: 'player' as string | null, finalPlayerTeam: [original.hero, original.merc],
      finalEnemyTeam: [{ ...original.countess, life: 0 }] } };
}
function patchUnit(unit: CombatUnit, patch: Record<string, unknown>): CombatUnit {
  return { ...unit, ...patch } as unknown as CombatUnit;
}

// Matrix size is deliberate: absent, false and true legacy flags have different repair/Claim authority.
describe('Countess finite eligibility and completion authority', () => {
  it.each([false, true])('admits tracked unclaimed progress with objective %s and no proof', objective => {
    expect(isCountessAdmissionEligible(progress(row({ objectives: { [OBJECTIVE]: objective } })), {})).toBe(true);
  });

  it.each([
    ['missing', {}], ['false', { [OBJECTIVE]: false }], ['true', { [OBJECTIVE]: true }],
  ] as const)('admits completed legacy %s objective with each canonical claim state', (_label, objectives) => {
    for (const rewardClaimed of [undefined, false, true]) {
      const { rewardClaimed: _claimed, ...completedBase } = row({ status: 'completed', objectives });
      const completed = rewardClaimed === undefined ? completedBase : { ...completedBase, rewardClaimed };
      const before = structuredClone(completed);
      expect(isCountessAdmissionEligible(progress(completed), {})).toBe(true);
      expect(hasCountessCompletion(progress(completed), {})).toBe(false);
      expect(completed).toEqual(before);
    }
  });

  it.each(['inProgress', 'completed'] as const)('own proof disables %s reentry regardless legacy flags', status => {
    for (const objectives of [{}, { [OBJECTIVE]: false }, { [OBJECTIVE]: true }]) {
      expect(isCountessAdmissionEligible(progress(row({ status, objectives })), { [PROOF]: true })).toBe(false);
    }
  });

  it('requires canonical completed status, own true objective and own exact proof together', () => {
    const completed = row({ status: 'completed', objectives: { [OBJECTIVE]: true } });
    expect(hasCountessCompletion(progress(completed), { [PROOF]: true })).toBe(true);
    expect(hasCountessCompletion(progress({ ...completed, rewardClaimed: true }), { [PROOF]: true })).toBe(true);
    expect(hasCountessCompletion(progress(completed), {})).toBe(false);
    expect(hasCountessCompletion(progress(row({ objectives: { [OBJECTIVE]: true } })), { [PROOF]: true })).toBe(false);
    expect(hasCountessCompletion(progress({ ...completed, objectives: {} }), { [PROOF]: true })).toBe(false);
    expect(hasCountessCompletion(progress({ ...completed, objectives: { [OBJECTIVE]: false } }), { [PROOF]: true })).toBe(false);
    expect(hasCountessCompletion(progress(completed), { [`${PROOF}-other`]: true })).toBe(false);
  });

  it.each([
    ['missing', undefined], ['null', null], ['wrong id', row({ id: 'quests/act1-tools-of-the-trade' })],
    ['locked', row({ status: 'locked' })], ['available', row({ status: 'available' })],
    ['claimed active', row({ rewardClaimed: true })],
    ['active missing objective', row({ objectives: {} })],
    ['null objectives', { ...row(), objectives: null }],
    ['array objectives', { ...row(), objectives: [] }],
    ['string flag', { ...row(), objectives: { [OBJECTIVE]: 'true' } }],
    ['undefined flag', { ...row(), objectives: { [OBJECTIVE]: undefined } }],
    ['malformed claim bit', { ...row(), rewardClaimed: 'false' }],
    ['inherited fields', Object.create(row()) as unknown],
    ['inherited objective', { ...row(), objectives: Object.create({ [OBJECTIVE]: true }) as unknown }],
  ] as const)('rejects malformed or ineligible row: %s', (_label, value) => {
    expect(isCountessAdmissionEligible(progress(value), {})).toBe(false);
    expect(hasCountessCompletion(progress(value), { [PROOF]: true })).toBe(false);
  });

  it('does not borrow a different quest row or inherited quest/proof authority', () => {
    const completed = row({ status: 'completed', objectives: { [OBJECTIVE]: true } });
    const inherited = Object.create({ [QUEST]: completed }) as Readonly<Record<string, QuestProgressData>>;
    const wrongRow = { 'quests/act1-tools-of-the-trade': completed };
    for (const value of [inherited, wrongRow]) {
      expect(isCountessAdmissionEligible(value, {})).toBe(false);
      expect(hasCountessCompletion(value, { [PROOF]: true })).toBe(false);
    }
    expect(hasCountessCompletion(progress(completed), receipts(Object.create({ [PROOF]: true })))).toBe(false);
    expect(hasCountessCompletion(progress(completed), receipts({ [PROOF]: false }))).toBe(false);
  });

  it.each([false, undefined, 'true', 1])('refuses malformed own target receipt %j', value => {
    const invalid = receipts({ [PROOF]: value });
    expect(isCountessAdmissionEligible(progress(row()), invalid)).toBe(false);
    expect(hasCountessCompletion(progress(row({ status: 'completed', objectives: { [OBJECTIVE]: true } })), invalid)).toBe(false);
  });

  it('accepts valid null-prototype own records and leaves unrelated records unchanged', () => {
    const objective = Object.assign(Object.create(null), { [OBJECTIVE]: true }) as Record<string, boolean>;
    const completed = Object.assign(Object.create(null), row({ status: 'completed', objectives: objective })) as QuestProgressData;
    const records = Object.assign(Object.create(null), { [QUEST]: completed,
      unrelated: row({ id: 'unrelated' }) }) as Readonly<Record<string, QuestProgressData>>;
    const proof = Object.assign(Object.create(null), { [PROOF]: true, unrelated: true }) as QuestActionReceipts;
    const before = structuredClone({ records, proof });
    expect(hasCountessCompletion(records, proof)).toBe(true);
    expect(isCountessAdmissionEligible(records, proof)).toBe(false);
    expect(records).toEqual(before.records);
    expect(proof).toEqual(before.proof);
  });
});

describe('Countess original actor capture', () => {
  it('captures immutable original hero and enemy identities, independent of caller edits', () => {
    const { hero, countess } = actors();
    const mutableHero = { ...hero }, mutableCountess = { ...countess }, mutableWave = wave();
    const captured = required(captureCountessEncounter(1, AREA, mutableWave, [mutableHero], [mutableCountess]));
    expect(Object.isFrozen(captured)).toBe(true);
    for (const value of Object.values(captured)) {
      if (value !== null && typeof value === 'object') expect(Object.isFrozen(value)).toBe(true);
    }
    mutableHero.id = 'mutated-hero'; mutableCountess.id = 'mutated-countess';
    // Replacing caller-owned metadata after capture cannot rewrite the already captured source.
    Object.assign(mutableWave, { source: { kind: 'wave', waveId: 'wrong', encounterIds: [] }, spawns: [] });
    expect(hasOriginalCountessVictory(captured, { winner: 'player',
      finalPlayerTeam: [hero], finalEnemyTeam: [{ ...countess, life: 0 }] })).toBe(true);
    expect(hasOriginalCountessVictory(captured, { winner: 'player',
      finalPlayerTeam: [mutableHero], finalEnemyTeam: [{ ...mutableCountess, life: 0 }] })).toBe(false);
  });

  it.each([
    ['wrong act', 2, AREA], ['wrong area', 1, 'areas/act1-blood-moor'],
  ] as const)('rejects %s', (_label, act, areaId) => {
    const { hero, countess } = actors();
    expect(captureCountessEncounter(act, areaId, wave(), [hero], [countess])).toBeUndefined();
  });

  it.each([
    ['missing source', { source: undefined }],
    ['ordinary source', { source: { kind: 'wave', waveId: 'constructed-countess', encounterIds: [ENCOUNTER] } }],
    ['boss encounter source', { source: { kind: 'bossEncounter', encounterId: ENCOUNTER } }],
    ['unknown quest source', { source: { kind: 'questEncounter', encounterId: 'other' } }],
    ['elite wave', { waveTier: 'elite' }], ['no spawns', { spawns: [] }],
    ['duplicate spawns', { spawns: [...wave().spawns, ...wave().spawns] }],
    ['chapter presentation', { presentation: { kind: 'boss', isActBoss: true } }],
  ] as const)('rejects source/composition mismatch: %s', (_label, patch) => {
    const { hero, countess } = actors();
    expect(captureCountessEncounter(1, AREA, { ...wave(), ...patch } as unknown as WaveSpec, [hero], [countess])).toBeUndefined();
  });

  it.each([
    ['wrong archetype', { archetypeId: 'monsters/act1.andariel' }],
    ['wrong encounter', { encounterId: 'other' }], ['missing encounter', { encounterId: undefined }],
    ['wrong level', { level: 14 }], ['nonfinite level', { level: Infinity }],
    ['chapter tier', { tier: 'chapter-boss' }], ['wrong index', { index: 1 }],
    ['chapter override', { chapterBoss: { archetypeId: ARCHETYPE } }],
    ['elite override', { eliteAffix: { id: 'constructed' } }],
  ] as const)('rejects malformed spawn: %s', (_label, patch) => {
    const { hero, countess } = actors(), source = wave();
    const changed = { ...source, spawns: [{ ...required(source.spawns[0]), ...patch }] } as unknown as WaveSpec;
    expect(captureCountessEncounter(1, AREA, changed, [hero], [countess])).toBeUndefined();
  });

  it.each([
    ['empty id', { id: '' }], ['wrong side', { side: 'player' }],
    ['summon kind', { kind: 'summon' }], ['summon marker', { summon: true }],
    ['summon owner', { summonOwnerId: 'original-hero' }],
    ['wrong tier', { tier: 'chapter-boss' }], ['wrong archetype', { monsterArchetypeId: 'other' }],
    ['wrong level', { level: 14 }], ['dead', { life: 0 }], ['negative life', { life: -1 }],
    ['nan life', { life: NaN }], ['infinite life', { life: Infinity }],
  ] as const)('rejects malformed original Countess: %s', (_label, patch) => {
    const { hero, countess } = actors();
    expect(captureCountessEncounter(1, AREA, wave(), [hero], [patchUnit(countess, patch)])).toBeUndefined();
  });

  it.each([
    ['empty id', { id: '' }], ['wrong side', { side: 'enemy' }],
    ['merc replacement', { kind: 'merc' }], ['summon replacement', { kind: 'summon' }],
    ['summon marker', { summon: true }], ['dead', { life: 0 }],
    ['nan life', { life: NaN }], ['infinite life', { life: Infinity }],
  ] as const)('rejects malformed original hero: %s', (_label, patch) => {
    const { hero, countess } = actors();
    expect(captureCountessEncounter(1, AREA, wave(), [patchUnit(hero, patch)], [countess])).toBeUndefined();
  });

  it('rejects missing/duplicate originals and hero/enemy identity collisions', () => {
    const { hero, merc, countess } = actors();
    expect(captureCountessEncounter(1, AREA, wave(), [], [countess])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero, hero], [countess])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero, { ...hero, id: 'second-hero' }], [countess])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero, { ...merc, id: hero.id }], [countess])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero], [])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero], [countess, countess])).toBeUndefined();
    expect(captureCountessEncounter(1, AREA, wave(), [hero], [{ ...countess, id: hero.id }])).toBeUndefined();
  });
});

describe('Countess original victory evidence', () => {
  it.each([0, -1])('accepts original dead Countess at life %i with original hero alive', life => {
    const fixture = admitted(), before = structuredClone(fixture.outcome);
    expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome,
      finalEnemyTeam: [{ ...fixture.countess, life }] })).toBe(true);
    expect(fixture.outcome).toEqual(before);
  });

  it.each(['enemy', null, 'draw'])('rejects winner %j despite original death', winner => {
    const fixture = admitted();
    expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome, winner })).toBe(false);
  });

  it.each([
    ['replacement id', { id: 'replacement-countess' }], ['wrong side', { side: 'player' }],
    ['summon kind', { kind: 'summon' }], ['summon marker', { summon: true }],
    ['summon owner', { summonOwnerId: 'original-hero' }],
    ['wrong archetype', { monsterArchetypeId: 'monsters/act1.andariel' }],
    ['wrong tier', { tier: 'trash' }], ['wrong level', { level: 14 }],
    ['still alive', { life: 1 }], ['nan life', { life: NaN }],
    ['negative infinity', { life: -Infinity }],
  ] as const)('rejects final Countess mismatch: %s', (_label, patch) => {
    const fixture = admitted();
    expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome,
      finalEnemyTeam: [patchUnit(required(fixture.outcome.finalEnemyTeam[0]), patch)] })).toBe(false);
  });

  it.each([
    ['replacement id', { id: 'replacement-hero' }], ['enemy side', { side: 'enemy' }],
    ['merc kind', { kind: 'merc' }], ['summon kind', { kind: 'summon' }],
    ['summon marker', { summon: true }], ['dead', { life: 0 }],
    ['negative life', { life: -1 }], ['nan life', { life: NaN }], ['infinite life', { life: Infinity }],
  ] as const)('rejects final original hero mismatch: %s', (_label, patch) => {
    const fixture = admitted();
    expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome,
      finalPlayerTeam: [patchUnit(fixture.hero, patch), fixture.merc] })).toBe(false);
  });

  it('requires each original exactly once; a surviving merc or dead same-archetype replacement is insufficient', () => {
    const fixture = admitted(), dead = required(fixture.outcome.finalEnemyTeam[0]);
    for (const finalEnemyTeam of [[], [dead, dead], [{ ...dead, id: 'replacement' }],
      [{ ...fixture.countess, life: 1 }, { ...dead, id: 'dead-summon', kind: 'summon' as const }]]) {
      expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome, finalEnemyTeam })).toBe(false);
    }
    for (const finalPlayerTeam of [[], [fixture.merc], [fixture.hero, fixture.hero],
      [{ ...fixture.hero, life: 0 }, fixture.merc], [fixture.hero, { ...fixture.merc, id: fixture.hero.id }]]) {
      expect(hasOriginalCountessVictory(fixture.encounter, { ...fixture.outcome, finalPlayerTeam })).toBe(false);
    }
  });

  it('binds fresh retry identities independently from a defeated first capture', () => {
    const first = admitted();
    expect(hasOriginalCountessVictory(first.encounter, { ...first.outcome, winner: 'enemy',
      finalPlayerTeam: [{ ...first.hero, life: 0 }], finalEnemyTeam: [first.countess] })).toBe(false);
    const hero = { ...first.hero, id: 'retry-original-hero' };
    const countess = { ...first.countess, id: 'retry-original-countess' };
    const retry = required(captureCountessEncounter(1, AREA, wave(), [hero], [countess]));
    const win = { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [{ ...countess, life: 0 }] };
    expect(hasOriginalCountessVictory(retry, win)).toBe(true);
    expect(hasOriginalCountessVictory(first.encounter, win)).toBe(false);
    expect(hasOriginalCountessVictory(retry, first.outcome)).toBe(false);
  });
});
