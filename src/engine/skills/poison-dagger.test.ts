import { expect, it } from 'vitest';
import rows from '@/data/skills/necromancer.json';
import { PLAYABLE_CLASS_SKILL_DATA } from '@/engine/skills/dataCatalog';
import { computeSkillDisplayModel } from '@/engine/skills/displayStats';
import { createSkillValidator } from '@/engine/skills/skill-validator';
import { resolvePoisonExplosionDefinition } from '@/engine/skills/poison-explosion';

const dagger = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(row => row.id === 'skills-necromancer-poison-dagger');
if (!dagger) throw new Error('Missing authored Dagger');
const validate = createSkillValidator<unknown>();

it('authors damaging Dagger without changing direct damage, unlock, resources or prerequisite compatibility', () => {
  expect(dagger).toMatchObject({ requiredLevel: 6, trigger: 'active', target: 'single-enemy',
    cooldown: 1, minLevel: 1, maxLevel: 20, cost: { mana: 5 },
    damage: { min: 25, max: 40, breakdown: { poison: 40 } }, damageType: 'poison',
    appliesStatus: ['poison'], appliesTags: ['poison'], scaling: { damagePerLevel: 5 },
    statusEffect: { dotPctOfDamage: 0.05 } });
  expect(dagger.prerequisites).toBeUndefined();
  expect(validate(dagger)).toBe(true);
  expect(resolvePoisonExplosionDefinition(rows)).toMatchObject({ requiredLevel: 18,
    maxRank: 20, daggerMaxRank: 20, manaCost: 15, cooldown: 2, poisonPct: 0.05 });
});

it.each([undefined, {}, { dotPctOfDamage: 0 }, { dotPctOfDamage: -0.05 },
  { dotPctOfDamage: NaN }, { dotPctOfDamage: Infinity }, { dotPctOfDamage: '0.05' },
  { dotPctOfDamage: 0.05, chance: 0 }, { dotPctOfDamage: 0.05, stacksOnApply: 2 }])(
  'schema refuses missing, invalid or additional Dagger status semantics %#', statusEffect => {
    const changed = { ...dagger, statusEffect };
    if (statusEffect === undefined) Reflect.deleteProperty(changed, 'statusEffect');
    expect(validate(changed)).toBe(false);
  });

it.each([0, 1, 2, 19, 20])('previews actual Dagger rank%s/current-next/MAX without guessed final DPS', rank => {
  const before = structuredClone(dagger), model = computeSkillDisplayModel(dagger, rank);
  const current = rank === 0 ? model.next : model.current;
  expect(current?.periodic).toEqual({ statusId: 'poison', percentOfHit: 5,
    durationSeconds: 5, maxStacks: 10, minDps: 1 });
  expect(current?.totalDamage).toEqual({ min: 25 + 5 * (Math.max(1, rank) - 1),
    max: 40 + 5 * (Math.max(1, rank) - 1) });
  expect(current?.manaCost).toBe(5);
  expect(current?.cooldown).toBe(1);
  if (rank > 0 && rank < 20)
    expect(model.next?.totalDamage).toEqual({ min: 25 + 5 * rank, max: 40 + 5 * rank });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(dagger).toEqual(before);
});
