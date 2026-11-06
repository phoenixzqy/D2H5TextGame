import { describe, expect, it } from 'vitest';
import type { QuestProgressData } from '../types/save';
import { findRegionalBounty, REGIONAL_BOUNTY_DOMAIN, REGIONAL_BOUNTY_MAX_CLAIMS,
  regionalBountyState, validateRegionalBountyGraph, type RegionalBountyDefinition,
  type RegionalBountyLedger } from './regional-bounties';

const first = REGIONAL_BOUNTY_DOMAIN[0];
function fixture(definition: RegionalBountyDefinition = first,
  state: 'active' | 'completed' | 'paid' = 'active', claims = 0) {
  const progress: Record<string, QuestProgressData> = {
    [definition.quest]: { id: definition.quest, status: state === 'active' ? 'inProgress' : 'completed',
      rewardClaimed: state === 'paid', objectives: { [definition.objective]: state !== 'active' } }
  };
  const bounties: RegionalBountyLedger = { [definition.quest]: {
    claims, victoryOrdinal: claims + (state === 'completed' ? 1 : 0) } };
  return { progress, bounties };
}
function valid(progress: unknown, bounties: unknown) {
  return () => { validateRegionalBountyGraph(progress, bounties, REGIONAL_BOUNTY_DOMAIN); };
}

