import { afterEach, beforeEach, expect, it } from 'vitest';
import { subAreas } from '../data';
import { loadGameData, validateGameData } from '../data/loader';
import monsterSchema from '../data/schema/monster.schema.json';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import { applyEventToTeams } from './combatPlayback';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

const chapters = [
  { areaId: 'areas/act1-catacombs', archetypeId: 'monsters/act1.andariel', act: 1,
    stats: { lifeMax: 1200, attack: 90, defense: 40, attackSpeed: 110 } },
  { areaId: 'areas/act3-durance-of-hate', archetypeId: 'monsters/act3.mephisto', act: 3,
    stats: { lifeMax: 33600, attack: 300, defense: 360, attackSpeed: 120 } }
] as const;
type Chapter = typeof chapters[number];

async function nativeChapter(chapter: Chapter, mode: 'manual' | 'idle') {
  const data = await loadGameData();
  const area = subAreas.find(row => row.id === chapter.areaId);
  if (!area) throw new Error('Missing native boss area');
  expect(data.subAreas.get(area.id)).toEqual(area);
  const wave = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: chapter.archetypeId,
    fallbackLevel: area.areaLevel }).waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native boss wave');
  const waveBefore = structuredClone(wave);
  const enemies = buildEnemiesForWave(wave, 13);
  const boss = enemies[0];
  if (!boss) throw new Error('Missing native boss');
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: chapter.archetypeId });
  expect(enemies).toHaveLength(1);
  expect(boss.monsterArchetypeId).toBe(chapter.archetypeId);
  expect(boss.stats).toMatchObject(chapter.stats);
  expect(data.monsters.get(chapter.archetypeId)?.statusImmunities).toEqual(['poison', 'plague']);
  expect(boss.statusImmunities).toEqual(['poison', 'plague']);
  expect(data.monsters.get(chapter.archetypeId)?.damageImmunities).toEqual(['poison']);
  expect(boss.damageImmunities).toEqual(['poison']);
  expect(Object.isFrozen(boss.damageImmunities)).toBe(true);
  expect(Object.isFrozen(boss.statusImmunities)).toBe(true);
  expect(wave).toEqual(waveBefore);
  expect(buildEnemiesForWave(wave, 13)).toEqual(enemies);
  return { data, boss, enemies };
}

// Durable diagnostic caster, not an earned build or balance fixture.
function hero(skill: string): CombatUnit {
  return {
    id: 'hero', name: 'hero', kind: 'hero', side: 'player', tier: 'trash', level: 40,
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100,
      attack: 40, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [], cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: skill ? [skill] : [], skillLevels: skill ? { [skill]: 1 } : {}
  };
}

function assertNoPoison(recorded: ReturnType<typeof runBattleRecorded>, target: string) {
  expect(recorded.events.filter(event => event.kind === 'status' && event.target === target &&
    (event.statusId === 'poison' || event.statusId === 'plague'))).toEqual([]);
  expect(recorded.events.flatMap(event => event.kind === 'status-state' && event.target === target
    ? event.statuses.filter(status => status.id === 'poison' || status.id === 'plague') : [])).toEqual([]);
  expect(recorded.events.filter(event => event.kind === 'dot' && event.target === target)).toEqual([]);
  expect(recorded.result.enemyTeam.find(unit => unit.id === target)?.statuses
    .filter(status => status.id === 'poison' || status.id === 'plague')).toEqual([]);
}

