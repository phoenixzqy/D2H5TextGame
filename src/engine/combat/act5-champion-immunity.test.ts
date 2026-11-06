import Ajv2020 from 'ajv/dist/2020';
import { afterEach, describe, expect, it } from 'vitest';
import act5 from '../../data/monsters/act5.json';
import monsterSchema from '../../data/schema/monster.schema.json';
import { createRng } from '../rng';
import type { DamageType } from '../types/attributes';
import type { MonsterDef } from '../types/monsters';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { buildMonsterUnit } from './monster-factory';
import { resolveDamage } from './damage';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { statusDotRate } from './status';
import type { CombatUnit, MonsterTier } from './types';

const cases = [
  { archetype: 'monsters/act5.blood-lord', type: 'fire', skill: 'skills-sorceress-fire-bolt', status: 'burn' },
  { archetype: 'monsters/act5.frozen-terror', type: 'cold', skill: 'skills-sorceress-ice-bolt', status: 'chill' }
] as const;
const validate = new Ajv2020({ strict: true }).compile<MonsterDef>(monsterSchema);
function definition(id: string): MonsterDef {
  const row: unknown = act5.find(monster => monster.id === id);
  if (!validate(row)) throw new Error('Invalid native monster fixture');
  return row;
}
function native(def: MonsterDef, tier: MonsterTier = 'champion'): CombatUnit {
  return buildMonsterUnit({ def, tier, level: 60, id: 'enemy', rng: createRng(775) });
}
function damage(enemy: CombatUnit, type: DamageType) {
  return resolveDamage({ baseMin: 10000, baseMax: 10000, flatBonus: 0, increasedPct: 0,
    comboMult: 1, critChance: 0, critMult: 1.5, hitChance: 1, type,
    defenderResistances: enemy.stats.resistances, defenderArmor: enemy.stats.defense,
    defenderMagicResist: enemy.stats.magicResist, defenderDodge: 0,
    ...(enemy.damageImmunities ? { defenderDamageImmunities: enemy.damageImmunities } : {}) }, createRng(775));
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Act V champion elemental immunity', () => {
  it.each(cases)('$archetype champion rejects $type damage without changing numeric resistance', ({ archetype, type }) => {
    const def = definition(archetype), before = structuredClone(def), enemy = native(def);
    expect(enemy.damageImmunities).toEqual([type]);
    expect(Object.isFrozen(enemy.damageImmunities)).toBe(true);
    expect(enemy.damageImmunities).not.toBe(def.championDamageImmunities);
    expect(enemy.stats.resistances[type]).toBe(75);
    expect(damage(enemy, type)).toMatchObject({ hit: true, final: 0 });
    expect(damage(enemy, 'physical').final).toBeGreaterThan(0);
    expect(damage(enemy, 'lightning').final).toBeGreaterThan(0);
    expect(statusDotRate(enemy, { id: type === 'fire' ? 'ignite' : 'fixture-cold', sourceId: 'hero',
      remaining: 3, stacks: 1, damageType: type, dotPerStack: 500 })).toBe(0);
    expect(native(def)).toEqual(enemy);
    expect(def).toEqual(before);
  });

  it.each(['trash', 'elite', 'rare-elite', 'rare-minion', 'boss', 'chapter-boss'] as const)(
    'does not give %s variants champion-only immunity', tier => {
      for (const { archetype, type } of cases) {
        const def = definition(archetype), enemy = native(def, tier);
        expect(enemy.damageImmunities).toBeUndefined();
        expect(enemy.stats.resistances[type]).toBe(75);
        expect(damage(enemy, type).final).toBeGreaterThan(0);
        const { championDamageImmunities: omitted, ...previousDef } = def;
        expect(omitted).toEqual([type]);
        // Removing metadata creates custom source semantics, so the existing
        // delivery-provenance guard deliberately omits its native melee label.
        const { basicAttackDelivery, ...runtime } = enemy;
        expect(basicAttackDelivery).toBe('melee');
        expect(runtime).toEqual(native(previousDef, tier));
      }
    });

  it('composes all-tier and champion-only metadata once in source order without mutating sources or RNG', () => {
    const base = definition(cases[0].archetype);
    const def: MonsterDef = { ...base, damageImmunities: ['poison', 'fire'], championDamageImmunities: ['fire', 'cold'] };
    const before = structuredClone(def), rng = createRng(775), controlRng = createRng(775);
    const unit = buildMonsterUnit({ def, tier: 'champion', level: 60, id: 'enemy', rng });
    const { championDamageImmunities: omitted, ...controlDef } = def;
    expect(omitted).toEqual(['fire', 'cold']);
    const control = buildMonsterUnit({ def: controlDef, tier: 'champion', level: 60, id: 'enemy', rng: controlRng });
    expect(unit.damageImmunities).toEqual(['poison', 'fire', 'cold']);
    expect({ ...unit, damageImmunities: control.damageImmunities }).toEqual(control);
    expect(rng.next()).toBe(controlRng.next());
    expect(native(def, 'trash').damageImmunities).toEqual(['poison', 'fire']);
    expect(def).toEqual(before);
    expect(Object.isFrozen(def.damageImmunities)).toBe(false);
    expect(Object.isFrozen(def.championDamageImmunities)).toBe(false);
  });

  it.each([undefined, []])('preserves absent or empty champion metadata %j', championDamageImmunities => {
    const { championDamageImmunities: omitted, ...def } = definition(cases[0].archetype);
    expect(omitted).toEqual(['fire']);
    const extra = championDamageImmunities === undefined ? {} : { championDamageImmunities };
    expect(native({ ...def, ...extra })).toEqual(native(def));
    expect(native({ ...def, damageImmunities: [], ...extra }).damageImmunities).toEqual([]);
  });

  it.each([['fire', 'fire'], ['invalid'], [null], null, 'fire', {}, [1]])('rejects invalid authored champion metadata %j', value => {
    expect(validate({ ...definition(cases[0].archetype), championDamageImmunities: value })).toBe(false);
  });

  it.each(cases)('$archetype preserves actual native $type casts, status acceptance and recorded combat', ({ archetype, type, skill, status }) => {
    resetRegistry(); loadDefaultSkills();
    const enemy = native(definition(archetype));
    // Constructed durable caster; no earned build, campaign or balance credit.
    const hero: CombatUnit = { id: 'hero', name: 'hero', kind: 'hero', side: 'player', tier: 'trash', level: 60,
      life: 100000, mana: 100000, stats: { ...enemy.stats, life: 100000, lifeMax: 100000,
        mana: 100000, manaMax: 100000, attack: 0, attackSpeed: 100, critChance: 0 },
      statuses: [], cooldowns: {}, activeBuffIds: [], enraged: false, skillOrder: [skill], skillLevels: { [skill]: 1 } };
    const input: CombatSnapshot = { seed: 775, act: 5, maxRounds: 4, playerTeam: [hero], enemyTeam: [enemy] };
    const before = structuredClone(input), recorded = runBattleRecorded(input);
    const hits = recorded.events.filter(event => event.kind === 'damage' && event.source === 'hero' &&
      event.target === enemy.id && event.damageType === type && !event.dodged);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(event => event.kind === 'damage' && event.amount === 0)).toBe(true);
    expect(recorded.events.some(event => event.kind === 'status' && event.target === enemy.id && event.statusId === status)).toBe(true);
    expect(recorded.result.enemyTeam[0]?.life).toBe(enemy.life);
    expect(recorded.events.filter(event => event.kind === 'dot' && event.target === enemy.id && event.amount > 0)).toEqual([]);
    expect(runBattle(input)).toEqual(recorded.result);
    expect(runBattleRecorded(input)).toEqual(recorded);
    expect(input).toEqual(before);
  });
});
