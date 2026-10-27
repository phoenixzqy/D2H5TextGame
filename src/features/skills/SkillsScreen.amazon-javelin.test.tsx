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
  { slug:'power-strike',min:40,max:60,growth:4,mana:10,cooldown:1 },
  { slug:'charged-strike',min:70,max:100,growth:6,mana:20,cooldown:2 },
  { slug:'poison-javelin',min:20,max:35,growth:3,mana:10,cooldown:2 },
  { slug:'lightning-strike',min:80,max:110,growth:7,mana:25,cooldown:2 }
] as const;
beforeEach(() => { usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); usePlayerStore.getState().reset(); useHydrationStore.getState().setStatus('idle'); });
async function arrange(locale: 'en' | 'zh-CN', slug: string, rank: number) {
  await i18n.changeLanguage(locale);
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic Amazon volley preview', 'amazon'),
    level: 30, skillPoints: 1, comboOrder: [], skillLevels: {
      'skills-amazon-jab':1,'skills-amazon-power-strike':1,'skills-amazon-lightning-bolt':1,
      'skills-amazon-charged-strike':1, ['skills-amazon-' + slug]: rank
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
      ? [`${String(min)}–${String(max)} base damage`, `${String(skill.mana)} MP`, `${String(skill.cooldown)} s cooldown`]
      : [`${String(min)}～${String(max)} 点`, `${String(skill.mana)} 点法力`, `冷却${String(skill.cooldown)} 秒`])
      expect(panel).toHaveTextContent(phrase);
    const phrases = skill.slug === 'power-strike'
      ? locale==='en' ? ['one shared hit and critical decision','equal Physical and Lightning shares','up to 2 additional Lightning attempts','same original target','no spill']
        : ['一次共享命中与暴击判定','物理与闪电各占一半','最多追加2次独立闪电判定','同一原目标','不转移']
      : skill.slug === 'charged-strike'
        ? locale==='en' ? ['up to 2 other original living hostiles','cross around the primary','one independent Lightning bolt','Misses consume attempts','Stop on caster death']
          : ['最多2名其他原始存活敌人','主目标周围的十字','各承受一次独立闪电','未命中也消耗','施法者死亡立即停止']
        : skill.slug === 'poison-javelin'
          ? locale==='en' ? ['up to 9 living enemies','3×3 impact cloud','5% of the final hit','5 s','10 stacks','original rate']
            : ['最多9名存活敌人','3×3冲击毒云','最终命中伤害的5%','5 秒','最多10层','原有速率']
          : locale==='en' ? ['up to 5 distinct original living enemies','nearest Manhattan neighbor','Misses consume attempts','1 s Paralyze','no sixth replacement']
            : ['最多5名不同的原始存活敌人','曼哈顿距离最近','未命中也消耗','1 秒麻痹','不补选第六名'];
    if(skill.slug==='power-strike'||skill.slug==='charged-strike') {
      const minBolt=(skill.slug==='power-strike'?10:35)+(skill.slug==='power-strike'?1:3)*(Math.max(1,rank)-1);
      const maxBolt=(skill.slug==='power-strike'?15:50)+(skill.slug==='power-strike'?1:3)*(Math.max(1,rank)-1);
      expect(panel).toHaveTextContent(locale==='en'?`${String(minBolt)}–${String(maxBolt)} Lightning base damage`:`${String(minBolt)}～${String(maxBolt)} 点闪电基础伤害`);
    }
    for (const phrase of phrases) expect(panel).toHaveTextContent(phrase);
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
