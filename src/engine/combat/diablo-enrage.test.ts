import Ajv2020 from 'ajv/dist/2020';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import monsterSchema from '../../data/schema/monster.schema.json';
import { shouldEnrage } from '../ai/policy';
import { createRng } from '../rng';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageEffect } from '../skills/effects';
import type { MonsterDef } from '../types/monsters';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });
function definition(): MonsterDef {
  const def = monsters.find(row => row.id === 'monsters/act4.diablo');
  if (!def) throw new Error('Missing native Diablo');
  return def;
}
function fixture(): CombatSnapshot {
  const native = buildMonsterUnit({ def: definition(), level: 40, tier: 'chapter-boss', id: 'enemy', rng: createRng(13) });
  const enemy: CombatUnit = { ...native, life: 150, skillOrder: ['fixture.hit'],
    stats: { ...native.stats, life: 1000, lifeMax: 1000, critChance: 0 } };
  // Explicit synthetic hero; no monster enrage authority is copied into it.
  const hero: CombatUnit = {
    id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 40, tier: 'trash', life: 1_000_000, mana: 0,
    stats: { life: 1_000_000, lifeMax: 1_000_000, mana: 0, manaMax: 0, attack: 0,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    skillOrder: [], cooldowns: {}, activeBuffIds: [], enraged: false
  };
  return { seed: 13, act: 4, enemyTeam: [enemy], playerTeam: [hero] };
}
function install(effect: DamageEffect) {
  registerSkill({ id: 'fixture.hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 1, effects: [effect] });
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
const hits = (out: ReturnType<typeof runBattleRecorded>) => out.events.filter(
  (event): event is Extract<RecordedBattleEvent, { kind: 'damage' }> => event.kind === 'damage' && event.source === 'enemy');
const actionTimes = (out: ReturnType<typeof runBattleRecorded>) => out.events.flatMap(
  event => event.kind === 'action' && event.actor === 'enemy' ? [event.simClockMs] : []);

it('validates optional finite, nonnegative damage tuning and preserves the closed legacy shape', () => {
  const def = definition();
  expect(validate(def)).toBe(true);
  expect(validate({ ...def, enrage: { lifeFraction: .15, attackSpeedMultiplier: 2 } })).toBe(true);
  expect(validate({ ...def, enrage: { lifeFraction: .15, attackSpeedMultiplier: 2, damagePct: 0 } })).toBe(true);
  for (const patch of [{ damagePct: -1 }, { damagePct: NaN }, { damagePct: Infinity },
    { damagePct: '50' }, { damagePct: null }, { lifeFraction: 0 }, { lifeFraction: 1.01 },
    { attackSpeedMultiplier: .99 }, { unknown: 1 }]) {
    expect(validate({ ...def, enrage: { ...def.enrage, ...patch } }), String(Object.keys(patch))).toBe(false);
  }
});

it('admits only living boss tiers at the exact threshold and keeps activation sticky after healing', () => {
  const boss = fixture().enemyTeam[0];
  if (!boss) throw new Error('Missing fixture');
  for (const tier of ['boss', 'chapter-boss'] as const) {
    expect(shouldEnrage({ ...boss, tier }, 4)).toBe(true);
    expect(shouldEnrage({ ...boss, tier, life: 150.01 }, 4)).toBe(false);
    expect(shouldEnrage({ ...boss, tier, life: 0 }, 4)).toBe(false);
    expect(shouldEnrage({ ...boss, tier, life: 1000, enraged: true }, 4)).toBe(true);
  }
  for (const tier of ['trash', 'elite', 'champion'] as const)
    expect(shouldEnrage({ ...boss, tier }, 4)).toBe(false);
  expect(shouldEnrage({ ...boss, enrage: { lifeFraction: .2, attackSpeedMultiplier: 2 }, life: 200 }, 1)).toBe(true);
});

it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
  'adds authored damage before resistance/flat mitigation for %s, excluding thorns', damageType => {
    install({ kind: 'damage', damageType, base: [100, 100], increasedDamagePct: .25, alwaysHits: true });
    const input = fixture();
    const out = record({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, defense: 10, magicResist: 20,
        resistances: { physical: 25, fire: 25, cold: 25, lightning: 25, poison: 25, arcane: 25 } } })) });
    const first = hits(out)[0];
    const flat = ['cold', 'lightning', 'arcane'].includes(damageType) ? 20 : 10;
    expect(first).toMatchObject({ damageType, dodged: false, crit: false,
      amount: Math.floor((damageType === 'thorns' ? 125 : 175) * .75 - flat) });
  }
);

