import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import gemJson from '../items/gem-effects.json';
import runeSchema from '../schema/rune.schema.json';
import wordSchema from '../schema/runeword.schema.json';
import { runes, runewords } from '../index';
import { gemEffects, validateGemEffects } from './socket-effects';
import { materialCatalog } from './materials';
import { loadGameData } from '../loader';

describe('closed socket effect data', () => {
  it('provides every ownable gem exactly once in all three contexts', async () => {
    expect((await loadGameData()).gemEffects).toBe(gemEffects);
    expect([...gemEffects.keys()].sort()).toEqual([...materialCatalog.values()]
      .filter(material => material.kind === 'gem').map(material => material.id).sort());
    expect(gemEffects.size).toBe(35);
  });
  it.each([
    (rows: typeof gemJson) => rows.slice(1),
    (rows: typeof gemJson) => [rows[0], ...rows.slice(0, -1)],
    (rows: typeof gemJson) => [{ ...rows[0], id: 'gems/unknown/perfect' }, ...rows.slice(1)],
    (rows: typeof gemJson) => [{ ...rows[0], weaponEffect: { statMods: { magicResist: -1 } } }, ...rows.slice(1)],
    (rows: typeof gemJson) => [{ ...rows[0], weaponEffect: { statMods: { physDodge: 2 } } }, ...rows.slice(1)],
    (rows: typeof gemJson) => [{ ...rows[0], shieldEffect: { moveSpeed: 2 } }, ...rows.slice(1)],
    (rows: typeof gemJson) => [{ ...rows[0], extra: true }, ...rows.slice(1)]
  ])('refuses missing, duplicate, unknown or malformed gem effects %#', corrupt => {
    expect(() => validateGemEffects(corrupt(structuredClone(gemJson)))).toThrow(/gem/i);
  });
  it('enforces package ratios, flat MR and complete placement fields in authored rune/word schemas', () => {
    const ajv = new Ajv2020({ strict: true });
    const checkRune = ajv.compile(runeSchema), checkWord = ajv.compile(wordSchema);
    const rune = runes[0], word = runewords[0];
    if (!rune || !word) throw new Error('Missing socket schema controls');
    expect(checkRune({ ...rune, weaponEffect: { statMods: { physDodge: .02, magicResist: 8 } } })).toBe(true);
    expect(checkRune({ ...rune, weaponEffect: { statMods: { physDodge: 2 } } })).toBe(false);
    expect(checkWord({ ...word, stats: { statMods: { critChance: .20 } } })).toBe(true);
    expect(checkWord({ ...word, stats: { statMods: { critChance: 20 } } })).toBe(false);
    const { allowedSlots: _slots, ...missingSlots } = word;
    expect(checkWord(missingSlots)).toBe(false);
    expect(checkWord({ ...word, allowedWeaponTypes: ['shield'] })).toBe(false);
  });
});
