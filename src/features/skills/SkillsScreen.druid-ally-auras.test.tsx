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
  for (const rank of [1, 20])
    for (const key of ['oak-sage', 'heart-of-wolverine'] as const) {
      it(`shows ${key} rank${String(rank)} allied rules, exact aliases and upgrade in ${locale}`, async () => {
        await i18n.changeLanguage(locale);
        const fresh = createMockPlayer('Constructed allied aura details', 'druid');
        act(() => {
          usePlayerStore
            .getState()
            .setPlayer({
              ...fresh,
              level: 30,
              skillPoints: 1,
              comboOrder: [],
              skillLevels: {
                'druid.oak_sage': 1,
                ['skills-druid-' + key]: 1,
                ['druid.' + key.replace(/-/g, '_')]: rank
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
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'next wave' : '下一波');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'summons' : '召唤物');
        expect.soft(panel).toHaveTextContent(locale === 'en' ? 'source dies' : '施放者死亡');
        expect(panel).not.toHaveTextContent('{{');
        expect(panel).not.toHaveTextContent(locale === 'en' ? '30% attack speed' : '30%攻击速度');
        const rows =
          key === 'oak-sage'
            ? [['Life', '生命', 3]]
            : [
                ['Attack', '攻击', 3],
                ['Critical Chance', '暴击率', 0.5]
              ];
        const value = (heading: string, label: string) => {
          const section = within(panel)
            .getByRole('heading', { name: heading, level: 3 })
            .closest('section');
          if (!section) throw new Error('Missing aura detail section');
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
