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
import { runBattleRecorded } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { eventToLocalizedLogEntry } from '@/stores/eventToLogI18n';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore];
beforeEach(() => { abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); abortSubAreaRun(); for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it(`shows actual paid Command as a localized positive finite effect (${locale})`, async () => {
  await i18n.changeLanguage(locale);
  const player = { ...createMockPlayer('Synthetic Command feedback', 'barbarian'), level: 30,
    skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1, 'barbarian.battle_orders': 1,
      'barbarian.battle_command': 20 }, comboOrder: ['barbarian.battle_command'] };
  usePlayerStore.getState().setPlayer(player);
  const hero = playerToCombatUnit(player);
  const enemy: CombatUnit = { ...hero, id: 'synthetic-command-tank', side: 'enemy', kind: 'monster',
    life: 1000000000, stats: { ...hero.stats, lifeMax: 1000000000, attack: 0 },
    skillOrder: [], statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  const out = runBattleRecorded({ seed: 7, playerTeam: [hero], enemyTeam: [enemy] });
  const buff = out.events.find(event => event.kind === 'buff' && event.buffId === 'battle-command');
  const active = out.events.find(event => event.kind === 'status-state' && event.target === hero.id &&
    event.statuses.some(status => status.id === 'battle-command'));
  if (buff?.kind !== 'buff' || active?.kind !== 'status-state') throw new Error('Missing actual paid Command');
  const paid = active.statuses.find(status => status.id === 'battle-command');
  const expired = out.events.find(event => event.kind === 'status-state' && event.target === hero.id &&
    event.simClockMs === paid?.expiresAtMs && !event.statuses.some(status => status.id === 'battle-command'));
  if (expired?.kind !== 'status-state') throw new Error('Missing actual Command expiry');
  const name = locale === 'en' ? 'Battle Command' : '战斗指挥';
  expect.soft(eventToLocalizedLogEntry(buff)?.message).toContain(name);
  useCombatStore.setState({ inCombat: true, isPaused: true,
    playerTeam: [{ ...hero, statuses: active.statuses }], enemyTeam: [enemy] });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  const card = screen.getByTestId('unit-card-' + hero.id);
  const chip = within(card).getByTestId('unit-effect-chips').firstElementChild;
  expect.soft(chip).toHaveTextContent(name);
  expect.soft(chip).toHaveClass('text-blue-200');
  act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, statuses: expired.statuses }] }); });
  expect(within(card).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
});
