import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import skills from '../../data/skills/druid.json';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const attacks = [
  { slug: 'werewolf-maul', type: 'physical', status: 'bleed', fraction: 0.1 },
  { slug: 'rabies', type: 'poison', status: 'poison', fraction: 0.05 },
  { slug: 'fire-claws', type: 'fire', status: 'burn', fraction: 0.1 }
];
describe.each(attacks)(
  'explicit authored Druid $slug periodic damage',
  ({ slug, type, status, fraction }) => {
    const row = skills.find((s) => s.id === 'skills-druid-' + slug);
    it('accepts its actual catalog row with explicit potency', () => {
      expect(validate(row)).toBe(true);
      expect(row).toMatchObject({ statusEffect: { dotPctOfDamage: fraction } });
    });
    it.each([
      undefined,
      {},
      { dotPctOfDamage: 0 },
      { dotPctOfDamage: -1 },
      { dotPctOfDamage: Infinity },
      { dotPctOfDamage: NaN },
      { dotPctOfDamage: fraction, typo: 1 }
    ])('rejects absent, invalid or misspelled metadata %#', (statusEffect) => {
      expect(validate({ ...row, statusEffect })).toBe(false);
    });
    it.each([
      { trigger: 'passive' },
      { damageType: type === 'cold' ? 'physical' : 'cold' },
      { appliesStatus: [] },
      { appliesStatus: ['chill'] },
      { appliesStatus: [status, 'stun'] },
      { target: 'all-enemies' },
      { damage: undefined }
    ])('rejects contradictory attack behavior %#', (patch) => {
      expect(validate({ ...row, statusEffect: { dotPctOfDamage: fraction }, ...patch })).toBe(
        false
      );
    });
  }
);
