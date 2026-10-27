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
import { SkillsScreen } from '@/features/skills/SkillsScreen';
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 19, 20])(
  `Flight explains the paid blink and unchanged finisher (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const id = 'skills-assassin-dragon-flight', levels = Object.fromEntries(authored.map(row => [row.id, 1]));
    levels[id] = rank;
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Constructed Flight preview', 'assassin'),
      level: 99, skillPoints: 2, skillLevels: levels, comboOrder: rank > 0 ? [id] : [] }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter></Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-' + id));
    const panel = screen.getByTestId('skill-detail-panel');
    for (const text of locale === 'en'
      ? ['magical dodge', 'percentage points', 'even if the kick misses', 'one payment', '15 MP', 'next wave', 'death']
      : ['魔法闪避', '个百分点', '即使飞踢未命中', '只支付一次', '15 点法力', '下一波', '死亡'])
      expect(panel).toHaveTextContent(text);
    const sections = [
      ...(rank > 0 ? [[locale === 'en' ? 'Current' : '当前', rank] as const] : []),
      ...(rank < 20 ? [[locale === 'en' ? (rank > 0 ? 'Next Level' : 'Learned at Lv. 1')
        : (rank > 0 ? '下一级' : '学习后 Lv.1'), Math.max(1, rank + 1)] as const] : [])
    ];
    for (const [title, shownRank] of sections) {
      const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
      if (!section) throw new Error('Missing Flight rank section');
      const dodge = within(section).getByText(locale === 'en' ? 'Magical dodge bonus' : '魔法闪避加成', { selector: 'dt' });
      expect(dodge.nextElementSibling).toHaveTextContent(locale === 'en'
        ? `${String(shownRank)} percentage points` : `${String(shownRank)}个百分点`);
      const lifetime = within(section).getByText(locale === 'en' ? 'Blink duration' : '闪现持续时间', { selector: 'dt' });
      expect(lifetime.nextElementSibling).toHaveTextContent(locale === 'en' ? '1 s' : '1 秒');
      const damage = within(section).getByText(locale === 'en' ? 'Physical attack' : '物理攻击', { selector: 'dt' });
      expect(damage.nextElementSibling).toHaveTextContent(`${String(80 + 7 * (shownRank - 1))} ~ ${String(115 + 7 * (shownRank - 1))}`);
    }
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
