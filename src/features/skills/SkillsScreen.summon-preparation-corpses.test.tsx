import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    cap: 'Summon Cap', mana: 'Mana Cost', cooldown: 'Cooldown', maxed: 'Max level reached.', life: 'Life', attack: 'Attack', defense: 'Defense',
    prose: (name: string, count: number, mana: number) => `${name}: once at each wave start, if learned, unlocked and in your combo, fill missing living summons up to ${String(count)} for one payment of ${String(mana)} MP for the whole batch. Already full: no cost. Not enough mana: no summons or payment, and no retry that wave. This skill uses no ordinary action; fallen summons are not replaced and return no mana. Each new wave starts with fresh summons, paid from your carried mana.`,
    generic: (name: string, count: number) => `${name}: summon up to ${String(count)} allies.` },
  'zh-CN': { current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    cap: '召唤上限', mana: '法力消耗', cooldown: '冷却', maxed: '已达到最高等级。', life: '生命', attack: '攻击', defense: '防御',
    prose: (name: string, count: number, mana: number) => `${name}：已学习、已解锁并编入连招时，每波开始仅准备一次，以整批共 ${String(mana)} 点法力补足存活召唤物，最多 ${String(count)} 名。已满员不消耗法力；法力不足则不召唤、不扣费，本波不再重试。此技能不占常规行动，召唤物阵亡不补召、不返还法力。新一波召唤物重新生成，从继承的法力中重新付费。`,
    generic: (name: string, count: number) => `${name}：最多召唤 ${String(count)} 名随从。` }
} as const;
function arrange(cls: CharacterClass = 'druid', levels: Record<string, number> = { 'druid.raven': 2 }): void {
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Summon UI', cls),
    level: 30, skillPoints: 2, skills: [], skillLevels: levels, comboOrder: [] }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(id: string): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${id}`));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { cleanup(); abortSubAreaRun(); });
// Independent v1c display literals; imported ranks/points are not earned progression.
const CASES = [
  { slug: 'raise-skeleton', en: 'Raise Skeleton', zh: '召唤骷髅', cost: 15, cd: 1,
    caps: [1, 1, 1, 2, 2, 3, 3], next: [1, 1, 2, 2, 3, 3, 3],
    identity: { en: 'Prepare skeleton warriors; no corpse is required.', 'zh-CN': '准备骷髅战士，无需尸体。' },
    base: ['162', '35', '19'], current: ['291.6', '49', '22.8'], upgraded: ['309.6(+18)', '51.8(+2.8)', '24(+1.2)'],
    unlearned: ['201.6', '35', '16.8'] },
  { slug: 'raise-skeletal-mage', en: 'Raise Skeletal Mage', zh: '召唤骷髅法师', cost: 22, cd: 1,
    caps: [1, 2, 3, 4, 5, 6, 8], next: [2, 3, 4, 4, 6, 6, 8],
    identity: { en: 'Each fresh batch assigns mages Fire → Cold → Lightning → Poison, repeating from Fire. Their basic attacks deal direct damage of their assigned element. No corpse is required; these attacks do not automatically apply statuses or damage over time.',
      'zh-CN': '每批新准备的法师按火焰→冰冷→闪电→毒素循环分配元素，每批从火焰开始。普通攻击造成所分配元素的直接伤害。无需尸体；这些攻击不会自动附加状态或持续伤害。' },
    base: ['123', '45', '10'], current: ['221.4', '63', '12'], upgraded: ['234(+12.6)', '67.2(+4.2)', '12'],
    unlearned: ['158.4', '42', '12'] },
  { slug: 'revive', en: 'Revive', zh: '复生', cost: 45, cd: 4,
    caps: [1, 2, 3, 4, 5, 6, 8], next: [2, 3, 4, 4, 6, 6, 8],
    identity: { en: 'Prepare Revived Minions whose strength grows with skill rank. No corpse or fallen enemy is required. They last until they or their summoner die, or the wave ends.',
      'zh-CN': '准备实力随技能等级成长的复生仆从，无需尸体或倒下的敌人。仆从持续作战，直到自身或召唤者死亡，或本波结束。' },
    base: ['210', '38', '23'], current: ['210', '38', '23'], upgraded: ['222(+12)', '40(+2)', '24(+1)'],
    unlearned: ['150', '28', '18'] }
] as const;
function section(panel: HTMLElement, title: string): HTMLElement {
  const value = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!value) throw new Error('Missing corpse-summon stat section');
  return value;
}
function stat(panel: HTMLElement, label: string, expected: string): void {
  const value = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  expect(value?.childNodes[0]?.textContent).toBe(expected);
}
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`D06 corpse-summon preparation detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(CASES)('$slug explains one paid preparation and exact current/next rank boundaries', item => {
      const text = copy[locale], name = locale === 'en' ? item.en : item.zh;
      for (const [index, rank] of [1, 2, 5, 6, 11, 12, 20].entries()) {
        const cap = item.caps[index];
        if (cap === undefined) throw new Error('Missing literal cap');
        arrange('necromancer', { [`necromancer.${item.slug.replace(/-/g, '_')}`]: rank }); mount();
        const panel = detail(`skills-necromancer-${item.slug}`);
        expect(panel).toHaveTextContent(`${item.identity[locale]} ${text.prose(name, cap, item.cost)}`);
        expect(panel.textContent).not.toMatch(/\{\{|descriptionSummonPreparation|skills\./);
        const current = section(panel, text.current), next = section(panel, text.next);
        stat(current, text.cap, String(cap)); stat(current, text.mana, String(item.cost));
        stat(current, text.cooldown, `${String(item.cd)} ${locale === 'en' ? 's' : '秒'}`);
        if (rank === 20) expect(next).toHaveTextContent(text.maxed);
        else { stat(next, text.cap, String(item.next[index])); stat(next, text.mana, String(item.cost)); }
        cleanup();
      }
    });
    it.each(CASES)('$slug renders Mastery20 rank6/7 values and clean deltas for both allocation aliases', item => {
      const text = copy[locale];
      for (const authored of [false, true]) {
        const id = `skills-necromancer-${item.slug}`;
        const alias = authored ? id : `necromancer.${item.slug.replace(/-/g, '_')}`;
        const masteryAlias = authored ? 'skills-necromancer-skeleton-mastery' : 'necromancer.skeleton_mastery';
        arrange('necromancer', { [alias]: 6, [masteryAlias]: 20 }); mount();
        const panel = detail(id);
        for (const [index, label] of [text.life, text.attack, text.defense].entries()) {
          const current = within(section(panel, text.current)).getByText(label, { selector: 'dt' }).nextElementSibling;
          const next = within(section(panel, text.next)).getByText(label, { selector: 'dt' }).nextElementSibling;
          expect(current?.textContent).toBe(item.current[index]);
          expect(next?.textContent).toBe(item.upgraded[index]);
        }
        cleanup();
      }
    });

    it('keeps Mastery1 fractions readable and responds to current allocated Mastery changes', () => {
      const text = copy[locale];
      arrange('necromancer', { 'necromancer.raise_skeleton': 6, 'necromancer.skeleton_mastery': 1 }); mount();
      const panel = detail('skills-necromancer-raise-skeleton');
      for (const [label, current, next] of [
        [text.life, '168.48', '178.88(+10.4)'], [text.attack, '35.7', '37.74(+2.04)'],
        [text.defense, '19.19', '20.2(+1.01)']]) {
        if (!label || !current || !next) throw new Error('Missing Mastery1 literal');
        stat(section(panel, text.current), label, current);
        expect(within(section(panel, text.next)).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent).toBe(next);
      }
      arrange('necromancer', { 'necromancer.raise_skeleton': 6, 'necromancer.skeleton_mastery': 20 });
      stat(section(panel, text.current), text.life, '291.6');
      stat(section(panel, text.current), text.attack, '49');
      stat(section(panel, text.current), text.defense, '22.8');
    });

    it('retains base stats without allocated Mastery and gives unlearned rank1 the current bonus', () => {
      const text = copy[locale];
      for (const item of CASES) {
        const id = `skills-necromancer-${item.slug}`;
        arrange('necromancer', { [id]: 6 }); mount();
        const current = section(detail(id), text.current);
        for (const [index, label] of [text.life, text.attack, text.defense].entries()) {
          expect(within(current).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent).toBe(item.base[index]);
        }
        cleanup();
        arrange('necromancer', { 'necromancer.skeleton_mastery': 20 }); mount();
        const panel = detail(id), preview = section(panel, text.preview);
        expect(section(panel, text.unlearned)).toBeInTheDocument();
        for (const [index, label] of [text.life, text.attack, text.defense].entries()) {
          expect(within(preview).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent).toBe(item.unlearned[index]);
        }
        cleanup();
      }
    });

    it.each(CASES)('$slug accepts an authored rank alias with identical preparation prose', item => {
      const id = `skills-necromancer-${item.slug}`;
      arrange('necromancer', { [id]: 6 }); mount();
      expect(detail(id)).toHaveTextContent(copy[locale].prose(locale === 'en' ? item.en : item.zh,
        item.slug === 'raise-skeleton' ? 2 : 4, item.cost));
    });
  });
}
