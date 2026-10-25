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
import { abortSubAreaRun } from '@/stores/combatHelpers';
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
    it(`shows Barbs rank${String(rank)} real spirit rules, base preview, MAX aliases and upgrade in ${locale}`, async () => {
      await i18n.changeLanguage(locale);
      act(() => {
        usePlayerStore.getState().setPlayer({
          ...createMockPlayer('Constructed Barbs details', 'druid'),
          level: 30,
          skillPoints: 1,
          comboOrder: [],
          skillLevels: {
            'druid.oak_sage': 1,
            'druid.heart_of_wolverine': 1,
            'skills-druid-spirit-of-barbs': 1,
            'druid.spirit_of_barbs': rank
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
      fireEvent.click(screen.getByTestId('skill-node-skills-druid-spirit-of-barbs'));
      const panel = screen.getByTestId('skill-detail-panel');
      for (const phrase of locale === 'en'
        ? [
            'next wave',
            'both you and the spirit live',
            'not replaced',
            'base stats',
            'no ordinary action'
          ]
        : ['下一波', '你与棘灵都存活', '不会补召', '基础属性', '不占普通行动'])
        expect.soft(panel).toHaveTextContent(phrase);
      expect(panel).not.toHaveTextContent('{{');
      const value = (heading: string, label: string) => {
        const section = within(panel)
          .getByRole('heading', { name: heading, level: 3 })
          .closest('section');
        if (!section) throw new Error('Missing spirit details');
        return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
      };
      const current = locale === 'en' ? 'Current' : '当前';
      for (const [en, zh, v] of [
        ['Summon Cap', '召唤上限', 1],
        ['Life', '生命', 80],
        ['Attack', '攻击', 0],
        ['Defense', '防御', 10]
      ] as const)
        expect.soft(value(current, locale === 'en' ? en : zh)).toHaveTextContent(String(v));
      for (const [en, zh, perRank] of [
        ['Thorns', '荆棘反伤', 4],
        ['Summon Defense', '召唤物防御', 2]
      ] as const) {
        expect
          .soft(value(current, locale === 'en' ? en : zh))
          .toHaveTextContent(`${String(rank * perRank)}%`);
        if (rank < 20)
          expect
            .soft(value(locale === 'en' ? 'Next Level' : '下一级', locale === 'en' ? en : zh))
            .toHaveTextContent(`${String((rank + 1) * perRank)}%`);
      }
      if (rank < 20) {
        fireEvent.click(within(panel).getByRole('button'));
        expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
        expect(value(current, locale === 'en' ? 'Thorns' : '荆棘反伤')).toHaveTextContent('8%');
      } else expect(within(panel).getByRole('button')).toBeDisabled();
    });
  }
