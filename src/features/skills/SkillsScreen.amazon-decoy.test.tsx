import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from '@/features/skills/SkillsScreen';

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
  it.each([0, 1, 18, 20])(
    `shows real finite Decoy body and paid startup rules (${locale}, rank%i)`,
    async (rank) => {
      await i18n.changeLanguage(locale);
      act(() => {
        usePlayerStore.getState().setPlayer({
          ...createMockPlayer('Synthetic Decoy preview', 'amazon'),
          level: 30,
          skillPoints: 2,
          comboOrder: [],
          skillLevels: { 'skills-amazon-decoy': rank }
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
      fireEvent.click(screen.getByTestId('skill-node-skills-amazon-decoy'));
      const panel = screen.getByTestId('skill-detail-panel'),
        safe = Math.max(1, rank),
        cost = Math.round(15 - 0.1 * (safe - 1)),
        cooldown = Number((4 - 0.05 * (safe - 1)).toFixed(1)),
        life = 200 + 20 * (safe - 1),
        duration = 8 + 0.5 * (safe - 1);
      for (const phrase of locale === 'en'
        ? [
            'At each wave start',
            `pay ${String(cost)} MP`,
            'non-attacking Decoy',
            `${String(life)} Life`,
            `${String(duration)} s`,
            'single-target attacks',
            'Taunt takes priority',
            'Area attacks can still hit you',
            'No replacement or mana refund',
            `${String(cooldown)} s cooldown`
          ]
        : [
            '每波开始',
            `消耗${String(cost)} 点法力`,
            '不攻击的诱饵',
            `${String(life)} 点生命`,
            `${String(duration)} 秒`,
            '单体攻击优先瞄准诱饵',
            '嘲讽优先',
            '范围攻击仍可能命中你',
            '本波不补召、不返还法力',
            `冷却${String(cooldown)} 秒`
          ])
        expect(panel).toHaveTextContent(phrase);
      if (rank === 20)
        expect(panel).toHaveTextContent(
          locale === 'en' ? 'Max level reached.' : '已达到最高等级。'
        );
      expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\.|combat:summons/);
      expect(usePlayerStore.getState().player).toEqual(before);
    }
  );
