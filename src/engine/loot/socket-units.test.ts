import { describe, expect, it } from 'vitest';
import { runes, runewords } from '@/data';

describe('authored socket package units', () => {
  it.each([
    ['runes/eld', 'armorEffect', .02], ['runes/eld', 'shieldEffect', .07],
    ['runes/shael', 'shieldEffect', .10]
  ] as const)('%s %s dodge is a ratio', (id, location, expected) => {
    expect(runes.find(row => row.id === id)?.[location]?.statMods?.physDodge).toBe(expected);
  });
  it.each([['infinity', .20], ['last-wish', .25], ['death', .50]] as const)(
    '%s critical chance is a ratio', (id, expected) => {
      expect(runewords.find(row => row.id === `runewords/${id}`)?.stats.statMods?.critChance).toBe(expected);
    });
});
