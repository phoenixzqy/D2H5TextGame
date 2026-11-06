/** Constructed hero/gear and unlock capabilities; real journal actions and native full-area culls. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { REGIONAL_BOUNTY_DOMAIN, REGIONAL_BOUNTY_MAX_CLAIMS } from '@/engine/map/regional-bounties';
import { xpRequired } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { QuestsScreen } from './QuestsScreen';

const first = REGIONAL_BOUNTY_DOMAIN[0];
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const originalLocale = i18n.language;
const originalHydration = useHydrationStore.getState();
function mount() {
  const view = render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><QuestsScreen /></MemoryRouter></Suspense></I18nextProvider>);
  fireEvent.click(screen.getByRole('tab', { name: i18n.t('bounty', { ns: 'quests' }) })); return view;
}
function actors() { return structuredClone({ hero: usePlayerStore.getState().player, mercs: useMercStore.getState().ownedMercs }); }
function finishCull(seed: number) {
  act(() => {
    startSubAreaRun({ act: 1, subAreaId: first.area, mode: 'manual', runSeed: seed });
    let remainingWaves = 100;
    while (!useCombatStore.getState().runVictory && !useCombatStore.getState().runDefeat && remainingWaves-- > 0) {
      let remainingEvents = 100_000;
      while (!useCombatStore.getState().playbackComplete && remainingEvents-- > 0) useCombatStore.getState().advanceEvent();
      expect(useCombatStore.getState().playbackComplete).toBe(true); advanceWaveOrFinish();
    }
    expect(useCombatStore.getState().runVictory).toBe(true);
    abortSubAreaRun(); useCombatStore.getState().endCombat();
  });
}
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Bounty journal fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), comboOrder: [] });
  const gear = { id: 'bounty-ui-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: first.area, selectedDifficulty: 'normal',
    clearedSubAreas: [first.area], questProgress: {}, bounties: {}, questReceipts: {} });
  useInventoryStore.setState({ currencies: { 'gem-shard': 0, gemShards: 77, gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.setState(originalHydration); await i18n.changeLanguage(originalLocale); vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('regional bounty real journal UI %s', locale => {
  it('shows only unlocked contracts and Accept never uses generic Start or old clear flags', async () => {
    await i18n.changeLanguage(locale); const before = actors(), wallet = structuredClone(useInventoryStore.getState().currencies); mount();
    expect(screen.getByTestId(`quest-${first.quest}`)).toBeVisible();
    for (const definition of REGIONAL_BOUNTY_DOMAIN.slice(1)) expect(screen.queryByTestId(`quest-${definition.quest}`)).toBeNull();
    expect(screen.queryByTestId(`quest-start-${first.quest}`)).toBeNull();
    expect(useMapStore.getState().bounties).toEqual({});
    const accept = screen.getByTestId(`bounty-accept-${first.quest}`);
    expect(accept).toHaveAccessibleName(i18n.t('regionalBounty.accept', { ns: 'quests' }));
    expect(accept).toBeEnabled(); fireEvent.click(accept);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
    expect(useMapStore.getState().questProgress[first.quest]).toEqual({ id: first.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-cull': false } });
    expect(screen.getByTestId(`bounty-progress-${first.quest}`)).toHaveTextContent('0/1');
    expect(screen.queryByTestId(`quest-claim-${first.quest}`)).toBeNull();
    expect(actors()).toEqual(before); expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(screen.getByTestId(`quest-${first.quest}`).textContent).not.toMatch(/regionalBounty\.|byId\.|quests\/|undefined/);
  });

  it('uses two real full culls with separate Claim and explicit Repeat, paying exactly one catalyst per cycle without bounty XP', async () => {
    await i18n.changeLanguage(locale); mount(); fireEvent.click(screen.getByTestId(`bounty-accept-${first.quest}`));
    for (let cycle = 1; cycle <= 2; cycle++) {
      finishCull(8100 + cycle);
      expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: cycle - 1, victoryOrdinal: cycle });
      expect(screen.getByTestId(`bounty-progress-${first.quest}`)).toHaveTextContent('1/1');
      const beforeClaim = actors(), inventoryBefore = useInventoryStore.getState();
      const claim = screen.getByTestId(`quest-claim-${first.quest}`); expect(claim).toBeEnabled();
      fireEvent.click(claim);
      expect(actors()).toEqual(beforeClaim);
      expect(useInventoryStore.getState().backpack).toBe(inventoryBefore.backpack);
      expect(useInventoryStore.getState().currencies).toEqual({ ...inventoryBefore.currencies,
        'gem-shard': (inventoryBefore.currencies['gem-shard'] ?? 0) + 1 });
      expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: cycle, victoryOrdinal: cycle });
      expect(useMapStore.getState().questProgress[first.quest]?.rewardClaimed).toBe(true);
      expect(claim).toBeDisabled(); fireEvent.click(claim);
      expect(actors()).toEqual(beforeClaim);
      const repeat = screen.getByTestId(`bounty-repeat-${first.quest}`); expect(repeat).toBeEnabled();
      if (cycle === 1) {
        const wallet = structuredClone(useInventoryStore.getState().currencies); fireEvent.click(repeat);
        expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 1, victoryOrdinal: 1 });
        expect(useMapStore.getState().questProgress[first.quest]).toMatchObject({ status: 'inProgress', rewardClaimed: false, objectives: { 'obj-cull': false } });
        expect(screen.getByTestId(`bounty-progress-${first.quest}`)).toHaveTextContent('0/1');
        expect(useInventoryStore.getState().currencies).toEqual(wallet); expect(actors()).toEqual(beforeClaim);
      }
    }
    expect(screen.getByTestId(`bounty-claims-${first.quest}`)).toHaveTextContent('2');
    expect(screen.queryByTestId(`quest-start-${first.quest}`)).toBeNull();
  });

  it('renders the constructed exhausted boundary with disabled Repeat and truthful localized explanation', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ bounties: { [first.quest]: { claims: REGIONAL_BOUNTY_MAX_CLAIMS, victoryOrdinal: REGIONAL_BOUNTY_MAX_CLAIMS } },
      questProgress: { [first.quest]: { id: first.quest, status: 'completed', rewardClaimed: true, objectives: { 'obj-cull': true } } } });
    const before = actors(), map = useMapStore.getState(), wallet = useInventoryStore.getState().currencies; mount();
    const card = within(screen.getByTestId(`quest-${first.quest}`));
    expect(screen.getByTestId(`bounty-repeat-${first.quest}`)).toBeDisabled();
    expect(card.getByText(i18n.t('regionalBounty.exhausted', { ns: 'quests' }))).toBeVisible();
    expect(screen.getByTestId(`quest-claim-${first.quest}`)).toBeDisabled();
    expect(actors()).toEqual(before); expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState().currencies).toBe(wallet);
  });
});
