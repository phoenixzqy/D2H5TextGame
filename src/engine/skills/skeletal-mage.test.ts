import { describe, expect, it } from 'vitest';
import necromancerSkills from '../../data/skills/necromancer.json';
import { resolveSkeletalMageDefinition, SKELETAL_MAGE_DEFINITION } from './skeletal-mage';
import { getSkill, registerSkill } from './registry';

const MAGE = 'skills-necromancer-raise-skeletal-mage';
function authored(): Record<string, unknown> {
  const row = necromancerSkills.find(row => row.id === MAGE);
  if (!row) throw new Error('Missing authored Mage');
  return structuredClone(row);
}

describe('D06 immutable authored Mage element definition', () => {
  it('uses the production F/C/L/P cycle including index0 and largest safe index', () => {
    expect(SKELETAL_MAGE_DEFINITION.elements).toEqual(['fire', 'cold', 'lightning', 'poison']);
    expect(SKELETAL_MAGE_DEFINITION.elementAt(0)).toBe('fire');
    expect(SKELETAL_MAGE_DEFINITION.elementAt(-0)).toBe('fire');
    expect(SKELETAL_MAGE_DEFINITION.elementAt(Number.MAX_SAFE_INTEGER)).toBe('poison');
    expect(SKELETAL_MAGE_DEFINITION.maxRank).toBe(20);
    expect(Object.isFrozen(SKELETAL_MAGE_DEFINITION)).toBe(true);
    expect(Object.isFrozen(SKELETAL_MAGE_DEFINITION.elements)).toBe(true);
  });

  it.each([
    [1, ['fire']], [2, ['fire', 'cold']], [3, ['fire', 'cold', 'lightning']],
    [4, ['fire', 'cold', 'lightning', 'poison']],
    [8, ['fire', 'cold', 'lightning', 'poison', 'fire', 'cold', 'lightning', 'poison']]
  ] as const)('returns the literal fresh prefix for count%s without a counter', (count, expected) => {
    const read = () => Array.from({ length: count }, (_, index) => SKELETAL_MAGE_DEFINITION.elementAt(index));
    expect(read()).toEqual(expected);
    SKELETAL_MAGE_DEFINITION.elementAt(11);
    expect(read()).toEqual(expected);
  });

  it('copies reordered tuning and isolates source element edits, replacement and push', () => {
    const elements = ['poison', 'lightning', 'cold', 'fire'];
    const row = { ...authored(), summonBasicAttackElements: elements };
    const before = structuredClone(row);
    const definition = resolveSkeletalMageDefinition([null, { id: 'unrelated' }, row]);
    expect(row).toEqual(before);
    elements[0] = 'fire';
    elements.push('arcane');
    row.summonBasicAttackElements = ['cold'];
    expect(definition.elements).toEqual(['poison', 'lightning', 'cold', 'fire']);
    expect([0, 1, 2, 3, 4].map(index => definition.elementAt(index)))
      .toEqual(['poison', 'lightning', 'cold', 'fire', 'poison']);
    expect(SKELETAL_MAGE_DEFINITION.elementAt(0)).toBe('fire');
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.elements)).toBe(true);
  });

  it('copies the authored rank limit without retaining a source reference', () => {
    const row = { ...authored(), maxLevel: 7 };
    const definition = resolveSkeletalMageDefinition([row]);
    row.maxLevel = 3;
    expect(definition.maxRank).toBe(7);
    expect(SKELETAL_MAGE_DEFINITION.maxRank).toBe(20);
  });

  it.each([0, -1, 1.5, '20', null, undefined])('rejects invalid authored rank limit %s', maxLevel => {
    expect(() => resolveSkeletalMageDefinition([{ ...authored(), maxLevel }]))
      .toThrow('Invalid authored Skeletal Mage');
  });

  it.each([NaN, Infinity, -Infinity, -1, -0.1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE])('rejects invalid fresh index%s', index => {
      expect(() => SKELETAL_MAGE_DEFINITION.elementAt(index)).toThrow(RangeError);
    });

  it('rejects absent, foreign-only, and duplicate exact authored sources', () => {
    for (const rows of [[], [null, 1, 'mage'], [{ ...authored(), id: 'necromancer.raise_skeletal_mage' }],
      [{ ...authored(), id: MAGE + '-copy' }], [authored(), authored()]]) {
      expect(() => resolveSkeletalMageDefinition(rows)).toThrow('Expected exactly one authored Skeletal Mage');
    }
  });

  it.each([
    { summonBasicAttackElements: undefined }, { summonBasicAttackElements: [] },
    { summonBasicAttackElements: ['fire', 'cold', 'lightning', 'fire'] },
    { summonBasicAttackElements: ['fire', 'cold', 'lightning', 'arcane'] },
    { summonBasicAttackElements: ['fire', 'cold', 'lightning', 4] },
    { summonBasicAttackElements: ['fire', 'cold', 'lightning', 'poison'], typo: true },
    { summon: false }, { summon: undefined }, { summonId: 'skeleton' }, { summonId: undefined },
    { trigger: 'passive' }, { target: 'self' }, { cooldown: '1' }
  ])('fails malformed source/data without fallback or input mutation %j', fields => {
    const row = { ...authored(), ...fields };
    const before = structuredClone(row);
    expect(() => resolveSkeletalMageDefinition([row])).toThrow('Invalid authored Skeletal Mage');
    expect(row).toEqual(before);
  });

  it('ignores mutable registry overrides and restores the shared registry', () => {
    const original = getSkill(MAGE);
    if (!original) throw new Error('Missing registered Mage fixture');
    try {
      registerSkill({ ...original, effects: [] });
      expect(getSkill(MAGE)?.effects).toEqual([]);
      expect(SKELETAL_MAGE_DEFINITION.elementAt(0)).toBe('fire');
      expect(resolveSkeletalMageDefinition([authored()]).elements).toEqual(['fire', 'cold', 'lightning', 'poison']);
    } finally {
      registerSkill(original);
    }
  });

  it('keeps A/B/A resolution and index access independent without shared catalog mutation', () => {
    const first = resolveSkeletalMageDefinition([authored()]);
    const alternate = resolveSkeletalMageDefinition([{ ...authored(),
      summonBasicAttackElements: ['cold', 'poison', 'fire', 'lightning'] }]);
    const last = resolveSkeletalMageDefinition([authored()]);
    expect(first.elementAt(0)).toBe('fire');
    expect(alternate.elementAt(0)).toBe('cold');
    expect(last.elementAt(0)).toBe('fire');
    expect(first.elements).not.toBe(last.elements);
  });
});
