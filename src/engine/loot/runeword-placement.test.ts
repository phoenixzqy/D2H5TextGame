import { describe, expect, it } from 'vitest';
import { runewords } from '@/data';
import { matchRuneword, recipeFromData } from './runeword';
import type { ItemBaseType, EquipmentSlot, WeaponType } from '../types/items';

const placements = [
  ['steel malice strength passion oath call-to-arms breath-of-the-dying death last-wish hand-of-justice', ['sword', 'axe', 'mace', 'scepter', 'staff', 'polearm', 'bow']],
  ['leaf', ['staff']], ['insight', ['polearm', 'staff']], ['obedience infinity', ['polearm']],
  ['spirit', ['sword', 'offhand']], ['heart-of-the-oak', ['staff', 'mace']], ['grief', ['sword']],
  ['beast', ['axe', 'mace', 'scepter']], ['phoenix', ['sword', 'axe', 'mace', 'scepter', 'staff', 'polearm', 'bow', 'offhand']],
  ['stealth wealth smoke treachery duress lionheart enigma chains-of-honor bramble', ['chest']],
  ['ancients-pledge steelclash rhyme exile', ['offhand']], ['lore', ['head']], ['dream', ['head', 'offhand']],
  ['fortitude', ['sword', 'axe', 'mace', 'scepter', 'staff', 'polearm', 'bow', 'chest']]
] as const;
const cases = placements.flatMap(([ids, allowed]) => ids.split(' ').map(id => ({ id: `runewords/${id}`, allowed: [...allowed] as string[] })));
const bases: { label: string; baseType: ItemBaseType; slot: EquipmentSlot; weaponType?: WeaponType }[] = [
  ...(['sword', 'axe', 'mace', 'scepter', 'staff', 'polearm', 'bow'] as const)
    .map(weaponType => ({ label: weaponType, baseType: 'weapon' as const, slot: 'weapon' as const, weaponType })),
  ...(['head', 'chest', 'offhand', 'gloves'] as const)
    .map(slot => ({ label: slot, baseType: 'armor' as const, slot })),
  { label: 'jewelry', baseType: 'jewelry', slot: 'amulet' },
  { label: 'wrong-weapon-slot', baseType: 'weapon', slot: 'offhand', weaponType: 'sword' },
  { label: 'wrong-armor-slot', baseType: 'armor', slot: 'weapon' }
];

describe('complete D10 runeword placement predicates', () => {
  it('covers exactly the real 35-word catalog', () => {
    expect(cases.map(row => row.id).sort()).toEqual(runewords.map(word => word.id).sort());
    expect(cases).toHaveLength(35);
  });
  it.each(cases)('$id accepts only its complete allowed base branches', ({ id, allowed }) => {
    const word = runewords.find(row => row.id === id);
    if (!word) throw new Error(`Missing authored word ${id}`);
    for (const base of bases) {
      const candidate = { ...base, sockets: word.sockets, runes: word.runes, isWhiteBase: true };
      expect(matchRuneword(candidate, [recipeFromData(word)]), `${id} on ${base.label}`)
        .toBe(allowed.includes(base.label) ? id : undefined);
    }
  });
  it.each(cases)('$id still requires white base, exact capacity, full ordered runes and explicit slot identity', ({ id, allowed }) => {
    const word = runewords.find(row => row.id === id), base = bases.find(row => allowed.includes(row.label));
    if (!word || !base) throw new Error('Incomplete placement fixture');
    const candidate = { ...base, sockets: word.sockets, runes: word.runes, isWhiteBase: true };
    const recipes = [recipeFromData(word)];
    expect(matchRuneword({ ...candidate, isWhiteBase: false }, recipes)).toBeUndefined();
    expect(matchRuneword({ ...candidate, sockets: word.sockets + 1 }, recipes)).toBeUndefined();
    expect(matchRuneword({ ...candidate, runes: word.runes.slice(1) }, recipes)).toBeUndefined();
    const wrongOrder = [...word.runes], first = wrongOrder[0];
    const different = wrongOrder.findIndex(id => id !== first), other = wrongOrder[different];
    if (!first || !other) throw new Error('Recipe needs two distinct rune IDs for the order control');
    wrongOrder[0] = other; wrongOrder[different] = first;
    expect(matchRuneword({ ...candidate, runes: wrongOrder }, recipes)).toBeUndefined();
    const { slot: _slot, ...missingSlot } = candidate;
    expect(matchRuneword(missingSlot, recipes)).toBeUndefined();
  });
});
