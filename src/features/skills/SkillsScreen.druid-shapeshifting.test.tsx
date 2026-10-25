import { afterEach, beforeEach, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { startSubAreaRun, abortSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => {
  abortSubAreaRun();
  for (const s of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore])
    s.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  abortSubAreaRun();
  useHydrationStore.getState().setStatus('idle');
});

for (const locale of ['en', 'zh-CN'] as const)
  for (const rank of [1, 20]) {
    for (const key of ['werewolf', 'werebear', 'lycanthropy'] as const) {
      it(`shows ${key} rank${String(rank)} truthful form rules, exact aliases and upgrade in ${locale}`, async () => {
        await i18n.changeLanguage(locale);
        const fresh = createMockPlayer('Synthetic Druid details', 'druid');
        act(() => {
          usePlayerStore.getState().setPlayer({
            ...fresh,
            level: 30,
            skillPoints: 1,
            comboOrder: [],
            skillLevels: {
              'druid.lycanthropy': 1,
              ['skills-druid-' + key]: 1,
              ['druid.' + key]: rank
            }
          });
        });
        render(
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={null}>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkillsScreen />
              </MemoryRouter>
            </Suspense>
          </I18nextProvider>
        );
        fireEvent.click(screen.getByTestId('skill-node-skills-druid-' + key));
        const panel = screen.getByTestId('skill-detail-panel');
        expect(panel).toHaveTextContent(locale === 'en' ? 'next wave' : '下一波');
        expect(panel).toHaveTextContent(locale === 'en' ? 'never heals' : '不会治疗');
        expect(panel).toHaveTextContent(
          key === 'lycanthropy'
            ? locale === 'en'
              ? 'No effect in human or bear'
              : '人形和熊人形态均不生效'
            : locale === 'en'
              ? 'first eligible form'
              : '第一个符合条件的形态'
        );
        expect(panel).not.toHaveTextContent('{{');
        const rows =
          key === 'werewolf'
            ? [
                ['Attack Speed', '攻击速度', 2],
                ['Physical Dodge', '物理闪避', 0.5]
              ]
            : key === 'werebear'
              ? [
                  ['Life', '生命', 2.5],
                  ['Defense', '防御', 2]
                ]
              : [
                  ['Life', '生命', 3],
                  ['Attack Speed', '攻击速度', 1]
                ];
        const value = (heading: string, label: string) => {
          const section = within(panel)
            .getByRole('heading', { name: heading, level: 3 })
            .closest('section');
          if (!section) throw new Error('Missing form detail section');
          return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
        };
        for (const [en, zh, perRank] of rows) {
          const label = String(locale === 'en' ? en : zh);
          expect
            .soft(value(locale === 'en' ? 'Current' : '当前', label))
            .toHaveTextContent(`${String(rank * Number(perRank))}%`);
          if (rank < 20)
            expect
              .soft(value(locale === 'en' ? 'Next Level' : '下一级', label))
              .toHaveTextContent(`${String((rank + 1) * Number(perRank))}%`);
        }
        if (rank < 20) {
          fireEvent.click(within(panel).getByRole('button'));
          expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
        } else expect(within(panel).getByRole('button')).toBeDisabled();
      });
    }
  }

it('defers public form-priority changes until the next wave without replacing the paid current recording', async () => {
  await i18n.changeLanguage('en');
  const fresh = createMockPlayer('Native form priority control', 'druid');
  usePlayerStore
    .getState()
    .setPlayer({
      ...fresh,
      level: 30,
      skillLevels: { 'druid.werewolf': 20, 'druid.werebear': 20, 'druid.lycanthropy': 20 },
      comboOrder: ['skills-druid-werewolf', 'skills-druid-werebear']
    });
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkillsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
  const capture = () =>
    structuredClone({
      events: useCombatStore.getState().recordedEvents,
      outcome: useCombatStore.getState().outcome,
      cursor: useCombatStore.getState().eventCursor,
      rewards: useCombatStore.getState().runRewards
    });
  const before = capture();
  fireEvent.click(screen.getByRole('tab', { name: i18n.t('skills:tab.active') }));
  const up = within(screen.getByTestId('skills-active-panel')).getAllByRole('button', {
    name: i18n.t('skills:moveUp')
  })[1];
  if (!up) throw new Error('Missing second combo move control');
  fireEvent.click(up);
  expect(usePlayerStore.getState().player?.comboOrder).toEqual([
    'skills-druid-werebear',
    'skills-druid-werewolf'
  ]);
  expect(capture()).toEqual(before);
});
