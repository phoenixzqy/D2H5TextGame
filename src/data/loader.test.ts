/**
 * Tests for data loader
 */

import { describe, it, expect } from 'vitest';
import { validateGameData, loadGameData, GameDataValidationError } from './loader';
import monsterSchema from './schema/monster.schema.json';
import skillSchema from './schema/skill.schema.json';
import necromancerSkills from './skills/necromancer.json';
import sorceressSkills from './skills/sorceress.json';
import { skills, mainQuests, sideQuests } from './index';
import type { DamageEffect } from '../engine/skills/effects';

describe('data/loader', () => {
  describe('opt-in secondary Freeze representation', () => {
    const authoredFrost = sorceressSkills.find((skill) => skill.id === 'skills-sorceress-frost-nova');
    if (!authoredFrost) throw new Error('Production Frost Nova definition is missing');
    // Keep opt-out controls valid after the separately tested behavior child opts in.
    const frost: Record<string, unknown> = { ...authoredFrost };
    delete frost.additionalStatusEffects;
    const optedIn = { ...frost, additionalStatusEffects: { freeze: { chance: 0.1 } } };

    it('accepts adding only reviewed secondary metadata to the valid actual Frost row', () => {
      expect(() => validateGameData(skillSchema.$id, frost)).not.toThrow();
      let caught: unknown;
      try {
        validateGameData(skillSchema.$id, optedIn);
      } catch (error) {
        caught = error;
      }
      if (caught instanceof GameDataValidationError) {
        // Pin the genuine pre-fix cause separately from invalid-fixture controls.
        expect(caught.errors).toEqual([expect.objectContaining({
          keyword: 'additionalProperties',
          instancePath: '',
          params: { additionalProperty: 'additionalStatusEffects' }
        })]);
      }
      expect(caught).toBeUndefined();
    });

    it.each([
      { chance: 0 }, { chance: 0.1 }, { chance: 1 },
      { chance: 0.1, stacksOnApply: 1 }, { chance: 0.1, stacksOnApply: 3 },
      { chance: 0.1, dotPctOfDamage: 0 }, { chance: 0.1, dotPctOfDamage: 0.25 }
    ])('accepts explicit chance boundaries and optional generic on-hit fields: %j', (freeze) => {
      expect(() => validateGameData(skillSchema.$id, {
        ...optedIn, additionalStatusEffects: { freeze }
      })).not.toThrow();
    });

    it.each(['chill', 'burn', 'fixture-unknown-primary'])(
      'accepts any nonempty non-Freeze primary without adding a status registry enum: %s', (primary) => {
        expect(() => validateGameData(skillSchema.$id, {
          ...optedIn, appliesStatus: [primary, 'freeze']
        })).not.toThrow();
      }
    );

    it.each([
      {}, null, [], 'freeze', 1,
      { freeze: {} }, { freeze: null }, { freeze: [] }, { freeze: 0.1 },
      { freeze: { chance: -0.01 } }, { freeze: { chance: 1.01 } },
      { freeze: { chance: '0.1' } }, { freeze: { chance: null } },
      { freeze: { chance: 0.1, stacksOnApply: 0 } },
      { freeze: { chance: 0.1, stacksOnApply: 1.5 } },
      { freeze: { chance: 0.1, stacksOnApply: '1' } },
      { freeze: { chance: 0.1, dotPctOfDamage: -0.01 } },
      { freeze: { chance: 0.1, dotPctOfDamage: '0.25' } },
      { burn: { chance: 0.1 } },
      { freeze: { chance: 0.1 }, burn: { chance: 0.1 } },
      { freeze: { chance: 0.1, typo: true } },
      { freeze: { chance: 0.1, durationMs: 1000 } },
      { freeze: { chance: 0.1, physicalResistReductionPct: 50 } }
    ].map((additionalStatusEffects) => ({ additionalStatusEffects })))(
      'rejects malformed, unsupported or misplaced secondary metadata: %j', ({ additionalStatusEffects }) => {
        expect(() => validateGameData(skillSchema.$id, {
          ...frost, additionalStatusEffects
        })).toThrow(GameDataValidationError);
      }
    );

    it.each([
      [], ['chill'], ['freeze'], ['freeze', 'chill'], ['freeze', 'freeze'],
      ['chill', 'burn'], ['', 'freeze'], [1, 'freeze'],
      ['chill', 'burn', 'freeze'], ['chill', 'chill', 'freeze'],
      ['chill', 'freeze', 'freeze'], null, 'chill'
    ].map((appliesStatus) => ({ appliesStatus })))(
      'rejects opt-in status lists outside the closed two-entry contract: %j', ({ appliesStatus }) => {
        expect(() => validateGameData(skillSchema.$id, {
          ...optedIn, appliesStatus
        })).toThrow(GameDataValidationError);
      }
    );

    it.each(['appliesStatus', 'damage', 'damageType'] as const)(
      'requires %s only when opting into secondary metadata', (key) => {
        const missing = Object.fromEntries(Object.entries(optedIn).filter(([name]) => name !== key));
        expect(() => validateGameData(skillSchema.$id, missing)).toThrow(GameDataValidationError);
        delete missing.additionalStatusEffects;
        expect(() => validateGameData(skillSchema.$id, missing)).not.toThrow();
      }
    );

    it.each([
      [], ['freeze'], ['freeze', 'chill'], ['chill', 'chill'],
      ['chill', 'burn', 'freeze'], ['chill', 'chill', 'freeze'], ['']
    ].map((appliesStatus) => ({ appliesStatus })))(
      'preserves the identical legacy opt-out status list: %j', ({ appliesStatus }) => {
        expect(() => validateGameData(skillSchema.$id, { ...frost, appliesStatus })).not.toThrow();
      }
    );

    it('keeps all 283 authored rows and their central loaded definitions unchanged', async () => {
      const before = JSON.stringify(skills);
      expect(skills).toHaveLength(283);
      const loaded = await loadGameData();
      expect([...loaded.skills.values()]).toEqual(skills);
      expect(JSON.stringify(skills)).toBe(before);
    });

    it('types scalar, no-status and readonly nonempty plural damage as exclusive alternatives', () => {
      const base = { kind: 'damage', damageType: 'cold', base: [25, 35] } as const;
      const scalar: DamageEffect = { ...base, applyStatus: { id: 'chill' } };
      const plain: DamageEffect = base;
      const statuses = [{ id: 'chill' }, { id: 'freeze', chance: 0.1 }] as const;
      const plural: DamageEffect = { ...base, applyStatuses: statuses };
      // @ts-expect-error -- scalar and full plural forms must never coexist.
      const both: DamageEffect = { ...base, applyStatus: { id: 'chill' }, applyStatuses: statuses };
      // @ts-expect-error -- a plural form must contain at least one status.
      const empty: DamageEffect = { ...base, applyStatuses: [] };
      expect([scalar, plain, plural, both, empty]).toHaveLength(5);
    });
  });

  describe('validateGameData', () => {
    describe('monster validation', () => {
      it('accepts valid monster definition', () => {
        const validMonster = {
          id: 'monsters/test-monster',
          name: 'Test Monster',
          life: [10, 20],
          lifeGrowth: [2, 4],
          skills: ['basic-attack'],
          baseExperience: 100
        };

        expect(() => {
          validateGameData(monsterSchema.$id, validMonster);
        }).not.toThrow();
      });

      it('rejects monster with invalid ID format', () => {
        const invalid = {
          id: 'invalid-id',
          name: 'Test',
          life: [10, 20],
          lifeGrowth: [2, 4],
          skills: ['basic-attack'],
          baseExperience: 100
        };

        expect(() => {
          validateGameData(monsterSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });

      it('rejects monster with missing required fields', () => {
        const invalid = {
          id: 'monsters/test',
          name: 'Test'
          // missing life, lifeGrowth, skills, baseExperience
        };

        expect(() => {
          validateGameData(monsterSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });

      it('rejects monster with invalid life range', () => {
        const invalid = {
          id: 'monsters/test',
          name: 'Test',
          life: [10], // should be [min, max]
          lifeGrowth: [2, 4],
          skills: ['basic-attack'],
          baseExperience: 100
        };

        expect(() => {
          validateGameData(monsterSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });

      it('rejects monster with additional properties', () => {
        const invalid = {
          id: 'monsters/test',
          name: 'Test',
          life: [10, 20],
          lifeGrowth: [2, 4],
          skills: ['basic-attack'],
          baseExperience: 100,
          unknownProperty: 'should not be here'
        };

        expect(() => {
          validateGameData(monsterSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });

      it('accepts optional fields', () => {
        const valid = {
          id: 'monsters/test',
          name: 'Test',
          life: [10, 20],
          lifeGrowth: [2, 4],
          skills: ['basic-attack'],
          baseExperience: 100,
          attackSpeed: 15,
          defense: 50,
          resistances: {
            fire: 25,
            cold: -10
          },
          canBeElite: true,
          canBeBoss: false,
          eliteAffixes: ['extra-strong', 'fire-enchanted']
        };

        expect(() => {
          validateGameData(monsterSchema.$id, valid);
        }).not.toThrow();
      });
    });

    describe('skill validation', () => {
      const amplify = necromancerSkills.find((skill) => skill.id === 'skills-necromancer-amplify-damage');
      if (!amplify) throw new Error('Production Amplify Damage definition is missing');

      it('authors the reviewed Amplify Damage defaults in the actual production row', () => {
        expect(amplify).toMatchObject({
          statusEffect: { durationMs: 3000, physicalResistReductionPct: 50 }
        });
      });

      it.each([undefined, {}, { durationMs: 3000 }, { physicalResistReductionPct: 50 }])(
        'requires complete metadata for the exact production Amplify Damage row: %j', (statusEffect) => {
          expect(() => validateGameData(skillSchema.$id, { ...amplify, statusEffect }))
            .toThrow(GameDataValidationError);
        }
      );

      it('accepts explicit zero metadata on Amplify Damage', () => {
        expect(() => validateGameData(skillSchema.$id, {
          ...amplify, statusEffect: { durationMs: 0, physicalResistReductionPct: 0 }
        })).not.toThrow();
      });

      it.each([undefined, {}, { durationMs: 3000 }, { physicalResistReductionPct: 50 }])(
        'keeps metadata optional for another skill ID: %j', (statusEffect) => {
          expect(() => validateGameData(skillSchema.$id, {
            ...amplify, id: 'skills-fixture-status-metadata', statusEffect
          })).not.toThrow();
        }
      );

      it('validates every actual skill row against the updated schema', () => {
        expect(skills.length).toBeGreaterThan(0);
        for (const skill of skills) {
          expect(() => validateGameData(skillSchema.$id, skill, skill.id)).not.toThrow();
        }
      });

      it('accepts valid skill definition', () => {
        const validSkill = {
          id: 'fireball',
          name: 'Fireball',
          description: 'Hurls a fiery projectile',
          trigger: 'active',
          target: 'single-enemy',
          cooldown: 3,
          minLevel: 1,
          maxLevel: 20,
          damage: {
            min: 10,
            max: 20,
            breakdown: {
              fire: 15
            }
          },
          damageType: 'fire'
        };

        expect(() => {
          validateGameData(skillSchema.$id, validSkill);
        }).not.toThrow();
      });

      it('rejects skill with invalid trigger type', () => {
        const invalid = {
          id: 'test',
          name: 'Test',
          description: 'Test',
          trigger: 'invalid-trigger',
          target: 'self',
          cooldown: 0,
          minLevel: 1,
          maxLevel: 1
        };

        expect(() => {
          validateGameData(skillSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });

      it('accepts skill with synergies', () => {
        const valid = {
          id: 'lightning-strike',
          name: 'Lightning Strike',
          description: 'Strike with lightning',
          trigger: 'active',
          target: 'single-enemy',
          cooldown: 2,
          minLevel: 1,
          maxLevel: 20,
          damageType: 'lightning',
          synergies: {
            cold: 1.5, // 50% more damage if target is chilled
            chill: 2.0
          }
        };

        expect(() => {
          validateGameData(skillSchema.$id, valid);
        }).not.toThrow();
      });

      it('rejects skill with negative cooldown', () => {
        const invalid = {
          id: 'test',
          name: 'Test',
          description: 'Test',
          trigger: 'active',
          target: 'self',
          cooldown: -1,
          minLevel: 1,
          maxLevel: 1
        };

        expect(() => {
          validateGameData(skillSchema.$id, invalid);
        }).toThrow(GameDataValidationError);
      });
    });

    describe('error handling', () => {
      it('throws GameDataValidationError with file path', () => {
        const invalid = { id: 'bad' };

        try {
          validateGameData(monsterSchema.$id, invalid, 'test.json');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(GameDataValidationError);
          if (error instanceof GameDataValidationError) {
            expect(error.filePath).toBe('test.json');
            expect(error.errors).toBeDefined();
            expect(error.message).toContain('test.json');
          }
        }
      });
    });
  });
});

describe('quest document validation', () => {
  const schemaId = 'https://d2h5.game/schemas/quest.json';
  const talk = { id: 'obj-talk', type: 'talk', description: 'Talk.', npcId: 'npc/akara' };
  const quest = {
    id: 'quests/schema-fixture', name: 'Schema fixture', type: 'side',
    actId: 'acts/act1', description: 'Schema fixture.', objectives: [talk]
  };
  const document = (entry: object = quest) => ({
    $schema: '../schema/quest.schema.json', quests: [entry]
  });
  const objective = (fields: object) => ({ id: 'obj-fixture', description: 'Fixture.', ...fields });
  const validate = (value: unknown) => validateGameData(schemaId, value, 'quest-fixture');

  it('validates both complete authored documents and collects every quest in order', async () => {
    expect(() => validate(mainQuests)).not.toThrow();
    expect(() => validate(sideQuests)).not.toThrow();
    const loaded = await loadGameData();
    expect([...loaded.quests.keys()]).toEqual([...mainQuests.quests, ...sideQuests.quests].map(q => q.id));
  });

  it('covers every authored objective kind rather than only the talk path', () => {
    const kinds = [...new Set([...mainQuests.quests, ...sideQuests.quests].flatMap(
      q => (q as typeof quest).objectives.map(o => o.type)
    ))].sort();
    expect(kinds).toEqual([
      'clear-area', 'collect', 'deliver', 'fetch', 'gamble', 'hire-mercenary',
      'interact', 'kill', 'kill-boss', 'kill-boss-group', 'rescue', 'survive-waves',
      'talk', 'transmute', 'use-item'
    ]);
  });

  it.each([null, [], {}, { quests: {} }, { quests: [null] }, { quests: [quest], typo: true }].map(value => ({ value })))(
    'rejects a malformed document envelope: %j', ({ value }) => {
      expect(() => validate(value)).toThrow(GameDataValidationError);
    }
  );

  it.each(['id', 'name', 'type', 'actId', 'description', 'objectives'])(
    'requires quest field %s', field => {
      const invalid = { ...quest };
      Reflect.deleteProperty(invalid, field);
      expect(() => validate(document(invalid))).toThrow(GameDataValidationError);
    }
  );

  it.each([
    { id: 'bare-quest' }, { name: '' }, { description: '' }, { type: 'daily' },
    { actId: 'acts/act6' }, { giver: 'monsters/akara' }, { unlocks: 'npc/akara' },
    { prerequisites: ['areas/act1-den-of-evil'] }, { prerequisites: 'quests/previous' },
    { order: 0 }, { order: -1 }, { order: 1.5 }, { objectives: [] }, { unknownQuestField: true }
  ])('rejects malformed quest metadata: %j', fields => {
    expect(() => validate(document({ ...quest, ...fields }))).toThrow(GameDataValidationError);
  });

  it('preserves bounty, object givers, null unlocks and namespaced prerequisites', () => {
    expect(() => validate(document({ ...quest, type: 'bounty', giver: 'objects/moldy_tome',
      unlocks: null, prerequisites: ['quests/previous'], order: 1
    }))).not.toThrow();
  });

  it.each(['areas/act1-den-of-evil', 'services/identify', 'acts/act2', 'difficulty/nightmare'])(
    'accepts the authored unlock namespace %s', unlocks => {
      expect(() => validate(document({ ...quest, unlocks }))).not.toThrow();
    }
  );

  it.each(['id', 'type', 'description', 'npcId'])(
    'requires talk objective field %s', field => {
      const invalid = { ...talk };
      Reflect.deleteProperty(invalid, field);
      expect(() => validate(document({ ...quest, objectives: [invalid] }))).toThrow(GameDataValidationError);
    }
  );

  it.each([
    { type: 'unknown' }, { type: 'talk', npcId: 'monsters/akara' },
    { type: 'talk', npcId: 'npc/akara', targetId: 'npc/akara' },
    { type: 'clear-area' }, { type: 'collect', itemId: 'quest/gland', areaId: 'areas/cave' },
    { type: 'fetch', itemId: 'quest/malus' }, { type: 'gamble' },
    { type: 'hire-mercenary', mercId: 'npc/kashya' },
    { type: 'kill', targetId: 'npc/akara', areaId: 'areas/cave' },
    { type: 'kill-boss', targetId: 'monsters/boss' },
    { type: 'kill-boss-group', targetId: 'monsters/ancients' },
    { type: 'rescue', targetId: 'npc/prisoner', areaId: 'areas/cave' },
    { type: 'survive-waves', areaId: 'areas/throne' },
    { type: 'transmute', recipe: '' }, { type: 'use-item', itemId: 'npc/akara' },
    { type: 'interact', targetId: 'monsters/boss', areaId: 'areas/cave' },
    { type: 'interact', targetId: 'objects/altar' },
    { type: 'interact', targetId: 'objects/altar', itemRequired: 'npc/akara' },
    { type: 'deliver', npcId: 'npc/charsi' },
    { type: 'deliver', npcId: 'npc/charsi', itemId: 'quest/malus' },
    { type: 'deliver', npcId: 'npc/charsi', itemFilter: 'rare' },
    { type: 'deliver', npcId: 'npc/charsi', itemFilter: 'normal', itemId: 'quest/malus', count: 1 },
    { type: 'deliver', npcId: 'npc/charsi', itemFilter: 'any', count: 1 }
  ])('rejects missing, wrong or unrelated kind-specific fields: %j', fields => {
    expect(() => validate(document({ ...quest, objectives: [objective(fields)] })))
      .toThrow(GameDataValidationError);
  });

  it.each([0, -1, 1.5])('rejects nonpositive or fractional counts and waves: %s', value => {
    for (const fields of [
      { type: 'collect', itemId: 'quest/gland', areaId: 'areas/cave', count: value },
      { type: 'deliver', npcId: 'npc/charsi', itemId: 'quest/malus', count: value },
      { type: 'gamble', count: value },
      { type: 'kill', targetId: 'monsters/fallen', areaId: 'areas/cave', count: value },
      { type: 'rescue', targetId: 'npc/prisoner', areaId: 'areas/cave', count: value },
      { type: 'survive-waves', areaId: 'areas/throne', waves: value }
    ]) {
      expect(() => validate(document({ ...quest, objectives: [objective(fields)] })))
        .toThrow(GameDataValidationError);
    }
  });

  it.each([
    { type: 'deliver', npcId: 'npc/charsi', itemFilter: 'normal' },
    { type: 'deliver', npcId: 'npc/larzuk', itemFilter: 'any' },
    { type: 'deliver', npcId: 'npc/meshif', itemId: 'quest/jade_trinket', count: 3 },
    { type: 'interact', targetId: 'objects/orifice', itemRequired: 'quest/horadric_staff' },
    { type: 'interact', targetId: 'objects/hellforge', itemRequired: 'items/soulstone_mephisto' },
    { type: 'interact', targetId: 'objects/altar', areaId: 'areas/cave', itemRequired: 'quest/key' },
    { type: 'kill', targetId: 'monsters/act1.fallen-shaman', areaId: 'areas/act1-cave', count: 2 }
  ])('preserves the supported objective variant: %j', fields => {
    expect(() => validate(document({ ...quest, objectives: [objective(fields)] }))).not.toThrow();
  });

  const numericRewards = ['xp', 'gold', 'skillPoints', 'statPoints', 'runes', 'runeShards', 'gems', 'wishstones'];
  it('accepts authored zero rewards and the claim handler’s existing numeric fields', () => {
    expect(() => validate(document({ ...quest,
      rewards: Object.fromEntries(numericRewards.map(key => [key, 0]))
    }))).not.toThrow();
  });

  it.each(numericRewards)('requires a nonnegative integer %s reward', key => {
    for (const value of [-1, 0.5, '1', null]) {
      expect(() => validate(document({ ...quest, rewards: { [key]: value } })))
        .toThrow(GameDataValidationError);
    }
  });

  it.each([
    [], { unknownReward: 1 }, { stat: { strength: 5 } }, { stat: { life: -1 } },
    { stat: { attribute_points: 0.5 } }, { stat: [] }, { service: 'unknown_service' },
    { itemDrop: 'monsters/boss' }, { lootTable: 'items/ring' }, { mercenaryUnlock: 'npc/kashya' },
    { npcUnlock: 'objects/altar' }, { areaUnlock: 'acts/act2' },
    { vendorUnlock: 'npc/anya' }, { title: 'bare-title' }
  ].map(rewards => ({ rewards })))('rejects malformed or unknown rewards: %j', ({ rewards }) => {
    expect(() => validate(document({ ...quest, rewards }))).toThrow(GameDataValidationError);
  });

  // Replace only the test worker's bundled document and restore its exact original
  // properties/references even if an assertion fails; no loader mock hides integration.
  async function withDocument(file: object, replacement: object, check: () => Promise<void>): Promise<void> {
    const original = { ...file };
    const replace = (value: object) => {
      for (const key of Object.keys(file)) Reflect.deleteProperty(file, key);
      Object.assign(file, value);
    };
    replace(replacement);
    try { await check(); } finally { replace(original); }
  }

  async function rejectedDocument(context: string): Promise<unknown[]> {
    let failure: unknown;
    try { await loadGameData(); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(GameDataValidationError);
    if (!(failure instanceof GameDataValidationError)) throw new Error('Expected quest validation failure');
    expect(failure.filePath).toBe(context);
    return failure.errors;
  }

  it.each([
    ['mainQuests', mainQuests], ['sideQuests', sideQuests]
  ] as const)('loadGameData rejects a malformed %s objective with document/path context', async (context, file) => {
    const invalid = { ...quest, objectives: [objective({ type: 'clear-area' })] };
    await withDocument(file, document(invalid), async () => {
      const errors = await rejectedDocument(context);
      expect(errors).toContainEqual(expect.objectContaining({
        instancePath: '/quests/0/objectives/0', keyword: 'required',
        params: { missingProperty: 'areaId' }
      }));
    });
  });

  it.each([
    ['mainQuests', mainQuests], ['sideQuests', sideQuests]
  ] as const)('loadGameData refuses a missing %s quests envelope', async (context, file) => {
    await withDocument(file, { $schema: '../schema/quest.schema.json' }, async () => {
      const errors = await rejectedDocument(context);
      expect(errors).toContainEqual(expect.objectContaining({
        instancePath: '', keyword: 'required', params: { missingProperty: 'quests' }
      }));
    });
  });

  for (const [context, file] of [['mainQuests', mainQuests], ['sideQuests', sideQuests]] as const) {
    it.each([
      { name: '' }, { type: 'daily' }, { objectives: [] },
      { objectives: [objective({ type: 'unknown' })] },
      { rewards: { xp: -1 } }, { rewards: { skillPoints: 0.5 } },
      { rewards: { statPoints: '1' } }, { typo: true }
    ])(`loadGameData rejects malformed ${context} row: %j`, async fields => {
      await withDocument(file, document({ ...quest, ...fields }), async () => {
        const errors = await rejectedDocument(context);
        const paths = errors.flatMap(detail => typeof detail === 'object' && detail !== null &&
          'instancePath' in detail ? [detail.instancePath] : []);
        expect(paths.some(path => typeof path === 'string' && /^\/quests\/0(?:\/|$)/.test(path))).toBe(true);
      });
    });
  }

  it('preserves cross-document duplicate quest ID rejection', async () => {
    const first = mainQuests.quests[0];
    if (!first) throw new Error('Authored main quests are missing');
    await withDocument(sideQuests, { $schema: '../schema/quest.schema.json', quests: [first] }, async () => {
      await expect(loadGameData()).rejects.toThrow(`Duplicate quest id "${first.id}" in sideQuests`);
    });
  });
});
