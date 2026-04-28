/**
 * Tests for data loader
 */

import { describe, it, expect } from 'vitest';
import { validateGameData, GameDataValidationError } from './loader';
import monsterSchema from './schema/monster.schema.json';
import skillSchema from './schema/skill.schema.json';

describe('data/loader', () => {
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
