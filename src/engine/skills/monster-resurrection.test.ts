import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import type { CombatUnit, MonsterTier } from '../combat/types';
import type { RegisteredSkill } from './effects';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';
import {
  MONSTER_RESURRECTION_SKILL, isMonsterResurrectionId, isOriginalMonsterResurrectionBody,
  isOriginalMonsterResurrectionSource, matchesMonsterResurrection, resolveMonsterResurrection
} from './monster-resurrection';

const CANONICAL = 'monster.resurrect_fallen', AUTHORED = 'monster-resurrect-fallen';
const sourceIds = [
  'monsters/act1.fallen-shaman', 'monsters/act1.carver-shaman',
  'monsters/act1.devilkin-shaman', 'monsters/act1.bishibosh'
];
const bodyIds = [
  'monsters/act1.fallen', 'monsters/act1.dark-one',
  'monsters/act1.carver', 'monsters/act1.devilkin'
];
const bodyTiers: readonly MonsterTier[] = ['trash', 'elite', 'champion', 'rare-elite', 'rare-minion'];
const fixture = () => ({
  id: AUTHORED, name: 'skills.monster.resurrect-fallen.name',
  description: 'skills.monster.resurrect-fallen.desc', icon: 'skills/monster/resurrect-fallen.png',
  trigger: 'active', target: 'summon', cooldown: 5, minLevel: 1, maxLevel: 1
});

