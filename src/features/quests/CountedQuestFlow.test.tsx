import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import { loadCountedQuestItems } from '@/data/loaders/counted-quest-items';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { AreaObjectsPanel } from '@/features/map/AreaObjectsPanel';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { TownScreen } from '@/features/town/TownScreen';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { QuestsScreen } from './QuestsScreen';
import { hasAreaObjects } from './interactObject';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing counted UI fixture state');
  return value;
}
const definitions = loadCountedQuestItems();
const hydration = useHydrationStore.getState();
const originalLocale = i18n.language;
const wrap = (children: ReactNode) => <I18nextProvider i18n={i18n}>
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>
</I18nextProvider>;
const reset = () => {
  for (const store of [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore]) store.getState().reset();
};
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Ingredient explorer', 'sorceress');
  const player = { ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35) };
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: deriveEquippedPlayerStats(player, 35, {}) });
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
    'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ currencies: { 'rune-shard': 0, runeShards: 77, gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  reset();
  useHydrationStore.setState(hydration);
  await i18n.changeLanguage(originalLocale);
});

describe.each(['en', 'zh-CN'])('physical counted-quest UI %s', locale => {
  it.each(definitions)('$key: named finite finds, actual exchange and separate one-time Claim', async definition => {
    await i18n.changeLanguage(locale);
    const firstSource = definition.sources[0];
    if (!firstSource) throw new Error('Missing finite source');
    const actNumber = Number(definition.actId.slice('acts/act'.length));
    useMapStore.setState({ currentAct: actNumber, currentSubAreaId: definition.areaId, questProgress: {
      [definition.quest]: { id: definition.quest, status: 'inProgress', objectives: { [definition.objective]: false } }
    } });
    const heroBefore = structuredClone(usePlayerStore.getState().player);
    const walletBefore = structuredClone(useInventoryStore.getState().currencies);
    expect(hasAreaObjects(actNumber, definition.areaId)).toBe(true);
    expect(hasAreaObjects(actNumber === 1 ? 2 : 1, definition.areaId)).toBe(false);
    const view = render(wrap(<><AreaObjectsPanel act={actNumber} areaId={definition.areaId} onClose={() => undefined} /><QuestItemsPanel /></>));
    const sources = screen.getByTestId('counted-quest-sources');
    expect(within(sources).getAllByRole('button')).toHaveLength(definition.sources.length);
    expect(useInventoryStore.getState().questItems).toEqual({});
    for (const [index, placement] of definition.placements.entries()) {
      const button = screen.getByTestId(`counted-recover-${placement.targetId}`);
      expect(button).toHaveAccessibleName(i18n.t('counted.recover', { ns: 'quests',
        item: i18n.t(definition.nameKey), number: index + 1 }));
      expect(button).toBeEnabled();
      fireEvent.click(button);
      expect(button).toBeDisabled();
      expect(screen.getByTestId(`counted-area-progress-${definition.key}`)).toHaveTextContent(`${String(index + 1)}/${String(definition.sources.length)}`);
      expect(required(useMapStore.getState().questProgress[definition.quest]).status)
        .toBe(index === definition.sources.length - 1 && definition.sink === 'claim' ? 'completed' : 'inProgress');
      expect(usePlayerStore.getState().player).toEqual(heroBefore);
      expect(useInventoryStore.getState().currencies).toEqual(walletBefore);
    }
    const ingredients = screen.getByTestId(`quest-counted-item-${definition.key}`);
    expect(within(ingredients).queryByRole('button')).toBeNull();
    expect(ingredients.textContent).not.toMatch(/questItems\.|counted\.|objects\/|undefined/);
    if (definition.key === 'jade') {
      view.rerender(wrap(<TownScreen />));
      fireEvent.click(screen.getByTestId('town-npc-meshif'));
      expect(useInventoryStore.getState().questItems[firstSource]?.state).toBe('owned');
      expect(required(useMapStore.getState().questProgress[definition.quest]).status).toBe('inProgress');
      const give = screen.getByTestId('counted-jade-give');
      expect(give).toHaveAccessibleName(i18n.t('counted.jade.give', { ns: 'quests' }));
      expect(give).toBeEnabled();
      fireEvent.click(give);
      expect(give).toBeDisabled();
      expect(definition.sources.map(source => required(useInventoryStore.getState().questItems[source]).state)).toEqual(['consumed', 'consumed', 'consumed']);
      expect(usePlayerStore.getState().player).toEqual(heroBefore);
      expect(useInventoryStore.getState().currencies).toEqual(walletBefore);
    }
    view.rerender(wrap(<><QuestsScreen /><QuestItemsPanel /></>));
    fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    const claim = screen.getByTestId(`quest-claim-${definition.quest}`);
    expect(claim).toBeEnabled();
    const card = screen.getByTestId(`quest-${definition.quest}`);
    expect(card.textContent).not.toMatch(/rewardLabel\.|counted\.|undefined/);
    fireEvent.click(claim);
    expect(claim).toBeDisabled();
    expect(required(useMapStore.getState().questProgress[definition.quest]).rewardClaimed).toBe(true);
    expect(definition.sources.every(source => required(useInventoryStore.getState().questItems[source]).state === 'consumed')).toBe(true);
    const hero = usePlayerStore.getState().player;
    expect(hero?.derivedStats.life).toBe(heroBefore?.derivedStats.life);
    expect(hero?.experience).toBe(({ alkor: 4500, jade: 3500, jamella: 7000, malah: 9000, gheed: 1000 })[definition.key]);
    expect(hero?.statPoints).toBe((heroBefore?.statPoints ?? 0) + (definition.key === 'alkor' ? 5 : 0));
    expect(useInventoryStore.getState().currencies).toEqual({ ...walletBefore, wishstone: (walletBefore.wishstone ?? 0) + 10,
      'rune-shard': definition.key === 'jade' ? 1000 : 0,
      ...(definition.key === 'gheed' ? { 'gem-shard': 1 } : {}) });
    if (definition.key === 'jamella') {
      const materials = Object.entries(useInventoryStore.getState().materials);
      expect(materials).toHaveLength(1);
      expect(required(materials[0])[0]).toMatch(/^gems\/[a-z]+\/perfect$/);
      expect(required(materials[0])[1]).toBe(1);
    }
    if (definition.key === 'malah') expect(hero?.derivedStats.lifeMax).toBe((heroBefore?.derivedStats.lifeMax ?? 0) + 20);
    const paid = structuredClone(hero);
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toEqual(paid);
  });

  it('explains a source-free legacy completion without implying physical Claim readiness', async () => {
    await i18n.changeLanguage(locale);
    const definition = definitions.find(row => row.key === 'alkor');
    if (!definition) throw new Error('Missing Alkor definition');
    useMapStore.setState({ questProgress: { [definition.quest]: { id: definition.quest,
      status: 'completed', objectives: { [definition.objective]: true } } } });
    render(wrap(<QuestsScreen />));
    fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    expect(screen.getByTestId(`quest-claim-${definition.quest}`)).toBeDisabled();
    expect(screen.getByTestId('counted-journal-alkor')).toHaveTextContent(i18n.t('counted.repair', { ns: 'quests' }));
    expect(screen.getByTestId('counted-journal-alkor')).toHaveTextContent('0/3');
  });
});