for (const chapter of chapters) for (const mode of ['manual', 'idle'] as const) {
  it.each(['skills-necromancer-poison-nova', 'skills-amazon-plague-javelin'])(
    `${chapter.archetypeId} native ${mode} rejects poison damage/statuses from %s after a landed carrier`, async skill => {
      const { boss, enemies } = await nativeChapter(chapter, mode);
      const input: CombatSnapshot = { seed: 13, act: chapter.act, maxRounds: 4,
        playerTeam: [hero(skill)], enemyTeam: enemies };
      const before = structuredClone(input), recorded = runBattleRecorded(input);
      const poisonHits = recorded.events.flatMap(event => event.kind === 'damage' && event.source === 'hero' &&
        event.target === boss.id && event.damageType === 'poison' && !event.dodged ? [event] : []);
      expect(poisonHits.length).toBeGreaterThan(0);
      expect(poisonHits.every(event => event.amount === 0)).toBe(true);
      assertNoPoison(recorded, boss.id);
      let teams = { playerTeam: input.playerTeam, enemyTeam: input.enemyTeam };
      for (const event of recorded.events) {
        const previousLife = teams.enemyTeam.find(unit => unit.id === boss.id)?.life;
        teams = applyEventToTeams(teams.playerTeam, teams.enemyTeam, event);
        if (event.kind === 'damage' && event.target === boss.id && event.damageType === 'poison') {
          expect(teams.enemyTeam.find(unit => unit.id === boss.id)?.life).toBe(previousLife);
        }
      }
      expect(teams.enemyTeam.find(unit => unit.id === boss.id)?.life)
        .toBe(recorded.result.enemyTeam.find(unit => unit.id === boss.id)?.life);
      expect(input).toEqual(before);
      expect(runBattle(input)).toEqual(recorded.result);
      expect(runBattleRecorded(input)).toEqual(recorded);
      // Remove only immunity on a diagnostic clone to prove the native payload
      // really applies; this clone is not a native encounter acceptance result.
      const { statusImmunities: omitted, damageImmunities: omittedDamage, ...susceptible } = boss;
      expect(omitted).toEqual(['poison', 'plague']);
      expect(omittedDamage).toEqual(['poison']);
      const control = runBattleRecorded({ ...input, enemyTeam: [susceptible] });
      expect(control.events.some(event => event.kind === 'damage' && event.source === 'hero' &&
        event.target === boss.id && event.damageType === 'poison' && !event.dodged && event.amount > 0)).toBe(true);
      for (const statusId of skill === 'skills-amazon-plague-javelin' ? ['poison', 'plague'] : ['poison']) {
        expect(control.events.some(event => event.kind === 'status-state' && event.target === boss.id &&
          event.statuses.some(status => status.id === statusId))).toBe(true);
      }
    }
  );

  it(`${chapter.archetypeId} native ${mode} rejects Venom without logging poison success`, async () => {
    const { boss, enemies } = await nativeChapter(chapter, mode);
    const input: CombatSnapshot = { seed: 13, act: chapter.act, maxRounds: 4,
      playerTeam: [hero('')], enemyTeam: enemies, assassinVenom: { sourceHeroId: 'hero', rank: 1 } };
    const before = structuredClone(input), recorded = runBattleRecorded(input);
    expect(recorded.events.some(event => event.kind === 'damage' && event.source === 'hero' &&
      event.target === boss.id && event.damageType === 'physical' && !event.dodged && event.amount > 0)).toBe(true);
    assertNoPoison(recorded, boss.id);
    const { statusImmunities: omitted, damageImmunities: omittedDamage, ...susceptible } = boss;
    expect(omitted).toEqual(['poison', 'plague']);
    expect(omittedDamage).toEqual(['poison']);
    const control = runBattleRecorded({ ...input, enemyTeam: [susceptible] });
    expect(control.events.some(event => event.kind === 'status' && event.target === boss.id &&
      event.statusId === 'poison')).toBe(true);
    expect(control.events.some(event => event.kind === 'dot' && event.target === boss.id && event.amount > 0)).toBe(true);
    expect(input).toEqual(before);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(runBattleRecorded(input)).toEqual(recorded);
  });

  it(`${chapter.archetypeId} native ${mode} refuses poison death spread while a susceptible ally receives it`, async () => {
    const { boss } = await nativeChapter(chapter, mode);
    const doomed: CombatUnit = { ...hero(''), id: 'doomed', name: 'doomed', side: 'enemy', kind: 'monster', life: 1,
      statuses: [{ id: 'poison', sourceId: 'hero', stacks: 4, remaining: 5,
        appliedAtMs: 0, expiresAtMs: 5000, dotPerStack: 2, damageType: 'poison' }] };
    const recipient: CombatUnit = { ...hero(''), id: 'recipient', name: 'recipient', side: 'enemy', kind: 'monster' };
    const input: CombatSnapshot = { seed: 13, act: chapter.act, maxRounds: 4,
      playerTeam: [hero('')], enemyTeam: [doomed, boss, recipient] };
    const before = structuredClone(input), recorded = runBattleRecorded(input);
    expect(recorded.events.some(event => event.kind === 'death' && event.target === doomed.id)).toBe(true);
    assertNoPoison(recorded, boss.id);
    expect(recorded.events.some(event => event.kind === 'status-state' && event.target === recipient.id &&
      event.statuses.some(status => status.id === 'poison' && status.stacks === 2 &&
        status.dotPerStack === 2 && status.sourceId === doomed.id && status.damageType === 'poison'))).toBe(true);
    expect(recorded.events.some(event => event.kind === 'dot' && event.target === recipient.id && event.amount > 0)).toBe(true);
    expect(input).toEqual(before);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(runBattleRecorded(input)).toEqual(recorded);
  });
}

it('validates explicit poison/plague immunity and rejects malformed status metadata', async () => {
  const data = await loadGameData(), boss = data.monsters.get(chapters[0].archetypeId);
  if (!boss) throw new Error('Missing native Andariel');
  expect(() => validateGameData(monsterSchema.$id,
    { ...boss, statusImmunities: ['poison', 'plague'] })).not.toThrow();
  for (const invalid of ['poison', ['Poison'], ['poison', 'poison'], [100], ['unknown']]) {
    expect(() => validateGameData(monsterSchema.$id, { ...boss, statusImmunities: invalid })).toThrow();
  }
});

it('validates explicit typed damage immunity and rejects malformed, duplicate or unknown metadata', async () => {
  const data = await loadGameData(), boss = data.monsters.get(chapters[0].archetypeId);
  if (!boss) throw new Error('Missing native Andariel');
  for (const damageImmunities of [[], ['poison'], ['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns']]) {
    expect(() => validateGameData(monsterSchema.$id, { ...boss, damageImmunities })).not.toThrow();
  }
  for (const damageImmunities of [null, 'poison', ['Poison'], ['poison', 'poison'], [100], ['unknown']]) {
    expect(() => validateGameData(monsterSchema.$id, { ...boss, damageImmunities })).toThrow();
  }
});
