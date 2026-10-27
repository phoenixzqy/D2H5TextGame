import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import rows from '@/data/skills/assassin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) for (const slug of ['shadow-warrior', 'shadow-master'])
  it.each([0, 1, 19, 20])(`shows ${slug} native skill policy and current/next/MAX mana and rank caps (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const id = 'skills-assassin-' + slug;
    const levels = Object.fromEntries(rows.map(row => [row.id, 1])); levels[id] = rank;
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic shadow preview', 'assassin'),
      level: 30, skillPoints: 2, skillLevels: levels, comboOrder: rank > 0 ? [id] : [] }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-' + id));
    const panel = screen.getByTestId('skill-detail-panel'), safe = Math.max(1, rank),
      bodyMana = slug === 'shadow-warrior' ? 100 : 150,
      cost = Math.round((slug === 'shadow-warrior' ? 22 : 35) - (slug === 'shadow-warrior' ? 0.2 : 0.25) * (safe - 1));
    for (const phrase of locale === 'en'
      ? [`one payment of ${String(cost)} MP`, `Own MP: ${String(bodyMana)}`, 'own cooldowns', 'basic attacks',
        'No automatic mana refill', 'fallen summons are not replaced and return no mana', 'next wave']
      : [`整批共 ${String(cost)} 点法力`, `自身法力：${String(bodyMana)}`, '独立冷却', '普攻',
        '不会自动补满法力', '不补召、不返还法力', '下一波']) expect(panel).toHaveTextContent(phrase);
    if (slug === 'shadow-warrior') expect(panel).toHaveTextContent(locale === 'en'
      ? 'selected, learned Assassin attacks in priority order' : '按优先序复制已选择、已学习的刺客攻击技能');
    else for (const phrase of locale === 'en' ? ['Independent priority', 'Mind Blast', 'Fire Blast', 'Blade Fury', 'Dragon Talon']
      : ['独立优先序', '精神爆裂', '烈焰冲击', '刀锋之怒', '龙爪踢']) expect(panel).toHaveTextContent(phrase);
    const value = (title: string, label: string) => {
      const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
      if (!section) throw new Error('Missing shadow rank section');
      return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
    };
    if (rank > 0) {
      expect(value(locale === 'en' ? 'Current' : '当前', locale === 'en' ? 'Own Mana' : '自身法力')).toHaveTextContent(String(bodyMana));
      expect(value(locale === 'en' ? 'Current' : '当前', locale === 'en' ? 'Skill rank cap' : '技能等级上限')).toHaveTextContent(String(rank));
      if (rank < 20) expect(value(locale === 'en' ? 'Next Level' : '下一级', locale === 'en' ? 'Skill rank cap' : '技能等级上限'))
        .toHaveTextContent(String(rank + 1));
    }
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\.|combat:summons/);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
