import { describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data/index';
import { createRng } from '../rng';
import { buildMonsterUnit } from '../combat/monster-factory';
import type { WaveSpec } from '../combat/sub-area-run';
import type { CombatUnit } from '../combat/types';
import type { QuestActionReceipts, QuestProgressData } from '../types/save';
import { captureGuardianEncounter, GUARDIAN_ORB_SOURCE, GUARDIAN_QUEST_ID, hasOriginalGuardianVictory,
  isGuardianAdmissionEligible, MEPHISTO_AREA_ID } from './guardian-admission';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing Guardian fixture');
  return value;
}
const boss = required(required(subAreas.find(area => area.id === MEPHISTO_AREA_ID)).chapterBoss);
const wave: WaveSpec = { id: 'generated-id', waveTier: 'boss', presentation: { kind: 'boss', isActBoss: true },
  source: { kind: 'chapterBoss', archetypeId: boss.archetypeId },
  spawns: [{ archetypeId: boss.archetypeId, chapterBoss: boss, tier: 'chapter-boss', level: 47, index: 0 }] };
const original = buildMonsterUnit({ def: required(monsters.find(monster => monster.id === boss.archetypeId)),
  level: 47, tier: 'chapter-boss', rng: createRng(4) });
const hero: CombatUnit = { ...original, id: 'original-hero', side: 'player', kind: 'hero', life: 7 };
const victory = { winner: 'player', finalPlayerTeam: [hero], finalEnemyTeam: [{ ...original, life: 0 }] };
const row: QuestProgressData = { id: GUARDIAN_QUEST_ID, status: 'inProgress', rewardClaimed: false,
  objectives: { 'obj-kill-mephisto': false } };
const receipts: QuestActionReceipts = { [GUARDIAN_ORB_SOURCE]: true };

describe('original canonical Mephisto admission', () => {
  it('captures immutable original identity before simulation, independent of generated wave names', () => {
    const mutable = structuredClone(wave);
    const captured = required(captureGuardianEncounter(3, MEPHISTO_AREA_ID, mutable, [original]));
    expect(Object.isFrozen(captured)).toBe(true);
    expect(captured.originalBossId).toBe(original.id);
    Object.assign(mutable, { source: { kind: 'bossEncounter', encounterId: 'act3-durance-mephisto' } });
    expect(captured.archetypeId).toBe('monsters/act3.mephisto');
    expect(hasOriginalGuardianVictory(captured, hero.id, victory)).toBe(true);
  });

  it.each([
    { source: undefined }, { source: { kind: 'chapterBoss', archetypeId: 'monsters/mephisto' } },
    { source: { kind: 'bossEncounter', encounterId: 'act3-durance-mephisto' } },
    { source: { kind: 'wave', waveId: 'act3-durance-mephisto', encounterIds: ['act3-durance-mephisto'] } },
    { waveTier: 'elite' }, { presentation: undefined }, { spawns: [] },
    { spawns: [...wave.spawns, ...wave.spawns] },
    { spawns: wave.spawns.map(spawn => ({ ...spawn, chapterBoss: undefined })) },
    { spawns: wave.spawns.map(spawn => ({ ...spawn, encounterId: 'act3-durance-mephisto' })) },
    { spawns: wave.spawns.map(spawn => ({ ...spawn, tier: 'boss' })) }
  ])('refuses a synthetic or incompatible source %j', patch => {
    expect(captureGuardianEncounter(3, MEPHISTO_AREA_ID, { ...wave, ...patch } as WaveSpec, [original])).toBeUndefined();
  });

  it('requires correct act, area and a live canonical original chapter boss', () => {
    expect(captureGuardianEncounter(2, MEPHISTO_AREA_ID, wave, [original])).toBeUndefined();
    expect(captureGuardianEncounter(3, 'areas/act3-travincal', wave, [original])).toBeUndefined();
    for (const enemies of [[], [original, original], ...[
      { id: '' }, { monsterArchetypeId: 'monsters/wrong' }, { tier: 'boss' as const },
      { kind: 'summon' as const }, { side: 'player' as const }, { life: 0 }, { life: Infinity }
    ].map(patch => [{ ...original, ...patch }])]) {
      expect(captureGuardianEncounter(3, MEPHISTO_AREA_ID, wave, enemies)).toBeUndefined();
    }
  });

  it('requires the original unique dead canonical boss and living original hero in a player win', () => {
    const captured = required(captureGuardianEncounter(3, MEPHISTO_AREA_ID, wave, [original]));
    const dead = required(victory.finalEnemyTeam[0]);
    for (const finalEnemyTeam of [[], [dead, dead], ...[
      { id: 'replacement' }, { kind: 'summon' as const }, { side: 'player' as const },
      { tier: 'boss' as const }, { monsterArchetypeId: 'monsters/wrong' }, { life: 1 }, { life: NaN }
    ].map(patch => [{ ...dead, ...patch }])]) {
      expect(hasOriginalGuardianVictory(captured, hero.id, { ...victory, finalEnemyTeam })).toBe(false);
    }
    for (const patch of [{ winner: 'enemy' }, { winner: 'draw' }, { finalPlayerTeam: [] },
      { finalPlayerTeam: [hero, hero] }, ...[
        { id: 'replacement' }, { kind: 'merc' as const }, { side: 'enemy' as const }, { life: 0 }, { life: Infinity }
      ].map(change => ({ finalPlayerTeam: [{ ...hero, ...change }] }))]) {
      expect(hasOriginalGuardianVictory(captured, hero.id, { ...victory, ...patch })).toBe(false);
    }
  });

  it('requires own tracked incomplete Guardian and an own true Orb receipt without inferring a graph', () => {
    expect(isGuardianAdmissionEligible({ [GUARDIAN_QUEST_ID]: row }, receipts)).toBe(true);
    const invalid = [undefined, null, Object.create(row) as unknown, { ...row, id: 'wrong' }, { ...row, status: 'available' },
      { ...row, status: 'completed' }, { ...row, rewardClaimed: true }, { ...row, objectives: {} },
      { ...row, objectives: null }, { ...row, objectives: Object.create(row.objectives) as unknown },
      { ...row, objectives: { 'obj-kill-mephisto': true } }];
    for (const candidate of invalid) {
      expect(isGuardianAdmissionEligible({ [GUARDIAN_QUEST_ID]: candidate } as Record<string, QuestProgressData>, receipts)).toBe(false);
    }
    for (const proof of [{}, { [GUARDIAN_ORB_SOURCE]: false }, Object.create(receipts) as unknown,
      { 'quests/act3-khalims-will#action:break-compelling-orb': true }]) {
      expect(isGuardianAdmissionEligible({ [GUARDIAN_QUEST_ID]: row }, proof as QuestActionReceipts)).toBe(false);
    }
    expect(isGuardianAdmissionEligible(Object.create({ [GUARDIAN_QUEST_ID]: row }) as Record<string, QuestProgressData>, receipts)).toBe(false);
  });
});
