import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { monsters, subAreas } from '../../data';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from './sub-area-run';
import type { CombatUnit, MonsterTier } from './types';

const CASTERS = ['monsters/act1.bishibosh', 'monsters/act1.bone-ash',
  'monsters/act2.dark-elder', 'monsters/act2.the-summoner', 'monsters/act3.mephisto',
  'monsters/act4.diablo', 'monsters/act5.baal'] as const;
const RAVEN = 'monsters/act1.blood-raven';
const STUN = { id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 } as const;
const BURN = { id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 } as const;
function definition(id: string) {
  const row = monsters.find(row => row.id === id);
  if (!row) throw new Error('Missing native boss ' + id);
  return row;
}
function build(id: string, level = 12, tier: MonsterTier = 'boss') {
  return buildMonsterUnit({ def: definition(id), id: 'enemy', level, tier, rng: createRng(7) });
}
function input(enemy: CombatUnit): CombatSnapshot {
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 1_000_000, mana: 0, skillOrder: [], statuses: [STUN],
    stats: { ...enemy.stats, life: 1_000_000, lifeMax: 1_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out);
  return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(CASTERS)('boss caster numeric %s', id => {
  it('uses the literal low-melee curve and preserves nonattack construction and RNG', () => {
    const def = definition(id);
    expect(def).toMatchObject({ attack: [13, 13], attackGrowth: [2, 2], canBeElite: false, canBeBoss: true });
    expect([[1, 'boss'], [12, 'boss'], [90, 'boss'], [12, 'trash'], [17, 'elite']].map(([level, tier]) =>
      build(id, level as number, tier as MonsterTier).attackRange)).toEqual([[21, 21], [56, 56], [306, 306], [35, 35], [59, 59]]);
    const legacy = { ...def };
    Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
    const a = createRng(7), b = createRng(7);
    const current = buildMonsterUnit({ def, level: 12, tier: 'boss', rng: a });
    const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'boss', rng: b });
    expect(current.stats.attack).toBe(56); expect(old.stats.attack).toBe(139);
    expect(current.basicAttackDelivery).toBe('melee');
    const normalized = { ...current, stats: { ...current.stats, attack: old.stats.attack } };
    for (const unit of [normalized, old]) {
      Reflect.deleteProperty(unit, 'attackRange'); Reflect.deleteProperty(unit, 'basicAttackDelivery');
    }
    expect(normalized).toEqual(old); expect(a.next()).toBe(b.next());
  });
  it('exposes actual ordinary56 under native ManaBurn and replays immutably', () => {
    const out = record(input({ ...build(id), statuses: [BURN] }));
    const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && !e.crit);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.kind === 'damage' && e.damageType === 'physical' && e.amount === 56)).toBe(true);
  });
  it('preserves base spell coverage or finite-cap fallback independently of the scalar', () => {
    const enemy = build(id), snapshot = input(enemy), out = record(snapshot);
    const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'enemy' && e.simClockMs > 0);
    expect(actions.length).toBeGreaterThan(0);
    const hasOrdinary = actions.some(e => e.kind === 'action' && e.skillId === null);
    expect(hasOrdinary).toBe(id === 'monsters/act1.bone-ash');
    const old: CombatUnit = { ...enemy, stats: { ...enemy.stats, attack: 139 } };
    Reflect.deleteProperty(old, 'attackRange');
    const previous = runBattleRecorded({ ...snapshot, enemyTeam: [old] });
    if (hasOrdinary) {
      expect(out.events.some(e => e.kind === 'summon' && e.owner === 'enemy')).toBe(true);
      const current = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'physical' && !e.dodged && !e.crit);
      expect(current.length).toBeGreaterThan(0);
      expect(current.every(e => e.kind === 'damage' && e.amount === 56)).toBe(true);
      expect(out.events).not.toEqual(previous.events);
    } else expect(out.events).toEqual(previous.events);
  });
});

