import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import quests from '@/data/quests/main.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '@/engine/rng';
import * as dropRoller from '@/engine/loot/drop-roller';
import * as itemRoller from '@/engine/loot/rollItem';
import { useMapStore, usePlayerStore, useInventoryStore, useMercStore,
  useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { QuestsScreen } from './QuestsScreen';

const questId = 'quests/act2-seven-tombs';
const states = () => [useMapStore.getState(), usePlayerStore.getState(),
  useInventoryStore.getState(), useMercStore.getState(), useHydrationStore.getState(),
  useCombatStore.getState(), useMetaStore.getState(), useFormationStore.getState()];

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <QuestsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe.each(['zh-CN', 'en'] as const)('Duriel reward preview %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('renders the actual cache as one localized chip without rolling, allocating or publishing', () => {
    const before = states();
    const stateBytes = JSON.stringify(before);
    const dataBytes = JSON.stringify(quests);
    const pools = loadAwardPools();
    const roll = () => itemRoller.rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 32 }, pools, createRng(5047));
    itemRoller.__resetRollItemSeqForTests();
    const baseline = roll();
    expect(baseline).toBeDefined();
    itemRoller.__resetRollItemSeqForTests();
    const drops = vi.spyOn(dropRoller, 'rollDrops');
    const items = vi.spyOn(itemRoller, 'rollItem');

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const view = renderScreen();
      try {
        const card = within(screen.getByTestId(`quest-${questId}`));
        const cache = card.getByText(locale === 'en' ? '📦 Reward cache' : '📦 奖励宝箱');
        expect(cache.tagName).toBe('LI');
        expect(cache.parentElement?.children).toHaveLength(2);
        expect(cache.parentElement?.textContent).not.toMatch(/lootTable|tableId|ilvl|picks|loot\/|duriel-q|[{}]|Unique|暗金|Io|符文/);
      } finally { view.unmount(); }
    }
    expect(drops).not.toHaveBeenCalled();
    expect(items).not.toHaveBeenCalled();
    states().forEach((state, index) => { expect(state).toBe(before[index]); });
    expect(JSON.stringify(states())).toBe(stateBytes);
    expect(JSON.stringify(quests)).toBe(dataBytes);
    // Rendering must leave the allocator at the same next instance ID.
    expect(roll()).toEqual(baseline);
  });
});
