import { describe, expect, it } from 'vitest';
import { monsters } from '@/data/index';
import { createRng } from '../rng';
import { buildMonsterUnit } from '../combat/monster-factory';
import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestProgressData } from '../types/save';
import { captureCouncilEncounter, COUNCIL_AREA_ID, COUNCIL_QUEST_ID,
  hasOriginalCouncilVictory, isCouncilAdmissionEligible } from './council-admission';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Council fixture');
  return value;
}
const wave: WaveSpec = { id: 'generated-runtime-id', waveTier: 'boss',
  source: { kind: 'bossEncounter', encounterId: 'act3-travincal-council' },
  spawns: Array.from({ length: 3 }, (_, index) => ({ archetypeId: 'monsters/act3.infector',
    encounterId: 'act3-travincal-council', tier: 'boss', level: 40, index })) };
const members = wave.spawns.map(spawn => buildMonsterUnit({
  def: required(monsters.find(row => row.id === spawn.archetypeId)), level: spawn.level,
  tier: spawn.tier, index: spawn.index, rng: createRng(4 + spawn.index)
}));
const hero: CombatUnit = { ...required(members[0]), id: 'original-hero', side: 'player', kind: 'hero', life: 9 };
const victory = { winner: 'player', finalPlayerTeam: [hero],
  finalEnemyTeam: members.map(unit => ({ ...unit, life: 0 })) };
const progress: QuestProgressData = { id: COUNCIL_QUEST_ID, status: 'inProgress', rewardClaimed: false,
  objectives: { 'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } };

describe('original complete Council encounter admission', () => {
  it('captures copied frozen original member identities independently of runtime wave names', () => {
    const source = structuredClone(wave);
    const captured = required(captureCouncilEncounter(3, COUNCIL_AREA_ID, source, members));
    expect(hasOriginalCouncilVictory(captured, hero.id, victory)).toBe(true);
    expect(Object.isFrozen(captured)).toBe(true);
    expect(Object.isFrozen(captured.originalMemberIds)).toBe(true);
    Object.assign(source, { source: { kind: 'bossEncounter', encounterId: 'mutated' } });
    expect(captured.encounterId).toBe('act3-travincal-council');
    expect(captured.originalMemberIds).toEqual(members.map(unit => unit.id));
  });

  it.each([
    { source: undefined }, { source: { kind: 'bossEncounter', encounterId: 'lookalike-council' } },
    { source: { kind: 'wave', waveId: 'act3-travincal-council', encounterIds: ['act3-travincal-council'] } },
    { waveTier: 'elite' }, { presentation: { kind: 'boss', isActBoss: true } },
    { spawns: wave.spawns.slice(0, 2) },
    { spawns: wave.spawns.map(spawn => ({ ...spawn, encounterId: 'different' })) },
    { spawns: wave.spawns.map(spawn => ({ ...spawn, archetypeId: 'monsters/missing' })) }
  ])('refuses wrong, missing, transformed or incompatible source metadata %j', patch => {
    expect(captureCouncilEncounter(3, COUNCIL_AREA_ID, { ...wave, ...patch } as WaveSpec, members)).toBeUndefined();
  });

  it('refuses wrong act/area, missing originals, duplicate identities and replacement/summoned input', () => {
    expect(captureCouncilEncounter(2, COUNCIL_AREA_ID, wave, members)).toBeUndefined();
    expect(captureCouncilEncounter(3, 'areas/act3-kurast-bazaar', wave, members)).toBeUndefined();
    expect(captureCouncilEncounter(3, COUNCIL_AREA_ID, wave, members.slice(0, 2))).toBeUndefined();
    const first = required(members[0]);
    for (const patch of [{ id: required(members[1]).id }, { kind: 'summon' as const },
      { monsterArchetypeId: 'monsters/replacement' }, { tier: 'elite' as const }, { life: 0 }]) {
      expect(captureCouncilEncounter(3, COUNCIL_AREA_ID, wave,
        [{ ...first, ...patch }, ...members.slice(1)])).toBeUndefined();
    }
  });

  it('requires a complete original win with the original hero alive, never a sum of matching archetypes', () => {
    const captured = required(captureCouncilEncounter(3, COUNCIL_AREA_ID, wave, members));
    const first = required(victory.finalEnemyTeam[0]);
    for (const finalEnemyTeam of [victory.finalEnemyTeam.slice(1),
      [{ ...first, id: 'replacement-member' }, ...victory.finalEnemyTeam.slice(1)],
      [{ ...first, life: 1 }, ...victory.finalEnemyTeam.slice(1)],
      [{ ...first, kind: 'summon' as const }, ...victory.finalEnemyTeam.slice(1)],
      [{ ...first, monsterArchetypeId: 'monsters/wrong' }, ...victory.finalEnemyTeam.slice(1)],
      [...victory.finalEnemyTeam, first]]) {
      expect(hasOriginalCouncilVictory(captured, hero.id, { ...victory, finalEnemyTeam })).toBe(false);
    }
    for (const patch of [{ winner: 'enemy' }, { winner: 'draw' }, { finalPlayerTeam: [] },
      { finalPlayerTeam: [{ ...hero, life: 0 }] }, { finalPlayerTeam: [{ ...hero, kind: 'merc' as const }] },
      { finalPlayerTeam: [{ ...hero, id: 'replacement-hero' }] }]) {
      expect(hasOriginalCouncilVictory(captured, hero.id, { ...victory, ...patch })).toBe(false);
    }
  });

  it('allows the unordered recovery stage but requires explicit historical mode for claimed rows', () => {
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: progress })).toBe(true);
    const claimed: QuestProgressData = { ...progress, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(Object.keys(progress.objectives).map(id => [id, true])) };
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: claimed })).toBe(false);
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: claimed }, true)).toBe(true);
    expect(isCouncilAdmissionEligible({}, true)).toBe(false);
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: progress }, true)).toBe(false);
    expect(isCouncilAdmissionEligible(Object.create({ [COUNCIL_QUEST_ID]: progress }) as Record<string, QuestProgressData>)).toBe(false);
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: { ...progress, rewardClaimed: true } })).toBe(false);
    expect(isCouncilAdmissionEligible({ [COUNCIL_QUEST_ID]: { ...progress,
      objectives: { 'obj-flail': false } } })).toBe(false);
  });
});