it('authors Blood Raven compatibility without replacing the calibrated explicit basic', () => {
  expect(definition(RAVEN)).toMatchObject({ attack: [32, 32], attackGrowth: [5, 5],
    basicAttack: { damage: [30, 50], damageType: 'physical' } });
  expect([1, 12, 90].map(level => build(RAVEN, level).stats.attack)).toEqual([51, 139, 763]);
  const enemy = build(RAVEN), snapshot = input(enemy), out = record(snapshot);
  const old = { ...enemy }; Reflect.deleteProperty(old, 'attackRange');
  expect(runBattleRecorded({ ...snapshot, enemyTeam: [old] }).events).toEqual(out.events);
  expect(enemy.basicAttackDelivery).toBe('ranged');
  // ManaBurn suppresses Fire Arrow's Ignite and its existing physical combo.
  const muted = record(input({ ...enemy, statuses: [BURN] }));
  const hits = muted.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'physical' && !e.dodged && !e.crit);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every(e => e.kind === 'damage' && e.amount >= 30 && e.amount <= 50)).toBe(true);
});

it.each([
  ['areas/act1-catacombs', 90, 150, 40, 'monster-poison-cloud'],
  ['areas/act2-tomb-of-tal-rasha', 350, 3200, 280, 'monster-charge'],
  ['areas/act3-durance-of-hate', 300, 4200, 360, 'monster-lightning'],
  ['areas/act4-chaos-sanctuary', 420, 5600, 460, 'monster-inferno'],
  ['areas/act5-throne-of-destruction', 520, 7200, 560, 'monster-tentacles']
] as const)('keeps %s actual chapter source/stat/order authority', (id, attack, hp, defense, skill) => {
  const area = subAreas.find(row => row.id === id); if (!area) throw new Error('Missing chapter area');
  const before = structuredClone(area), plan = resolveChallengeWavePlan({ subArea: area,
    fallbackArchetypeId: area.chapterBoss?.archetypeId ?? '', fallbackLevel: area.areaLevel, seed: 7, challengeOrdinal: 0 });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave || wave.spawns.length !== 1) throw new Error('Missing native singleton chapter wave');
  const spawn = wave.spawns[0]; if (!spawn?.chapterBoss) throw new Error('Missing native chapter payload');
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: area.chapterBoss?.archetypeId });
  expect([spawn.archetypeId, spawn.tier]).toEqual([area.chapterBoss?.archetypeId, 'chapter-boss']);
  const boss = spawn.chapterBoss;
  expect(boss).toMatchObject({ atk: attack, hp, def: defense, skills: [skill] });
  const enemy = buildMonsterUnit({ def: definition(spawn.archetypeId), id: 'enemy',
    level: spawn.level, tier: spawn.tier, rng: createRng(7), skillOrderOverride: boss.skills,
    statOverrides: { attack: boss.atk, lifeMax: boss.hp * DEFAULT_ELITE_CONFIG.chapterBossHpMultiplier,
      defense: boss.def, ...(boss.magicResist !== undefined ? { magicResist: boss.magicResist } : {}) } });
  expect(enemy.stats).toMatchObject({ attack, defense, lifeMax: hp * DEFAULT_ELITE_CONFIG.chapterBossHpMultiplier });
  expect(enemy.skillOrder).toEqual([skill]);
  expect(enemy.attackRange).toEqual([attack, attack]);
  const out = record(input({ ...enemy, statuses: [BURN] }));
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && !e.dodged && !e.crit);
  expect(hits.length).toBeGreaterThan(0);
  if (id === 'areas/act2-tomb-of-tal-rasha') {
    const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'enemy');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
    const physical = hits.filter(e => e.kind === 'damage' && e.damageType === 'physical');
    expect(physical.some(e => e.kind === 'damage' && e.amount === 350)).toBe(true);
    expect(physical.some(e => e.kind === 'damage' && e.amount === 367)).toBe(true);
    for (const hit of physical) {
      // The copied tank retains boss tier: Chill adds 5% physical damage taken.
      const chilled = hit.simClockMs >= 5000 && hit.simClockMs % 5000 < 2000;
      expect(hit.kind === 'damage' && hit.amount).toBe(chilled ? 367 : 350);
    }
    const pulses = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'cold');
    expect(pulses).toHaveLength(12);
    for (const [i, pulse] of pulses.entries()) expect(pulse).toMatchObject({
      target: 'hero', damageType: 'cold', amount: 15, simClockMs: (i + 1) * 5000, dodged: false, crit: false
    });
    expect(hits).toHaveLength(physical.length + pulses.length);
    expect(out.events.filter(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'chill')
      .map(e => e.simClockMs)).toEqual(Array.from({ length: 12 }, (_, i) => (i + 1) * 5000));
  } else {
    expect(hits.every(e => e.kind === 'damage' && e.damageType === 'physical' && e.amount === attack)).toBe(true);
  }
  expect(area).toEqual(before);
});
