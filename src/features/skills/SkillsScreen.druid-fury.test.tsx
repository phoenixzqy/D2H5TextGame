import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';
const spells = [{ slug: 'fury', min: 95, max: 135, growth: 8 }] as const;
const words = {
  en: {
    current: 'Current',
    next: 'Next Level',
    preview: 'Learned at Lv. 1',
    recovery: 'Attack attempts per cast',
    rate: '% of actual direct HP removed',
    speed: 'Attack speed per stack',
    cap: 'Maximum speed stacks',
    duration: 'Speed refresh duration',
    maxed: 'Max level reached.',
    form: 'any form',
    floor: 'original two-enemy pool',
    capLife: 'caster dies'
  },
  'zh-CN': {
    current: '当前',
    next: '下一级',
    preview: '学习后 Lv.1',
    recovery: '每次施放攻击次数',
    rate: '%的直接实际生命损失',
    speed: '每层攻击速度',
    cap: '速度层数上限',
    duration: '速度刷新持续',
    maxed: '已达到最高等级。',
    form: '任何形态',
    floor: '最初选定的两名敌人',
    capLife: '施法者死亡'
  }
} as const;
function section(panel: HTMLElement, title: string) {
  const n = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!n) throw new Error('Missing section');
  return n;
}
function row(panel: HTMLElement, label: string) {
  const n = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!n) throw new Error('Missing row');
  return n;
}
beforeEach(() => {
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});
for (const locale of ['en', 'zh-CN'] as const)
  describe.each(spells)(`Fury sequence $slug details ${locale}`, (spell) => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    it.each([0, 1, 2, 20])(
      'shows real attempt count and per-strike current/next damage at allocated rank %i',
      (rank) => {
        const canonical = 'druid.' + spell.slug.replaceAll('-', '_');
        act(() => {
          usePlayerStore.getState().setPlayer({
            ...createMockPlayer('Synthetic sustain UI', 'druid'),
            level: 30,
            skillPoints: 2,
            comboOrder: [],
            skillLevels: {
              'druid.werewolf': 1,
              'druid.feral_rage': 1,
              'druid.rabies': 1,
              ...(rank > 0 ? { [canonical]: rank } : {})
            }
          });
        });
        const before = structuredClone(usePlayerStore.getState().player);
        render(
          <I18nextProvider i18n={i18n}>
            <Suspense fallback={null}>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkillsScreen />
              </MemoryRouter>
            </Suspense>
          </I18nextProvider>
        );
        fireEvent.click(screen.getByTestId('skill-node-skills-druid-' + spell.slug));
        const panel = screen.getByTestId('skill-detail-panel'),
          w = words[locale];
        const current = section(panel, rank === 0 ? w.preview : w.current);
        expect(row(current, w.recovery)).toHaveTextContent(/^5$/);
        const growth = spell.growth * Math.max(0, rank - 1);
        expect(current).toHaveTextContent(
          `${String(spell.min + growth)} ~ ${String(spell.max + growth)}`
        );
        expect(panel).toHaveTextContent(w.form);
        expect(panel).toHaveTextContent(w.floor);
        expect(panel).toHaveTextContent(w.capLife);
        expect(panel.textContent).not.toMatch(/\{\{|details\.|combat:|undefined|NaN/);
        if (rank > 0) {
          const next = section(panel, w.next);
          if (rank === 20) expect(next).toHaveTextContent(w.maxed);
          else expect(row(next, w.recovery)).toHaveTextContent(/^5$/);
        }
        expect(usePlayerStore.getState().player).toEqual(before);
        if (rank === 0) {
          fireEvent.click(within(panel).getByRole('button'));
          expect(usePlayerStore.getState().player?.skillLevels?.[canonical]).toBe(1);
          expect(usePlayerStore.getState().player?.derivedStats).toEqual(before?.derivedStats);
          expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
        }
      }
    );
  });
