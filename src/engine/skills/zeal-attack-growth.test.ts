import { beforeEach, expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';
import { loadDefaultSkills } from './registry';
import { runBattleRecorded, type CombatSnapshot } from '../combat/combat';
import type { CombatUnit } from '../combat/types';

const row = PLAYABLE_CLASS_SKILL_DATA.paladin.find(skill => skill.id === 'skills-paladin-zeal');
if (!row) throw new Error('Missing authored Zeal');
const validate = createSkillValidator();
beforeEach(loadDefaultSkills);

function firstDamage(rank: number, attack: number, defense = 10, physical = 25): number {
  const hero: CombatUnit = {
    id: 'hero', name: 'Zeal Attack regression', side: 'player', kind: 'hero', tier: 'trash',
    level: 28, life: 5000, mana: 5000, cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: ['paladin.zeal'], skillLevels: { 'paladin.zeal': rank },
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: 1701 }],
    stats: { life: 5000, lifeMax: 5000, mana: 5000, manaMax: 5000, attack, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0,
      magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }
  };
  const enemy: CombatUnit = { ...hero, id: 'enemy', kind: 'monster', side: 'enemy',
    life: 100000, mana: 0, skillOrder: [], skillLevels: {},
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: 0 }],
    stats: { ...hero.stats, life: 100000, lifeMax: 100000, defense,
      resistances: { ...hero.stats.resistances, physical } } };
  const input: CombatSnapshot = { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  const hit = out.events.find(e => e.kind === 'damage' && e.source === 'hero');
  if (!hit || hit.kind !== 'damage') throw new Error('Missing paid Zeal hit');
  expect(hit.dodged).toBe(false);
  expect(out.events.filter(e => e.kind === 'action')).toHaveLength(1);
  expect(out.result.playerTeam[0]?.mana).toBe(4990);
  return hit.amount;
}

it('uses equipment Attack only above rank1 and still applies resistance and Defense', () => {
  expect(firstDamage(1, 200)).toBe(firstDamage(1, 100));
  expect(firstDamage(2, 200) - firstDamage(2, 100)).toBe(15);
  expect(firstDamage(20, 200) - firstDamage(20, 100)).toBe(285);
  expect(firstDamage(20, 342, 142, 50)).toBeGreaterThan(500);
});

it('authors and registers the existing cleave with ranked Attack, one cost and no bypass', () => {
  expect(row).toMatchObject({ target: 'area-enemies', aoeShape: 'cross', maxTargets: 3,
    requiredLevel: 12, maxLevel: 20, cooldown: 1, cost: { mana: 10 },
    damage: { min: 40, max: 60 }, scaling: { damagePerLevel: 4, attackDamagePctPerLevel: 20 } });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'paladin.zeal',
    effects: [{ kind: 'damage', base: [40, 60], perRank: [4, 4], attackDamagePctPerRank: 20 }] });
  expect(registeredSkillFromJson(row).effects[0]).not.toHaveProperty('ignoresDefense');
});

it.each([0, 1, 2, 19, 20])('previews current/next/MAX ranked Attack without mutating rank%i data', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined))
    expect(stats).toMatchObject({ additionalAttackPercent: 20 * (stats.rank - 1), maxTargets: 3,
      damage: [{ type: 'physical', min: 40 + 4 * (stats.rank - 1), max: 60 + 4 * (stats.rank - 1) }] });
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});

it('requires finite nonnegative growth and rejects moving it to unrelated Paladin skills', () => {
  const scaling = { ...row.scaling }; Reflect.deleteProperty(scaling, 'attackDamagePctPerLevel');
  expect(validate({ ...row, scaling })).toBe(false);
  for (const value of [-1, '20', null, Infinity, NaN])
    expect(validate({ ...row, scaling: { ...row.scaling, attackDamagePctPerLevel: value } })).toBe(false);
  const sacrifice = PLAYABLE_CLASS_SKILL_DATA.paladin.find(s => s.id === 'skills-paladin-sacrifice');
  expect(validate(sacrifice)).toBe(true);
  expect(validate({ ...sacrifice, scaling: { ...sacrifice?.scaling, attackDamagePctPerLevel: 20 } })).toBe(false);
});
