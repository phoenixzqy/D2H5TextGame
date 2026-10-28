import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { loadItemBases } from '@/data/loaders/loot';
import { MALUS_QUEST as MAIN, MALUS_SIDE_QUEST as SIDE, MALUS_SOURCE, MALUS_ITEM } from '@/engine/map/malus-quest';
import { ACT1_IMBUE_SOURCES as SOURCES, ACT1_QUEST_RECEIPTS as R } from '@/engine/map/act1-quest-sources';
import { claimQuestReward } from '@/features/quests/claimReward';
import type { Item } from '@/engine/types/items';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { QuestServicePanel } from './QuestServicePanel';

const stores = [usePlayerStore, useMapStore, useInventoryStore, useMercStore, useCombatStore] as const;
function reset() { cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset(); }
function target(id = 'ui-imbue-native'): Item {
  const base = [...loadItemBases().values()].find(row => row.type === 'weapon' && row.canHaveAffixes);
  if (!base) throw new Error('Missing native weapon');
  return { id, baseId: base.id, rarity: 'normal', level: 50, ilvl: 50, socketCapacity: 0, identified: true, equipped: false };
}
function panel(npcId = 'npc/charsi') { return render(<I18nextProvider i18n={i18n}><QuestServicePanel npcId={npcId} /></I18nextProvider>); }
function completeSide(claimed = false) {
  useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
    [SIDE]: { id: SIDE, status: 'completed', rewardClaimed: claimed, objectives: { 'obj-bring-item': true } } }, questReceipts: { [R.presentItem]: true } }));
}
function earnBoth() { completeSide(); expect(claimQuestReward(MAIN)).toBe('ok'); expect(claimQuestReward(SIDE)).toBe('ok'); }
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); usePlayerStore.getState().setPlayer(createMockPlayer('Imbue UI', 'sorceress'));
  useMapStore.setState({ currentAct: 1, questProgress: {
    [MAIN]: { id: MAIN, status: 'completed', rewardClaimed: false, objectives: { 'obj-recover-malus': true, 'obj-imbue-ready': true } },
    [SIDE]: { id: SIDE, status: 'inProgress', rewardClaimed: false, objectives: {} }
  } }); useInventoryStore.setState({ questItems: { [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' } } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('Charsi explicit witnessed Present/Restore/Imbue UI', () => {
  it.each(['hero', 'receipt', 'difficulty'])('clears successful Present feedback when %s changes in the mounted view', async kind => {
    await i18n.changeLanguage('en'); const item = target(); useInventoryStore.setState({ backpack: [item] }); panel();
    fireEvent.change(screen.getByTestId('charsi-present-target'), { target: { value: item.id } });
    fireEvent.click(screen.getByTestId('charsi-present-use'));
    const success = i18n.t('imbue.presentSuccess', { ns: 'town' }); expect(screen.getByText(success)).toBeVisible();
    act(() => {
      if (kind === 'hero') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
      if (kind === 'receipt') useMapStore.setState({ questReceipts: {} });
      if (kind === 'difficulty') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    });
    expect(screen.queryByText(success)).not.toBeInTheDocument();
  });

  it('reacts to replay unlock changes, allowing earned use while Present and Restore stay Normal-only', () => {
    earnBoth(); useInventoryStore.setState({ questServices: { [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } }, backpack: [target()] });
    const evidence = campaignEvidence();
    useMapStore.setState(state => ({ selectedDifficulty: 'nightmare', questDifficulties: { 'difficulty/nightmare': true },
      questProgress: { ...state.questProgress, ...evidence.questProgress }, questReceipts: { ...state.questReceipts, ...evidence.questReceipts } }));
    panel(); expect(screen.getByTestId(`charsi-source-${SOURCES.main}`)).toBeVisible();
    expect(screen.queryByTestId('charsi-present-use')).not.toBeInTheDocument();
    expect(screen.queryByTestId(`charsi-restore-${SOURCES.side}`)).not.toBeInTheDocument();
    act(() => { useMapStore.setState({ questDifficulties: {} }); });
    expect(screen.queryByTestId('charsi-imbue')).not.toBeInTheDocument();
  });
  it.each(['en', 'zh-CN'])('%s reports a failed publication without false success or spending the item/charge', async locale => {
    await i18n.changeLanguage(locale); earnBoth(); const item = target(); useInventoryStore.setState({ backpack: [item] }); panel();
    const row = screen.getByTestId(`charsi-source-${SOURCES.main}`);
    fireEvent.change(within(row).getByRole('combobox'), { target: { value: item.id } });
    const original = useInventoryStore.setState; let fired = false;
    vi.spyOn(useInventoryStore, 'setState').mockImplementation((...args: Parameters<typeof original>) => {
      original(...args);
      if (!fired && useInventoryStore.getState().questServices[SOURCES.main]?.state === 'consumed') {
        fired = true; throw new Error('injected UI publication failure');
      }
    });
    fireEvent.click(within(row).getByRole('button')); expect(fired).toBe(true);
    expect(within(row).getByRole('alert')).toHaveTextContent(i18n.t('services.feedback.grant-failed', { ns: 'town' }));
    expect(useInventoryStore.getState().backpack).toEqual([item]);
    expect(useInventoryStore.getState().questServices[SOURCES.main]?.state).toBe('available');
    expect(within(row).getByRole('button')).toBeDisabled();
  });

  it.each(['en', 'zh-CN'])('%s presents unchanged and separately spends both claimed source rewards', async locale => {
    await i18n.changeLanguage(locale); const item = target(), other = target('second-imbue'); useInventoryStore.setState({ backpack: [item, other] }); panel();
    const present = screen.getByTestId('charsi-present-target'), button = screen.getByTestId('charsi-present-use');
    expect(present).toHaveAccessibleName(i18n.t('imbue.presentChoose', { ns: 'town' })); expect(button).toBeDisabled();
    fireEvent.change(present, { target: { value: item.id } }); expect(button).toBeEnabled();
    expect(screen.getByTestId('charsi-present-preview')).toBeVisible(); fireEvent.click(button);
    expect(useInventoryStore.getState().backpack).toEqual([item, other]); expect(useInventoryStore.getState().backpack[0]).toBe(item);
    expect(useInventoryStore.getState().questServices).toEqual({}); expect(useMapStore.getState().questReceipts[R.presentItem]).toBe(true);
    expect(screen.getByText(i18n.t('imbue.presentSuccess', { ns: 'town' }))).toBeVisible();
    act(() => { expect(claimQuestReward(MAIN)).toBe('ok'); expect(claimQuestReward(SIDE)).toBe('ok'); });
    for (const [source, selected] of [[SOURCES.main, item], [SOURCES.side, other]] as const) {
      const row = screen.getByTestId(`charsi-source-${source}`);
      expect(within(row).getByRole('combobox')).toHaveAccessibleName();
      const use = within(row).getByRole('button'); expect(use).toBeDisabled();
      fireEvent.change(within(row).getByRole('combobox'), { target: { value: selected.id } }); expect(use).toBeEnabled(); fireEvent.click(use);
      expect(useInventoryStore.getState().backpack.find(entry => entry.id === selected.id)?.rarity).toBe('rare');
      expect(useInventoryStore.getState().questServices[source]).toEqual({ serviceId: 'imbue_item', state: 'consumed', targetItemId: selected.id });
      expect(within(row).getByText(i18n.t('services.consumed', { ns: 'town' }))).toBeVisible();
      expect(within(row).queryByRole('combobox')).not.toBeInTheDocument();
    }
  });
  it('restores only the explicitly selected absent claimed reward and never a consumed source after salvage', () => {
    earnBoth(); useInventoryStore.setState({ questServices: {} }); const item = target(); useInventoryStore.setState({ backpack: [item] }); panel();
    fireEvent.click(screen.getByTestId(`charsi-restore-${SOURCES.side}`));
    expect(useInventoryStore.getState().questServices).toEqual({ [SOURCES.side]: { serviceId: 'imbue_item', state: 'available' } });
    expect(screen.getByTestId(`charsi-restore-${SOURCES.main}`)).toBeEnabled();
    expect(screen.queryByTestId(`charsi-restore-${SOURCES.side}`)).not.toBeInTheDocument();
    act(() => { useInventoryStore.setState({ backpack: [], questServices: { [SOURCES.side]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: 'salvaged' } } }); });
    expect(screen.queryByTestId(`charsi-restore-${SOURCES.side}`)).not.toBeInTheDocument();
  });
  it.each(['item', 'source', 'hero', 'quarantine'])('requires a new witness after %s replacement or collision', kind => {
    earnBoth(); const item = target(); useInventoryStore.setState({ backpack: [item] }); panel();
    const row = screen.getByTestId(`charsi-source-${SOURCES.main}`), select = within(row).getByRole('combobox');
    fireEvent.change(select, { target: { value: item.id } }); expect(within(row).getByRole('button')).toBeEnabled();
    act(() => {
      if (kind === 'item') useInventoryStore.setState({ backpack: [{ ...item }] });
      if (kind === 'source') useInventoryStore.setState(state => ({ questServices: { ...state.questServices, [SOURCES.main]: { serviceId: 'imbue_item', state: 'available' } } }));
      if (kind === 'hero') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
      if (kind === 'quarantine') useInventoryStore.setState({ socketQuarantine: [{ sourceVersion: 18, item, origin: { container: 'backpack', index: 0 } }] });
    });
    expect(within(row).getByRole('button')).toBeDisabled(); expect(within(row).queryByTestId(`charsi-imbue-preview-${SOURCES.main}`)).not.toBeInTheDocument();
  });
  it('keeps stale Present disabled and exposes no Charsi operation at a different NPC', () => {
    const item = target(); useInventoryStore.setState({ backpack: [item] }); const view = panel();
    fireEvent.change(screen.getByTestId('charsi-present-target'), { target: { value: item.id } });
    act(() => { useInventoryStore.setState({ backpack: [{ ...item }] }); }); expect(screen.getByTestId('charsi-present-use')).toBeDisabled();
    view.rerender(<I18nextProvider i18n={i18n}><QuestServicePanel npcId="npc/akara" /></I18nextProvider>);
    expect(screen.queryByTestId('charsi-imbue')).not.toBeInTheDocument();
  });
});
