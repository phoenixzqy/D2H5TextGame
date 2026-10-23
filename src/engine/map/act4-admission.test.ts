import { describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data/index';
import { createRng } from '../rng';
import { buildMonsterUnit } from '../combat/monster-factory';
import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestProgressData } from '../types/save';
import { ACT4_ENCOUNTERS, captureAct4Encounter, hasOriginalAct4Victory, isAct4AdmissionEligible } from './act4-admission';
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing fixture'); return value; }

describe.each(ACT4_ENCOUNTERS)('Act IV original admission $questId', contract => {
  const chapter = contract.source.kind === 'chapterBoss';
  const boss = required(subAreas.find(area => area.id === contract.areaId)).chapterBoss;
  const wave: WaveSpec = { id: 'generated', waveTier: 'boss', source: contract.source,
    ...(chapter ? { presentation: { kind: 'boss', isActBoss: true } } : {}),
    spawns: contract.members.map((archetypeId, index) => ({ archetypeId, index, level: 61,
      tier: chapter ? 'chapter-boss' : 'boss', ...(chapter ? { chapterBoss: required(boss) }
        : { encounterId: contract.source.encounterId }) })) };
  const originals = contract.members.map((archetypeId, index) => ({ ...buildMonsterUnit({
    def: required(monsters.find(monster => monster.id === archetypeId)), level: 61,
    tier: chapter ? 'chapter-boss' : 'boss', rng: createRng(4 + index) }), id: `original-${String(index)}` }));
  const hero: CombatUnit = { ...required(originals[0]), id: 'hero', side: 'player', kind: 'hero', life: 7 };
  const victory = { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: originals.map(unit => ({ ...unit, life: 0 })) };
  const objectives: Record<string, boolean> = Object.fromEntries<boolean>([...contract.prerequisites.map(id => [id, true] as const), [contract.objectiveId, false] as const,
    ...(contract.questId === 'quests/act4-hellforge' ? [['obj-shatter', false] as const] : [])]);
  const row: QuestProgressData = { id: contract.questId, status: 'inProgress', objectives };
  it('copies exact canonical source and all original member identities', () => {
    const captured = required(captureAct4Encounter(4, contract.areaId, wave, originals));
    expect(Object.isFrozen(captured)).toBe(true); expect(Object.isFrozen(captured.originalMemberIds)).toBe(true);
    expect(hasOriginalAct4Victory(captured, hero.id, victory)).toBe(true);
  });
  it('rejects wrong act/area/tier, synthetic source, partial, duplicate and malformed originals', () => {
    expect(captureAct4Encounter(3, contract.areaId, wave, originals)).toBeUndefined();
    expect(captureAct4Encounter(4, 'areas/act4-outer-steppes', wave, originals)).toBeUndefined();
    for (const patch of [{ source: undefined }, { waveTier: 'elite' }, { spawns: [] },
      { source: { kind: 'bossEncounter', encounterId: 'synthetic' } },
      { source: { kind: 'chapterBoss', archetypeId: 'monsters/diablo' } },
      { source: { kind: 'wave', waveId: 'generated', encounterIds: [] } }]) {
      expect(captureAct4Encounter(4, contract.areaId, { ...wave, ...patch } as WaveSpec, originals)).toBeUndefined();
    }
    for (const patch of [{ id: '' }, { kind: 'summon' }, { side: 'player' }, { tier: 'trash' },
      { monsterArchetypeId: 'monsters/wrong' }, { life: 0 }, { life: Infinity }]) {
      expect(captureAct4Encounter(4, contract.areaId, wave,
        originals.map((unit, index) => index ? unit : { ...unit, ...patch }) as CombatUnit[])).toBeUndefined();
    }
    expect(captureAct4Encounter(4, contract.areaId, wave, originals.slice(1))).toBeUndefined();
    expect(captureAct4Encounter(4, contract.areaId, wave, [...originals, required(originals[0])])).toBeUndefined();
  });
  it('requires all original dead members and original living hero in the actual win', () => {
    const captured = required(captureAct4Encounter(4, contract.areaId, wave, originals));
    for (const patch of [{ id: 'replacement' }, { kind: 'summon' }, { side: 'player' }, { tier: 'trash' },
      { monsterArchetypeId: 'monsters/wrong' }, { life: 1 }, { life: NaN }]) {
      expect(hasOriginalAct4Victory(captured, hero.id, { ...victory,
        finalEnemyTeam: victory.finalEnemyTeam.map((unit, index) => index ? unit : { ...unit, ...patch }) as CombatUnit[] })).toBe(false);
    }
    for (const finalEnemyTeam of [[], victory.finalEnemyTeam.slice(1), [...victory.finalEnemyTeam, required(victory.finalEnemyTeam[0])]]) {
      expect(hasOriginalAct4Victory(captured, hero.id, { ...victory, finalEnemyTeam })).toBe(false);
    }
    for (const winner of ['enemy', null]) expect(hasOriginalAct4Victory(captured, hero.id, { ...victory, winner })).toBe(false);
    for (const finalPlayerTeam of [[], [hero, hero], [{ ...hero, life: 0 }], [{ ...hero, id: 'replacement' }]]) {
      expect(hasOriginalAct4Victory(captured, hero.id, { ...victory, finalPlayerTeam })).toBe(false);
    }
  });
  it('accepts tracked pre-event progress and new victory for completed unclaimed history only', () => {
    expect(isAct4AdmissionEligible(contract, { [contract.questId]: row })).toBe(true);
    const completed = { ...row, status: 'completed' as const, objectives: Object.fromEntries<boolean>(Object.keys(objectives).map(id => [id, true])) };
    expect(isAct4AdmissionEligible(contract, { [contract.questId]: completed })).toBe(true);
    for (const bad of [null, undefined, Object.create(row) as unknown, { ...row, id: 'wrong' }, { ...row, status: 'available' },
      { ...row, rewardClaimed: true }, { ...row, objectives: {} }, { ...row, objectives: null },
      { ...row, objectives: Object.create(objectives) as unknown }]) {
      expect(isAct4AdmissionEligible(contract, { [contract.questId]: bad } as Record<string, QuestProgressData>)).toBe(false);
    }
    for (const id of contract.prerequisites) expect(isAct4AdmissionEligible(contract,
      { [contract.questId]: { ...row, objectives: { ...objectives, [id]: false } } })).toBe(false);
  });
});