describe('finite regional bounty durable state', () => {
  it('pins exactly the five ratified identities without mutable domain objects', () => {
    expect(REGIONAL_BOUNTY_DOMAIN.map(({ key, quest, area, objective }) => [key, quest, area, objective])).toEqual([
      ['moor', 'quests/bounty-act1-moor-cull', 'areas/act1-blood-moor', 'obj-cull'],
      ['waste', 'quests/bounty-act2-waste-cull', 'areas/act2-rocky-waste', 'obj-cull'],
      ['forest', 'quests/bounty-act3-forest-cull', 'areas/act3-spider-forest', 'obj-cull'],
      ['steppes', 'quests/bounty-act4-steppes-cull', 'areas/act4-outer-steppes', 'obj-cull'],
      ['foothills', 'quests/bounty-act5-foothills-cull', 'areas/act5-bloody-foothills', 'obj-cull']
    ]);
    expect(REGIONAL_BOUNTY_MAX_CLAIMS).toBe(1_000_000);
    expect(Object.isFrozen(REGIONAL_BOUNTY_DOMAIN)).toBe(true);
    for (const definition of REGIONAL_BOUNTY_DOMAIN) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(findRegionalBounty(definition.quest)).toBe(definition);
    }
    expect(findRegionalBounty('quests/bounty-future')).toBeUndefined();
  });

  it.each(REGIONAL_BOUNTY_DOMAIN)('admits only the four legal states for $key', definition => {
    expect(valid({}, {})).not.toThrow();
    expect(regionalBountyState(definition.quest, {}, {}, REGIONAL_BOUNTY_DOMAIN)).toBe('never-accepted');
    for (const [state, claims] of [['active', 0], ['completed', 0], ['paid', 1],
      ['active', 17], ['completed', 17], ['paid', 17]] as const) {
      const { progress, bounties } = fixture(definition, state, claims), before = structuredClone({ progress, bounties });
      expect(valid(progress, bounties)).not.toThrow();
      expect(regionalBountyState(definition.quest, progress, bounties, REGIONAL_BOUNTY_DOMAIN)).toBe(state);
      expect({ progress, bounties }).toEqual(before);
    }
  });

  it('admits the final payable cycle and paid exhaustion, refusing an active exhausted cycle', () => {
    const completed = fixture(first, 'completed', REGIONAL_BOUNTY_MAX_CLAIMS - 1);
    expect(valid(completed.progress, completed.bounties)).not.toThrow();
    const paid = fixture(first, 'paid', REGIONAL_BOUNTY_MAX_CLAIMS);
    expect(regionalBountyState(first.quest, paid.progress, paid.bounties, REGIONAL_BOUNTY_DOMAIN)).toBe('paid');
    const active = fixture(first, 'active', REGIONAL_BOUNTY_MAX_CLAIMS);
    expect(valid(active.progress, active.bounties)).toThrow('Invalid');
    const overflow = fixture(first, 'completed', REGIONAL_BOUNTY_MAX_CLAIMS);
    expect(valid(overflow.progress, overflow.bounties)).toThrow('Invalid');
  });

  it('validates all five reciprocal graphs while retaining unrelated quest history', () => {
    const progress: Record<string, QuestProgressData> = {
      other: { id: 'other', status: 'completed', objectives: { historical: true } }
    }, bounties: RegionalBountyLedger = {};
    for (const [index, definition] of REGIONAL_BOUNTY_DOMAIN.entries()) {
      const part = fixture(definition, index % 2 === 0 ? 'active' : 'completed', index);
      Object.assign(progress, part.progress); Object.assign(bounties, part.bounties);
    }
    expect(valid(progress, bounties)).not.toThrow();
    Reflect.set(bounties, REGIONAL_BOUNTY_DOMAIN[4].quest, { claims: 4, victoryOrdinal: 5 });
    expect(valid(progress, bounties)).toThrow('Invalid');
    expect(regionalBountyState(first.quest, progress, bounties, REGIONAL_BOUNTY_DOMAIN)).toBeUndefined();
  });

  it.each(['row-only', 'entry-only', 'wrong-id', 'wrong-status', 'missing-paid', 'paid-type', 'missing-objective',
    'extra-objective', 'objective-type', 'extra-row', 'extra-entry', 'missing-claims', 'missing-victory',
    'v-below-c', 'v-above-next', 'active-next', 'completed-same', 'paid-zero', 'paid-next', 'unpaid-false',
    'unknown-entry', 'negative', 'fractional', 'unsafe', 'nan', 'infinity', 'string-count'] as const)(
    'rejects malformed or contradictory %s state', fault => {
      const { progress, bounties } = fixture(first, 'completed', 2);
      const row = progress[first.quest], entry = bounties[first.quest];
      if (!row || !entry) throw new Error('Missing bounty test fixture');
      if (fault === 'row-only') Reflect.deleteProperty(bounties, first.quest);
      if (fault === 'entry-only') Reflect.deleteProperty(progress, first.quest);
      if (fault === 'wrong-id') Reflect.set(row, 'id', 'quests/foreign');
      if (fault === 'wrong-status') Reflect.set(row, 'status', 'available');
      if (fault === 'missing-paid') Reflect.deleteProperty(row, 'rewardClaimed');
      if (fault === 'paid-type') Reflect.set(row, 'rewardClaimed', 0);
      if (fault === 'missing-objective') Reflect.deleteProperty(row.objectives, first.objective);
      if (fault === 'extra-objective') Reflect.set(row.objectives, 'future', true);
      if (fault === 'objective-type') Reflect.set(row.objectives, first.objective, 1);
      if (fault === 'extra-row') Reflect.set(row, 'future', true);
      if (fault === 'extra-entry') Reflect.set(entry, 'future', 0);
      if (fault === 'missing-claims') Reflect.deleteProperty(entry, 'claims');
      if (fault === 'missing-victory') Reflect.deleteProperty(entry, 'victoryOrdinal');
      if (fault === 'v-below-c') Reflect.set(entry, 'victoryOrdinal', 1);
      if (fault === 'v-above-next') Reflect.set(entry, 'victoryOrdinal', 4);
      if (fault === 'active-next') { Reflect.set(row, 'status', 'inProgress'); Reflect.set(row.objectives, first.objective, false); }
      if (fault === 'completed-same') Reflect.set(entry, 'victoryOrdinal', 2);
      if (fault === 'paid-zero') { Reflect.set(row, 'rewardClaimed', true); Object.assign(entry, { claims: 0, victoryOrdinal: 0 }); }
      if (fault === 'paid-next') Reflect.set(row, 'rewardClaimed', true);
      if (fault === 'unpaid-false') Reflect.set(row.objectives, first.objective, false);
      if (fault === 'unknown-entry') Reflect.set(bounties, 'quests/bounty-future', { claims: 0, victoryOrdinal: 0 });
      const counts: Partial<Record<typeof fault, unknown>> = { negative: -1, fractional: 0.5,
        unsafe: Number.MAX_SAFE_INTEGER + 1, nan: NaN, infinity: Infinity, 'string-count': '2' };
      if (Object.hasOwn(counts, fault)) Reflect.set(entry, 'claims', counts[fault]);
      expect(valid(progress, bounties)).toThrow('Invalid');
      expect(regionalBountyState(first.quest, progress, bounties, REGIONAL_BOUNTY_DOMAIN)).toBeUndefined();
    });

  it.each(['progress', 'ledger', 'row', 'objectives', 'objective', 'claims', 'victory'] as const)(
    'rejects %s accessors without invoking getters', target => {
      const { progress, bounties } = fixture(), row = progress[first.quest], entry = bounties[first.quest];
      if (!row || !entry) throw new Error('Missing bounty test fixture');
      const object = target === 'progress' ? progress : target === 'ledger' ? bounties
        : target === 'row' || target === 'objectives' ? row : target === 'objective' ? row.objectives : entry;
      const key = target === 'progress' || target === 'ledger' ? first.quest : target === 'row' ? 'id'
        : target === 'objectives' ? 'objectives' : target === 'objective' ? first.objective
        : target === 'claims' ? 'claims' : 'victoryOrdinal';
      let reads = 0;
      Object.defineProperty(object, key, { enumerable: true, get() { reads++; return {}; } });
      expect(valid(progress, bounties)).toThrow('Invalid'); expect(reads).toBe(0);
    });

  it.each(['prototype', 'symbol', 'nonenumerable', 'array'] as const)(
    'rejects %s records at each participating boundary', fault => {
      for (const boundary of ['progress', 'ledger', 'row', 'objectives', 'entry'] as const) {
        const { progress, bounties } = fixture(), row = progress[first.quest], entry = bounties[first.quest];
        if (!row || !entry) throw new Error('Missing bounty test fixture');
        const value = boundary === 'progress' ? progress : boundary === 'ledger' ? bounties
          : boundary === 'row' ? row : boundary === 'objectives' ? row.objectives : entry;
        if (fault === 'prototype') Object.setPrototypeOf(value, { inherited: true });
        if (fault === 'symbol') Reflect.set(value, Symbol('future'), true);
        if (fault === 'nonenumerable') Object.defineProperty(value, 'future', { value: true });
        let currentProgress: unknown = progress, currentBounties: unknown = bounties;
        if (fault === 'array') {
          if (boundary === 'progress') currentProgress = [];
          if (boundary === 'ledger') currentBounties = [];
          if (boundary === 'row') Reflect.set(progress, first.quest, []);
          if (boundary === 'objectives') Reflect.set(row, 'objectives', []);
          if (boundary === 'entry') Reflect.set(bounties, first.quest, []);
        }
        expect(valid(currentProgress, currentBounties)).toThrow('Invalid');
      }
    });

  it('accepts null-prototype own JSON records and never infers acceptance from unrelated history', () => {
    const { progress, bounties } = fixture();
    for (const value of [progress, bounties, progress[first.quest], progress[first.quest]?.objectives, bounties[first.quest]]) {
      if (!value) throw new Error('Missing bounty test fixture'); Object.setPrototypeOf(value, null);
    }
    expect(valid(progress, bounties)).not.toThrow();
    const history = { old: { id: 'old', status: 'completed', objectives: { 'obj-cull': true } } };
    expect(regionalBountyState(first.quest, history, {}, REGIONAL_BOUNTY_DOMAIN)).toBe('never-accepted');
    expect(regionalBountyState('quests/foreign', {}, {}, REGIONAL_BOUNTY_DOMAIN)).toBeUndefined();
  });

  it('requires explicit current domain and rejects changed or malformed domain without reading accessors', () => {
    const { progress, bounties } = fixture();
    expect(() => { validateRegionalBountyGraph({}, {}, undefined); }).not.toThrow();
    expect(() => { validateRegionalBountyGraph(progress, bounties, undefined); }).toThrow('Invalid');
    expect(() => { validateRegionalBountyGraph(progress, {}, undefined); }).toThrow('Invalid');
    expect(regionalBountyState(first.quest, {}, {}, undefined)).toBeUndefined();
    for (const field of ['key', 'quest', 'actId', 'area', 'objective'] as const) {
      const domain = structuredClone(REGIONAL_BOUNTY_DOMAIN); Reflect.set(domain[0], field, 'future');
      expect(() => { validateRegionalBountyGraph({}, {}, domain); }).toThrow('domain');
    }
    const domain = structuredClone(REGIONAL_BOUNTY_DOMAIN); let reads = 0;
    Object.defineProperty(domain[0], 'quest', { enumerable: true, get() { reads++; return first.quest; } });
    expect(() => { validateRegionalBountyGraph({}, {}, domain); }).toThrow('domain'); expect(reads).toBe(0);
    const array = [...REGIONAL_BOUNTY_DOMAIN];
    Object.defineProperty(array, '0', { enumerable: true, get() { reads++; return first; } });
    expect(() => { validateRegionalBountyGraph({}, {}, array); }).toThrow('domain'); expect(reads).toBe(0);
    expect(() => { validateRegionalBountyGraph({}, {}, REGIONAL_BOUNTY_DOMAIN.slice(1)); }).toThrow('domain');
  });
});
