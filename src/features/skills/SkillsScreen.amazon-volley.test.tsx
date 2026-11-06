import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from '@/features/skills/SkillsScreen';


const skills = [
  { slug: 'guided-arrow', min: 70, max: 100, growth: 6, mana: 20 },
  { slug: 'multiple-shot', min: 40, max: 60, growth: 12, mana: 15 },
  { slug: 'strafe', min: 35, max: 55, growth: 4, mana: 20 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: 'en' | 'zh-CN', slug: string, rank: number) {
  await i18n.changeLanguage(locale);
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Amazon volley preview', 'amazon'),
    level: 30, skillPoints: 1, comboOrder: [], skillLevels: {
      'skills-amazon-magic-arrow': 1, 'skills-amazon-multiple-shot': 1,
      'skills-amazon-guided-arrow': 1, ['skills-amazon-' + slug]: rank
    } }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-amazon-' + slug));
  return screen.getByTestId('skill-detail-panel');
}
for (const locale of ['en', 'zh-CN'] as const) for (const skill of skills) {
  it.each([0, 1, 19, 20])(`explains actual ${skill.slug} identity, damage and payment (${locale}, rank%i)`, async rank => {
    const panel = await arrange(locale, skill.slug, rank), before = structuredClone(usePlayerStore.getState().player);
    const min = skill.min + skill.growth * (Math.max(1, rank) - 1), max = skill.max + skill.growth * (Math.max(1, rank) - 1);
    for (const phrase of locale === 'en'
      ? [`${String(min)}–${String(max)} base damage`, `${String(skill.mana)} MP`, '2 s cooldown', 'Physical resistance', 'Defense']
      : [`${String(min)}～${String(max)} 点`, `${String(skill.mana)} 点法力`, '冷却2 秒', '物理抗性', '防御'])
      expect(panel).toHaveTextContent(phrase);
    const phrases = skill.slug === 'guided-arrow'
      ? locale === 'en' ? ['guaranteed single-target', 'accuracy, dodge and Blind', 'personal absorption', 'does not switch targets']
        : ['单个存活敌人必定命中一次', '普通命中判定、闪避与致盲', '个人吸收', '不会转向其他敌人']
      : skill.slug === 'multiple-shot'
        ? locale === 'en' ? ['up to 5 living enemies', 'three-row widening cone', '1, 3, then 5 cells', 'Misses consume attempts', 'outside the footprint']
          : ['最多5名存活敌人', '三排逐渐展开的锥形', '每排1、3、5格', '未命中也消耗', '不从范围外补足']
        : locale === 'en' ? ['2 ordered passes', 'up to 2 independent Physical attempts', 'dead originals are skipped', 'without redistributing attempts', 'Stop on caster death']
          : ['依次进行2轮攻击', '最多承受2次独立物理判定', '原目标死亡后跳过', '不转移其剩余次数', '施法者死亡立即停止'];
    for (const phrase of phrases) expect(panel).toHaveTextContent(phrase);
    if (skill.slug === 'multiple-shot') {
      const attack = 40 * (Math.max(1, rank) - 1);
      expect(panel).toHaveTextContent(locale === 'en' ? `plus ${String(attack)}% of current Attack`
        : `另加当前攻击力的${String(attack)}%`);
    }
    expect(panel.textContent).not.toMatch(/\{\{|undefined|NaN|details\./);
    expect(usePlayerStore.getState().player).toEqual(before);
  });
  it(`allocates the final ${skill.slug} rank and shows exact MAX damage (${locale})`, async () => {
    const panel = await arrange(locale, skill.slug, 19);
    fireEvent.click(within(panel).getByRole('button', { name: locale === 'en' ? /^Allocate$/ : /^分配$/ }));
    expect(usePlayerStore.getState().player?.skillLevels?.['skills-amazon-' + skill.slug]).toBe(20);
    expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
    expect(panel).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
    const min = skill.min + skill.growth * 19, max = skill.max + skill.growth * 19;
    expect(panel).toHaveTextContent(locale === 'en' ? `${String(min)}–${String(max)} base damage`
      : `${String(min)}～${String(max)} 点`);
  });
}
