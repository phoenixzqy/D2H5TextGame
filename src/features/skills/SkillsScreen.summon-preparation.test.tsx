import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer, type CharacterClass } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { getSkillsForClass } from '@/stores/skillsHelpers';
import { SkillsScreen } from './SkillsScreen';

const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const RAVEN = 'skills-druid-raven';
const copy = {
  en: { current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    cap: 'Summon Cap', mana: 'Mana Cost', cooldown: 'Cooldown', maxed: 'Max level reached.', life: 'Life', attack: 'Attack',
    prose: (name: string, count: number, mana: number) => `${name}: once at each wave start, if learned, unlocked and in your combo, fill missing living summons up to ${String(count)} for one payment of ${String(mana)} MP for the whole batch. Already full: no cost. Not enough mana: no summons or payment, and no retry that wave. This skill uses no ordinary action; fallen summons are not replaced and return no mana. Each new wave starts with fresh summons, paid from your carried mana.`,
    generic: (name: string, count: number) => `${name}: summon up to ${String(count)} allies.` },
  'zh-CN': { current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    cap: '召唤上限', mana: '法力消耗', cooldown: '冷却', maxed: '已达到最高等级。', life: '生命', attack: '攻击',
    prose: (name: string, count: number, mana: number) => `${name}：已学习、已解锁并编入连招时，每波开始仅准备一次，以整批共 ${String(mana)} 点法力补足存活召唤物，最多 ${String(count)} 名。已满员不消耗法力；法力不足则不召唤、不扣费，本波不再重试。此技能不占常规行动，召唤物阵亡不补召、不返还法力。新一波召唤物重新生成，从继承的法力中重新付费。`,
    generic: (name: string, count: number) => `${name}：最多召唤 ${String(count)} 名随从。` }
} as const;
// Literal reviewed membership and ranked MP/caps; imported level/ranks/points are
// display scaffolding, not earned progression or campaign/balance evidence.
const CASES = [
  { cls: 'amazon', slug: 'valkyrie', en: 'Valkyrie', zh: '女武神', base: 25, max: 25, cd: 2, multi: false },
  { cls: 'assassin', slug: 'shadow-warrior', en: 'Shadow Warrior', zh: '影子战士', base: 22, max: 18, cd: 4, multi: false },
  { cls: 'assassin', slug: 'shadow-master', en: 'Shadow Master', zh: '影子大师', base: 35, max: 30, cd: 4, multi: false },
  { cls: 'druid', slug: 'summon-dire-wolf', en: 'Summon Dire Wolf', zh: '召唤恶狼', base: 20, max: 16, cd: 1, multi: true },
  { cls: 'druid', slug: 'raven', en: 'Raven', zh: '乌鸦', base: 6, max: 4, cd: 2, multi: true },
  { cls: 'druid', slug: 'poison-creeper', en: 'Poison Creeper', zh: '猛毒花藤', base: 8, max: 6, cd: 2, multi: false },
  { cls: 'druid', slug: 'summon-spirit-wolf', en: 'Summon Spirit Wolf', zh: '召唤灵狼', base: 14, max: 11, cd: 2, multi: true },
  { cls: 'druid', slug: 'carrion-vine', en: 'Carrion Vine', zh: '食尸藤', base: 14, max: 11, cd: 2, multi: false },
  { cls: 'druid', slug: 'solar-creeper', en: 'Solar Creeper', zh: '日光藤', base: 18, max: 15, cd: 2, multi: false },
  { cls: 'druid', slug: 'summon-grizzly', en: 'Summon Grizzly', zh: '召唤灰熊', base: 35, max: 30, cd: 4, multi: false },
  { cls: 'necromancer', slug: 'blood-golem', en: 'Blood Golem', zh: '血魔像', base: 25, max: 25, cd: 4, multi: false },
  { cls: 'necromancer', slug: 'clay-golem', en: 'Clay Golem', zh: '黏土石魔', base: 15, max: 15, cd: 3, multi: false },
  { cls: 'necromancer', slug: 'fire-golem', en: 'Fire Golem', zh: '火焰石魔', base: 35, max: 35, cd: 4, multi: false }
] as const;
function player(): Player {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing summon UI player');
  return value;
}
function arrange(cls: CharacterClass = 'druid', levels: Record<string, number> = { 'druid.raven': 2 }): void {
  act(() => { usePlayerStore.getState().setPlayer({ ...createMockPlayer('Summon UI', cls),
    level: 30, skillPoints: 2, skills: [], skillLevels: levels, comboOrder: [] }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(id = RAVEN): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${id}`));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string): HTMLElement {
  const value = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!value) throw new Error('Missing summon stat section');
  return value;
}
function row(panel: HTMLElement, label: string): HTMLElement {
  const value = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error('Missing summon stat value');
  return value;
}
function stat(panel: HTMLElement, label: string, value: number): void {
  expect(row(panel, label).childNodes[0]?.textContent).toBe(String(value));
}
function recording() {
  return structuredClone(Object.fromEntries(Object.entries(useCombatStore.getState())
    .filter(([, value]) => typeof value !== 'function')));
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
});
afterEach(() => { cleanup(); abortSubAreaRun(); });
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`D06 paid summon preparation detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(CASES)('$cls.$slug explains paid preparation at ranks 1/2/20 and preserves current/next stats', item => {
      const id = `skills-${item.cls}-${item.slug}`, canonical = `${item.cls}.${item.slug.replace(/-/g, '_')}`;
      const text = copy[locale], name = locale === 'en' ? item.en : item.zh;
      for (const rank of [1, 2, 20]) {
        arrange(item.cls, { [canonical]: rank }); mount(); const panel = detail(id);
        const cap = item.multi ? (rank === 20 ? 8 : rank) : 1, mana = rank === 20 ? item.max : item.base;
        expect(panel).toHaveTextContent(text.prose(name, cap, mana));
        expect(panel.textContent).not.toMatch(/\{\{|descriptionSummonPreparation|skills\./);
        const current = section(panel, text.current);
        stat(current, text.cap, cap); stat(current, text.mana, mana);
        expect(row(current, text.cooldown).childNodes[0]?.textContent).toBe(`${String(item.cd)} ${locale === 'en' ? 's' : '秒'}`);
        const next = section(panel, text.next);
        if (rank === 20) expect(next).toHaveTextContent(text.maxed);
        else { stat(next, text.cap, item.multi ? rank + 1 : 1); stat(next, text.mana, item.base); }
        cleanup();
      }
    });
    it.each(CASES)('$cls.$slug accepts an authored allocation alias without changing the description', item => {
      const id = `skills-${item.cls}-${item.slug}`;
      arrange(item.cls, { [id]: 2 }); mount();
      expect(detail(id)).toHaveTextContent(copy[locale].prose(locale === 'en' ? item.en : item.zh, item.multi ? 2 : 1, item.base));
    });
    it('previews unlearned rank one conditionally without mutation and preserves summon unit stats', () => {
      arrange('druid', {}); const before = structuredClone(player()); mount(); const panel = detail(), text = copy[locale];
      expect(section(panel, text.unlearned).querySelector('dl')).toBeNull();
      expect(panel).toHaveTextContent(text.prose(locale === 'en' ? 'Raven' : '乌鸦', 1, 6));
      const preview = section(panel, text.preview);
      stat(preview, text.cap, 1); stat(preview, text.mana, 6); stat(preview, text.life, 45); stat(preview, text.attack, 18);
      expect(player()).toEqual(before);
    });
    it.each([
      ['iron-golem', 'Iron Golem', '钢铁石魔', 1]
    ] as const)('keeps the excluded %s generic summon description', (slug, en, zh, cap) => {
      arrange('necromancer', { [`necromancer.${slug.replace(/-/g, '_')}`]: 2 }); mount();
      const panel = detail(`skills-necromancer-${slug}`);
      expect(panel).toHaveTextContent(copy[locale].generic(locale === 'en' ? en : zh, cap));
      expect(panel).not.toHaveTextContent(locale === 'en' ? 'once at each wave start' : '每波开始仅准备一次');
    });
    it('keeps a synthetic summon with the same template outside the preparation description', () => {
      const skills = getSkillsForClass('druid'), index = skills.findIndex(skill => skill.id === RAVEN), original = skills[index];
      if (!original) throw new Error('Missing real Raven display source');
      skills[index] = { ...original, id: 'skills-druid-raven-echo' };
      try {
        arrange('druid', { 'druid.raven_echo': 2 }); mount();
        expect(detail('skills-druid-raven-echo')).toHaveTextContent(copy[locale].generic(locale === 'en' ? 'Raven' : '乌鸦', 2));
      } finally { cleanup(); skills[index] = original; }
    });
    it.each([0, 1])('native Raven learning from rank%i preserves the active recording and requires explicit combo selection', rank => {
      arrange('druid', rank ? { 'druid.raven': rank } : {});
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      const before = recording(), events = useCombatStore.getState().recordedEvents;
      expect(events.length).toBeGreaterThan(0);
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels).toEqual({ 'druid.raven': rank + 1 });
      expect(player().skillPoints).toBe(1); expect(player().comboOrder).toEqual([]);
      expect(recording()).toEqual(before); expect(useCombatStore.getState().recordedEvents).toBe(events);
      const tab = document.querySelector<HTMLButtonElement>('button[role="tab"][aria-controls="tabpanel-active"]');
      if (!tab) throw new Error('Missing active skills tab');
      fireEvent.click(tab); const select = document.querySelector('select');
      if (!select) throw new Error('Missing combo select');
      expect(within(select).getByRole('option', { name: locale === 'en' ? 'Raven' : '乌鸦' })).toHaveValue(RAVEN);
      fireEvent.change(select, { target: { value: RAVEN } });
      expect(player().comboOrder).toEqual([RAVEN]);
    });
  });
}
