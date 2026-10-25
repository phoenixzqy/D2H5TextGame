import { describe, expect, it } from 'vitest';
import { monsters } from '../../data';
import { GameDataValidationError, validateGameData } from '../../data/loader';
import monsterSchema from '../../data/schema/monster.schema.json';
import type { MonsterDef } from '../types/monsters';
import { createRng } from '../rng';
import { buildMonsterUnit } from './monster-factory';

const undeadIds = [
  'monsters/act1.zombie', 'monsters/act1.corpsefire', 'monsters/act1.hungry-dead',
  'monsters/act1.ghoul', 'monsters/act1.ghost', 'monsters/act1.wraith',
  'monsters/act1.returned', 'monsters/act1.bone-warrior', 'monsters/act1.returned-archer',
  'monsters/act1.burning-dead-mage', 'monsters/act1.bone-ash', 'monsters/act1.griswold', 'monsters/act1.blood-raven',
  'monsters/act2.mummy', 'monsters/act2.greater-mummy', 'monsters/act2.burning-dead-archer',
  'monsters/act2.horadrim-ancient', 'monsters/act2.ancient-kaa', 'monsters/act2.radament',
  'monsters/act2.horror-mage', 'monsters/act2.cantor', 'monsters/act2.dark-elder',
  'monsters/act2.undead-scavenger', 'monsters/act2.undead-flayer',
  'monsters/act4.abyss-knight', 'monsters/act4.stygian-doll', 'monsters/act4.damned',
  'monsters/act4.doom-caster', 'monsters/act4.oblivion-knight'
];
const sample = monsters[0];
if (!sample) throw new Error('Missing production monster');

function build(def: MonsterDef) {
  return buildMonsterUnit({ def, level: 24, tier: 'elite', rng: createRng(42), id: 'arbitrary-instance' });
}

describe('authored undead identity boundary', () => {
  it('explicitly classifies every current archetype with the reviewed positive set', () => {
    expect(monsters).toHaveLength(109);
    for (const monster of monsters) {
      expect(Object.hasOwn(monster, 'undead'), monster.id).toBe(true);
      expect(typeof Reflect.get(monster, 'undead'), monster.id).toBe('boolean');
    }
    expect(monsters.filter(monster => Reflect.get(monster, 'undead') === true).map(monster => monster.id).sort())
      .toEqual([...undeadIds].sort());
  });
  it('accepts literal booleans while retaining absent legacy definitions as unclassified', () => {
    for (const undead of [true, false]) {
      expect(() => validateGameData(monsterSchema.$id, { ...sample, undead })).not.toThrow();
    }
    const legacy = { ...sample }; Reflect.deleteProperty(legacy, 'undead');
    expect(() => validateGameData(monsterSchema.$id, legacy)).not.toThrow();
    expect(build(legacy)).not.toHaveProperty('undead');
  });
  it.each(['true', 1, 0, null, {}, []])('rejects non-boolean authored identity %j', undead => {
    expect(() => validateGameData(monsterSchema.$id, { ...sample, undead })).toThrow(GameDataValidationError);
  });
  it('copies literal authored true independently of names, archetype and instance IDs without changing RNG or stats', () => {
    const definition = { ...sample, id: 'monsters/act1.fallen', name: 'Fallen', undead: true };
    const before = structuredClone(definition), marked = build(definition);
    expect(marked).toHaveProperty('undead', true); expect(definition).toEqual(before);
    const ordinary = build({ ...definition, undead: false });
    const { undead: _authored, ...legacy } = definition;
    expect(ordinary).not.toHaveProperty('undead');
    expect(build(legacy)).toEqual(ordinary);
    const { undead: _marker, ...rest } = marked as typeof marked & { undead?: true };
    expect(rest).toEqual(ordinary);
    expect(build({ ...definition, id: 'monsters/act1.zombie', name: 'Undead zombie', undead: false })).not.toHaveProperty('undead');
  });
  it('never coerces a truthy malformed direct definition into an undead combat identity', () => {
    const malformed = { ...sample, undead: 'true' } as unknown as MonsterDef;
    expect(build(malformed)).not.toHaveProperty('undead');
  });
});
