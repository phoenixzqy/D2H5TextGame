import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { payPeriodicSpell } from '@/engine/skills/periodic-spells';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore];
beforeEach(() => { abortSubAreaRun(); for (const s of stores) s.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const s of stores) s.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const spell of ['blaze', 'fire-wall', 'thunder-storm', 'inferno'] as const) {
  it(`${spell} renders as a localized positive finite effect, removed by playback (${locale})`, async () => {
    await i18n.changeLanguage(locale);
    const player = createMockPlayer('Synthetic field chip', 'sorceress');
    usePlayerStore.getState().setPlayer(player);
    const hero = payPeriodicSpell(playerToCombatUnit(player), spell, 1, 0);
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    const card = screen.getByTestId('unit-card-' + hero.id);
    const chip = within(card).getByTestId('unit-effect-chips').firstElementChild;
    const names = locale === 'en' ? { blaze: 'Blaze', 'fire-wall': 'Fire Wall', 'thunder-storm': 'Thunder Storm', inferno: 'Inferno' }
      : { blaze: '炽烈之径', 'fire-wall': '火墙', 'thunder-storm': '雷暴', inferno: '炼狱' };
    expect(chip).toHaveTextContent(names[spell]);
    expect(chip).toHaveClass('text-blue-200');
    act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, statuses: [] }] }); });
    expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
  });
}
