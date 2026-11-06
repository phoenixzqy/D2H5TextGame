import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { getSkill } from './registry';
import {
  CORPSE_EXPLOSION_DEFINITION, composeCorpseExplosion, copyCorpseExplosionProjections,
  isCorpseExplosionId, matchesCorpseExplosion, resolveCorpseExplosionDefinition
} from './corpse-explosion';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing fixture value');
  return value;
}
const CE = 'necromancer.corpse_explosion', ALIAS = 'skills-necromancer-corpse-explosion';
const TEETH = 'necromancer.teeth';
const player = { id: 'hero', class: 'necromancer' as const, level: 6, skillLevels: { [CE]: 1, [TEETH]: 1 } };

describe('D06 Corpse Explosion definition and Player authority', () => {
  it('freezes independent authored literals and the production registered spell', () => {
    const d = CORPSE_EXPLOSION_DEFINITION;
    expect(d).toMatchObject({ requiredLevel: 6, maxRank: 20, teethMaxRank: 20,
      manaCost: 20, cooldown: 2, baseMin: 50, baseMax: 80, damagePerRank: 80, ignitePct: 0.1 });
    expect(Object.isFrozen(d)).toBe(true);
    expect(matchesCorpseExplosion(required(getSkill(CE)))).toBe(true);
    expect([1, 6, 20].map(r => [d.baseMin + d.damagePerRank * (r - 1), d.baseMax + d.damagePerRank * (r - 1)]))
      .toEqual([[50, 80], [450, 480], [1570, 1600]]);
    expect(isCorpseExplosionId(CE)).toBe(true);
    expect(isCorpseExplosionId(ALIAS)).toBe(true);
    expect(isCorpseExplosionId('monster.corpse_explosion')).toBe(false);
  });

  it('requires the reviewed blast Defense bypass in authored and registered semantics', () => {
    const source = required(rows.find(row => row.id === ALIAS));
    expect(source).toHaveProperty('ignoresDefense', true);
    const skill = required(getSkill(CE)), effect = required(skill.effects[0]);
    expect(effect).toMatchObject({ kind: 'damage', ignoresDefense: true });
    const missing = { ...effect };
    Reflect.deleteProperty(missing, 'ignoresDefense');
    expect(matchesCorpseExplosion({ ...skill, effects: [missing] })).toBe(false);
    const cloned = structuredClone(rows);
    Reflect.deleteProperty(required(cloned.find(row => row.id === ALIAS)), 'ignoresDefense');
    expect(() => resolveCorpseExplosionDefinition(cloned)).toThrow();
  });

  it.each([
    { requiredLevel: 5 }, { maxLevel: 21 }, { prerequisites: [] }, { prerequisites: ['other'] },
    { cooldown: 3 }, { cost: { mana: 19 } }, { cost: { mana: 20, life: 1 } },
    { target: 'single-enemy' }, { trigger: 'passive' }, { passive: true }, { summon: true }, { aura: true },
    { damageType: 'physical' }, { damage: { min: 50, max: 80, breakdown: { fire: 80, physical: 1 } } },
    { appliesStatus: ['ignite', 'poison'] }, { appliesTags: ['fire'] },
    { statusEffect: { dotPctOfDamage: 0.2 } }, { statusEffect: { dotPctOfDamage: 0.1, chance: 0.5 } },
    { scaling: { damagePerLevel: 5 } }, { scaling: { damagePerLevel: 6 } },
    { scaling: { damagePerLevel: 80, costPerLevel: -1 } },
    { heal: { min: 1, max: 1, target: 'self' } }, { requires: {} }
  ])('refuses changed/additional authored semantics %j', change => {
    const modified = rows.map(row => row.id === ALIAS ? { ...row, ...change } : row);
    expect(() => resolveCorpseExplosionDefinition(modified)).toThrow();
  });

  it('refuses missing/duplicate/malformed source or prerequisite and copies source primitives', () => {
    const ce = required(rows.find(r => r.id === ALIAS));
    expect(() => resolveCorpseExplosionDefinition(rows.filter(r => r.id !== ALIAS))).toThrow();
    expect(() => resolveCorpseExplosionDefinition([...rows, ce])).toThrow();
    expect(() => resolveCorpseExplosionDefinition([...rows, rows.find(r => r.id === 'skills-necromancer-teeth')])).toThrow();
    expect(() => resolveCorpseExplosionDefinition(rows.map(r => r.id === ALIAS ? { ...r, damage: null } : r))).toThrow();
    expect(() => resolveCorpseExplosionDefinition(rows.map(r => r.id === 'skills-necromancer-teeth' ? { ...r, maxLevel: 21 } : r))).toThrow();
    const clone = structuredClone(rows), resolved = resolveCorpseExplosionDefinition(clone);
    required(required(clone.find(r => r.id === ALIAS)).cost).mana = 1;
    expect(resolved.manaCost).toBe(20);
  });

  it('requires the actual eligible Player and returns only copied immutable authority', () => {
    const p = structuredClone(player), projection = composeCorpseExplosion(p);
    expect(projection).toEqual({ sourceHeroId: 'hero', rank: 1 });
    expect(Object.isFrozen(projection)).toBe(true);
    p.skillLevels[CE] = 20;
    expect(projection?.rank).toBe(1);
  });

  it.each([
    { id: '' }, { class: 'sorceress' as const }, { level: 5 }, { level: 6.5 }, { level: Infinity },
    { skillLevels: {} }, { skillLevels: { [CE]: 1 } },
    { skillLevels: { [TEETH]: 1 } }, { skillLevels: { [CE]: 1, [TEETH]: 21 } },
    { skillLevels: { [CE]: 1, [TEETH]: 1.5 } },
    { skillLevels: { 'corpse-explosion': 20, [TEETH]: 1 } }
  ])('does not infer eligibility from invalid Player data %j', fields => {
    expect(composeCorpseExplosion({ ...player, ...fields })).toBeUndefined();
  });

  it.each([0, -1, 1.5, 21, NaN, Infinity])('rejects rank %s without clamping or fallback', rank => {
    expect(composeCorpseExplosion({ ...player, skillLevels: { [TEETH]: 1, [CE]: rank } })).toBeUndefined();
    expect(composeCorpseExplosion({ ...player, skillLevels: { [TEETH]: 1, [CE]: rank, [ALIAS]: 6 } }))
      .toEqual({ sourceHeroId: 'hero', rank: 6 });
  });

  it('missing allocation has no implicit rank-one fallback', () => {
    const { skillLevels: _levels, ...missing } = player;
    expect(composeCorpseExplosion(missing)).toBeUndefined();
  });

  it('uses maximum valid exact alias once for each allocation', () => {
    expect(composeCorpseExplosion({ ...player, skillLevels: {
      [CE]: 1, [ALIAS]: 20, [TEETH]: NaN, 'skills-necromancer-teeth': 1
    } })).toEqual({ sourceHeroId: 'hero', rank: 20 });
  });

  it.each([undefined, null, {}, [null], [{ sourceHeroId: 'hero', rank: Infinity }],
    [{ sourceHeroId: 1, rank: 1 }], [{ sourceHeroId: '', rank: 1 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }],
    [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'other', rank: 21 }]])('copies malformed projection %j as no authority', value => {
    expect(copyCorpseExplosionProjections(value)).toEqual([]);
  });

  it('copies every entry without retaining caller arrays or objects', () => {
    const source = [{ sourceHeroId: 'hero', rank: 6 }, { sourceHeroId: 'other', rank: 20 }];
    const copied = copyCorpseExplosionProjections(source);
    required(source[0]).rank = 1; source.push({ sourceHeroId: 'third', rank: 1 });
    expect(copied).toEqual([{ sourceHeroId: 'hero', rank: 6 }, { sourceHeroId: 'other', rank: 20 }]);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(copied.every(Object.isFrozen)).toBe(true);
  });

  it('refuses sparse authority arrays and added entry fields', () => {
    const sparse: unknown[] = []; sparse.length = 2;
    sparse[0] = { sourceHeroId: 'hero', rank: 1 };
    expect(copyCorpseExplosionProjections(sparse)).toEqual([]);
    expect(copyCorpseExplosionProjections([{ sourceHeroId: 'hero', rank: 1, extra: true }])).toEqual([]);
  });

  it.each([
    { manaCost: 0 }, { cooldown: 0 }, { minLevel: 1 }, { trigger: 'passive' as const },
    { archetype: 'monster' }, { target: 'single-enemy' as const }, { summonOnStart: true },
    { manaCostPerRank: -1 }, { cooldownPerRank: -1 }, { requires: {} }, { isBuff: true }
  ])('refuses unreviewed registered semantics %j', change => {
    expect(matchesCorpseExplosion({ ...required(getSkill(CE)), ...change })).toBe(false);
  });


  it('rejects an extended sparse effect array rather than matching only enumerable keys', () => {
    const skill = required(getSkill(CE)), effects = [...skill.effects];
    effects.length = 2;
    expect(matchesCorpseExplosion({ ...skill, effects })).toBe(false);
  });

});
