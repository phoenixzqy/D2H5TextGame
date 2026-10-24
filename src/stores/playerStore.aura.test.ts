import { prepareTownRespec, executeTownRespec } from './respecActions';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types/entities';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';

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
beforeEach(() => { useCombatStore.getState().reset(); useMapStore.getState().reset(); useInventoryStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); usePlayerStore.getState().reset(); });
function respec() { const quote = prepareTownRespec('npc/akara', 'skill'); return quote.kind === 'ok' ? executeTownRespec(quote.request) : quote.kind; }
function resetExpected(input: Player, free: number) {
  const { selectedAuraId: _aura, ...base } = input;
  const next = { ...base, skillLevels: {}, skills: [], comboOrder: [], skillPoints: input.skillPoints + 2, respecsRemaining: { stat: 3, skill: free } };
  return { ...next, derivedStats: deriveEquippedPlayerStats(next, next.level, {}, {}, {}, {}) };
}

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
    try {
      expect(respec()).toBe('ok');
      expect(usePlayerStore.getState().player).toEqual(resetExpected(input, 2));
      expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      expect(observed.publications).toHaveLength(1);
    } finally { observed.unsubscribe(); }
  });
  it.each(['no-allocations', 'insufficient-wishstones'] as const)('failed respec %s preserves selection and publishes nothing', reason => {
    const input = player({ selectedAuraId: 'paladin.might', respecsRemaining: { stat: 3, skill: 0 },
      ...(reason === 'no-allocations' ? { skillLevels: {} } : {}) });
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    try { expect(respec()).toBe(reason); expect(usePlayerStore.getState().player).toBe(input); expect(observed.publications).toEqual([]); }
    finally { observed.unsubscribe(); }
  });
});


describe('exclusive Meditation store selection', () => {
  it.each(['paladin.meditation', 'skills-paladin-meditation'])('selects allocated %s and replaces/clears atomically without resource changes', id => {
    const input = player({ level: 24, selectedAuraId: 'paladin.might',
      skillLevels: { 'paladin.might': 2, [id]: 11 } });
    const original = structuredClone(input);
    usePlayerStore.getState().setPlayer(input); const observed = observe();
    try {
      expect(usePlayerStore.getState().selectAura('paladin.meditation')).toBe('ok');
      const selected = usePlayerStore.getState().player;
      expect(selected).toEqual({ ...input, selectedAuraId: 'paladin.meditation' });
      expect(selected?.derivedStats).toBe(input.derivedStats);
      expect(selected?.skillLevels).toBe(input.skillLevels);
      expect(selected?.cooldowns).toBe(input.cooldowns);
      expect(observed.publications).toEqual([selected]);
      expect(usePlayerStore.getState().selectAura('paladin.meditation')).toBe('ok');
      expect(usePlayerStore.getState().player).toBe(selected);
      expect(observed.publications).toHaveLength(1);
      expect(usePlayerStore.getState().selectAura('paladin.might')).toBe('ok');
      expect(usePlayerStore.getState().player).toEqual(input);
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      const { selectedAuraId: _selection, ...none } = input;
      expect(usePlayerStore.getState().player).toEqual(none);
      expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      const cleared = usePlayerStore.getState().player;
      expect(usePlayerStore.getState().selectAura(null)).toBe('ok');
      expect(usePlayerStore.getState().player).toBe(cleared);
      expect(observed.publications).toHaveLength(3); expect(input).toEqual(original);
    } finally { observed.unsubscribe(); }
  });
  it.each<Partial<Player>>([{ class: 'sorceress' }, { level: 23 }, { level: NaN }, { level: Infinity },
    { skillLevels: { 'paladin.might': 20 } }, { skillLevels: { 'paladin.meditation': 0 } },
    { skillLevels: { 'paladin.meditation': 1.5 } }, { skillLevels: { 'aura-meditation': 20 } }])(
    'refuses independently ineligible Meditation %# even when already selected', patch => {
      const input = player({ level: 24, skillLevels: { 'paladin.meditation': 1 },
        selectedAuraId: 'paladin.meditation', ...patch });
      usePlayerStore.getState().setPlayer(input); const basis = usePlayerStore.getState(); const observed = observe();
      try {
        expect(basis.selectAura('paladin.meditation')).toBe('ineligible');
        expect(usePlayerStore.getState()).toBe(basis); expect(observed.publications).toEqual([]);
        expect(basis.selectAura(null)).toBe('ok');
        expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
      } finally { observed.unsubscribe(); }
    });
  it('refuses aliases and malformed requests without publishing or replacing Might', () => {
    const input = player({ level: 24, selectedAuraId: 'paladin.might', skillLevels: { 'paladin.meditation': 20 } });
    usePlayerStore.getState().setPlayer(input); const basis = usePlayerStore.getState(); const observed = observe();
    try {
      for (const request of ['skills-paladin-meditation', 'aura-meditation', 'paladin.Meditation', undefined, {}, 1]) {
        expect(basis.selectAura(request)).toBe('unsupported-aura'); expect(usePlayerStore.getState()).toBe(basis);
      }
      expect(observed.publications).toEqual([]);
    } finally { observed.unsubscribe(); }
  });
  it('learning and combo never select Meditation; upgrading preserves explicit selection', () => {
    usePlayerStore.getState().setPlayer(player({ level: 24, skillLevels: { 'paladin.cleansing': 1 }, skillPoints: 2 }));
    expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-meditation')).toBe('ok');
    expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
    usePlayerStore.getState().setComboOrder(['paladin.meditation']);
    expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
    expect(usePlayerStore.getState().selectAura('paladin.meditation')).toBe('ok');
    expect(usePlayerStore.getState().allocateSkillPoint('skills-paladin-meditation')).toBe('ok');
    expect(usePlayerStore.getState().player?.selectedAuraId).toBe('paladin.meditation');
    expect(usePlayerStore.getState().player?.skillLevels?.['paladin.meditation']).toBe(2);
  });
  it.each(['paid', 'no-allocations', 'insufficient-wishstones'] as const)('respec %s clears only on success and publishes once', reason => {
    const input = player({ level: 24, selectedAuraId: 'paladin.meditation', respecsRemaining: { stat: 3, skill: 0 },
      skillLevels: reason === 'no-allocations' ? {} : { 'paladin.meditation': 2 } });
    useInventoryStore.setState({ currencies: { wishstone: reason === 'paid' ? 5 : 0 } });
    usePlayerStore.getState().setPlayer(input); const basis = usePlayerStore.getState(); const observed = observe();
    try {
      expect(respec()).toBe(reason === 'paid' ? 'ok' : reason);
      if (reason === 'paid') {
        expect(usePlayerStore.getState().player).toEqual(resetExpected(input, 0));
        expect(Object.hasOwn(usePlayerStore.getState().player ?? {}, 'selectedAuraId')).toBe(false);
        expect(useInventoryStore.getState().currencies.wishstone).toBe(0); expect(observed.publications).toHaveLength(1);
      } else { expect(usePlayerStore.getState()).toBe(basis); expect(observed.publications).toEqual([]); }
    } finally { observed.unsubscribe(); }
  });
});
