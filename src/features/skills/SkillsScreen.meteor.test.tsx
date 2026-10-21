import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { METEOR_ARMOR_MELT_DEFINITION } from '@/engine/skills/armor-melt';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

const AUTHORED = 'skills-sorceress-meteor';
const CANONICAL = 'sorceress.meteor';
const prerequisites = { 'sorceress.fire_ball': 1, 'sorceress.fire_wall': 1 };
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { name: 'Meteor', current: 'Current', next: 'Next Level', unlearned: 'Not Learned',
    preview: 'Learned at Lv. 1', requirements: 'Requirements', level: 'Character Level',
    damage: 'Fire attack', mana: 'Mana Cost', cooldown: 'Cooldown', status: 'Applies',
    effects: 'Burn, Armor Melt', seconds: '4 s', maxed: 'Max level reached.',
    prose: (min: number, max: number) => `A meteor deals ${String(min)}–${String(max)} Fire damage over an area. On a successful hit, applies Burn then Armor Melt. Armor Melt reduces ordinary Defense by 30% for 3 s at every skill rank.` },
  'zh-CN': { name: '流星术', current: '当前', next: '下一级', unlearned: '未学习',
    preview: '学习后 Lv.1', requirements: '需求', level: '角色等级',
    damage: '火焰攻击', mana: '法力消耗', cooldown: '冷却', status: '附加',
    effects: '燃烧, 护甲熔毁', seconds: '4 秒', maxed: '已达到最高等级。',
    prose: (min: number, max: number) => `召唤陨石，造成${String(min)}–${String(max)}点范围火焰伤害。命中后依次施加燃烧与护甲熔毁；护甲熔毁使普通防御降低30%，持续3 秒，各技能等级相同。` }
} as const;
function player(): Player {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing Meteor UI fixture player');
  return value;
}
/** Imported L24/prerequisites/ranks/points are display scaffolding, not earned progression. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('Meteor UI', 'sorceress');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 24, skillPoints: 2,
    skills: [], skillLevels: { ...prerequisites, [CANONICAL]: 1 }, comboOrder: [], ...patch }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkillsScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${AUTHORED}`));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string): HTMLElement {
  const value = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!value) throw new Error('Missing Meteor stat section');
  return value;
}
function row(panel: HTMLElement, label: string): HTMLElement {
  const value = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error('Missing Meteor stat value');
  return value;
}
function stats(panel: HTMLElement, locale: keyof typeof copy, min: number, max: number, next = false): void {
  const text = copy[locale];
  expect(row(panel, text.damage).textContent.trim()).toBe(`${String(min)} ~ ${String(max)}${next ? '(+10 ~ +10)' : ''}`);
  expect(row(panel, text.mana)).toHaveTextContent(/^50$/);
  expect(row(panel, text.cooldown)).toHaveTextContent(text.seconds);
  expect(row(panel, text.status)).toHaveTextContent(text.effects);
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
  describe(`BUG069 Meteor detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each([[1, 100, 150], [2, 110, 160], [20, 290, 340]])(
      'shows literal damage and fixed ordinary-Defense Melt potency/duration at rank%i', (rank, min, max) => {
        arrange({ skillLevels: { ...prerequisites, [CANONICAL]: rank } });
        mount(); const panel = detail(), text = copy[locale];
        expect(within(panel).getByRole('heading', { name: text.name, level: 2 })).toBeVisible();
        stats(section(panel, text.current), locale, min, max);
        const next = section(panel, text.next);
        if (rank === 20) {
          expect(next).toHaveTextContent(text.maxed);
          expect(within(panel).getByRole('button')).toBeDisabled();
        } else stats(next, locale, min + 10, max + 10, true);
        expect(row(section(panel, text.requirements), text.level))
          .toHaveTextContent(locale === 'en' ? 'Lv. 24' : '等级 24');
        expect(panel).toHaveTextContent(text.prose(min, max));
        expect(panel.textContent).not.toMatch(/\{\{|skills\.sorceress|damage-types:/);
      });
    it('previews unlearned rank one without publishing a learned rank or combo', () => {
      arrange({ skillLevels: { ...prerequisites } }); const before = structuredClone(player());
      mount(); const panel = detail(), text = copy[locale];
      expect(section(panel, text.unlearned).querySelector('dl')).toBeNull();
      stats(section(panel, text.preview), locale, 100, 150);
      expect(player()).toEqual(before);
      expect(panel).toHaveTextContent(text.prose(100, 150));
    });
    it('allocates one then two without changing resources or adding a combo entry', () => {
      arrange({ skillLevels: { ...prerequisites } }); const resources = structuredClone(player().derivedStats);
      mount(); const panel = detail(), text = copy[locale], button = within(panel).getByRole('button');
      expect(button).toBeEnabled(); fireEvent.click(button);
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(player().skillPoints).toBe(1);
      stats(section(panel, text.current), locale, 100, 150);
      stats(section(panel, text.next), locale, 110, 160, true);
      expect(player().derivedStats).toEqual(resources); expect(player().comboOrder).toEqual([]);
      fireEvent.click(button);
      expect(player().skillLevels?.[CANONICAL]).toBe(2); expect(player().skillPoints).toBe(0);
      stats(section(panel, text.current), locale, 110, 160);
      stats(section(panel, text.next), locale, 120, 170, true);
      expect(player().derivedStats).toEqual(resources); expect(player().comboOrder).toEqual([]);
      expect(button).toBeDisabled();
    });
    it('refuses allocation below the authored character-level 24 gate', () => {
      arrange({ level: 23, skillLevels: { ...prerequisites } }); const before = structuredClone(player());
      mount(); const panel = detail(); expect(within(panel).getByRole('button')).toBeDisabled();
      fireEvent.click(within(panel).getByRole('button')); expect(player()).toEqual(before);
      expect(row(section(panel, copy[locale].requirements), copy[locale].level))
        .toHaveTextContent(locale === 'en' ? 'Lv. 24' : '等级 24');
    });
    it('refuses allocation with the Fire Wall prerequisite missing', () => {
      arrange({ skillLevels: { 'sorceress.fire_ball': 1 } }); const before = structuredClone(player());
      mount(); const panel = detail(); expect(within(panel).getByRole('button')).toBeDisabled();
      fireEvent.click(within(panel).getByRole('button')); expect(player()).toEqual(before);
      expect(section(panel, copy[locale].requirements)).toHaveTextContent(locale === 'en' ? 'Fire Wall' : '火墙');
    });
    it.each([0, 1])('keeps a real current recording frozen while allocating from rank%i', (rank) => {
      const comboOrder = rank === 0 ? ['skills-sorceress-fire-ball'] : [AUTHORED];
      arrange({ skillLevels: { ...prerequisites, 'sorceress.fire_bolt': 1,
        ...(rank > 0 ? { [CANONICAL]: rank } : {}) }, comboOrder });
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
      const before = recording(), events = useCombatStore.getState().recordedEvents;
      const resources = structuredClone(player().derivedStats);
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(rank + 1); expect(player().skillPoints).toBe(1);
      expect(recording()).toEqual(before); expect(useCombatStore.getState().recordedEvents).toBe(events);
      expect(player().derivedStats).toEqual(resources); expect(player().comboOrder).toEqual(comboOrder);
    });
    it('keeps authored immutable Melt values independent of a replaced registry payload', () => {
      const original = getSkill(CANONICAL);
      if (!original) throw new Error('Missing registered Meteor fixture');
      const damage = original.effects.find(effect => effect.kind === 'damage');
      if (!damage?.applyStatuses) throw new Error('Missing ordered Meteor statuses');
      const [primary, ...additional] = damage.applyStatuses;
      expect(additional.some(status => status.id === 'armor-melt')).toBe(true);
      registerSkill({ ...original, effects: original.effects.map(effect => effect === damage
        ? { ...damage, applyStatuses: [primary, ...additional.map(status => status.id === 'armor-melt'
          ? { ...status, durationMs: 1 } : status)] as const } : effect) });
      const replaced = getSkill(CANONICAL)?.effects.find(effect => effect.kind === 'damage');
      expect(replaced?.applyStatuses?.find(status => status.id === 'armor-melt')?.durationMs).toBe(1);
      expect(METEOR_ARMOR_MELT_DEFINITION).toEqual({ statusId: 'armor-melt', defenseReductionPct: 30, durationMs: 3000 });
      arrange(); mount(); const panel = detail();
      expect(panel).toHaveTextContent(copy[locale].prose(100, 150));
    });
  });
}
