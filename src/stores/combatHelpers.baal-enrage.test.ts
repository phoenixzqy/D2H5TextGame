import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters, subAreas } from '../data';
import { shouldEnrage } from '../engine/ai/policy';
import { createRng } from '../engine/rng';
import { buildMonsterUnit } from '../engine/combat/monster-factory';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '../engine/combat/combat';
import { resolveChallengeWavePlan } from '../engine/combat/sub-area-run';
import type { CombatUnit } from '../engine/combat/types';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../engine/skills/registry';
import { buildEnemiesForWave } from './combatHelpers';
import i18n from '../i18n';
import { eventToLocalizedLogEntry } from './eventToLogI18n';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Diagnostic controls, not earned campaign characters or balance evidence.
function fixture(mode: 'manual' | 'idle', fraction: number): CombatSnapshot {
  const area = subAreas.find(row => row.id === 'areas/act5-throne-of-destruction');
  if (!area) throw new Error('Missing native Throne of Destruction');
  const plan = resolveChallengeWavePlan({ subArea: area, mode, seed: 13,
    challengeOrdinal: 450, fallbackArchetypeId: 'monsters/act5.baal', fallbackLevel: area.areaLevel });
  const wave = plan.waves.find(row => row.source?.kind === 'chapterBoss');
  if (!wave) throw new Error('Missing native chapter boss');
  expect(wave.source).toEqual({ kind: 'chapterBoss', archetypeId: 'monsters/act5.baal' });
  const boss = buildEnemiesForWave(wave, 13)[0];
  if (!boss) throw new Error('Missing native Baal');
  const hero: CombatUnit = {
    id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 40, tier: 'trash',
    life: 1_000_000, mana: 0, gridPosition: { row: 0, col: 2 },
    stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 0, manaMax: 0,
      attack: 0, defense: 0, magicResist: 0, attackSpeed: 100,
      critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false
  };
  return { seed: 13, act: 5, enemyTeam: [{ ...boss, life: boss.stats.lifeMax * fraction }], playerTeam: [hero] };
}

function actions(out: ReturnType<typeof runBattleRecorded>, id: string) {
  return out.events.flatMap(event => event.kind === 'action' && event.actor === id ? [event.simClockMs] : []);
}

it.each(['manual', 'idle'] as const)('native %s Baal gains authored speed and damage at exactly 20%% Life', async mode => {
  const input = fixture(mode, .2), before = structuredClone(input), boss = input.enemyTeam[0];
  if (!boss) throw new Error('Missing native Baal');
  expect(boss.enrage).toEqual({ lifeFraction: .2, attackSpeedMultiplier: 2.5, damagePct: 100 });
  expect(Object.isFrozen(boss.enrage)).toBe(true);
  expect(boss).toMatchObject({ tier: 'chapter-boss', monsterArchetypeId: 'monsters/act5.baal',
    stats: { lifeMax: 57600, attack: 520, defense: 560, attackSpeed: 150 } });
  const out = runBattleRecorded(input);
  const rage = out.events.filter(event => event.kind === 'enrage');
  expect(rage).toHaveLength(1);
  expect(rage[0]).toMatchObject({ target: boss.id, simClockMs: 0 });
  // AS375 reaches the existing global 400ms period floor; base AS stays150.
  expect(actions(out, boss.id).slice(0, 4)).toEqual([400, 800, 1200, 1600]);
  const normal = runBattleRecorded(fixture(mode, .2001));
  let landed = 0;
  for (const type of ['cold', 'fire', 'arcane'] as const) {
    const hit = out.events.find(event => event.kind === 'damage' && event.source === boss.id && event.damageType === type);
    const control = normal.events.find(event => event.kind === 'damage' && event.source === boss.id && event.damageType === type);
    if (hit?.kind !== 'damage' || control?.kind !== 'damage') throw new Error('Missing native elemental impact');
    expect(hit.dodged).toBe(control.dodged);
    if (hit.dodged) { expect(hit.amount).toBe(0); expect(control.amount).toBe(0); continue; }
    landed++;
    expect(hit.crit).toBe(control.crit);
    // Same seed and first three native spells: twice the raw damage before integer flooring.
    expect(hit.amount).toBeGreaterThanOrEqual(control.amount * 2);
    expect(hit.amount).toBeLessThanOrEqual(control.amount * 2 + 1);
  }
  expect(landed).toBeGreaterThan(0);
  const prior = i18n.language;
  try {
    for (const [locale, name, message] of [['en', 'Baal', 'Baal becomes enraged!'], ['zh-CN', '巴尔', '巴尔陷入狂怒！']] as const) {
      await i18n.changeLanguage(locale);
      const event = rage[0]; if (!event) throw new Error('Missing feedback');
      expect(eventToLocalizedLogEntry(event, new Map([[boss.id, name]])))
        .toMatchObject({ type: 'buff', actorId: boss.id, message });
    }
  } finally { await i18n.changeLanguage(prior); }
  expect(out.result.enemyTeam[0]).toMatchObject({ enraged: true, stats: boss.stats });
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
});

