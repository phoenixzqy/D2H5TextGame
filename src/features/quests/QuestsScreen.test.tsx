/**
 * QuestsScreen smoke tests — verifies real quests from `quests/main.json` and
 * `quests/side.json` are surfaced and that statuses from `useMapStore`
 * override the default.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { QuestsScreen } from './QuestsScreen';
import { useMapStore } from '@/stores';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/persistence';
import mainDocument from '@/data/quests/main.json';
import uniqueItems from '@/data/items/uniques.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '@/engine/rng';
import { __resetRollItemSeqForTests, rollItem } from '@/engine/loot/rollItem';
import { useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { createMockPlayer } from '@/features/character/createMockPlayer';

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

describe.each(['zh-CN', 'en'] as const)('QuestsScreen %s', locale => {
  let hydrationBefore = useHydrationStore.getState();
  beforeEach(async () => {
    hydrationBefore = useHydrationStore.getState();
    act(() => {
      useMapStore.getState().reset();
      useInventoryStore.getState().reset();
      usePlayerStore.getState().setPlayer(createMockPlayer('Quest visitor', 'sorceress'));
      useHydrationStore.getState().setStatus('ready');
    });
    await i18n.changeLanguage(locale);
  });
  afterEach(() => {
    useHydrationStore.setState({ status: hydrationBefore.status, error: hydrationBefore.error });
    usePlayerStore.getState().reset();
    useInventoryStore.getState().reset();
  });

  it('shows readable permanent Sun resistance in the current locale', () => {
    renderScreen();
    const card = screen.getByTestId('quest-quests/act2-tainted-sun');
    expect(card.textContent).toContain(locale === 'en'
      ? 'Permanent fire resistance +30%, cold resistance +30%'
      : '永久火焰抗性 +30%，冰冷抗性 +30%');
    expect(card.textContent).not.toMatch(/fire_resist|cold_resist|[{}]/);
  });

  it('previews the real Blade ring and Tome attribute rewards without publishing or exposing content IDs', () => {
    const before = [useMapStore.getState(), useInventoryStore.getState(), usePlayerStore.getState()];
    renderScreen();
    const blade = within(screen.getByTestId('quest-quests/act3-blade-of-the-old-religion'));
    const tome = within(screen.getByTestId('quest-quests/act3-lam-esens-tome'));
    expect(blade.getByText(locale === 'en' ? '🎁 Unique ring' : '🎁 暗金戒指')).toBeVisible();
    expect(tome.getByText(locale === 'en' ? '📈 +5 Stat Point' : '📈 +5 属性点')).toBeVisible();
    for (const id of ['act3-blade-of-the-old-religion', 'act3-lam-esens-tome']) {
      const card = screen.getByTestId(`quest-quests/${id}`);
      expect(card).toHaveTextContent(i18n.t(`byId.${id}.obj2`, { ns: 'quests' }));
      expect(card.textContent).not.toMatch(/profileId|quest-rewards|statPoints|itemDrop|rewardLabel|[{}]/);
    }
    expect(useMapStore.getState()).toBe(before[0]);
    expect(useInventoryStore.getState()).toBe(before[1]);
    expect(usePlayerStore.getState()).toBe(before[2]);
  });

  it('previews all three Act IV main rewards and the seven ordered objectives without granting anything', () => {
    const before = [useMapStore.getState(), useInventoryStore.getState(), usePlayerStore.getState()];
    renderScreen();
    const fallen = screen.getByTestId('quest-quests/act4-fallen-angel');
    const forge = screen.getByTestId('quest-quests/act4-hellforge');
    const terror = screen.getByTestId('quest-quests/act4-terrors-end');
    expect(fallen).toHaveTextContent('9000');
    expect(fallen).toHaveTextContent(locale === 'en' ? '+2 Skill Point' : '+2 技能点');
    expect(forge).toHaveTextContent('7000');
    expect(forge).toHaveTextContent(locale === 'en' ? '3 Gem Shards' : '3 宝石碎片');
    expect(forge).toHaveTextContent(i18n.t('rewardLabel.rewardCache', { ns: 'quests' }));
    expect(terror).toHaveTextContent('25000');
    expect(terror).toHaveTextContent(i18n.t('rewardLabel.rewardCache', { ns: 'quests' }));
    for (const [card, id, count] of [[fallen, 'act4-fallen-angel', 1], [forge, 'act4-hellforge', 2],
      [terror, 'act4-terrors-end', 4]] as const) {
      let previous = -1;
      for (let index = 1; index <= count; index++) {
        const label = i18n.t(`byId.${id}.obj${String(index)}`, { ns: 'quests' });
        const objective = within(card).getByText(label);
        expect(objective).toBeVisible();
        const position = card.textContent.indexOf(label);
        expect(position).toBeGreaterThan(previous);
        previous = position;
      }
      expect(card.textContent).not.toMatch(/gemShards|lootTable|tableId|picks|ilvl|rewardLabel|byId\.|[{}]/);
    }
    expect(forge).toHaveTextContent(locale === 'en' ? 'consume the hammer and Mephisto’s Soulstone together' : '同时消耗铁锤和墨菲斯托的灵魂石');
    expect(terror).toHaveTextContent(locale === 'en' ? 'seals do not control battle access' : '封印不控制战斗入口');
    expect(useMapStore.getState()).toBe(before[0]);
    expect(useInventoryStore.getState()).toBe(before[1]);
    expect(usePlayerStore.getState()).toBe(before[2]);
  });

  it('renders the main quest tab with real Act 1 quests by default', () => {
    renderScreen();
    // "Den of Evil" is the first main quest in act1.
    expect(screen.getByTestId('quest-quests/act1-den-of-evil')).toBeInTheDocument();
    expect(screen.getByTestId('quest-quests/act1-sisters-burial-grounds'))
      .toBeInTheDocument();
  });

  it('renders side quests when the side tab is selected', () => {
    renderScreen();
    const sideTab = screen.getByRole('tab', { name: /支线|side/i });
    fireEvent.click(sideTab);
    const quest = screen.getByTestId('quest-quests/side-act1-charsis-imbue');
    expect(quest).toBeInTheDocument();
    expect(quest.textContent).toMatch(/查西的灌注|Charsi's Imbue/);
    expect(quest.textContent).not.toContain('items/imbued_rare_random');
  });

  it('reflects in-progress status from useMapStore', () => {
    act(() => {
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', {
        status: 'inProgress',
        objectives: { 'obj-clear-den': false }
      });
    });
    renderScreen();
    const card = screen.getByTestId('quest-quests/act1-den-of-evil');
    expect(card.textContent).toMatch(/进行中|in progress/i);
  });

  it('starts an available quest and shows feedback', () => {
    renderScreen();
    const start = screen.getByTestId('quest-start-quests/act1-den-of-evil');
    fireEvent.click(start);
    expect(useMapStore.getState().questProgress['quests/act1-den-of-evil']?.status).toBe('inProgress');
    expect(screen.getByTestId('quest-feedback-quests/act1-den-of-evil')).toHaveTextContent(/任务已加入追踪|Quest added/);
  });

  it('keeps an unsupported service unclaimed and displays a localized refusal on every attempt', () => {
    const id = 'quests/side-act1-cains-favor';
    act(() => { useMapStore.getState().completeQuest(id); });
    renderScreen();
    fireEvent.click(screen.getByRole('tab', { name: /支线|side/i }));
    const claim = screen.getByTestId(`quest-claim-${id}`);
    expect(claim).toBeEnabled();
    const before = usePlayerStore.getState().player;
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
    expect(usePlayerStore.getState().player).toBe(before);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(locale === 'en'
      ? 'This reward cannot be delivered yet. Nothing was claimed.'
      : '该奖励暂时无法发放，尚未领取。');
    expect(claim).toBeEnabled();
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
  });

  it('claims real Den rewards once and disables the settled claim button', () => {
    const id = 'quests/act1-den-of-evil';
    act(() => { useMapStore.getState().completeQuest(id); });
    renderScreen();
    const claim = screen.getByTestId(`quest-claim-${id}`);
    fireEvent.click(claim);
    const hero = usePlayerStore.getState().player;
    expect(hero?.level).toBe(2);
    expect(hero?.experience).toBe(400);
    expect(hero?.skillPoints).toBe(3);
    expect(hero?.statPoints).toBe(5);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(/奖励已领取|Rewards claimed/);
    expect(claim).toBeDisabled();
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toBe(hero);
  });

  it('shows not-ready refusal and allows a later retry after hydration finishes', () => {
    const id = 'quests/act1-den-of-evil';
    act(() => {
      useMapStore.getState().completeQuest(id);
      useHydrationStore.getState().setStatus('loading');
    });
    renderScreen();
    const claim = screen.getByTestId(`quest-claim-${id}`);
    expect(claim).toBeEnabled();
    const hero = usePlayerStore.getState().player;
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toBe(hero);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).not.toBe(true);
    expect(screen.getByTestId(`quest-feedback-${id}`)).toHaveTextContent(locale === 'en'
      ? 'Save data is loading or being replaced. Try again when it finishes.'
      : '存档正在载入或替换，请完成后重试。');
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    fireEvent.click(claim);
    expect(useMapStore.getState().questProgress[id]?.rewardClaimed).toBe(true);
    expect(claim).toBeDisabled();
  });

  it('provides localized feedback for every new refusal without raw translation keys', () => {
    for (const result of ['no-player', 'not-ready', 'unsupported-rewards', 'claim-in-progress', 'grant-failed']) {
      const key = `feedback.claim.${result}`;
      expect(i18n.exists(key, { ns: 'quests', lng: locale })).toBe(true);
      expect(i18n.t(key, { ns: 'quests', lng: locale })).not.toContain(key);
    }
  });
});


/** A temporary authored row, with the exact original reward descriptor restored. */
function withUniquePreview(uniqueId: string, ilvl: number, check: () => void) {
  const den = mainDocument.quests.find(quest => quest.id === 'quests/act1-den-of-evil');
  if (!den) throw new Error('Missing actual Den quest');
  const descriptor = Object.getOwnPropertyDescriptor(den, 'rewards');
  if (!descriptor) throw new Error('Missing actual Den rewards');
  try {
    Object.defineProperty(den, 'rewards', { ...descriptor, value: { itemDrop: { uniqueId, ilvl } } });
    check();
  } finally {
    Object.defineProperty(den, 'rewards', descriptor);
  }
}