it('reads non-default damage tuning and keeps omitted legacy speed-only tuning damage-neutral', () => {
  install({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true });
  const input = fixture();
  for (const damagePct of [undefined, 0, 17]) {
    const out = record({ ...input, enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy,
      enrage: { lifeFraction: .15, attackSpeedMultiplier: 2, ...(damagePct !== undefined ? { damagePct } : {}) } })) });
    expect(hits(out)[0]?.amount).toBe(100 + (damagePct ?? 0));
    expect(actionTimes(out).slice(0, 2)).toEqual([400, 800]);
  }
});

it('captures boosted landed Burn once without multiplying periodic damage again', () => {
  install({ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true,
    applyStatus: { id: 'ignite', chance: 1, stacksOnApply: 3, durationMs: 3000, dotPctOfDamage: .1 } });
  const input = fixture();
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy,
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 401 }] })) });
  expect(hits(out)).toHaveLength(1);
  expect(hits(out)[0]?.amount).toBe(150);
  const paid = out.events.find(event => event.kind === 'status-state' && event.target === 'hero' &&
    event.statuses.some(status => status.id === 'ignite'));
  if (paid?.kind !== 'status-state') throw new Error('Missing boosted Burn');
  expect(paid.statuses.find(status => status.id === 'ignite')).toMatchObject({
    sourceId: 'enemy', stacks: 3, dotPerStack: 15, appliedAtMs: 400, expiresAtMs: 3400
  });
  expect(out.events.reduce((sum, event) => sum + (event.kind === 'dot' && event.target === 'hero' ? event.amount : 0), 0)).toBe(135);
});

it('leaves already-captured periodic damage unchanged when its source enrages', () => {
  const input = fixture();
  const out = record({ ...input,
    enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy, skillOrder: [],
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] })),
    playerTeam: input.playerTeam.map(hero => ({ ...hero, statuses: [...hero.statuses,
      { id: 'poison', sourceId: 'enemy', stacks: 1, remaining: 3, expiresAtMs: 3000, dotPerStack: 10 }] })) });
  expect(out.events.filter(event => event.kind === 'enrage')).toHaveLength(1);
  expect(out.events.reduce((sum, event) => sum + (event.kind === 'dot' && event.target === 'hero' ? event.amount : 0), 0)).toBe(30);
});

it('does not apply damage, Burn or periodic damage on a missed enraged hit', () => {
  install({ kind: 'damage', damageType: 'fire', base: [100, 100],
    applyStatus: { id: 'ignite', chance: 1, stacksOnApply: 3, durationMs: 3000, dotPctOfDamage: .1 } });
  const input = fixture();
  const out = record({ ...input,
    enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs: 401 }] })),
    playerTeam: input.playerTeam.map(hero => ({ ...hero, stats: { ...hero.stats, magicDodge: 1 } })) });
  expect(hits(out)).toHaveLength(1);
  expect(hits(out)[0]).toMatchObject({ dodged: true, amount: 0 });
  expect(out.events.some(event => event.kind === 'status' && event.statusId === 'ignite' || event.kind === 'dot')).toBe(false);
});

it('preserves pending action progress when periodic damage crosses the chapter threshold', () => {
  const input = fixture();
  const out = record({ ...input,
    enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy, life: 161, skillOrder: [],
      statuses: [{ id: 'ignite', sourceId: 'hero', stacks: 1, remaining: -1, dotPerStack: 10 }] })),
    playerTeam: input.playerTeam.map(hero => ({ ...hero, stats: { ...hero.stats, attackSpeed: 150 } })) });
  expect(actionTimes(out)[0]).toBeCloseTo(1300 + 80 * 400 / 1380, 8);
  expect(out.events.filter(event => event.kind === 'enrage')).toHaveLength(1);
});

it('keeps low-life enrage after healing and combines doubled speed with Chill before clamping', () => {
  registerSkill({ id: 'fixture.heal', archetype: 'fixture', target: 'self', minLevel: 1,
    cooldown: 100, manaCost: 0, effects: [{ kind: 'heal', target: 'self', pctOfMaxLife: 1 }] });
  const input = fixture();
  const out = record({ ...input, enemyTeam: input.enemyTeam.map(enemy => ({ ...enemy,
    skillOrder: ['fixture.heal'], statuses: [{ id: 'chill', sourceId: 'hero', stacks: 1, remaining: -1 }] })) });
  expect(actionTimes(out).slice(0, 3)).toEqual([1380, 2760, 4140]);
  expect(out.result.enemyTeam[0]).toMatchObject({ life: 1000, enraged: true, stats: { attackSpeed: 140 } });
  expect(out.events.filter(event => event.kind === 'enrage')).toHaveLength(1);
});
