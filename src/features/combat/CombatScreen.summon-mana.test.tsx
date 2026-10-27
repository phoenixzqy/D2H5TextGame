import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';
import type { CombatUnit } from '@/engine/combat/types';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const)
  it(`shows a shadow's own live mana, exhaustion and death without adding pools to other compact cards in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const player = createMockPlayer('Summon resource fixture', 'assassin');
    usePlayerStore.getState().setPlayer(player);
    const hero = { ...playerToCombatUnit(player), id: 'hero', gridPosition: { row: 1, col: 1 } };
    const body: CombatUnit = { ...hero, id: 'shadow', name: 'Shadow fixture', kind: 'summon', summon: true,
      summonOwnerId: 'hero', summonTemplateId: 'shadow_warrior', mana: 63.5,
      stats: { ...hero.stats, mana: 999, manaMax: 100 }, gridPosition: { row: 0, col: 0 } };
    const empty: CombatUnit = { ...body, id: 'mana-free', name: 'Mana-free fixture', mana: 0,
      stats: { ...body.stats, mana: 0, manaMax: 0 }, gridPosition: { row: 0, col: 2 } };
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero, body, empty], enemyTeam: [] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
    const name = locale === 'en' ? 'MP' : '法力';
    const card = screen.getByTestId('unit-card-shadow');
    const bar = within(card).getByRole('progressbar', { name });
    expect(bar).toHaveAttribute('aria-valuenow', '63.5');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(card).toHaveTextContent(name + ' 63.5 / 100');
    expect(bar.querySelector('.bg-blue-600')).toHaveStyle({ width: '63.50%' });
    for (const id of ['hero', 'mana-free'])
      expect(within(screen.getByTestId('unit-card-' + id)).queryByRole('progressbar', { name })).toBeNull();
    act(() => { useCombatStore.setState({ playerTeam: [hero, { ...body, mana: 0 }, empty] }); });
    expect(within(card).getByRole('progressbar', { name })).toHaveAttribute('aria-valuenow', '0');
    expect(card).toHaveTextContent(name + ' 0 / 100');
    act(() => { useCombatStore.setState({ playerTeam: [hero, { ...body, life: 0, mana: 0 }, empty] }); });
    expect(screen.queryByTestId('unit-card-shadow')).toBeNull();
  });
