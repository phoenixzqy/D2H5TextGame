import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { eliteConfig } from '@/data';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, buildEnemiesForWave, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing native affix fixture');
  return value;
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(async () => {
  cleanup(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
  await i18n.changeLanguage('zh-CN');
});

it.each(['en', 'zh-CN'])('shows one readable selected-affix badge per native card in %s', async locale => {
  await i18n.changeLanguage(locale);
  const hero = createMockPlayer('Affix fixture', 'necromancer');
  usePlayerStore.getState().setPlayer(hero);
  const enemies = buildEnemiesForWave({ id: 'affix-display', waveTier: 'elite', spawns: [
    ...eliteConfig.affixes.map((eliteAffix, index) => ({
      archetypeId: 'monsters/act2.sand-raider', level: 20,
      tier: 'champion' as const, index, eliteAffix,
    })),
    { archetypeId: 'monsters/act2.sand-raider', level: 20, tier: 'trash', index: 6 },
    { archetypeId: 'monsters/act2.duriel', level: 20, tier: 'chapter-boss', index: 7 },
  ] }, 7);
  useCombatStore.setState({ inCombat: true, isPaused: true,
    playerTeam: [{ ...playerToCombatUnit(hero), gridPosition: { row: 1, col: 1 } }],
    enemyTeam: enemies.map((unit, index) => ({ ...unit, gridPosition: { row: Math.floor(index / 3), col: index % 3 } })),
  });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CombatScreen />
  </MemoryRouter></Suspense></I18nextProvider>);
  const label = locale === 'en' ? 'Elite modifiers' : '精英词缀';
  enemies.slice(0, 6).forEach((unit, index) => {
    const card = within(screen.getByTestId(`unit-card-${unit.id}`));
    const badge = card.getByRole('list', { name: label });
    const text = i18n.t(`combat:eliteAffixTag.${required(eliteConfig.affixes[index]).nameKey.replace('combat.eliteAffix.', '')}`);
    expect(within(badge).getAllByRole('listitem')).toHaveLength(1);
    expect(badge).toHaveTextContent(text);
    expect(card.getAllByText(text, { exact: true })).toHaveLength(1);
  });
  for (const unit of enemies.slice(6)) {
    expect(within(screen.getByTestId(`unit-card-${unit.id}`)).queryByRole('list', { name: label })).toBeNull();
  }
  const first = required(enemies[0]);
  await act(async () => { await i18n.changeLanguage(locale === 'en' ? 'zh-CN' : 'en'); });
  expect(within(screen.getByTestId(`unit-card-${first.id}`)).getByRole('list', {
    name: locale === 'en' ? '精英词缀' : 'Elite modifiers',
  })).toHaveTextContent(locale === 'en' ? '额外火焰伤害' : 'Extra Fire Damage');
  act(() => { useCombatStore.setState({ enemyTeam: [{ ...required(enemies[6]), id: first.id, gridPosition: { row: 0, col: 0 } }] }); });
  expect(within(screen.getByTestId(`unit-card-${first.id}`)).queryByRole('list')).toBeNull();
});
