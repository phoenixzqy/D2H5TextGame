import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '@/engine/skills/dataCatalog';
import { createSkillValidator } from '@/engine/skills/skill-validator';
const validate = createSkillValidator();
const contracts = [
  ['fend', 'cross', 5],
  ['exploding-arrow', 'box-3x3', 9],
  ['immolation-arrow', 'box-3x3', 9],
  ['lightning-fury', 'chain', undefined]
] as const;
for (const [slug, shape, cap] of contracts) {
  const row = PLAYABLE_CLASS_SKILL_DATA.amazon.find((s) => s.id === 'skills-amazon-' + slug);
  if (!row) throw new Error('Missing author data');
  it(slug + ' validates and carries its exact footprint/cap without source mutation', () => {
    const before = structuredClone(row);
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(registeredSkillFromJson(row)).toMatchObject({ target: 'area-enemies', aoeShape: shape });
    expect(registeredSkillFromJson(row).maxTargets).toBe(cap);
    expect(row).toEqual(before);
  });
  it(slug + ' rejects missing or foreign targeting and contradictory effect tuning', () => {
    const missing: Record<string, unknown> = { ...row };
    Reflect.deleteProperty(missing, 'aoeShape');
    expect(validate(missing)).toBe(false);
    if (cap !== undefined) {
      const missingCap: Record<string, unknown> = { ...row };
      Reflect.deleteProperty(missingCap, 'maxTargets');
      expect(validate(missingCap)).toBe(false);
    }
    for (const patch of [
      { id: 'skills-amazon-fire-arrow' },
      { target: 'all-enemies' },
      { maxTargets: cap === 9 ? 5 : 9 },
      { requiredLevel: 1 },
      { damageComposition: 'weighted-components' },
      { hitSequence: { strikes: 2 } },
      { damageType: 'arcane' }
    ])
      expect(validate({ ...row, ...patch }), JSON.stringify(patch)).toBe(false);
  });
}
it('all current playable rows remain schema-valid', () => {
  for (const rows of Object.values(PLAYABLE_CLASS_SKILL_DATA))
    for (const row of rows)
      expect(validate(row), row.id + JSON.stringify(validate.errors)).toBe(true);
});