/** Record overrides deliberately include malformed external actors such as an absent explicit kind. */
function unit(monsterArchetypeId: string, fields: Readonly<Record<string, unknown>> = {}): CombatUnit {
  return {
    id: 'original-monster', name: 'untrusted-display-name', kind: 'monster', side: 'enemy',
    monsterArchetypeId, level: 1, tier: 'trash', life: 100, mana: 0,
    stats: {
      life: 100, lifeMax: 100, mana: 0, manaMax: 0, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: 85, critChance: 0, critDamage: 1, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [], cooldowns: {}, skillOrder: [AUTHORED], activeBuffIds: [], enraged: false,
    ...fields
  };
}

/** Model malformed external registry replacements without weakening the production API. */
function replacement(fields: Readonly<Record<string, unknown>>): RegisteredSkill {
  return { ...MONSTER_RESURRECTION_SKILL, ...fields };
}

describe('monster resurrection authored leaf', () => {
  it('derives the active one-body spell from the actual authored row', () => {
    const before = structuredClone(rows);
    expect(rows.filter(row => row.id === AUTHORED)).toEqual([fixture()]);
    expect(MONSTER_RESURRECTION_SKILL).toEqual({
      id: CANONICAL, archetype: 'monster', trigger: 'active', target: 'summon',
      cooldown: 5, manaCost: 0, minLevel: 1, effects: [{ kind: 'monster-resurrection' }]
    });
    expect(resolveMonsterResurrection(rows)).toEqual(MONSTER_RESURRECTION_SKILL);
    expect(rows).toEqual(before);
  });

  it('requires exactly one authored identity and ignores unrelated rows', () => {
    for (const candidates of [[], [null, 42, {}], [{ ...fixture(), id: CANONICAL }],
      [fixture(), fixture()]]) {
      expect(() => resolveMonsterResurrection(candidates)).toThrow(/exactly one/);
    }
    expect(resolveMonsterResurrection([null, {}, { id: 'monster-fire-bolt' }, fixture()]))
      .toEqual(MONSTER_RESURRECTION_SKILL);
  });

  it('allows only equivalent explicit zero mana in addition to the authored absent cost', () => {
    expect(resolveMonsterResurrection([{ ...fixture(), cost: { mana: 0 } }]))
      .toEqual(MONSTER_RESURRECTION_SKILL);
  });

  it.each([
    { name: undefined }, { description: 1 }, { icon: 42 },
    { trigger: 'passive' }, { trigger: 'aura' }, { target: 'self' },
    { cooldown: 6 }, { cooldown: 0 }, { cooldown: NaN }, { cooldown: Infinity },
    { minLevel: 2 }, { maxLevel: 2 },
    { cost: {} }, { cost: undefined }, { cost: { mana: 1 } }, { cost: { mana: -1 } },
    { cost: { mana: 0, life: 0 } }, { cost: { life: 1 } },
    { damage: { min: 1, max: 1, breakdown: { fire: 1 } } }, { damageType: 'fire' },
    { appliesStatus: [] }, { appliesTags: [] }, { statusEffect: {} },
    { scaling: { costPerLevel: 0 } }, { passive: true }, { aura: true },
    { summon: true }, { summonId: 'fallen' }, { requires: {} }, { maxTargets: 1 },
    { heal: { min: 1, max: 1, target: 'self' } }, { unexpected: true }
  ])('refuses malformed or unreviewed authored semantics %j', fields => {
    expect(() => resolveMonsterResurrection([{ ...fixture(), ...fields }])).toThrow(/resurrection/);
  });

  it('copies and deeply freezes native output without freezing or mutating caller data', () => {
    const row = { ...fixture(), cost: { mana: 0 } };
    const before = structuredClone(row);
    const first = resolveMonsterResurrection([row]), second = resolveMonsterResurrection([row]);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.effects).not.toBe(second.effects);
    expect(first.effects[0]).not.toBe(second.effects[0]);
    for (const value of [first, first.effects, first.effects[0]]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(row).toEqual(before);
    expect(Object.isFrozen(row)).toBe(false);
    expect(Object.isFrozen(row.cost)).toBe(false);
    row.cooldown = 99;
    row.cost.mana = 99;
    expect(first).toEqual(MONSTER_RESURRECTION_SKILL);
    expect(Reflect.set(first.effects[0] ?? {}, 'kind', 'buff')).toBe(false);
  });
});

describe('monster resurrection registered authority', () => {
  describe('default registry integration', () => {
    beforeEach(() => {
      resetRegistry();
      loadDefaultSkills();
    });
    afterEach(() => {
      resetRegistry();
      loadDefaultSkills();
    });

    it.each([CANONICAL, AUTHORED])('resolves actual registry alias %s to native resurrection semantics', id => {
      const skill = getSkill(id);
      expect(skill).toBeDefined();
      if (!skill) throw new Error(`Missing registered monster resurrection alias: ${id}`);
      expect(matchesMonsterResurrection(skill)).toBe(true);
    });
  });

  it.each([CANONICAL, AUTHORED])('accepts only native semantics for exact alias %s', id => {
    expect(isMonsterResurrectionId(id)).toBe(true);
    expect(matchesMonsterResurrection({ ...MONSTER_RESURRECTION_SKILL, id })).toBe(true);
  });

  it.each([
    'monster.resurrect-fallen', 'monster-resurrect_fallen', 'monster.resurrect_fallen.extra',
    'MONSTER.RESURRECT_FALLEN', 'resurrect', 'necromancer.revive', ''
  ])('does not infer native authority from a similar identity %s', id => {
    expect(isMonsterResurrectionId(id)).toBe(false);
    expect(matchesMonsterResurrection({ ...MONSTER_RESURRECTION_SKILL, id })).toBe(false);
  });

  it('rejects the old permanent self-buff placeholder', () => {
    expect(matchesMonsterResurrection(replacement({
      cooldown: 6, trigger: undefined, effects: [{ kind: 'buff', buffId: 'resurrect', duration: -1 }]
    }))).toBe(false);
  });

  it.each([
    { archetype: 'necromancer' }, { trigger: undefined }, { trigger: 'passive' }, { target: 'self' },
    { cooldown: 6 }, { cooldown: NaN }, { cooldown: Infinity }, { manaCost: 1 }, { minLevel: 2 },
    { effects: [] }, { effects: [null] }, { effects: [{ kind: 'monster-resurrection', count: 2 }] },
    { effects: [{ kind: 'monster-resurrection' }, { kind: 'monster-resurrection' }] },
    { effects: [{ kind: 'monster-resurrection' }, { kind: 'buff', buffId: 'resurrect', duration: -1 }] },
    { manaCostPerRank: 0 }, { cooldownPerRank: 0 }, { isBuff: false }, { summonOnStart: false },
    { requires: {} }, { maxTargets: 1 }, { arbitraryImportedBehavior: true }
  ])('refuses changed or extra registered behavior %j', fields => {
    expect(matchesMonsterResurrection(replacement(fields))).toBe(false);
  });

  it('rejects hidden or inherited extra behavior without calling accessors', () => {
    const hidden = { ...MONSTER_RESURRECTION_SKILL };
    Object.defineProperty(hidden, 'summonOnStart', { value: true });
    expect(matchesMonsterResurrection(hidden)).toBe(false);
    const inherited = Object.assign(Object.create({ isBuff: true }) as object, MONSTER_RESURRECTION_SKILL);
    expect(matchesMonsterResurrection(inherited)).toBe(false);
    let reads = 0;
    const accessor = { ...MONSTER_RESURRECTION_SKILL };
    Object.defineProperty(accessor, 'effects', { enumerable: true, get: () => { reads++; return []; } });
    expect(matchesMonsterResurrection(accessor)).toBe(false);
    expect(reads).toBe(0);
  });

  it('keeps the authored reference independent of a mutated replacement', () => {
    const effects = [{ kind: 'monster-resurrection' }];
    const imported = replacement({ effects });
    expect(matchesMonsterResurrection(imported)).toBe(true);
    effects[0] = { kind: 'buff' };
    expect(matchesMonsterResurrection(imported)).toBe(false);
    expect(matchesMonsterResurrection(MONSTER_RESURRECTION_SKILL)).toBe(true);
  });
});

describe('monster resurrection original-actor capture qualification', () => {
  it.each(sourceIds)('accepts exact original source %s', id => {
    expect(isOriginalMonsterResurrectionSource(unit(id))).toBe(true);
    expect(isOriginalMonsterResurrectionBody(unit(id))).toBe(false);
  });

  it.each(bodyIds)('accepts exact original body %s at every allowed body tier', id => {
    for (const tier of bodyTiers) {
      expect(isOriginalMonsterResurrectionBody(unit(id, { tier }))).toBe(true);
    }
    expect(isOriginalMonsterResurrectionSource(unit(id))).toBe(false);
  });

  it.each(['boss', 'chapter-boss'] as const)('rejects every synthetic %s body', tier => {
    for (const id of bodyIds) expect(isOriginalMonsterResurrectionBody(unit(id, { tier }))).toBe(false);
  });

  it('allows Bishibosh as an original boss source', () => {
    expect(isOriginalMonsterResurrectionSource(unit('monsters/act1.bishibosh', { tier: 'boss' }))).toBe(true);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('rejects original body maxHP %s that cannot be restored', lifeMax => {
    const body = unit('monsters/act1.fallen');
    expect(isOriginalMonsterResurrectionBody({ ...body, stats: { ...body.stats, lifeMax } })).toBe(false);
  });

  it.each([-1, NaN, Infinity, -Infinity])('rejects original body mana capacity %s that cannot be restored', manaMax => {
    const body = unit('monsters/act1.fallen');
    expect(isOriginalMonsterResurrectionBody({ ...body, stats: { ...body.stats, manaMax } })).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity])('rejects nonfinite original body MP %s', mana => {
    expect(isOriginalMonsterResurrectionBody(unit('monsters/act1.fallen', { mana }))).toBe(false);
  });

  it.each([-10, 0, 50])('accepts finite original body MP %s for restoration-time clamping', mana => {
    const body = unit('monsters/act1.fallen', { mana });
    expect(isOriginalMonsterResurrectionBody({ ...body, stats: { ...body.stats, manaMax: 25 } })).toBe(true);
  });

  it('accepts finite positive body maxHP and finite zero or positive mana capacity', () => {
    const body = unit('monsters/act1.fallen');
    for (const manaMax of [0, 25]) {
      expect(isOriginalMonsterResurrectionBody({ ...body, stats: { ...body.stats, lifeMax: 1, manaMax } }))
        .toBe(true);
    }
  });

  it.each([
    { side: 'player' as const }, { kind: undefined }, { kind: 'hero' as const },
    { kind: 'merc' as const }, { kind: 'summon' as const },
    { life: 0 }, { life: -1 }, { life: NaN }, { life: Infinity }, { life: -Infinity },
    { summon: true }, { ownerId: 'owner' }, { ownerId: '' },
    { summonOwnerId: 'owner' }, { summonOwnerId: '' },
    { summonTemplateId: 'fallen' }, { summonTemplateId: '' }
  ])('excludes nonoriginal or initially nonliving actors %j', fields => {
    expect(isOriginalMonsterResurrectionSource(unit('monsters/act1.fallen-shaman', fields))).toBe(false);
    expect(isOriginalMonsterResurrectionBody(unit('monsters/act1.fallen', fields))).toBe(false);
  });

  it('allows explicit nonsummons without imposing skill-order or display-name authority', () => {
    expect(isOriginalMonsterResurrectionSource(unit('monsters/act1.fallen-shaman', {
      summon: false, name: 'anything', skillOrder: []
    }))).toBe(true);
    expect(isOriginalMonsterResurrectionBody(unit('monsters/act1.fallen', { summon: false }))).toBe(true);
  });

  it.each([
    undefined, '', 'fallen', 'fallen-shaman', 'monsters/act1.fallen-shaman-copy',
    'monsters/act2.fallen', 'monsters/act1.Fallen', 'monsters/act1.zombie'
  ])('rejects missing and foreign catalog identities despite forged names or IDs: %s', monsterArchetypeId => {
    const actor = unit('monsters/act1.zombie', {
      monsterArchetypeId, id: 'monsters/act1.fallen-shaman', name: 'Fallen Shaman',
      activeBuffIds: ['resurrect'], skillOrder: [CANONICAL, AUTHORED]
    });
    expect(isOriginalMonsterResurrectionSource(actor)).toBe(false);
    expect(isOriginalMonsterResurrectionBody(actor)).toBe(false);
  });

  it('leaves capture inputs unchanged', () => {
    const source = unit('monsters/act1.fallen-shaman'), body = unit('monsters/act1.fallen');
    const before = structuredClone([source, body]);
    expect(isOriginalMonsterResurrectionSource(source)).toBe(true);
    expect(isOriginalMonsterResurrectionBody(body)).toBe(true);
    expect([source, body]).toEqual(before);
    // The combat owner must call these only during its one-time starting-map capture;
    // a later identical actor never becomes an original merely by passing this predicate.
  });
});
