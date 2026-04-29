import { describe, expect, it } from 'vitest';
import {
  checkEligibility,
  compareEquip,
  slotCandidates,
  slotMatches,
  type PlayerLike
} from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import { deriveStats } from '@/engine/progression/stats';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';

function mkItem(baseId: string, overrides: Partial<Item> = {}): Item {
  return {
    id: `inst-${baseId}-${Math.random().toString(36).slice(2, 8)}`,
    baseId,
    rarity: 'normal',
    level: 1,
    identified: true,
    equipped: false,
    ...overrides
  };
}

function mkPlayer(level: number, core: Partial<CoreStats> = {}): PlayerLike {
  const coreStats: CoreStats = { strength: 20, dexterity: 20, vitality: 20, energy: 20, ...core };
  return { level, coreStats, derivedStats: deriveStats(coreStats, level) };
}

describe('slotMatches', () => {
  it('rings are interchangeable between left and right slots', () => {
    expect(slotMatches('ring-left', 'ring-right')).toBe(true);
    expect(slotMatches('ring-right', 'ring-left')).toBe(true);
  });
  it('non-ring slots require exact match', () => {
    expect(slotMatches('head', 'head')).toBe(true);
    expect(slotMatches('head', 'chest')).toBe(false);
    expect(slotMatches(null, 'head')).toBe(false);
  });
});

describe('slotCandidates', () => {
  it('returns only items whose base maps to the requested slot', () => {
    const cap = mkItem('items/base/helm-cap');
    const armor = mkItem('items/base/armor-quilted');
    const out = slotCandidates([cap, armor], 'head');
    expect(out.map((i) => i.baseId)).toEqual(['items/base/helm-cap']);
  });
});

describe('checkEligibility', () => {
  it('flags level requirement when player is too low', () => {
    const item = mkItem('items/base/helm-war-hat');
    const result = checkEligibility(item, mkPlayer(5));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContainEqual({ kind: 'level', required: 22, current: 5 });
  });

  it('passes when player meets reqLevel and no reqStats', () => {
    const item = mkItem('items/base/helm-cap');
    const result = checkEligibility(item, mkPlayer(1));
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('returns eligible when base is not found in catalog', () => {
    const item = mkItem('items/base/does-not-exist');
    const result = checkEligibility(item, mkPlayer(1));
    expect(result.eligible).toBe(true);
  });
});

describe('compareEquip', () => {
  const bases = loadItemBases();

  it('reports a positive defense delta when upgrading helm cap (7) → skull-cap (12)', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const skullCap = mkItem('items/base/helm-skull-cap');
    const equipped: Record<string, Item | null> = { head: cap };
    const result = compareEquip(player, skullCap, 'head', equipped, bases);
    expect(result.current?.baseId).toBe('items/base/helm-cap');
    expect(result.stats.defense.delta).toBe(5);
  });

  it('reports a negative defense delta when downgrading helm', () => {
    const player = mkPlayer(10);
    const skullCap = mkItem('items/base/helm-skull-cap');
    const cap = mkItem('items/base/helm-cap');
    const equipped: Record<string, Item | null> = { head: skullCap };
    const result = compareEquip(player, cap, 'head', equipped, bases);
    expect(result.stats.defense.delta).toBe(-5);
  });

  it('reports zero deltas for unaffected stats and includes resistances bag', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const skullCap = mkItem('items/base/helm-skull-cap');
    const equipped: Record<string, Item | null> = { head: cap };
    const result = compareEquip(player, skullCap, 'head', equipped, bases);
    expect(result.stats.lifeMax.delta).toBe(0);
    expect(result.stats.attack.delta).toBe(0);
    expect(result.resistances.fire.delta).toBe(0);
    expect(Object.keys(result.resistances)).toEqual(
      expect.arrayContaining(['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'])
    );
  });

  it('treats an empty slot as null current (deltas equal candidate values)', () => {
    const player = mkPlayer(10);
    const cap = mkItem('items/base/helm-cap');
    const equipped: Record<string, Item | null> = {};
    const result = compareEquip(player, cap, 'head', equipped, bases);
    expect(result.current).toBeNull();
    expect(result.stats.defense.delta).toBe(7);
  });
});