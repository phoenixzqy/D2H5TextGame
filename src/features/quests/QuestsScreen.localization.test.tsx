import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import en from '@/i18n/locales/en/quests.json';
import zh from '@/i18n/locales/zh-CN/quests.json';
import { loadQuests, questI18nKey, type QuestDef } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { QuestsScreen } from './QuestsScreen';

const resources: Record<string, Record<string, Record<string, unknown>>> = {
  en: en.byId, 'zh-CN': zh.byId
};
const fields = (quest: QuestDef) => ['name', 'desc',
  ...quest.objectives.map((_, index) => `obj${String(index + 1)}`)];
const examples = {
  main: [
    ['quests/act1-sisters-burial-grounds', "Sisters' Burial Grounds", '姐妹的安息'],
    ['quests/act2-seven-tombs', 'The Seven Tombs', '七座古墓']
  ],
  side: [
    ['quests/side-act2-greiz-merc-roster', "Greiz's Roster", '格雷兹的名册'],
    ['quests/side-act5-nihlathaks-treasure', "Nihlathak's Treasure", '尼拉塞克的宝藏']
  ]
} as const;

function ownText(locale: string, slug: string, field: string): string {
  const value = resources[locale]?.[slug]?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing own-locale quest text: ${locale}:${slug}.${field}`);
  }
  return value;
}

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

describe.each(['zh-CN', 'en'] as const)('canonical quest localization %s', locale => {
  let originalLanguage = i18n.language;
  let hydrationBefore = useHydrationStore.getState();
  beforeEach(async () => {
    originalLanguage = i18n.language;
    hydrationBefore = useHydrationStore.getState();
    act(() => {
      useMapStore.getState().reset();
      useInventoryStore.getState().reset();
      usePlayerStore.getState().setPlayer(createMockPlayer('Quest translation visitor', 'sorceress'));
      useHydrationStore.getState().setStatus('ready');
    });
    await act(async () => { await i18n.changeLanguage(locale); });
  });
  afterEach(async () => {
    act(() => {
      useMapStore.getState().reset();
      useInventoryStore.getState().reset();
      usePlayerStore.getState().reset();
      useHydrationStore.setState({ status: hydrationBefore.status, error: hydrationBefore.error });
    });
    await act(async () => { await i18n.changeLanguage(originalLanguage); });
  });

  it('provides every shipped name, description and ordered objective in its own resource', () => {
    // i18n.exists includes fallback languages, so inspect the actual locale bundle.
    const missing = loadQuests().flatMap(quest => {
      const slug = questI18nKey(quest.id);
      return fields(quest).filter(field => {
        const value = resources[locale]?.[slug]?.[field];
        return typeof value !== 'string' || value.trim() === '';
      }).map(field => `${slug}.${field}`);
    });
    expect(missing).toEqual([]);
  });

  it.each(['main', 'side'] as const)('renders canonical %s card names, descriptions and objective order', type => {
    renderScreen();
    if (type === 'side') fireEvent.click(screen.getByRole('tab', {
      name: i18n.t('side', { ns: 'quests' })
    }));
    // Independent visible examples catch English fallback in Chinese, including
    // both main ID mismatches and side quests in early and late acts.
    for (const [id, english, chinese] of examples[type]) {
      expect(within(screen.getByTestId(`quest-${id}`)).getByRole('heading', {
        name: locale === 'en' ? english : chinese
      })).toBeVisible();
    }
    for (const quest of loadQuests().filter(quest => quest.type === type)) {
      const slug = questI18nKey(quest.id), card = within(screen.getByTestId(`quest-${quest.id}`));
      expect(card.getByRole('heading', { name: ownText(locale, slug, 'name') })).toBeVisible();
      expect(card.getByText(ownText(locale, slug, 'desc'))).toBeVisible();
      if (typeof quest.rewards?.wishstones === 'number' && quest.rewards.wishstones > 0) {
        expect(card.getByText(`${String(quest.rewards.wishstones)} ${locale === 'en' ? 'Wishstones' : '祈愿石'}`)).toBeVisible();
      }
      const objectives = card.getAllByRole('list')[0];
      expect(objectives).toBeDefined();
      if (!objectives) throw new Error('Missing quest objective list');
      const lines = within(objectives).getAllByRole('listitem');
      expect(lines).toHaveLength(quest.objectives.length);
      quest.objectives.forEach((_, index) => {
        expect(lines[index]).toHaveTextContent(ownText(locale, slug, `obj${String(index + 1)}`));
      });
    }
  });
});
