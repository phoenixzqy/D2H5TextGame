import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as towns from '@/data/loaders/towns';
import { loadItemBases } from '@/data/loaders/loot';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { claimQuestReward } from '@/features/quests/claimReward';
import { QuestServicePanel } from './QuestServicePanel';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { LARZUK } from '@/engine/map/larzuk-quest';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';

const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const originalTownNpcs = towns.loadTownNpcs;
const stops: (() => void)[] = [];
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Larzuk fixture'); return value; }
const siege = required(ACT5_ENCOUNTERS.find(row => row.questId === LARZUK.prerequisite));
const base = required([...loadItemBases().values()].find(row => row.type === 'weapon' && (row.maxSockets ?? 0) > 1));
const sideSource = `${LARZUK.quest}#reward:service`;
function gear(id = 'presented'): Item { return { id, baseId: base.id, rarity: 'normal', level: 12, identified: true,
  equipped: false, socketCapacity: 0, baseRolls: { attack: 7 }, affixes: [] }; }
const inv = () => useInventoryStore.getState();
const map = () => useMapStore.getState();
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Larzuk', 'sorceress'), equipment: [] });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-bloody-foothills', isActUnlocked: () => true,
    questProgress: {
      [LARZUK.prerequisite]: { id: LARZUK.prerequisite, status: 'completed', rewardClaimed: false, objectives: { [siege.objectiveId]: true } },
      [LARZUK.quest]: { id: LARZUK.quest, status: 'inProgress', rewardClaimed: false, objectives: { [LARZUK.objective]: false } }
    }, questReceipts: { [siege.proof]: true } });
  vi.spyOn(towns, 'loadTownNpcs').mockImplementation(originalTownNpcs);
  useInventoryStore.setState({ backpack: [gear()] });
  validateQuestItemLedger(inv().questItems, map().questProgress, map().questReceipts);
  validateNative24CurrentCampaignRewards(map(), inv().questItems, inv().questServices, map().endgame);
});
afterEach(() => { cleanup(); stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });


function panel(npcId = 'npc/larzuk') { return render(<I18nextProvider i18n={i18n}><QuestServicePanel npcId={npcId} /></I18nextProvider>); }
describe('Larzuk localized Present and independent socket services', () => {
  it.each(['en', 'zh-CN'])('%s presents unchanged before journal Claim, then uses its independent charge', async locale => {
    await i18n.changeLanguage(locale); panel();
    const item = required(inv().backpack[0]), button = screen.getByTestId('larzuk-present-use');
    expect(button).toBeDisabled(); expect(screen.getByTestId('larzuk-present-target')).toHaveAccessibleName(i18n.t('larzukPresent.chooseItem', { ns: 'town' }));
    fireEvent.change(screen.getByTestId('larzuk-present-target'), { target: { value: item.id } });
    expect(button).toBeEnabled(); expect(screen.getByTestId('larzuk-present-preview')).toBeVisible();
    fireEvent.click(button); expect(inv().backpack[0]).toBe(item); expect(inv().questServices).toEqual({});
    expect(screen.getByText(i18n.t('larzukPresent.success', { ns: 'town' }))).toBeVisible();
    expect(screen.queryByTestId('larzuk-present-use')).not.toBeInTheDocument();
    act(() => { expect(claimQuestReward(LARZUK.quest)).toBe('ok'); });
    const row = screen.getByTestId(`quest-service-${sideSource}`);
    expect(within(row).getByRole('button')).toBeDisabled();
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: item.id } });
    fireEvent.click(within(row).getByRole('button'));
    expect(inv().backpack[0]?.socketCapacity).toBe(base.maxSockets); expect(inv().questServices[sideSource]?.state).toBe('consumed');
    expect(screen.queryByTestId('larzuk-present-use')).not.toBeInTheDocument();
  });
  it('does not refresh an equal replacement selection and disables until the player selects again', async () => {
    await i18n.changeLanguage('en'); panel(); const item = required(inv().backpack[0]);
    fireEvent.change(screen.getByTestId('larzuk-present-target'), { target: { value: item.id } });
    act(() => { useInventoryStore.setState({ backpack: [structuredClone(item)] }); });
    expect(screen.getByTestId('larzuk-present-use')).toBeDisabled(); expect(screen.queryByTestId('larzuk-present-preview')).not.toBeInTheDocument();
  });
  it('reports failed publication and preserves the item without stale success', () => {
    panel(); const item = required(inv().backpack[0]); fireEvent.change(screen.getByTestId('larzuk-present-target'), { target: { value: item.id } });
    const real = useMapStore.setState; vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('test failure'); });
    fireEvent.click(screen.getByTestId('larzuk-present-use'));
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('services.feedback.grant-failed', { ns: 'town' }));
    expect(screen.getByTestId('larzuk-present-use')).toBeDisabled(); expect(inv().backpack).toEqual([item]);
  });
  it.each(['hero', 'proof', 'difficulty'])('clears successful feedback on %s replacement', kind => {
    panel(); const item = required(inv().backpack[0]); fireEvent.change(screen.getByTestId('larzuk-present-target'), { target: { value: item.id } }); fireEvent.click(screen.getByTestId('larzuk-present-use'));
    const success = i18n.t('larzukPresent.success', { ns: 'town' }); expect(screen.getByText(success)).toBeVisible();
    act(() => {
      if (kind === 'hero') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
      if (kind === 'proof') useMapStore.setState({ questReceipts: { [siege.proof]: true } });
      if (kind === 'difficulty') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    });
    expect(screen.queryByText(success)).not.toBeInTheDocument();
  });
  it('offers no candidates without gear and never shows Present at a different NPC', () => {
    useInventoryStore.setState({ backpack: [] }); panel('npc/anya'); expect(screen.queryByTestId('larzuk-present-use')).not.toBeInTheDocument(); cleanup(); panel();
    expect(screen.getByTestId('larzuk-present-use')).toBeDisabled(); expect(screen.getByText(i18n.t('services.noCandidates', { ns: 'town' }))).toBeVisible();
  });
});
