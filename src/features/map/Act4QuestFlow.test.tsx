import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import type { QuestItemLedger } from '@/engine/types/save';
import { xpTotal } from '@/engine/progression/xp';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { AreaObjectsPanel } from './AreaObjectsPanel';

const FALLEN = 'quests/act4-fallen-angel', FORGE = 'quests/act4-hellforge', TERROR = 'quests/act4-terrors-end';
const GUARDIAN = 'quests/act3-guardian', KHALIM = 'quests/act3-khalims-will';
const RIVER = 'areas/act4-river-of-flame', CHAOS = 'areas/act4-chaos-sanctuary';
const HAMMER = 'quest/hellforge_hammer', SOULSTONE = 'items/soulstone_mephisto';
const SHATTER = 'quest-action-actions/act4-shatter-soulstone';
const hydration = useHydrationStore.getState();
const stores = [useInventoryStore, useMapStore, useCombatStore, useMercStore, usePlayerStore] as const;

function definition(id: string) {
  const quest = loadQuests().find(row => row.id === id);
  if (!quest) throw new Error(`Missing authored quest ${id}`);
  return quest;
}

function row(id: string, completed = false) {
  return { id, status: completed ? 'completed' as const : 'inProgress' as const,
    objectives: Object.fromEntries(definition(id).objectives.map(objective => [objective.id, completed])) };
}

function heroXp() {
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing Act IV UI fixture player');
  return xpTotal(player.level) + player.experience;
}

function mount(content: React.ReactNode) {
  return render(content, { wrapper: ({ children }) => <I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter></I18nextProvider> });
}

