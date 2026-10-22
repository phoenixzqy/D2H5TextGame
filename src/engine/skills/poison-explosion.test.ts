import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from './registry';
import rows from '../../data/skills/necromancer.json';
import type { CombatUnit } from '../combat/types';
import { composeCorpseExplosion } from './corpse-explosion';
import {
  POISON_EXPLOSION_DEFINITION, composePoisonExplosion, copyPoisonExplosionProjections,
  isPoisonExplosionId, matchesPoisonExplosion, poisonExplosionRank, resolvePoisonExplosionDefinition
} from './poison-explosion';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('D06 Poison Explosion production metadata', () => {
  it('adapts the authored single Poison effect with literal 5% potency', () => {
    expect(getSkill('necromancer.poison_explosion')).toEqual({
      id: 'necromancer.poison_explosion', archetype: 'necromancer',
      trigger: 'active', target: 'all-enemies', minLevel: 18,
      manaCost: 15, cooldown: 2,
      effects: [{ kind: 'damage', damageType: 'poison', base: [40, 60], perRank: [5, 5],
        tags: ['poison'], applyStatus: { id: 'poison', dotPctOfDamage: 0.05 } }]
    });
  });
});

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture value');
  return value;
}
const PE = 'necromancer.poison_explosion', ALIAS = 'skills-necromancer-poison-explosion';
const DAGGER = 'necromancer.poison_dagger';
const player = { id: 'hero', class: 'necromancer' as const, level: 18, skillLevels: { [PE]: 1, [DAGGER]: 1 } };

