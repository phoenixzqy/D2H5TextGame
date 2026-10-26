import { describe, expect, it } from 'vitest';
import { resolveSkeletalMageSignatures, SKELETAL_MAGE_SIGNATURES } from './skeletal-mage-signatures';

function authored() {
  return { id: 'summons/skeletal-mage-signatures', effects: {
    fire: { id: 'burn', damageType: 'fire', durationMs: 3000, chance: 1, dotPctOfDamage: .1 },
    cold: { id: 'chill', damageType: 'cold', durationMs: 2000, chance: 1 },
    lightning: { id: 'paralyze', damageType: 'lightning', durationMs: 1000, chance: 1 },
    poison: { id: 'poison', damageType: 'poison', durationMs: 5000, chance: 1, dotPctOfDamage: .05 }
  } };
}

describe('Mage authored signature definition', () => {
  it('validates exact matching elements/statuses with the literal provisional tuning', () => {
    const row = authored();
    expect(resolveSkeletalMageSignatures(row)).toEqual(row.effects);
    expect(SKELETAL_MAGE_SIGNATURES).toEqual(row.effects);
  });

  it('copies and freezes every nested payload without freezing or mutating caller data', () => {
    const row = authored(), before = structuredClone(row);
    const definition = resolveSkeletalMageSignatures(row);
    expect(row).toEqual(before);
    expect(Object.isFrozen(row.effects.fire)).toBe(false);
    row.effects.fire.dotPctOfDamage = .9;
    row.effects.cold.durationMs = 9000;
    expect(definition).toEqual(before.effects);
    expect(Object.isFrozen(definition)).toBe(true);
    for (const effect of Object.values(definition)) expect(Object.isFrozen(effect)).toBe(true);
  });

  it.each([
    undefined, null, {}, { ...authored(), id: 'foreign' },
    { ...authored(), typo: true },
    { ...authored(), effects: { ...authored().effects, fire: undefined } },
    { ...authored(), effects: { ...authored().effects, arcane: authored().effects.fire } },
    { ...authored(), effects: { ...authored().effects, fire: { ...authored().effects.fire, id: 'chill' } } },
    { ...authored(), effects: { ...authored().effects, cold: { ...authored().effects.cold, damageType: 'fire' } } },
    { ...authored(), effects: { ...authored().effects, poison: { ...authored().effects.poison, dotPctOfDamage: 0 } } },
    { ...authored(), effects: { ...authored().effects, fire: { ...authored().effects.fire, durationMs: 0 } } },
    { ...authored(), effects: { ...authored().effects, cold: { ...authored().effects.cold, chance: .5 } } },
    { ...authored(), effects: { ...authored().effects, lightning: { ...authored().effects.lightning, dotPctOfDamage: .1 } } }
  ])('rejects malformed or mismatched payload %# without a fallback', row => {
    expect(() => resolveSkeletalMageSignatures(row)).toThrow('Invalid authored Mage signature effects');
  });
});
