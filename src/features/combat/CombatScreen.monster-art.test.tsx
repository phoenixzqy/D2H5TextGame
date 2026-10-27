import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit, resolveCombatUnitDisplayName } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';
import * as overrides from '@/ui/imageOverrides';
import type { CombatUnit } from '@/engine/combat/types';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
function setup(id: string) {
  const player = createMockPlayer('Art fixture', 'assassin'); usePlayerStore.getState().setPlayer(player);
  const hero = playerToCombatUnit(player);
  const enemy: CombatUnit = { ...hero, id, name: 'Monster fixture', kind: 'monster', side: 'enemy',
    life: 37, stats: { ...hero.stats, lifeMax: 80 }, gridPosition: { row: 0, col: 1 } };
  useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [enemy] });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter></Suspense></I18nextProvider>);
  return { enemy, card: screen.getByTestId('unit-card-' + enemy.id) };
}
for (const locale of ['en', 'zh-CN'] as const) {
  it(`renders missing Blood Lord art deliberately while preserving its name and actual HP in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const { enemy, card } = setup('enemy-act5.blood-lord-0-abc');
    const name = resolveCombatUnitDisplayName(enemy);
    expect(card).toHaveAccessibleName(name);
    expect(card.querySelector('img')).toBeNull();
    expect(within(card).getByText(name.slice(0, 2))).toBeVisible();
    expect(within(card).getByRole('progressbar', { name: locale === 'en' ? 'HP' : '生命' }))
      .toHaveAttribute('aria-valuenow', '37');
  });

  it(`recovers a compact portrait after real load errors and later source changes in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    let source = '/custom/failed-fallen.webp';
    vi.spyOn(overrides, 'getImageOverride').mockImplementation((kind, key) =>
      kind === 'monster' && key === 'act1.fallen' ? source : null);
    const { enemy, card } = setup('enemy-act1.fallen-0-abc');
    const portrait = card.querySelector('img');
    expect(portrait).toHaveAttribute('src', source);
    if (!portrait) throw new Error('Expected registered portrait');
    fireEvent.error(portrait);
    expect(card.querySelector('img')).toBeNull();
    expect(within(card).getByText(resolveCombatUnitDisplayName(enemy).slice(0, 2))).toBeVisible();
    source = '/custom/recovered-fallen.webp';
    act(() => { useCombatStore.setState({ enemyTeam: [{ ...enemy, life: 36 }] }); });
    const recovered = card.querySelector('img');
    expect(recovered).toHaveAttribute('src', source);
    expect(recovered).toHaveClass('object-cover', 'object-top');
    expect(recovered).toHaveAttribute('loading', 'lazy');
    if (!recovered) throw new Error('Expected recovered portrait');
    fireEvent.error(recovered);
    expect(card.querySelector('img')).toBeNull();
    source = '/custom/failed-fallen.webp';
    act(() => { useCombatStore.setState({ enemyTeam: [{ ...enemy, life: 35 }] }); });
    expect(card.querySelector('img')).toHaveAttribute('src', source);
    expect(within(card).getByRole('progressbar', { name: locale === 'en' ? 'HP' : '生命' }))
      .toHaveAttribute('aria-valuenow', '35');
  });
}
