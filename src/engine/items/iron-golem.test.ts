import { describe, expect, it } from 'vitest';
import type { Item, SetDef, SetPieceDef, UniqueItemDef } from '../types/items';
import { projectIronGolemItem } from './iron-golem';

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: 'selected-metal', baseId: 'items/base/wp1h-short-sword',
    rarity: 'normal', level: 1, identified: true, equipped: false,
    ...overrides
  };
}

describe('projectIronGolemItem', () => {
  it.each([
    [item(), { life: 0, attack: 8, defense: 0 }],
    [item({ baseId: 'items/base/armor-chain-mail' }), { life: 0, attack: 0, defense: 53 }],
    [item({ rarity: 'unique', uniqueId: 'items/unique/coif-of-glory', baseId: 'items/base/helm-skull-cap' }), { life: 10, attack: 0, defense: 32 }],
    [item({ rarity: 'unique', uniqueId: 'items/unique/wormskull', baseId: 'items/base/helm-skull-cap' }), { life: 0, attack: 0, defense: 12 }],
    [item({ rarity: 'unique', uniqueId: 'items/unique/rixots-keen' }), { life: 0, attack: 53, defense: 0 }],
    [item({ rarity: 'set', setId: 'sets/arcanna-tricks', setPieceId: 'sets/arcanna-tricks/helm', baseId: 'items/base/helm-skull-cap' }), { life: 15, attack: 0, defense: 30 }]
  ])('projects only the isolated item scalar bonuses for %o', (source, bonuses) => {
    expect(projectIronGolemItem(source)).toEqual({ eligible: true, bonuses });
  });

  it('allows empty sockets, historical equipSlot and unmet wearing requirements', () => {
    expect(projectIronGolemItem(item({ runes: [], equipSlot: 'weapon', level: 1 })))
      .toEqual({ eligible: true, bonuses: { life: 0, attack: 8, defense: 0 } });
    expect(projectIronGolemItem(item({ baseId: 'items/base/armor-archon-plate' })).eligible).toBe(true);
  });

  it.each(['magic', 'rare'] as const)('resolves modern %s affixes and saved base rolls', (rarity) => {
    const source = item({ rarity, baseRolls: { attack: 6.25 }, affixes: [
      { id: 'affix.weapon.attack.flat', tier: 0, rolledValue: 3.25 },
      { id: 'affix.wolf.life.flat', tier: 0, rolledValue: 7.5 }
    ] });
    expect(projectIronGolemItem(source)).toEqual({ eligible: true, bonuses: { life: 7.5, attack: 9.5, defense: 0 } });
  });

  it('resolves modern armor affixes and fractional saved defense without hero stats', () => {
    const source = item({ baseId: 'items/base/armor-chain-mail', rarity: 'rare', baseRolls: { defense: 50.5 }, affixes: [
      { id: 'affix.armor.defense.flat', tier: 0, rolledValue: 3.5 },
      { id: 'affix.vital.life.flat', tier: 0, rolledValue: 12.5 }
    ] });
    expect(projectIronGolemItem(source)).toEqual({ eligible: true, bonuses: { life: 12.5, attack: 0, defense: 54 } });
  });

  it('keeps legacy resolved maps independent of modern affix identities and copies only three stats', () => {
    const source = item({ rarity: 'rare', affixes: [{ affixId: 'old-save-affix', values: new Map([
      ['statMods.life', 12.5], ['statMods.attack', 3.25], ['statMods.defense', 4.5],
      ['coreStats.vitality', 999], ['statMods.mana', 123], ['statMods.attackSpeed', 20],
      ['resistances.fire', 80], ['statMods.critChance', 50], ['statMods.magicFind', 100]
    ]) }] });
    const before = structuredClone(source);
    Object.freeze(source);
    expect(projectIronGolemItem(source)).toEqual({ eligible: true, bonuses: { life: 12.5, attack: 11.25, defense: 4.5 } });
    expect(projectIronGolemItem(source)).toEqual(projectIronGolemItem(source));
    expect(source).toEqual(before);
  });

  it('uses shared injected definitions, fractional saved rolls and deterministic minimum fallback', () => {
    const unique: UniqueItemDef = { id: 'fractional', name: 'test', baseId: 'items/base/wp1h-short-sword', reqLevel: 99,
      stats: { statMods: { life: { roll: 'life', min: 10.5, max: 20.5, step: 0.5 }, attack: 3.25, defense: 4.5 } } };
    const source = item({ rarity: 'unique', uniqueId: unique.id, statRolls: { life: 12.5 } });
    const pools = { uniques: [unique] };
    expect(projectIronGolemItem(source, pools)).toEqual({ eligible: true, bonuses: { life: 12.5, attack: 11.25, defense: 4.5 } });
    expect(projectIronGolemItem(item({ rarity: 'unique', uniqueId: unique.id }), pools))
      .toEqual({ eligible: true, bonuses: { life: 10.5, attack: 11.25, defense: 4.5 } });
    expect(source.statRolls).toEqual({ life: 12.5 });
  });

  it('disables even an injected one-piece set threshold', () => {
    const piece: SetPieceDef = { id: 'one-piece', setId: 'one-set', name: 'test', baseId: 'items/base/helm-skull-cap', reqLevel: 1,
      stats: { statMods: { life: 15, defense: 18 } } };
    const set: SetDef = { id: piece.setId, name: 'test', items: [piece.id], pieces: [piece],
      bonuses: { '1': { statMods: { life: 1000, attack: 2000, defense: 3000 } } } };
    expect(projectIronGolemItem(item({ baseId: piece.baseId, rarity: 'set', setPieceId: piece.id }), { setPieces: [piece], sets: [set] }))
      .toEqual({ eligible: true, bonuses: { life: 15, attack: 0, defense: 30 } });
  });

  it.each([
    { id: 'unknown-affix', tier: 0, rolledValue: 3 },
    { id: 'affix.weapon.attack.flat', tier: -1, rolledValue: 3 },
    { id: 'affix.weapon.attack.flat', tier: 0.5, rolledValue: 3 },
    { id: 'affix.weapon.attack.flat', tier: 99, rolledValue: 3 },
    { id: 'affix.weapon.attack.flat', tier: 0, rolledValue: NaN },
    { id: 'affix.weapon.attack.flat', tier: 0, rolledValue: Infinity },
    { id: 'affix.weapon.attack.flat', tier: 0, rolledValue: -1 },
    { id: 'affix.weapon.attack.flat', tier: 0, rolledValue: 6 },
    { id: 'affix.armor.defense.flat', tier: 0, rolledValue: 3 }
  ])('refuses an unresolved or invalid modern affix %o', (roll) => {
    expect(projectIronGolemItem(item({ rarity: 'magic', affixes: [roll] })))
      .toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it.each([NaN, Infinity, -1, undefined, null, '12'])('refuses malformed contributing saved base rolls %o', (value) => {
    const source = item({ baseRolls: { attack: value } as unknown as NonNullable<Item['baseRolls']> });
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it.each([NaN, Infinity, -1, undefined, null, '12', 9, 21])('refuses supplied invalid definition roll %o instead of falling back', (value) => {
    const unique: UniqueItemDef = { id: 'rolled', name: 'test', baseId: 'items/base/wp1h-short-sword', reqLevel: 1,
      stats: { statMods: { life: { roll: 'life', min: 10, max: 20 } } } };
    const source = item({ rarity: 'unique', uniqueId: unique.id, statRolls: { life: value } as unknown as NonNullable<Item['statRolls']> });
    expect(projectIronGolemItem(source, { uniques: [unique] })).toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it.each(['statMods.life', 'statMods.attack', 'statMods.defense', 'damageBonus.min', 'damageBonus.max',
    'damageBonus.value', 'damageBonus.breakdown.physical'])('refuses a negative legacy contribution at %s before it cancels a positive base', (path) => {
    const source = item({ rarity: 'magic', affixes: [{ affixId: 'legacy', values: new Map([[path, -1]]) }] });
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it('preserves legacy damage resolver semantics without copying elemental properties', () => {
    const source = item({ rarity: 'magic', affixes: [{ affixId: 'legacy', values: new Map([
      ['damageBonus.min', 1], ['damageBonus.max', 2], ['damageBonus.value', 3], ['damageBonus.breakdown.fire', 4]
    ]) }] });
    expect(projectIronGolemItem(source)).toEqual({ eligible: true, bonuses: { life: 0, attack: 18, defense: 0 } });
  });

  it('refuses overflow from individually finite contributions', () => {
    const source = item({ rarity: 'magic', affixes: [{ affixId: 'legacy', values: new Map([
      ['damageBonus.min', Number.MAX_VALUE], ['damageBonus.max', Number.MAX_VALUE]
    ]) }] });
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it('refuses conflicting/ambiguous definition identities and affixes on non-affix rarities', () => {
    const unique: UniqueItemDef = { id: 'duplicate', name: 'test', baseId: 'items/base/wp1h-short-sword', reqLevel: 1 };
    expect(projectIronGolemItem(item({ rarity: 'unique', uniqueId: unique.id }), { uniques: [unique, unique] }))
      .toEqual({ eligible: false, reason: 'invalidDefinition' });
    expect(projectIronGolemItem(item({ rarity: 'set', setId: 'wrong', setPieceId: 'sets/arcanna-tricks/helm', baseId: 'items/base/helm-skull-cap' })))
      .toEqual({ eligible: false, reason: 'invalidDefinition' });
    expect(projectIronGolemItem(item({ affixes: [{ id: 'affix.weapon.attack.flat', tier: 0, rolledValue: 3 }] })))
      .toEqual({ eligible: false, reason: 'invalidDefinition' });
  });

  it.each([
    item({ rarity: 'unique', uniqueId: 'items/unique/rixots-keen', setId: 'sets/arcanna-tricks' }),
    item({ rarity: 'unique', uniqueId: 'items/unique/rixots-keen', setPieceId: 'sets/arcanna-tricks/helm' }),
    item({ rarity: 'set', setPieceId: 'unknown' }),
    item({ rarity: 'set', setId: 'sets/arcanna-tricks' }),
    item({ rarity: 'set', baseId: 'items/base/helm-skull-cap', setPieceId: 'sets/arcanna-tricks/helm', uniqueId: 'items/unique/coif-of-glory' }),
    item({ rarity: 'magic', setId: 'sets/arcanna-tricks' }),
    item({ rarity: 'rare', setPieceId: 'sets/arcanna-tricks/helm' })
  ])('refuses contradictory rarity/template identity %o', (source) => {
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason: 'invalidDefinition' });
  });

  it.each([NaN, Infinity, -1, undefined, null])('refuses malformed legacy contributing values %o', (value) => {
    const source = item({ rarity: 'magic', affixes: [{ affixId: 'old-save', values: new Map([['statMods.life', value]]) }] } as unknown as Partial<Item>);
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason: 'invalidRolls' });
  });

  it('refuses duplicate piece definitions rather than selecting an arbitrary definition', () => {
    const piece: SetPieceDef = { id: 'duplicate-piece', setId: 'test-set', name: 'test', baseId: 'items/base/helm-skull-cap', reqLevel: 1 };
    expect(projectIronGolemItem(item({ rarity: 'set', baseId: piece.baseId, setPieceId: piece.id }), { setPieces: [piece, piece] }))
      .toEqual({ eligible: false, reason: 'invalidDefinition' });
  });

  it.each([
    [item({ identified: false }), 'unidentified'],
    [item({ equipped: true }), 'equipped'],
    [item({ baseId: 'unknown-metal-sword' }), 'ineligibleBase'],
    [item({ baseId: 'items/base/weapon-wand' }), 'ineligibleBase'],
    [item({ baseId: 'items/base/ring-iron' }), 'ineligibleBase'],
    [item({ runes: ['runes/el'] }), 'unsupportedRunes'],
    [item({ runewordId: '' }), 'unsupportedRunes'],
    [item({ rarity: 'runeword' }), 'unsupportedRunes'],
    [item({ rarity: 'unique', uniqueId: 'unknown' }), 'invalidDefinition'],
    [item({ rarity: 'unique', uniqueId: 'items/unique/coif-of-glory' }), 'invalidDefinition'],
    [item({ uniqueId: 'items/unique/rixots-keen' }), 'invalidDefinition'],
    [item({ rarity: 'set', setPieceId: 'sets/arcanna-tricks/helm' }), 'invalidDefinition'],
    [item({ rarity: 'unique' }), 'invalidDefinition'],
    [item({ baseRolls: { attack: NaN } }), 'invalidRolls'],
    [item({ baseRolls: { attack: -1 } }), 'invalidRolls']
  ])('refuses %o without changing its source', (source, reason) => {
    const before = structuredClone(source);
    expect(projectIronGolemItem(source)).toEqual({ eligible: false, reason });
    expect(source).toEqual(before);
  });
});
