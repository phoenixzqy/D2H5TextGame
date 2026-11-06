import Ajv from 'ajv/dist/2020';
import { expect, it } from 'vitest';
import act5 from '../../data/maps/sub-areas/act5.json';
import monsters from '../../data/monsters/act5.json';
import elite from '../../data/elite/elite-config.json';
import schema from '../../data/schema/monster.schema.json';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';

const ancient = monsters.find(row => row.id === 'monsters/act5.ancient-barbarian');
const throne = act5.find(row => row.id === 'areas/act5-throne-of-destruction');
if (!ancient || !throne?.chapterBoss) throw new Error('Missing Act V boss budget');
const baalLife = throne.chapterBoss.hp * elite.chapterBossHpMultiplier;
const validate = new Ajv({ strict: true }).compile<MonsterDef>(schema);

it('BUG499 keeps the three native Ancients within the provisional final-boss health budget', () => {
  if (!validate(ancient)) throw new Error(JSON.stringify(validate.errors));
  const rng = createRng(499);
  const bosses = [0, 1, 2].map(index => buildMonsterUnit({ def: ancient,
    level: 75, tier: 'boss', rng, index }));
  const groupLife = bosses.reduce((sum, boss) => sum + boss.life, 0);
  expect(groupLife).toBeGreaterThanOrEqual(baalLife * .9);
  expect(groupLife).toBeLessThanOrEqual(baalLife * 1.25);
  expect(bosses.every(boss => boss.stats.attack === 804 && boss.stats.defense === 467 &&
    boss.stats.resistances.physical === 50 && boss.kind === 'monster')).toBe(true);
});

it('BUG499 retains a schema-valid hostile Ancient with its original signatures and rewards', () => {
  expect(validate(ancient), JSON.stringify(validate.errors)).toBe(true);
  expect(ancient).toMatchObject({ canBeBoss: true, canBeElite: false, baseExperience: 2000,
    skills: ['monster-whirlwind', 'monster-shout'], attack: [40, 40], attackGrowth: [6.25, 6.25],
    resistances: { physical: 50, fire: 25, cold: 25, lightning: 25, poison: 25, arcane: 25 } });
});