describe.each(['zh-CN', 'en'] as const)('explicit unique reward preview %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });

  it.each(['known', 'low-level', 'unknown', 'ambiguous'] as const)(
    'renders one localized gift chip for %s without publishing, allocating or mutating', kind => {
      const uniqueId = kind === 'unknown' ? 'items/unique/not-in-catalog' : 'items/unique/coif-of-glory';
      const expected = kind === 'unknown' || kind === 'ambiguous'
        ? (locale === 'en' ? 'Unique item' : '暗金装备')
        : (locale === 'en' ? 'Coif of Glory' : '荣耀之盔');
      const template = uniqueItems.find(item => item.id === uniqueId);
      if (kind === 'ambiguous' && !template) throw new Error('Missing actual Coif template');
      // Cached loader points at this same actual JSON array; no favorable catalog mock.
      if (kind === 'ambiguous' && template) uniqueItems.push(template);
      try {
        withUniquePreview(uniqueId, kind === 'low-level' ? 1 : 19, () => {
          const pools = loadAwardPools();
          const roll = () => rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 19 }, pools, createRng(5047));
          __resetRollItemSeqForTests();
          const baseline = roll();
          expect(baseline).toBeDefined();
          __resetRollItemSeqForTests();
          const states = () => [useMapStore.getState(), usePlayerStore.getState(),
            useInventoryStore.getState(), useMercStore.getState(), useHydrationStore.getState(),
            useCombatStore.getState(), useMetaStore.getState(), useFormationStore.getState()];
          const before = states();
          const bytes = JSON.stringify(before);
          const catalogBytes = JSON.stringify([mainDocument, uniqueItems]);
          for (let attempt = 0; attempt < 2; attempt += 1) {
            const view = renderScreen();
            try {
              const card = within(screen.getByTestId('quest-quests/act1-den-of-evil'));
              const chip = card.getByText(`🎁 ${expected}`);
              expect(chip.tagName).toBe('LI');
              expect(chip.parentElement?.children).toHaveLength(1);
              expect(chip.textContent).not.toMatch(/uniqueId|ilvl|items[/.]|itemDrop|rewardLabel|[{}]/);
            } finally { view.unmount(); }
          }
          states().forEach((state, index) => { expect(state).toBe(before[index]); });
          expect(JSON.stringify(states())).toBe(bytes);
          expect(JSON.stringify([mainDocument, uniqueItems])).toBe(catalogBytes);
          // No reset after either render: an allocation during preview changes this ID.
          expect(roll()).toEqual(baseline);
        });
      } finally {
        if (kind === 'ambiguous') expect(uniqueItems.pop()).toBe(template);
      }
    });
});
