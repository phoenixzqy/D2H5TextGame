import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import { composeEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { CharacterScreen } from './CharacterScreen';
import { createMockPlayer } from './createMockPlayer';

const malah = loadCountedQuestItems().find(row => row.key === 'malah');
if (!malah) throw new Error('Missing canonical Malah definition');
const definition = malah;
const originalLocale = i18n.language;
const hydration = useHydrationStore.getState();
const stores = [usePlayerStore, useInventoryStore, useMapStore] as const;
function hero() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing Vitality fixture');
  return player;
}
function fixture(raw: number, physical = true) {
  const fresh = createMockPlayer('Effective Vitality', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, statPoints: 3,
    coreStats: { ...fresh.coreStats, vitality: raw },
    derivedStats: { ...fresh.derivedStats, life: 7, mana: 5 } });
  useMapStore.setState({ questProgress: { [definition.quest]: { id: definition.quest,
    status: 'completed', rewardClaimed: true, objectives: { [definition.objective]: true } } } });
  if (physical) useInventoryStore.setState({ questItems: Object.fromEntries(definition.sources.map(source =>
    [source, { itemId: definition.itemId, state: 'consumed' as const }])) });
  usePlayerStore.getState().recomputeDerived({});
}
function renderSheet() {
  return render(<I18nextProvider i18n={i18n}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CharacterScreen />
    </MemoryRouter>
  </I18nextProvider>);
}
function increase() {
  return screen.getByRole('button', { name: i18n.t('character:draft.increase', {
    attribute: i18n.t('common:stats.vitality') }) });
}
beforeEach(() => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(async () => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.setState(hydration);
  await i18n.changeLanguage(originalLocale);
});

describe.each(['en', 'zh-CN'])('effective Vitality sheet %s', locale => {
  it.each([[199, 209, 209], [200, 210, 210], [499, 509, 359.5], [500, 510, 360]])(
    'shows raw %s independently of effective sheet %s and formula %s', async (raw, sheet, formula) => {
      await i18n.changeLanguage(locale);
      fixture(raw);
      const before = structuredClone(hero());
      renderSheet();
      expect(screen.getByTestId('char-draft-vitality')).toHaveTextContent(new RegExp(`^${String(raw)}$`));
      expect(screen.getByTestId('char-vitality-composition')).toHaveTextContent(i18n.t('character:vitality.effective', { sheet, formula }));
      expect(screen.getByTestId('char-vitality-composition')).toHaveTextContent(i18n.t('character:vitality.breakdown', {
        raw, equipment: 0, ordinarySheet: raw, elixir: 10 }));
      const label = within(screen.getByTestId('hero-strip')).getByText(i18n.t('common:stats.vitality'), { exact: true });
      expect(label.parentElement).toHaveTextContent(String(sheet));
      if (raw === 500) expect(increase()).toBeDisabled();
      else expect(increase()).toBeEnabled();
      expect(hero()).toEqual(before);
      expect(hero().derivedStats).toMatchObject({ life: 7, mana: 5 });
    });

  it('previews, cancels and applies raw499→500 with sheet510 and no resource refill', async () => {
    await i18n.changeLanguage(locale);
    fixture(499);
    const before = hero();
    const projected = composeEquippedPlayerStats({ ...before, coreStats: { ...before.coreStats, vitality: 500 } },
      before.level, {}, useMapStore.getState().questProgress, useInventoryStore.getState().questItems);
    renderSheet();
    fireEvent.click(increase());
    expect(screen.getByTestId('char-vitality-preview')).toHaveTextContent(i18n.t('character:vitality.preview', {
      sheet: 510, lifeMax: projected.derivedStats.lifeMax }));
    expect(increase()).toBeDisabled();
    expect(hero()).toBe(before);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('character:draft.cancel') }));
    expect(screen.queryByTestId('char-vitality-preview')).toBeNull();
    expect(hero()).toBe(before);
    fireEvent.click(increase());
    fireEvent.click(screen.getByRole('button', { name: i18n.t('character:draft.apply') }));
    expect(hero()).toMatchObject({ statPoints: 2, coreStats: { vitality: 500 },
      derivedStats: { ...projected.derivedStats, life: 7, mana: 5 } });
    expect(screen.getByTestId('char-draft-vitality')).toHaveTextContent(/^500$/);
    expect(increase()).toBeDisabled();
    expect(screen.queryByTestId('char-vitality-preview')).toBeNull();
  });

  it('shows no elixir entitlement for source-free historical claimed flags', async () => {
    await i18n.changeLanguage(locale);
    fixture(500, false);
    renderSheet();
    expect(screen.getByTestId('char-vitality-composition')).toHaveTextContent(i18n.t('character:vitality.effective', {
      sheet: 500, formula: 350 }));
    expect(screen.getByTestId('char-vitality-composition')).toHaveTextContent(i18n.t('character:vitality.breakdown', {
      raw: 500, equipment: 0, ordinarySheet: 500, elixir: 0 }));
    expect(hero().derivedStats).toMatchObject({ life: 7, mana: 5 });
  });
});