function forgeFixture(qualified = true, includeSoulstone = true) {
  // Constructed retained campaign proof for functional UI wiring only.
  // This fixture does not prove combat admission, earned progression, or encounter balance.
  const will = loadQuestItems().find(item => item.sourceQuestId === KHALIM && item.kind === 'assembled');
  if (will?.kind !== 'assembled') throw new Error('Missing actual Khalim recipe');
  const cube = loadQuestItems().find(item => item.id === will.requiredTool);
  if (!cube) throw new Error('Missing actual retained Cube');
  const questItems: Record<string, QuestItemLedger[string]> = {
    [questItemSource(cube)]: { itemId: cube.id, state: 'owned' },
    [questItemSource(will)]: { itemId: will.id, state: 'consumed' }
  };
  for (const id of will.ingredients) {
    const item = loadQuestItems().find(input => input.id === id);
    if (!item) throw new Error('Missing actual Khalim ingredient');
    questItems[questItemSource(item)] = { itemId: item.id, state: 'consumed' };
  }
  if (includeSoulstone) {
    const stone = loadQuestItems().find(item => item.id === SOULSTONE);
    if (!stone) throw new Error('Missing actual Guardian reward');
    questItems[questItemSource(stone)] = { itemId: stone.id, state: 'owned' };
  }
  useMapStore.setState({ currentAct: 4, currentSubAreaId: RIVER,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate'],
    questProgress: {
      [cube.sourceQuestId]: row(cube.sourceQuestId, true), [KHALIM]: row(KHALIM, true),
      [GUARDIAN]: { ...row(GUARDIAN, true), rewardClaimed: true },
      [FORGE]: { ...row(FORGE), objectives: { 'obj-kill-hephasto': true, 'obj-shatter': false } }
    },
    questReceipts: { [`${KHALIM}#action:council-victory`]: true,
      [`${GUARDIAN}#action:break-compelling-orb`]: true,
      ...(qualified ? { [`${FORGE}#action:hephasto-victory`]: true as const } : {}) }
  });
  useInventoryStore.setState({ questItems });
  const map = useMapStore.getState();
  expect(validateQuestItemLedger(questItems, map.questProgress, map.questReceipts)).toBe(questItems);
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Act IV functional visitor', 'sorceress'));
});
afterEach(() => {
  act(() => { stores.forEach(store => { store.getState().reset(); }); });
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Act IV player controls %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });

  it('recovers the encounter hammer, consumes both real inputs, and claims the Forge bundle separately once', () => {
    forgeFixture();
    const ledgerBefore = useInventoryStore.getState().questItems, before = heroXp();
    mount(<><AreaObjectsPanel act={4} areaId={RIVER} onClose={() => undefined} /><QuestItemsPanel /><QuestsScreen /></>);
    expect(useInventoryStore.getState().questItems).toBe(ledgerBefore);
    const recover = screen.getByTestId(`quest-recover-${HAMMER}`), shatter = screen.getByTestId(SHATTER);
    expect(recover).toBeEnabled();
    expect(shatter).toBeDisabled();
    expect(screen.getByTestId('area-object-panel')).toHaveTextContent(locale === 'en' ? 'consumes both' : '同时消耗');
    fireEvent.click(recover);
    expect(recover).toBeDisabled();
    expect(shatter).toBeEnabled();
    for (const id of [HAMMER, SOULSTONE]) {
      const item = screen.getByTestId(`quest-item-${id}`);
      expect(item).toHaveTextContent(i18n.t('questItems.owned', { ns: 'inventory' }));
      expect(within(item).queryByRole('button')).not.toBeInTheDocument();
    }
    expect(shatter).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'max-w-full', 'whitespace-normal');
    fireEvent.click(shatter);
    expect(shatter).toBeDisabled();
    expect(recover).toBeDisabled();
    expect(heroXp()).toBe(before);
    expect(useMapStore.getState().questProgress[FORGE]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[FORGE]?.rewardClaimed).not.toBe(true);
    const consumedLedger = useInventoryStore.getState().questItems;
    for (const id of [HAMMER, SOULSTONE]) {
      const item = loadQuestItems().find(input => input.id === id);
      if (!item) throw new Error('Missing actual Forge input');
      expect(consumedLedger[questItemSource(item)]?.state).toBe('consumed');
      const receipt = screen.getByTestId(`quest-item-${id}`);
      expect(receipt).toHaveTextContent(i18n.t('questItems.usedAtDestination', { ns: 'inventory' }));
      expect(within(receipt).queryByRole('button')).not.toBeInTheDocument();
    }
    const currencies = useInventoryStore.getState().currencies;
    const claim = screen.getByTestId(`quest-claim-${FORGE}`);
    expect(claim).toBeEnabled();
    fireEvent.click(claim);
    expect(claim).toBeDisabled();
    expect(heroXp()).toBe(before + 7000);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe((currencies['gem-shard'] ?? 0) + 3);
    expect(useInventoryStore.getState().currencies.gems).toBe(currencies.gems);
    expect(useInventoryStore.getState().questItems).toBe(consumedLedger);
    const paid = [useInventoryStore.getState(), usePlayerStore.getState(), useMapStore.getState()];
    fireEvent.click(claim); fireEvent.click(shatter); fireEvent.click(recover);
    expect([useInventoryStore.getState(), usePlayerStore.getState(), useMapStore.getState()]).toEqual(paid);
    expect(screen.getByTestId('area-object-panel').textContent).not.toMatch(/areaObjects\.|questItems\.|undefined/);
  });

  it.each(['missing-victory', 'missing-soulstone'])('keeps the Forge unavailable for %s without manufacturing an input', missing => {
    forgeFixture(missing !== 'missing-victory', missing !== 'missing-soulstone');
    const ledger = useInventoryStore.getState().questItems, before = heroXp();
    mount(<AreaObjectsPanel act={4} areaId={RIVER} onClose={() => undefined} />);
    const recover = screen.getByTestId(`quest-recover-${HAMMER}`);
    if (missing === 'missing-victory') expect(recover).toBeDisabled();
    if (missing === 'missing-soulstone') {
      expect(recover).toBeEnabled();
      fireEvent.click(recover);
    }
    expect(screen.getByTestId(SHATTER)).toBeDisabled();
    expect(heroXp()).toBe(before);
    if (missing === 'missing-victory') expect(useInventoryStore.getState().questItems).toBe(ledger);
    expect(Object.values(useInventoryStore.getState().questItems).some(item => item.itemId === SOULSTONE)).toBe(missing !== 'missing-soulstone');
    expect(screen.queryByRole('button', { name: /read|阅读/i })).not.toBeInTheDocument();
  });

  it('opens only the next seal, records no reward, and leaves Diablo as the final quest objective', () => {
    // Constructed Act IV access fixture; no battle or boss admission is simulated.
    useMapStore.setState({ currentAct: 4, currentSubAreaId: CHAOS,
      clearedSubAreas: ['areas/act3-durance-of-hate'], questProgress: { [TERROR]: row(TERROR) } });
    const before = heroXp(), ledger = useInventoryStore.getState().questItems;
    mount(<AreaObjectsPanel act={4} areaId={CHAOS} onClose={() => undefined} />);
    for (let n = 1; n <= 3; n++) {
      for (let check = 1; check <= 3; check++) {
        const seal = screen.getByTestId(`quest-object-objects/diablo_seal_${String(check)}`);
        if (check === n) expect(seal).toBeEnabled(); else expect(seal).toBeDisabled();
      }
      const seal = screen.getByTestId(`quest-object-objects/diablo_seal_${String(n)}`);
      expect(seal).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'max-w-full', 'whitespace-normal');
      fireEvent.click(seal);
      expect(seal).toBeDisabled();
      expect(heroXp()).toBe(before);
      expect(useInventoryStore.getState().questItems).toBe(ledger);
    }
    expect(useMapStore.getState().questProgress[TERROR]).toEqual({ id: TERROR, status: 'inProgress',
      objectives: { 'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true, 'obj-kill-diablo': false } });
    expect(screen.getByTestId('area-object-panel')).toHaveTextContent(locale === 'en' ? 'remain available independently' : '入口另行开放');
  });

  it.each([[FALLEN, 'izual-victory', 9000], [TERROR, 'diablo-victory', 25000]] as const)(
    'enables %s Claim when real source proof arrives without changing completed legacy flags', (questId, receipt, xp) => {
      // Constructed completed/unclaimed row plus retained source proof exercises UI wiring only.
      // Qualified victory admission is tested at the combat boundary in the core suite.
      useMapStore.setState({ questProgress: { [questId]: row(questId, true) } });
      const progress = useMapStore.getState().questProgress, before = heroXp();
      mount(<QuestsScreen />);
      const claim = screen.getByTestId(`quest-claim-${questId}`);
      expect(claim).toBeDisabled();
      act(() => { useMapStore.setState({ questReceipts: { [`${questId}#action:${receipt}`]: true } }); });
      expect(useMapStore.getState().questProgress).toBe(progress);
      expect(claim).toBeEnabled();
      fireEvent.click(claim);
      expect(claim).toBeDisabled();
      expect(heroXp()).toBe(before + xp);
      const paid = usePlayerStore.getState().player;
      fireEvent.click(claim);
      expect(usePlayerStore.getState().player).toBe(paid);
    }
  );
});
