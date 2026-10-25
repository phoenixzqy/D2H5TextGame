import { describe, expect, it } from 'vitest';
import { canonicalSkillIdFromData, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { createClassActiveProjector, projectPlayerClassActives,
  type ClassActiveOwnershipCatalog, type ClassActiveOwner } from './player-class-actives';
import { governedActiveId } from './runeword-actives';
import { isIronGolemSkill } from './iron-golem';
import { isPreparationSummonSkill } from './summon-preparation';
import { isCorpseExplosionId } from './corpse-explosion';
import { isPoisonExplosionId } from './poison-explosion';

const owner = (fields: Partial<ClassActiveOwner> = {}): ClassActiveOwner => ({
  classId: 'barbarian', level: 30, skillOrder: ['barbarian.bash'], skillLevels: {}, ...fields
});
const ordinary = Object.entries(PLAYABLE_CLASS_SKILL_DATA).flatMap(([classId, rows]) => rows
  .filter(row => row.trigger === 'active' && !governedActiveId(row.id) &&
    !isCorpseExplosionId(row.id) && !isPoisonExplosionId(row.id) &&
    !isPreparationSummonSkill({ id: canonicalSkillIdFromData(row.id) }) &&
    !isIronGolemSkill({ id: canonicalSkillIdFromData(row.id) }))
  .map(row => ({ classId, row, canonical: canonicalSkillIdFromData(row.id) })));

describe('copied native ordinary class-active ownership', () => {
  it.each(ordinary)('$canonical requires learned ownership and rejects every other class', ({ classId, row, canonical }) => {
    const skillOrder = [row.id, 'fixture.extension', canonical];
    expect(projectPlayerClassActives(owner({ classId, skillOrder })).skillOrder).toEqual(['fixture.extension']);
    // Full real catalog is prerequisite setup only; refusal outputs are literal.
    const prerequisites = Object.fromEntries(PLAYABLE_CLASS_SKILL_DATA[classId as keyof typeof PLAYABLE_CLASS_SKILL_DATA]
      .map(row => [row.id, 1]));
    for (const foreign of Object.keys(PLAYABLE_CLASS_SKILL_DATA).filter(cls => cls !== classId)) {
      expect(projectPlayerClassActives(owner({ classId: foreign, skillOrder,
        skillLevels: { ...prerequisites, [canonical]: 20 } })).skillOrder).toEqual(['fixture.extension']);
    }
  });
  it.each(ordinary)('$canonical accepts rank1/20 only at unlock, copying exact aliases once', ({ classId, row, canonical }) => {
    const prerequisites = Object.fromEntries(PLAYABLE_CLASS_SKILL_DATA[classId as keyof typeof PLAYABLE_CLASS_SKILL_DATA]
      .map(row => [row.id, 1]));
    for (const rank of [1, 20]) {
      const levels = { ...prerequisites, [canonical]: rank, [row.id]: 1 };
      const p = owner({ classId, level: row.requiredLevel ?? row.minLevel,
        skillOrder: [row.id, 'fixture.extension', canonical], skillLevels: levels });
      const before = structuredClone(p);
      Object.freeze(p.skillOrder); Object.freeze(p.skillLevels); Object.freeze(p);
      const actual = projectPlayerClassActives(p);
      expect(actual.skillOrder).toEqual([row.id, 'fixture.extension', canonical]);
      expect(actual.skillLevels?.[canonical]).toBe(rank);
      expect(Object.hasOwn(actual.skillLevels ?? {}, row.id)).toBe(false);
      expect(actual.skillOrder).not.toBe(p.skillOrder);
      expect(actual.skillLevels).not.toBe(p.skillLevels);
      expect(p).toEqual(before);
      expect(projectPlayerClassActives({ ...p, level: p.level - 1 }).skillOrder).toEqual(['fixture.extension']);
    }
  });
  it.each([NaN, Infinity, -Infinity, -1, 0, .5, 1.5, 21])('ignores invalid rank%s beside valid aliases in either direction', invalid => {
    for (const [canonical, authored] of [[invalid, 2], [2, invalid]]) {
      const p = owner({ skillLevels: { 'barbarian.bash': canonical ?? 0, 'skills-barbarian-bash': authored ?? 0 } });
      expect(projectPlayerClassActives(p)).toEqual({ skillOrder: ['barbarian.bash'], skillLevels: { 'barbarian.bash': 2 } });
    }
    expect(projectPlayerClassActives(owner({ skillLevels: { 'barbarian.bash': invalid } })).skillOrder).toEqual([]);
  });
  it.each(['barbarian/bash', 'sorceress/ice_blast', 'sorceress.ice-blast'])(
    'refuses nonexact registry shorthand%s even beside real allocations', id => {
      expect(projectPlayerClassActives(owner({ skillOrder: [id],
        skillLevels: { 'barbarian.bash': 20, 'sorceress.ice_bolt': 1, 'sorceress.ice_blast': 20 } })).skillOrder).toEqual([]);
    });
  it('never auto-slots learned actives or accepts inherited allocation properties', () => {
    expect(projectPlayerClassActives(owner({ skillOrder: [], skillLevels: { 'barbarian.bash': 20 } })).skillOrder).toEqual([]);
    const skillLevels: Record<string, number> = {};
    Object.setPrototypeOf(skillLevels, { 'barbarian.bash': 20 });
    expect(projectPlayerClassActives(owner({ skillLevels })).skillOrder).toEqual([]);
  });
  it('rejects known passive/aura priorities but leaves generic registered-extension identities untouched', () => {
    const skillOrder = ['barbarian.iron_skin', 'skills-paladin-might', 'fixture.skill', 'monster-weak-melee'];
    expect(projectPlayerClassActives(owner({ skillOrder })).skillOrder).toEqual(['fixture.skill', 'monster-weak-melee']);
    expect(skillOrder).toHaveLength(4);
  });
  it.each(['amazon.piercing_strike', 'skills-amazon-piercing-strike', 'barbarian.not_authored'])(
    'refuses class identity%s without an authoritative JSON definition', id => {
      expect(projectPlayerClassActives(owner({ skillOrder: [id], skillLevels: { [id]: 20 } })).skillOrder).toEqual([]);
    });
  it('delegates D06 summons/corpse spells and D10 actives without replacing their authority', () => {
    const p = owner({ skillOrder: ['necromancer.iron_golem', 'skills-necromancer-raise-skeleton',
      'skills-sorceress-fire-bolt', 'sorceress.blaze', 'sorceress.chain_lightning', 'item.redemption',
      'necromancer.corpse_explosion', 'skills-necromancer-poison-explosion'],
    skillLevels: { 'skills-sorceress-fire-bolt': 3 } });
    expect(projectPlayerClassActives(p)).toEqual({ skillOrder: p.skillOrder, skillLevels: p.skillLevels });
  });
  it('copies authored unlock/cap/prerequisite metadata and rejects cycles/missing prerequisites', () => {
    const first = { id: 'skills-barbarian-first', trigger: 'active' as const, minLevel: 1, maxLevel: 3 };
    const second = { id: 'skills-barbarian-second', trigger: 'active' as const, minLevel: 6, maxLevel: 4,
      prerequisites: ['skills-barbarian-first'] };
    const catalog = { barbarian: [first, second] };
    const project = createClassActiveProjector(catalog);
    first.maxLevel = 1; second.minLevel = 100; second.prerequisites.push('skills-barbarian-missing'); catalog.barbarian.length = 0;
    const p = owner({ level: 6, skillOrder: ['barbarian.second'], skillLevels: { 'barbarian.first': 3, 'barbarian.second': 4 } });
    expect(project(p)).toEqual({ skillOrder: ['barbarian.second'], skillLevels: p.skillLevels });
    for (const prerequisite of ['skills-barbarian-first', 'skills-barbarian-missing']) {
      const invalid: ClassActiveOwnershipCatalog = { barbarian: [{ ...first, maxLevel: 3,
        prerequisites: [prerequisite] }, { ...second, minLevel: 6, prerequisites: ['skills-barbarian-first'] }] };
      expect(createClassActiveProjector(invalid)(p).skillOrder).toEqual([]);
    }
  });
  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid authored cap/unlock%s', invalid => {
    const row = { id: 'skills-barbarian-first', trigger: 'active' as const, minLevel: 1, maxLevel: 20 };
    for (const field of ['minLevel', 'maxLevel'] as const) {
      const project = createClassActiveProjector({ barbarian: [{ ...row, [field]: invalid }] });
      expect(project(owner({ skillOrder: ['barbarian.first'], skillLevels: { 'barbarian.first': 1 } })).skillOrder).toEqual([]);
    }
  });
});
