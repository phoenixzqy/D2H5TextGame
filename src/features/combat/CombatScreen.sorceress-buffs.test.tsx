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
import { paySorceressBuff, SORCERESS_BUFF_DEFINITIONS } from '@/engine/skills/sorceress-buffs';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore];
beforeEach(() => { abortSubAreaRun(); for (const s of stores) s.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const s of stores) s.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const id of ['teleport', 'enchant'] as const) {
  it(`${id} displays a localized positive finite chip and removes it when the status view clears (${locale})`, async () => {
    await i18n.changeLanguage(locale);
    const player = { ...createMockPlayer('Synthetic paid buff chip', 'sorceress'), level: 30 };
    usePlayerStore.getState().setPlayer(player);
    const unit = playerToCombatUnit(player), duration = SORCERESS_BUFF_DEFINITIONS[id].durationMs;
    const hero = { ...unit, statuses: [{ id, sourceId: unit.id, stacks: 1, remaining: duration / 1000,
      appliedAtMs: 0, expiresAtMs: duration, sorceressBuff: paySorceressBuff(id, 20, unit.stats.attack) }] };
    useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [] });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    const card = screen.getByTestId('unit-card-' + hero.id);
    const chip = within(card).getByTestId('unit-effect-chips').firstElementChild;
    expect(chip).toHaveTextContent(locale === 'en' ? (id === 'teleport' ? 'Teleport' : 'Enchant')
      : (id === 'teleport' ? '传送' : '附魔'));
    expect(chip).toHaveClass('text-blue-200');
    act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, statuses: [] }] }); });
    expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
  });
}
