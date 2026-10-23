import { describe, expect, it } from 'vitest';
import type { RunewordGrant } from '../types/items';
import { governedActiveNameKey, projectGovernedActives } from './runeword-actives';

const fire: RunewordGrant = { id: 'skill-fire-bolt', skillId: 'sorceress.fire_bolt', rank: 3,
  increasedDamagePct: { fire: .12 } };
const blaze: RunewordGrant = { id: 'skill-blaze', skillId: 'sorceress.blaze', rank: 5 };
const chain: RunewordGrant = { id: 'skill-chain-lightning', skillId: 'sorceress.chain_lightning', rank: 5 };
const redemption: RunewordGrant = { id: 'aura-redemption', skillId: 'item.redemption', rank: 1, manaRegenPct: .1 };
const hero = { kind: 'hero', classId: 'sorceress', level: 70, learnedRanks: {} } as const;
const input = { owner: hero, grants: [] as readonly RunewordGrant[], storedOrder: [] as readonly string[] };

describe('equipment-governed active priority and ownership projection', () => {
  it('shares the authored names across canonical and data identities', () => {
    expect(governedActiveNameKey('sorceress.fire_bolt')).toBe('skills.sorceress.fire-bolt.name');
    expect(governedActiveNameKey('skills-sorceress-blaze')).toBe('skills.sorceress.blaze.name');
    expect(governedActiveNameKey('sorceress.chain_lightning')).toBe('skills.sorceress.chain-lightning.name');
    expect(governedActiveNameKey('item-redemption')).toBe('skills.item.redemption.name');
    expect(governedActiveNameKey('paladin.redemption')).toBeUndefined();
  });
  it('preserves explicit priority, canonicalizes governed aliases and appends grants in source order', () => {
    const source = { ...input, storedOrder: ['fixture.native', 'skills-sorceress-blaze', 'sorceress.blaze'],
      grants: [redemption, blaze, chain, fire] };
    const before = structuredClone(source);
    const result = projectGovernedActives(source);
    expect(result.configuredOrder).toEqual(['fixture.native', 'sorceress.blaze', 'item.redemption',
      'sorceress.chain_lightning', 'sorceress.fire_bolt']);
    expect(result.combatOrder).toEqual(result.configuredOrder);
    expect(result.ranks).toEqual({ 'sorceress.fire_bolt': 3, 'sorceress.blaze': 5,
      'sorceress.chain_lightning': 5, 'item.redemption': 1 });
    expect(source).toEqual(before);
    expect([result, result.ranks, result.configuredOrder, result.combatOrder, result.choices]
      .every(Object.isFrozen)).toBe(true);
    expect(result.choices.every(Object.isFrozen)).toBe(true);
  });
  it('preserves dormant priorities and a tail beyond nine, without treating them as ownership', () => {
    const order = Array.from({ length: 12 }, (_, i) => `fixture.${String(i)}`)
      .concat('skills-sorceress-blaze', 'item-redemption');
    const result = projectGovernedActives({ ...input, storedOrder: order });
    expect(result.configuredOrder).toEqual([...order.slice(0, 12), 'sorceress.blaze', 'item.redemption']);
    expect(result.combatOrder).toEqual(order.slice(0, 12));
    expect(Object.values(result.ranks)).toEqual([0, 0, 0, 0]);
    expect(result.choices.every(choice => !choice.available)).toBe(true);
  });
  it('uses max legal learned/granted rank and highest valid alias without adding them', () => {
    const result = projectGovernedActives({ ...input, grants: [fire, blaze, blaze], owner: { ...hero,
      learnedRanks: { 'sorceress.fire_bolt': 2, 'skills-sorceress-fire-bolt': 8,
        'skills-sorceress-inferno': 1, 'skills-sorceress-blaze': 7 } } });
    expect(result.ranks['sorceress.fire_bolt']).toBe(8);
    expect(result.ranks['sorceress.blaze']).toBe(7);
    expect(result.configuredOrder).toEqual(['sorceress.fire_bolt', 'sorceress.blaze']);
    expect(result.choices.find(choice => choice.id === 'sorceress.blaze')).toMatchObject({
      learnedRank: 7, grantedRank: 5, effectiveRank: 7, available: true });
  });
  it.each([0, -1, 1.5, NaN, Infinity, 21])('ignores invalid learned alias %s but retains a legal other alias', rank => {
    const result = projectGovernedActives({ ...input, owner: { ...hero,
      learnedRanks: { 'sorceress.fire_bolt': rank, 'skills-sorceress-fire-bolt': 2 } } });
    expect(result.ranks['sorceress.fire_bolt']).toBe(2);
  });
  it('requires the actual class, level and recursively learned prerequisites', () => {
    const learnedRanks = { 'skills-sorceress-chain-lightning': 9, 'skills-sorceress-lightning': 1 };
    expect(projectGovernedActives({ ...input, owner: { ...hero, learnedRanks } })
      .ranks['sorceress.chain_lightning']).toBe(0);
    const legal = { ...learnedRanks, 'skills-sorceress-charged-bolt': 1 };
    expect(projectGovernedActives({ ...input, owner: { ...hero, learnedRanks: legal } })
      .ranks['sorceress.chain_lightning']).toBe(9);
    for (const owner of [{ ...hero, level: 17 }, { ...hero, classId: 'paladin' },
      { ...hero, level: 18.5 }, { ...hero, classId: '__proto__' }]) {
      expect(projectGovernedActives({ ...input, owner: { ...owner, learnedRanks: legal } })
        .ranks['sorceress.chain_lightning']).toBe(0);
    }
  });
  it('never learns item Redemption from forged allocations or mercenary skill mirrors', () => {
    const source = { ...input, storedOrder: ['item.redemption'], owner: { ...hero,
      learnedRanks: { 'item.redemption': 1 } } };
    expect(projectGovernedActives(source).ranks['item.redemption']).toBe(0);
    const result = projectGovernedActives({ ...input, owner: { kind: 'merc', level: 70 }, grants: [fire, chain] });
    expect(result.ranks['sorceress.fire_bolt']).toBe(3);
    expect(result.choices.every(choice => choice.learnedRank === 0)).toBe(true);
  });
  it('caps granted ranks and enforces ordinary character level availability', () => {
    const result = projectGovernedActives({ ...input, grants: [{ ...chain, rank: 30 },
      { ...redemption, rank: 5 }], owner: { kind: 'merc', level: 1 } });
    expect(result.ranks['sorceress.chain_lightning']).toBe(20);
    expect(result.ranks['item.redemption']).toBe(1);
    expect(result.combatOrder).toEqual(['item.redemption']);
    expect(result.configuredOrder).toEqual(['sorceress.chain_lightning', 'item.redemption']);
  });
});
