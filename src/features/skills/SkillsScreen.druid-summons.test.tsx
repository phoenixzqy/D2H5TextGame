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
const spells = [
  { slug: 'raven', speed: 95 },
  { slug: 'poison-creeper', speed: 70 },
  { slug: 'summon-spirit-wolf', speed: 85 },
  { slug: 'summon-dire-wolf', speed: 90 },
  { slug: 'carrion-vine', speed: 70 },
  { slug: 'solar-creeper', speed: 70 },
  { slug: 'summon-grizzly', speed: 55 }
] as const;
const words = {
  en: {
    current: 'Current',
    next: 'Next Level',
    preview: 'Learned at Lv. 1',
    speed: 'Attack Speed',
    type: 'Summon attack type',
    physical: 'Physical',
    blind: 'Blind hit penalty',
    blindDuration: 'Blind duration',
    poison: 'Poison per stack',
    recovery: 'Corpse recovery',
    maxed: 'Max level reached.',
    rules: ['whole batch', 'no retry', 'coexist'],
    blindRules: ['20 percentage points', 'thorns', '5% minimum', 'refresh'],
    poisonRules: ['10%', 'rounded down', 'minimum 1', '5 s', '10 stacks', 'refresh'],
    vineRules: [
      '5%',
      'oldest',
      'living owner',
      'shared',
      'scheduled attack',
      'full',
      'no corpse',
      'dead owner',
      'Stun',
      'Freeze',
      'Paralyze',
      'do not carry'
    ]
  },
  'zh-CN': {
    current: '当前',
    next: '下一级',
    preview: '学习后 Lv.1',
    speed: '攻击速度',
    type: '召唤物攻击类型',
    physical: '物理',
    blind: '致盲命中惩罚',
    blindDuration: '致盲持续',
    poison: '每层中毒',
    recovery: '尸体恢复',
    maxed: '已达到最高等级。',
    rules: ['整批', '不再重试', '共存'],
    blindRules: ['20个百分点', '荆棘', '最低5%', '刷新'],
    poisonRules: ['10%', '向下取整', '最低1', '5 秒', '10层', '刷新'],
    vineRules: [
      '5%',
      '最早',
      '存活主人',
      '共享',
      '预定攻击',
      '已满',
      '没有尸体',
      '主人死亡',
      '眩晕',
      '冰冻',
      '麻痹',
      '不跨波'
    ]
  }
} as const;
function section(panel: HTMLElement, title: string) {
  const result = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!result) throw new Error('Missing rank section');
  return result;
}
function value(panel: HTMLElement, label: string) {
  const result = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!result) throw new Error('Missing stat row');
  return result;
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
  describe.each(spells)(`Druid summon $slug ${locale}`, (spell) => {
    beforeEach(async () => {
      await i18n.changeLanguage(locale);
    });
    it.each([0, 1, 2, 20])(
      'explains actual attacks/effects and preparation at allocation %i',
      (rank) => {
        const canonical = 'druid.' + spell.slug.replaceAll('-', '_');
        act(() => {
          usePlayerStore
            .getState()
            .setPlayer({
              ...createMockPlayer('Synthetic summon UI', 'druid'),
              level: 30,
              skillPoints: 2,
              comboOrder: [],
              skillLevels: {
                'druid.poison_creeper': 1,
                'druid.carrion_vine': 1,
                'druid.summon_spirit_wolf': 1,
                'druid.summon_dire_wolf': 1,
                [canonical]: rank
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
        const check = (s: HTMLElement) => {
          expect(value(s, w.speed)).toHaveTextContent(String(spell.speed));
          expect(value(s, w.type)).toHaveTextContent(w.physical);
          if (spell.slug === 'raven') {
            expect(value(s, w.blind)).toHaveTextContent('20');
            expect(value(s, w.blindDuration)).toHaveTextContent(locale === 'en' ? '2 s' : '2 秒');
          } else if (spell.slug === 'poison-creeper')
            expect(value(s, w.poison)).toHaveTextContent('10%');
          else if (spell.slug === 'carrion-vine' || spell.slug === 'solar-creeper')
            expect(value(s, w.recovery)).toHaveTextContent('5%');
        };
        check(section(panel, rank === 0 ? w.preview : w.current));
        if (rank > 0) {
          const next = section(panel, w.next);
          if (rank === 20) expect(next).toHaveTextContent(w.maxed);
          else check(next);
        }
        const phrases =
          spell.slug === 'raven'
            ? w.blindRules
            : spell.slug === 'poison-creeper'
              ? w.poisonRules
              : spell.slug === 'carrion-vine' || spell.slug === 'solar-creeper'
                ? w.vineRules
                : [];
        for (const phrase of [...w.rules, ...phrases]) expect(panel).toHaveTextContent(phrase);
        expect(panel.textContent).not.toMatch(/\{\{|details\.|combat:|undefined|NaN/);
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
