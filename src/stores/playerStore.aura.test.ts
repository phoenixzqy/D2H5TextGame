import { beforeEach, describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types/entities';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { respecCost, usePlayerStore } from './playerStore';

function player(patch: Partial<Player> = {}): Player {
  const base = createMockPlayer('Hero', 'paladin');
  return { ...base, level: 3, skillPoints: 4, skillLevels: { 'paladin.might': 2 },
    derivedStats: { ...base.derivedStats, life: 17, mana: 9 }, ...patch };
}
function observe() {
  const publications: unknown[] = [];
  const unsubscribe = usePlayerStore.subscribe(state => publications.push(state.player));
  return { publications, unsubscribe };
}
beforeEach(() => { usePlayerStore.getState().reset(); });

describe('explicit single player aura selection', () => {
  it('refuses without a player and publishes nothing', () => {
    const basis = usePlayerStore.getState(); const observed = observe();
    try {
      for (const request of [null, 'paladin.might', undefined, 'aura-might']) {
        expect(usePlayerStore.getState().selectAura(request)).toBe('no-player');
        expect(usePlayerStore.getState()).toBe(basis);
      }
      expect(observed.publications).toEqual([]);
    } finally { observed.unsubscribe(); }
  });
  it.each([undefined, '', 'skills-paladin-might', 'aura-might', 'paladin.Might',
    'paladin.holy-fire', 0, true, [], {}, ['paladin.might']])('refuses unsupported request %# without mutation/publication', request => {
    const input = player(); usePlayerStore.getState().setPlayer(input);
    const basis = usePlayerStore.getState(); const original = structuredClone(input); const observed = observe();
    try {
      expect(basis.selectAura(request)).toBe('unsupported-aura');
      expect(usePlayerStore.getState()).toBe(basis);
      expect(input).toEqual(original); expect(observed.publications).toEqual([]);
    } finally { observed.unsubscribe(); }
  });
  const ineligiblePatches: readonly Partial<Player>[] = [
    { class: 'sorceress' }, { level: 0 }, { level: NaN }, { level: Infinity }, { level: -Infinity },
    { skillLevels: {} }, { skillLevels: { 'paladin.might': 0 } },
    { skillLevels: { 'paladin.might': 1.5 } }, { skillLevels: { 'aura-might': 20 } }
  ];
  it.each(ineligiblePatches)('refuses ineligible canonical selection %# without mutation/publication', patch => {
    const input = player(patch); usePlayerStore.getState().setPlayer(input);
    const basis = usePlayerStore.getState(); const observed = observe();
    try {
      expect(basis.selectAura('paladin.might')).toBe('ineligible');
      expect(usePlayerStore.getState()).toBe(basis); expect(observed.publications).toEqual([]);
    } finally { observed.unsubscribe(); }
  });
  it.each(['paladin.might', 'skills-paladin-might'])('selects allocated alias %s, clears by omission and makes repeated requests no-ops', id => {
    const input = player({ skillLevels: { [id]: 2 } }); const original = structuredClone(input);
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    try {
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      expect(usePlayerStore.getState().player).toBe(input); expect(observed.publications).toHaveLength(0);
      expect(usePlayerStore.getState().selectAura('paladin.might')).toBe('ok');
      const selected = usePlayerStore.getState().player;
      expect(selected).toEqual({ ...input, selectedAuraId: 'paladin.might' });
      expect(selected?.derivedStats).toBe(input.derivedStats);
      expect(selected?.cooldowns).toBe(input.cooldowns);
      expect(selected?.skillLevels).toBe(input.skillLevels);
      expect(observed.publications).toHaveLength(1);
      expect(usePlayerStore.getState().selectAura('paladin.might')).toBe('ok');
      expect(usePlayerStore.getState().player).toBe(selected); expect(observed.publications).toHaveLength(1);
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      expect(usePlayerStore.getState().player).toEqual(input);
      expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      expect(observed.publications).toHaveLength(2);
      const cleared = usePlayerStore.getState().player;
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      expect(usePlayerStore.getState().player).toBe(cleared); expect(observed.publications).toHaveLength(2);
      expect(input).toEqual(original);
    } finally { observed.unsubscribe(); }
  });
  it('preserves an ineligible imported canonical selection until explicitly cleared', () => {
    const input = player({ class: 'sorceress', selectedAuraId: 'paladin.might' });
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    try {
      expect(usePlayerStore.getState().player).toBe(input);
      expect(usePlayerStore.getState().selectAura('paladin.might')).toBe('ineligible');
      expect(usePlayerStore.getState().player).toBe(input); expect(observed.publications).toHaveLength(0);
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      const { selectedAuraId: _selected, ...none } = input;
      expect(usePlayerStore.getState().player).toEqual(none);
      expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      expect(observed.publications).toHaveLength(1);
    } finally { observed.unsubscribe(); }
  });
  it('never selects from learning/combo and retains explicit selection on upgrading', () => {
    usePlayerStore.getState().setPlayer(player({ skillLevels: {}, skillPoints: 3 }));
    expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-might')).toBe('ok');
    expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
    usePlayerStore.getState().setComboOrder(['paladin.might']);
    expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
    expect(usePlayerStore.getState().selectAura('paladin.might')).toBe('ok');
    expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-might')).toBe('ok');
    expect(usePlayerStore.getState().player?.selectedAuraId).toBe('paladin.might');
    expect(usePlayerStore.getState().player?.skillLevels?.['paladin.might']).toBe(2);
  });
  it('successful respec omits selection in one publication while preserving resources', () => {
    const input = player({ selectedAuraId: 'paladin.might' });
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    const spent: number[] = [];
    try {
      expect(usePlayerStore.getState().respec({ getGold: () => 10000,
        spendGold: cost => { spent.push(cost); return true; } })).toBe('ok');
      const { selectedAuraId: _selected, ...none } = input;
      expect(usePlayerStore.getState().player).toEqual({ ...none, skillLevels: {}, skillPoints: 6 });
      expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      expect(spent).toEqual([respecCost(input.level)]); expect(observed.publications).toHaveLength(1);
    } finally { observed.unsubscribe(); }
  });
  it.each(['no-allocations', 'insufficient-gold', 'spend-refused'] as const)('failed respec %s preserves selection and publishes nothing', reason => {
    const input = player({ selectedAuraId: 'paladin.might',
      ...(reason === 'no-allocations' ? { skillLevels: {} } : {}) });
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    try {
      expect(usePlayerStore.getState().respec({ getGold: () => reason === 'insufficient-gold' ? 0 : 10000,
        spendGold: () => reason !== 'spend-refused' })).toBe(reason === 'no-allocations' ? reason : 'insufficient-gold');
      expect(usePlayerStore.getState().player).toBe(input); expect(observed.publications).toEqual([]);
    } finally { observed.unsubscribe(); }
  });
});
