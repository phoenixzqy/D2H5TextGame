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
import { CombatScreen } from '@/features/combat/CombatScreen';
import type { CombatUnit } from '@/engine/combat/types';
const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const)
  it(`exposes each compact unit's real fractional HP and live death with its localized resource name in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const player = createMockPlayer('Health fixture', 'assassin'); usePlayerStore.getState().setPlayer(player);
    const base = playerToCombatUnit(player);
    const hero: CombatUnit = { ...base, id: 'hero', kind: 'hero', life: 64.5,
      stats: { ...base.stats, life: 999, lifeMax: 128.75 }, gridPosition: { row: 1, col: 1 } };
    const merc: CombatUnit = { ...hero, id: 'merc', name: 'Merc fixture', kind: 'merc', life: 25,
      stats: { ...hero.stats, lifeMax: 100 }, gridPosition: { row: 0, col: 0 } };
    const summon: CombatUnit = { ...hero, id: 'summon', name: 'Summon fixture', kind: 'summon', summonOwnerId: 'hero',
      life: 10, stats: { ...hero.stats, lifeMax: 20 }, gridPosition: { row: 0, col: 2 } };
    const enemy: CombatUnit = { ...hero, id: 'enemy', name: 'Enemy fixture', kind: 'monster', side: 'enemy',
      life: 50, stats: { ...hero.stats, lifeMax: 200 }, gridPosition: { row: 0, col: 1 } };
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [merc, summon, hero], enemyTeam: [enemy] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
    for (const unit of [hero, merc, summon, enemy]) {
      const card = screen.getByTestId('unit-card-' + unit.id);
      expect(card).toHaveAttribute('role', 'group');
      expect(card).toHaveAccessibleName();
      const hp = within(card).getByRole('progressbar', { name: locale === 'en' ? 'HP' : '生命' });
      expect(hp).toHaveAttribute('aria-valuenow', String(unit.life));
      expect(hp).toHaveAttribute('aria-valuemax', String(unit.stats.lifeMax));
      expect(hp).toHaveAttribute('aria-valuemin', '0');
    }
    act(() => { useCombatStore.setState({ playerTeam: [merc, summon, { ...hero, life: 0 }] }); });
    const dead = screen.getByTestId('unit-card-hero');
    expect(dead).toHaveAttribute('data-dead', 'true');
    expect(within(dead).getByRole('progressbar', { name: locale === 'en' ? 'HP' : '生命' }))
      .toHaveAttribute('aria-valuenow', '0');
    expect(dead.querySelector('.bg-red-600')).toHaveStyle({ width: '0%' });
  });
