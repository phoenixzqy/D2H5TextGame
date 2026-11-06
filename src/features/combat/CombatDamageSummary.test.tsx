import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { BattleEvent, RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore] as const;
const hero: CombatUnit = {
  id: 'player-hero', name: 'Hero', side: 'player', kind: 'hero', level: 1, tier: 'trash', life: 0, mana: 0,
  stats: { life: 0, lifeMax: 10, mana: 0, manaMax: 0, attack: 1, attackSpeed: 100, defense: 0,
    magicResist: 0, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
  statuses: [], cooldowns: {}, activeBuffIds: [], skillOrder: [], enraged: false
};
const hit = (damageType: string, amount: number, target = hero.id): BattleEvent => ({
  kind: 'damage', source: 'enemy', target, damageType, amount, crit: false, dodged: false
});
const recorded = (events: readonly BattleEvent[]): RecordedBattleEvent[] => events.map((event, index) => ({
  ...event, simClockMs: index * 100, uiDelayMs: 0
}));
const events = recorded([
  hit('physical', 1001), hit('fire', 20), hit('true', 3), hit('mystery-type', 5),
  { kind: 'dot', target: hero.id, amount: 4 }, hit('cold', 999, 'merc-fixture'),
  { kind: 'end', winner: 'enemy' }
]);

// Constructed final-wave presentation; no earned progression or balance claim.
function mount(overrides: Partial<ReturnType<typeof useCombatStore.getState>> = {}) {
  useCombatStore.setState({ playerTeam: [hero], recordedEvents: events, eventCursor: events.length,
    playbackComplete: true, runDefeat: true, runVictory: false,
    outcome: { winner: 'enemy', finalPlayerTeam: [hero], finalEnemyTeam: [] }, ...overrides });
  return render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CombatScreen />
  </MemoryRouter></I18nextProvider>);
}

describe.each(['en', 'zh-CN'] as const)('defeat damage summary %s', locale => {
  const english = locale === 'en';
  beforeEach(async () => {
    for (const store of stores) store.getState().reset();
    useHydrationStore.getState().setStatus('ready');
    await i18n.changeLanguage(locale);
  });
  afterEach(() => { act(() => { for (const store of stores) store.getState().reset(); }); });

  it('shows final-wave hero damage with localized types, scope and exact recorded totals', () => {
    const before = structuredClone(events);
    mount();
    const summary = screen.getByRole('region', { name: english ? 'Hero damage in the final wave' : '英雄在最后一波受到的伤害' });
    expect(summary).toHaveTextContent(english ? 'Includes overkill and self-damage' : '包含过量伤害和自身造成的伤害');
    const amounts = within(summary).getAllByRole('definition').map(row => row.textContent);
    expect(amounts).toEqual(['1,001', '20', '3', '5', '4', '1,033']);
    expect(within(summary).getAllByRole('term').map(row => row.textContent)).toEqual(english
      ? ['physical', 'fire', 'true', 'Other direct damage', 'Damage over time', 'Total recorded damage']
      : ['物理', '火焰', '真实', '其他直接伤害', '持续伤害', '记录的伤害合计']);
    expect(summary).not.toHaveTextContent(/mystery-type|999|Cold|冰冷/);
    expect(events).toEqual(before);
    expect(useCombatStore.getState().recordedEvents).toBe(events);
    expect(useCombatStore.getState().playerTeam).toEqual([hero]);
  });

  it('also explains a completed draw', () => {
    const draw = recorded([{ kind: 'dot', target: hero.id, amount: 4 }, { kind: 'end', winner: null }]);
    mount({ recordedEvents: draw, eventCursor: draw.length,
      outcome: { winner: null, finalPlayerTeam: [hero], finalEnemyTeam: [] } });
    expect(screen.getByTestId('hero-damage-summary')).toHaveTextContent(english ? 'Damage over time' : '持续伤害');
  });

  it('distinguishes a valid no-damage wave from unavailable details', () => {
    const empty = recorded([{ kind: 'end', winner: null }]);
    mount({ recordedEvents: empty, eventCursor: empty.length });
    expect(screen.getByTestId('hero-damage-summary')).toHaveTextContent(english
      ? 'No damage to your hero was recorded in this wave.' : '本波未记录到英雄受到伤害。');
    expect(screen.queryAllByRole('definition')).toHaveLength(0);
  });

  it.each(['recording', 'hero'] as const)('reports unavailable %s instead of zero damage', missing => {
    mount(missing === 'recording' ? { recordedEvents: [], eventCursor: 0 } : { playerTeam: [] });
    expect(screen.getByTestId('hero-damage-summary')).toHaveTextContent(english
      ? 'Damage details for this wave are unavailable.' : '本波伤害详情不可用。');
    expect(screen.queryAllByRole('definition')).toHaveLength(0);
  });

  it.each([
    { runDefeat: false, runVictory: true },
    { runDefeat: false, runVictory: false },
    { playbackComplete: false },
    { eventCursor: events.length - 1 }
  ])('does not disclose the summary outside completed loss playback: %j', state => {
    mount(state);
    expect(screen.queryByTestId('hero-damage-summary')).not.toBeInTheDocument();
  });
});
