import { expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import rows from '../../data/skills/druid.json';
import schema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';
import { computeSkillDisplayModel } from './displayStats';
import { SPIRIT_OF_BARBS_IDS } from './spirit-of-barbs';
const validateSkill = new Ajv2020({ strict: true, allErrors: true }).compile<SkillDef>(schema);

it.each(SPIRIT_OF_BARBS_IDS)(
  'previews one passive spirit from the actual base template for %s',
  (id) => {
    const skill = rows.find((row) => row.id === SPIRIT_OF_BARBS_IDS[0]);
    if (!validateSkill(skill)) throw new Error('Missing or invalid authored Barbs row');
    for (const rank of [1, 20]) {
      const model = computeSkillDisplayModel({ ...skill, id }, rank);
      expect(model.current?.summonCap).toBe(1);
      expect(model.current?.summonUnit).toEqual({
        summonId: 'spirit_of_barbs',
        nameKey: 'details.summonName.spirit_of_barbs',
        stats: [
          { id: 'lifeMax', labelKey: 'details.summonStat.lifeMax', value: 80, valueKind: 'flat' },
          { id: 'attack', labelKey: 'details.summonStat.attack', value: 0, valueKind: 'flat' },
          { id: 'defense', labelKey: 'details.summonStat.defense', value: 10, valueKind: 'flat' }
        ]
      });
      expect(model.current?.cooldown).toBe(0);
      expect(model.current?.damage).toEqual([]);
      expect(model.current?.utility).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'thornsPct', value: rank * 0.04 }),
          expect.objectContaining({ id: 'summonDefensePct', value: rank * 0.02 })
        ])
      );
    }
    expect(
      computeSkillDisplayModel({ ...skill, id: 'foreign.spirit_of_barbs' }, 20).current?.summonUnit
    ).toBeUndefined();
  }
);
