import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 2, 20])(
  `Hydra explains per-head damage, paid preparation and a targetable finite body (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Hydra UI', 'sorceress'),
      level: 30, skillPoints: 1, comboOrder: [], skillLevels: { 'skills-sorceress-hydra': rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-hydra'));
    const panel = screen.getByTestId('skill-detail-panel'), at = Math.max(1, rank);
    const min = 95 + 9 * (at - 1), max = 140 + 9 * (at - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)}`, 'per head bolt', '40 MP', 'each wave starts', '10 s',
        '3 separate bolts', 'targetable body', 'own scheduled action', 'no instant caster damage',
        'paid rank', 'owner control', 'no same-wave retry', 'carried mana', 'Life', '240', 'Attack Speed', '100']
      : [`${String(min)}～${String(max)}`, '每个头的火弹', '40 点法力', '每波开始', '10 秒',
        '3 发独立火弹', '可被攻击的实体', '自身行动时机', '施法者不会立即造成伤害',
        '已支付等级', '主人受控', '同波不重试', '结转法力', '生命', '240', '攻击速度', '100'])
      expect(panel).toHaveTextContent(phrase);
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(i18n.t('summons.hydra', { ns: 'combat' })).toBe(locale === 'en' ? 'Hydra' : '九头海蛇');
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
  });
