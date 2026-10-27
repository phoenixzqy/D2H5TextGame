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
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import { ASSASSIN_CHARGE_DEFINITION as rules } from '@/engine/skills/assassin-charges';

beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) for (const id of [...rules.builders, ...rules.finishers])
  it.each([0, 1, 19, 20])(`explains ${id} paid charges and current/next/MAX release values (${locale}, rank%i)`, async rank => {
    await i18n.changeLanguage(locale);
    const dataId = 'skills-' + id.replace('.', '-').replaceAll('_', '-'), row = rows.find(row => row.id === dataId);
    if (!row) throw new Error('Missing martial skill');
    const levels = Object.fromEntries(rows.map(row => [row.id, 1])); levels[dataId] = rank;
    act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic charge preview', 'assassin'),
      level: 99, skillPoints: 2, skillLevels: levels, comboOrder: rank > 0 ? [dataId] : [] }); });
    const before = structuredClone(usePlayerStore.getState().player);
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-' + dataId));
    const panel = screen.getByTestId('skill-detail-panel');
    const builder = rules.builders.some(builder => builder === id);
    for (const text of locale === 'en'
      ? ['first hit that removes enemy HP', 'once per cast', 'Misses and full absorption keep charges',
        'remain usable without charges', 'Dragon Talon', 'Dragon Claw', 'Dragon Tail', 'Dragon Flight', 'basic attacks']
      : ['首次造成敌方生命损失', '每次施放仅释放一次', '未命中或完全吸收会保留聚气',
        '没有聚气时仍可使用', '龙爪踢', '龙爪', '神龙摆尾', '龙飞', '普攻']) expect(panel).toHaveTextContent(text);
    if (builder) for (const text of locale === 'en'
      ? ['paid hit removes enemy HP', 'caster survives', 'any pool is full', 'next wave', 'Command once']
      : ['付费攻击造成敌方生命损失', '施法者存活', '任一聚气池已满', '下一波', '战斗指挥只计入一次'])
      expect(panel).toHaveTextContent(text);
    if (id === 'assassin.cobra_strike') for (const text of locale === 'en'
      ? ['actual enemy HP removed', 'surviving victim', 'actual MP removed', 'no extra damage']
      : ['实际敌方生命损失', '存活目标', '实际扣除的法力', '没有额外伤害']) expect(panel).toHaveTextContent(text);
    const section = (title: string) => {
      const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
      if (!section) throw new Error('Missing charge rank section');
      return within(section);
    };
    for (const [title, shownRank] of [
      ...(rank > 0 ? [[locale === 'en' ? 'Current' : '当前', rank] as const] : []),
      ...(rank < 20 ? [[locale === 'en' ? (rank > 0 ? 'Next Level' : 'Learned at Lv. 1') :
        (rank > 0 ? '下一级' : '学习后 Lv.1'), Math.max(1, rank + 1)] as const] : [])
    ]) {
      const stats = section(title);
      const value = (label: string) => stats.getByText(label, { selector: 'dt' }).nextElementSibling;
      expect(value(locale === 'en' ? 'Charges per skill' : '每个技能聚气上限')).toHaveTextContent('3');
      expect(value(locale === 'en' ? 'Lifetime after last charge' : '最后一次聚气后的持续时间')).toHaveTextContent('15');
      for (const stacks of [1, 2, 3]) {
        if (!builder) continue;
        if (id === 'assassin.cobra_strike') {
          expect(value(locale === 'en' ? `${String(stacks)}-charge recovery` : `${String(stacks)} 层聚气回复`))
            .toHaveTextContent(locale === 'en' ? `${String(stacks * 10)}% HP / ${String(stacks * 10)}% MP` :
              `${String(stacks * 10)}% 生命 / ${String(stacks * 10)}% 法力`);
        } else {
          const damage = row.damage;
          if (!damage) throw new Error('Missing direct damage');
          const growth = row.scaling.damagePerLevel * (shownRank - 1);
          expect(value(locale === 'en' ? `${String(stacks)}-charge release base` : `${String(stacks)} 层聚气释放基础伤害`))
            .toHaveTextContent(`${String(Math.floor((damage.min + growth) * stacks * .5))} ~ ${String(Math.floor((damage.max + growth) * stacks * .5))}`);
        }
      }
    }
    if (rank === 20) expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