describe('D06 Poison Explosion definition and Player authority', () => {
  it('freezes independent authored literals and the production registered spell', () => {
    const d = POISON_EXPLOSION_DEFINITION;
    expect(d).toMatchObject({ requiredLevel: 18, maxRank: 20, daggerMaxRank: 20,
      manaCost: 15, cooldown: 2, baseMin: 40, baseMax: 60, damagePerRank: 5, poisonPct: 0.05 });
    expect(Object.isFrozen(d)).toBe(true);
    expect(matchesPoisonExplosion(required(getSkill(PE)))).toBe(true);
    expect([1, 2, 6, 12, 20].map(r => [d.baseMin + d.damagePerRank * (r - 1), d.baseMax + d.damagePerRank * (r - 1)]))
      .toEqual([[40, 60], [45, 65], [65, 85], [95, 115], [135, 155]]);
    expect(isPoisonExplosionId(PE)).toBe(true);
    expect(isPoisonExplosionId(ALIAS)).toBe(true);
    expect(isPoisonExplosionId('monster.poison_explosion')).toBe(false);
  });

  it.each([
    { requiredLevel: 17 }, { maxLevel: 21 }, { prerequisites: [] }, { prerequisites: ['other'] },
    { cooldown: 3 }, { cost: { mana: 14 } }, { cost: { mana: 15, life: 1 } },
    { target: 'single-enemy' }, { trigger: 'passive' }, { passive: true }, { summon: true }, { aura: true },
    { damageType: 'physical' }, { damage: { min: 40, max: 60, breakdown: { poison: 60, physical: 1 } } },
    { appliesStatus: ['poison', 'ignite'] }, { appliesTags: ['fire'] },
    { statusEffect: { dotPctOfDamage: 0.2 } }, { statusEffect: { dotPctOfDamage: 0.05, chance: 0.5 } },
    { scaling: { damagePerLevel: 4 } }, { scaling: { damagePerLevel: 5, costPerLevel: -1 } },
    { heal: { min: 1, max: 1, target: 'self' } }, { requires: {} }
  ])('refuses changed/additional authored semantics %j', change => {
    const modified = rows.map(row => row.id === ALIAS ? { ...row, ...change } : row);
    expect(() => resolvePoisonExplosionDefinition(modified)).toThrow();
  });

  it('refuses missing/duplicate/malformed source or prerequisite and copies source primitives', () => {
    const pe = required(rows.find(r => r.id === ALIAS));
    expect(() => resolvePoisonExplosionDefinition(rows.filter(r => r.id !== ALIAS))).toThrow();
    expect(() => resolvePoisonExplosionDefinition(rows.filter(r => r.id !== 'skills-necromancer-poison-dagger'))).toThrow();
    expect(() => resolvePoisonExplosionDefinition([...rows, pe])).toThrow();
    expect(() => resolvePoisonExplosionDefinition([...rows, rows.find(r => r.id === 'skills-necromancer-poison-dagger')])).toThrow();
    expect(() => resolvePoisonExplosionDefinition(rows.map(r => r.id === ALIAS ? { ...r, damage: null } : r))).toThrow();
    expect(() => resolvePoisonExplosionDefinition(rows.map(r => r.id === 'skills-necromancer-poison-dagger' ? { ...r, maxLevel: 21 } : r))).toThrow();
    const clone = structuredClone(rows), resolved = resolvePoisonExplosionDefinition(clone);
    required(required(clone.find(r => r.id === ALIAS)).cost).mana = 1;
    expect(resolved.manaCost).toBe(15);
  });

  it.each([{ requiredLevel: 5 }, { maxLevel: 21 }, { prerequisites: [] }])(
    'independently refuses changed authored Dagger eligibility %j', change => {
      expect(() => resolvePoisonExplosionDefinition(rows.map(row =>
        row.id === 'skills-necromancer-poison-dagger' ? { ...row, ...change } : row))).toThrow();
    });

  it('ignores only source presentation metadata and rejects an authored alias replacement', () => {
    const copy = rows.map(row => row.id === ALIAS ? {
      ...row, name: 'renamed', description: 'changed', icon: 'other.png', tree: 'other'
    } : row);
    expect(resolvePoisonExplosionDefinition(copy)).toEqual(POISON_EXPLOSION_DEFINITION);
    expect(() => resolvePoisonExplosionDefinition(rows.map(row => row.id === ALIAS ? { ...row, id: PE } : row)))
      .toThrow();
  });

  it('requires the actual eligible Player and returns only copied immutable authority', () => {
    const p = structuredClone(player), projection = composePoisonExplosion(p);
    expect(projection).toEqual({ sourceHeroId: 'hero', rank: 1 });
    expect(Object.isFrozen(projection)).toBe(true);
    p.skillLevels[PE] = 20;
    expect(projection?.rank).toBe(1);
  });

  it.each([
    { id: '' }, { class: 'sorceress' as const }, { level: 17 }, { level: 18.5 }, { level: Infinity },
    { skillLevels: {} }, { skillLevels: { [PE]: 1 } },
    { skillLevels: { [DAGGER]: 1 } }, { skillLevels: { [PE]: 1, [DAGGER]: 21 } },
    { skillLevels: { [PE]: 1, [DAGGER]: 1.5 } },
    { skillLevels: { 'poison-explosion': 20, [DAGGER]: 1 } }
  ])('does not infer eligibility from invalid Player data %j', fields => {
    expect(composePoisonExplosion({ ...player, ...fields })).toBeUndefined();
  });

  it.each([0, -1, 1.5, 21, NaN, Infinity])('rejects rank %s without clamping or fallback', rank => {
    expect(composePoisonExplosion({ ...player, skillLevels: { [DAGGER]: 1, [PE]: rank } })).toBeUndefined();
    expect(composePoisonExplosion({ ...player, skillLevels: { [DAGGER]: 1, [PE]: rank, [ALIAS]: 6 } }))
      .toEqual({ sourceHeroId: 'hero', rank: 6 });
  });

  it('missing allocation has no implicit rank-one fallback', () => {
    const { skillLevels: _levels, ...missing } = player;
    expect(composePoisonExplosion(missing)).toBeUndefined();
  });

  it('uses maximum valid exact alias once for each allocation', () => {
    expect(composePoisonExplosion({ ...player, skillLevels: {
      [PE]: 1, [ALIAS]: 20, [DAGGER]: NaN, 'skills-necromancer-poison-dagger': 1
    } })).toEqual({ sourceHeroId: 'hero', rank: 20 });
  });

  it('keeps Poison Dagger and Teeth/CE authority independent', () => {
    expect(composeCorpseExplosion(player)).toBeUndefined();
    expect(composePoisonExplosion({ ...player, skillLevels: {
      [PE]: 1, 'necromancer.teeth': 20, 'necromancer.corpse_explosion': 20
    } })).toBeUndefined();
    expect(composePoisonExplosion({ ...player, skillLevels: {
      [PE]: 1, 'skills-necromancer-poison-dagger': 20
    } })).toEqual({ sourceHeroId: 'hero', rank: 1 });
  });

  it.each([undefined, null, {}, [null], [{ sourceHeroId: 'hero', rank: Infinity }],
    [{ sourceHeroId: 'hero', rank: 0 }], [{ sourceHeroId: 'hero', rank: -1 }],
    [{ sourceHeroId: 'hero', rank: 1.5 }], [{ sourceHeroId: 'hero', rank: 21 }],
    [{ sourceHeroId: 'hero', rank: NaN }], [{ sourceHeroId: 'hero', rank: -Infinity }],
    [{ sourceHeroId: 1, rank: 1 }], [{ sourceHeroId: '', rank: 1 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'other', rank: 21 }]])('copies malformed projection %j as no authority', value => {
    expect(copyPoisonExplosionProjections(value)).toEqual([]);
  });

  it('copies every entry without retaining caller arrays or objects', () => {
    const source = [{ sourceHeroId: 'hero', rank: 6 }, { sourceHeroId: 'other', rank: 20 }];
    const copied = copyPoisonExplosionProjections(source);
    required(source[0]).rank = 1; source.push({ sourceHeroId: 'third', rank: 1 });
    expect(copied).toEqual([{ sourceHeroId: 'hero', rank: 6 }, { sourceHeroId: 'other', rank: 20 }]);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(copied.every(Object.isFrozen)).toBe(true);
  });

  it('refuses sparse authority arrays and added entry fields', () => {
    const sparse: unknown[] = []; sparse.length = 2;
    sparse[0] = { sourceHeroId: 'hero', rank: 1 };
    expect(copyPoisonExplosionProjections(sparse)).toEqual([]);
    expect(copyPoisonExplosionProjections([{ sourceHeroId: 'hero', rank: 1, extra: true }])).toEqual([]);
  });

  it.each([
    { manaCost: 0 }, { cooldown: 0 }, { minLevel: 1 }, { trigger: 'passive' as const },
    { archetype: 'monster' }, { target: 'single-enemy' as const }, { summonOnStart: true },
    { manaCostPerRank: -1 }, { cooldownPerRank: -1 }, { requires: {} }, { isBuff: true }
  ])('refuses unreviewed registered semantics %j', change => {
    expect(matchesPoisonExplosion({ ...required(getSkill(PE)), ...change })).toBe(false);
  });


  it('rejects an extended sparse effect array rather than matching only enumerable keys', () => {
    const skill = required(getSkill(PE)), effects = [...skill.effects];
    effects.length = 2;
    expect(matchesPoisonExplosion({ ...skill, effects })).toBe(false);
  });

  it.each([
    { kind: 'damage', damageType: 'fire', base: [40, 60] },
    { kind: 'damage', damageType: 'poison', base: [40, 60], perRank: [5, 5], tags: ['poison'],
      applyStatus: { id: 'poison' } },
    { kind: 'damage', damageType: 'poison', base: [40, 60], perRank: [5, 5], tags: ['poison'],
      applyStatus: { id: 'poison', dotPctOfDamage: 0.05, chance: 1 } },
    { kind: 'damage', damageType: 'poison', base: [40, 60], perRank: [5, 5], tags: ['poison'],
      applyStatus: { id: 'poison', dotPctOfDamage: 0.05, stacksOnApply: 2 } }
  ] as const)('rejects changed registered effect semantics %j', effect => {
    expect(matchesPoisonExplosion({ ...required(getSkill(PE)), effects: [effect] })).toBe(false);
  });

  it('rejects extra effects and identity substitutions independently of the frozen authored definition', () => {
    const skill = required(getSkill(PE));
    expect(matchesPoisonExplosion({ ...skill, id: ALIAS })).toBe(true);
    expect(matchesPoisonExplosion({ ...skill, id: 'monster.poison_explosion' })).toBe(false);
    expect(matchesPoisonExplosion({ ...skill, effects: [...skill.effects, { kind: 'heal', amount: 1, target: 'self' }] }))
      .toBe(false);
    registerSkill({ ...skill, manaCost: 0 });
    expect(matchesPoisonExplosion(required(getSkill(PE)))).toBe(false);
    expect(POISON_EXPLOSION_DEFINITION.manaCost).toBe(15);
    expect(composePoisonExplosion(player)).toEqual({ sourceHeroId: 'hero', rank: 1 });
  });

});

