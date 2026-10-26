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
const cases = [
  { id: 'iron-maiden', mana: 11, scaling: .25, en: ['100%', 'Physical HP actually removed', 'including lethal hits', 'before the attacker’s resistance and Defense'],
    zh: ['100%', '实际扣除的物理生命值', '包括致命攻击', '攻击者的抗性与防御之前'] },
  { id: 'life-tap', mana: 9, scaling: .2, en: ['25%', 'direct HP actually removed', 'surviving attacker', 'Damage-over-time and reflection do not heal'],
    zh: ['25%', '直接攻击实际扣除的生命值', '存活攻击者', '持续伤害与反伤不会治疗'] },
  { id: 'lower-resist', mana: 22, scaling: .3, en: ['30 percentage points', 'all six resistance pools', 'before resistance limits and flat mitigation', 'Existing damage-over-time rates stay unchanged'],
    zh: ['30个百分点', '全部六种抗性', '抗性上限与固定减伤之前', '已有持续伤害速率保持不变'] }
] as const;
for (const row of cases) for (const locale of ['en', 'zh-CN'] as const) it.each([0, 1, 19, 20])(
  `${row.id} shows truthful current/next/MAX rules (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic damage curse preview', 'necromancer'),
      level: 30, skillPoints: 2, comboOrder: [], skillLevels: { ['skills-necromancer-' + row.id]: rank } }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-' + row.id));
    const panel = screen.getByTestId('skill-detail-panel'), cost = Math.round(row.mana - row.scaling * (Math.max(1, rank) - 1));
    for (const phrase of [...row[locale === 'en' ? 'en' : 'zh'], ...(locale === 'en'
      ? ['all living enemies', 'for 3 s', `Pays ${String(cost)} MP`, '3 s cooldown', 'Refreshes without stacking']
      : ['所有存活敌人', '持续3 秒', `消耗${String(cost)} 点法力`, '3 秒冷却', '不会叠加效果'])]) expect(panel).toHaveTextContent(phrase);
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