it('keeps ordinary cadence and damage immediately above 20% without mutating native tuning', () => {
  const input = fixture('manual', .2001), before = structuredClone(input), boss = input.enemyTeam[0];
  if (!boss) throw new Error('Missing boss');
  const out = runBattleRecorded(input);
  expect(out.events.some(event => event.kind === 'enrage')).toBe(false);
  expect(actions(out, boss.id).slice(0, 4)).toEqual([1300, 2600, 3900, 5200]);
  expect(out.result.enemyTeam[0]?.enraged).toBe(false);
  expect(input).toEqual(before);
});

it('gives ordinary and chapter Baal the same immutable rule without granting it to trash or dead bosses', () => {
  const def = monsters.find(row => row.id === 'monsters/act5.baal');
  if (!def) throw new Error('Missing native Baal');
  const before = structuredClone(def);
  for (const tier of ['boss', 'chapter-boss'] as const) {
    const boss = buildMonsterUnit({ def, level: 75, tier, id: 'enemy', rng: createRng(13) });
    expect(boss.enrage).toEqual({ lifeFraction: .2, attackSpeedMultiplier: 2.5, damagePct: 100 });
    expect(Object.isFrozen(boss.enrage)).toBe(true);
    expect(boss.enrage).not.toBe(def.enrage);
    expect(shouldEnrage({ ...boss, life: boss.stats.lifeMax * .2 }, 5)).toBe(true);
    expect(shouldEnrage({ ...boss, life: boss.stats.lifeMax * .2001 }, 5)).toBe(false);
    expect(shouldEnrage({ ...boss, enrage: undefined, life: boss.stats.lifeMax * .2 }, 5)).toBe(true);
    expect(shouldEnrage({ ...boss, life: 0 }, 5)).toBe(false);
    expect(shouldEnrage({ ...boss, life: 1, tier: 'trash' }, 5)).toBe(false);
  }
  expect(def).toEqual(before);
});

it('preserves pending action progress when periodic damage crosses the native 20% boundary', () => {
  const base = fixture('manual', .2), boss = base.enemyTeam[0];
  if (!boss) throw new Error('Missing native boss');
  const input: CombatSnapshot = { ...base,
    enemyTeam: [{ ...boss, life: boss.life + 11, skillOrder: [],
      statuses: [{ id: 'ignite', sourceId: 'hero', stacks: 1, remaining: -1, dotPerStack: 10 }] }],
    playerTeam: base.playerTeam.map(hero => ({ ...hero, stats: { ...hero.stats, attackSpeed: 160 } })) };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(out.events.filter(event => event.kind === 'enrage')).toEqual([
    expect.objectContaining({ target: boss.id, simClockMs: 1220 })
  ]);
  expect(actions(out, boss.id)[0]).toBeCloseTo(1220 + 80 * 400 / 1300, 8);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
});

it('retains native enrage after healing above its activation threshold', () => {
  registerSkill({ id: 'fixture.heal', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 100, manaCost: 0, effects: [{ kind: 'heal', target: 'self', pctOfMaxLife: 1 }] });
  const base = fixture('manual', .2), boss = base.enemyTeam[0];
  if (!boss) throw new Error('Missing native boss');
  const input: CombatSnapshot = { ...base, enemyTeam: [{ ...boss, skillOrder: ['fixture.heal'] }] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(actions(out, boss.id).slice(0, 4)).toEqual([400, 800, 1200, 1600]);
  expect(out.events.filter(event => event.kind === 'enrage')).toHaveLength(1);
  expect(out.result.enemyTeam[0]).toMatchObject({ life: 57600, enraged: true, stats: boss.stats });
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
});
