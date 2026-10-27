import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import authored from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
const cases = [
  ['shock-web', 'Lightning', '闪电', 30, 50, 3], ['charged-bolt-sentry', 'Lightning', '闪电', 40, 60, 4],
  ['wake-of-fire', 'Fire', '火焰', 60, 85, 5], ['blade-sentinel', 'Physical', '物理', 50, 75, 5],
  ['lightning-sentry', 'Lightning', '闪电', 75, 110, 6], ['wake-of-inferno', 'Fire', '火焰', 90, 130, 7],
  ['death-sentry', 'Lightning', '闪电', 85, 125, 7], ['blade-shield', 'Physical', '物理', 95, 135, 8]
] as const;
for (const locale of ['en', 'zh-CN'] as const) for (const [slug, en, zh, min, max, growth] of cases)
  it.each([0, 1, 19, 20])(`${slug} explains actual current/next/MAX trap mechanics (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const id = 'skills-assassin-' + slug, levels = Object.fromEntries(authored.map(row => [row.id, 1]));
    levels[id] = rank;
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Constructed trap preview', 'assassin'),
      level: 99, skillPoints: 2, skillLevels: levels, comboOrder: rank > 0 ? [id] : [] }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter></Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-' + id));
    const panel = screen.getByTestId('skill-detail-panel'), shield = slug === 'blade-shield', corpse = slug === 'death-sentry';
    for (const text of locale === 'en'
      ? ['one payment', 'skip recasting while active', 'next wave', ...(shield
        ? ['ordinary hostile Physical hit', 'removes HP', 'surviving attacker', 'No immediate attack', 'including misses', 'damage over time']
        : ['all living enemies', 'first immediately', 'every 1 s', '3 pulses', 'Stun/Freeze'])]
      : ['只支付一次', '生效期间跳过重放', '下一波', ...(shield
        ? ['敌方普通物理攻击', '实际生命损失', '攻击者存活', '施放时不立即攻击', '包括未命中', '持续伤害']
        : ['所有存活敌人', '首次立即', '每 1 秒', '共 3 次', '眩晕或冻结'])]) expect(panel).toHaveTextContent(text);
    if (corpse) for (const text of locale === 'en'
      ? ['oldest corpse', 'at most one', 'instead', '10%', 'Burn', 'no corpse', 'Lightning']
      : ['最早的尸体', '至多消耗一具', '改为', '10%', '燃烧', '没有尸体', '闪电']) expect(panel).toHaveTextContent(text);
    const sections = [
      ...(rank > 0 ? [[locale === 'en' ? 'Current' : '当前', rank] as const] : []),
      ...(rank < 20 ? [[locale === 'en' ? (rank > 0 ? 'Next Level' : 'Learned at Lv. 1')
        : (rank > 0 ? '下一级' : '学习后 Lv.1'), Math.max(1, rank + 1)] as const] : [])
    ];
    for (const [title, shownRank] of sections) {
      const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
      if (!section) throw new Error('Missing trap rank section');
      const type = locale === 'en' ? en : zh;
      const label = locale === 'en' ? `${type} ${shield ? 'counterattempt' : corpse ? 'shot per pulse' : 'damage per pulse'}`
        : shield ? `${type}反击尝试` : corpse ? `每次脉冲${type}射击` : `每次脉冲${type}伤害`;
      const value = within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
      const range = `${String(min + growth * (shownRank - 1))} ~ ${String(max + growth * (shownRank - 1))}`;
      expect(value).toHaveTextContent(range);
      if (corpse) expect(within(section).getByText(locale === 'en' ? 'Fire corpse explosion' : '火焰尸爆', { selector: 'dt' })
        .nextElementSibling).toHaveTextContent(range);
      if (shield) for (const text of locale === 'en' ? ['Reactive lifetime', 'Per-attacker interval', '6 s', '1 s']
        : ['反应持续时间', '对每名攻击者的间隔', '6 秒', '1 秒']) expect(section).toHaveTextContent(text);
    }
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
