import Ajv2020 from 'ajv/dist/2020';
import { afterEach, describe, expect, it, vi } from 'vitest';
import skillSchema from '../schema/skill.schema.json';
import monsterSchema from '../schema/monster.schema.json';

afterEach(() => { vi.restoreAllMocks(); });

describe('authored skill modules share compiled schema code', () => {
  it('reuses one validator across all 24 modules while preserving the monster validator', async () => {
    vi.resetModules();
    const compile = vi.spyOn(Ajv2020.prototype, 'compile');
    await Promise.all([
      import('../../engine/skills/frozen-armor'), import('../../engine/skills/iron-golem'),
      import('../../engine/skills/poison-explosion'), import('../../engine/skills/merc-holy-freeze'),
      import('../../engine/skills/cold-mastery'), import('../../engine/skills/skeletal-mage'),
      import('../../engine/skills/barbarian-endurance'), import('../../engine/skills/corpse-explosion'),
      import('../../engine/skills/golem-mastery'), import('../../engine/skills/armor-melt'),
      import('../../engine/skills/static-field'), import('../../engine/skills/blood-raven'),
      import('../../engine/skills/amazon-passives'), import('../../engine/skills/skeleton-mastery'),
      import('../../engine/skills/inner-sight'), import('../../engine/skills/merc-arrows'),
      import('../../engine/skills/lightning-mastery'), import('../../engine/skills/act1-lightning'),
      import('../../engine/skills/barbarian-weapon-masteries'), import('../../engine/skills/fire-mastery'),
      import('../../engine/skills/item-redemption'), import('../../engine/skills/might'),
      import('../../engine/skills/meditation'), import('../../engine/skills/iron-skin'),
    ]);
    const validatorsFor = (id: string) => compile.mock.calls.flatMap(([schema], index) => {
      const result = compile.mock.results[index];
      return typeof schema === 'object' && '$id' in schema && schema.$id === id &&
        result?.type === 'return' ? [result.value] : [];
    });
    const skillValidators = validatorsFor(skillSchema.$id), monsterValidators = validatorsFor(monsterSchema.$id);
    expect(skillValidators.length).toBeGreaterThan(0);
    expect.soft(new Set(skillValidators).size).toBe(1);
    expect(monsterValidators).toHaveLength(1);
    expect(skillValidators).not.toContain(monsterValidators[0]);
  });
});