const hero: CombatUnit = {
  id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 18, tier: 'trash', life: 100, mana: 15,
  stats: { life: 100, lifeMax: 100, mana: 15, manaMax: 15, attack: 1, defense: 0, magicResist: 0,
    attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
  statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false
};
describe('D06 Poison Explosion runtime identity boundary', () => {
  it('uses only the copied source authority, preserving inputs', () => {
    const before = structuredClone(hero), authority = new Map([['hero', 12]]);
    expect(poisonExplosionRank(hero, authority)).toBe(12);
    expect(poisonExplosionRank(hero, new Map())).toBe(0);
    expect(hero).toEqual(before);
    expect(authority).toEqual(new Map([['hero', 12]]));
  });

  it.each<Partial<CombatUnit>>([
    { id: 'other' }, { side: 'enemy' }, { kind: 'monster' }, { kind: 'merc' }, { kind: 'summon' },
    { life: 0 }, { life: -1 }, { life: NaN }, { life: Infinity }, { summon: true },
    { ownerId: 'hero' }, { summonOwnerId: 'hero' }, { level: 17 }, { level: 18.5 }, { level: Infinity }
  ])('refuses a mismatched, ineligible or nonliving actor %j', change => {
    expect(poisonExplosionRank({ ...hero, ...change }, new Map([['hero', 20]]))).toBe(0);
  });
});
