import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { __resetPersistenceForTests } from '@/stores/persistence';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { SkillsScreen } from './SkillsScreen';

const AUTHORED = 'skills-necromancer-corpse-explosion', CE = 'necromancer.corpse_explosion';
const TEETH = 'skills-necromancer-teeth', prerequisites = { 'necromancer.teeth': 1 };
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { name: 'Corpse Explosion', current: 'Current', next: 'Next Level', unlearned: 'Not Learned',
    preview: 'Learned at Lv. 1', damage: 'Fire attack', mana: 'Mana Cost', cooldown: 'Cooldown',
    status: 'Applies', ignite: 'Ignite', seconds: '2 s', maxed: 'Max level reached.', slot: 'Slot',
    prose: (min: number, max: number) => `Requires an enemy monster to die in this wave first. Consumes one shared corpse and 20 MP to deal ${String(min)}–${String(max)} Fire damage to all remaining enemies and apply Ignite on hit. The blast ignores Defense; Fire resistance, dodge and damage absorption still apply. Cooldown: 2 s. With no corpse, the combo skips this skill. Corpses clear between waves; consumption leaves normal kill rewards unchanged.` },
  'zh-CN': { name: '尸体爆炸', current: '当前', next: '下一级', unlearned: '未学习',
    preview: '学习后 Lv.1', damage: '火焰攻击', mana: '法力消耗', cooldown: '冷却',
    status: '附加', ignite: '点燃', seconds: '2 秒', maxed: '已达到最高等级。', slot: '槽位',
    prose: (min: number, max: number) => `需先有敌方怪物在本波战斗中死亡。每次消耗1具队伍共享尸体和20点法力，对所有存活敌人造成${String(min)}–${String(max)}点火焰伤害，命中时附加点燃。爆炸无视防御，仍受火焰抗性、闪避和伤害吸收影响。冷却：2 秒。没有尸体时连招跳过此技能。尸体在每波之间清空，消耗尸体不影响原有击杀奖励。` }
} as const;
function player(): Player {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing CE UI fixture player');
  return value;
}
/** Imported level/ranks/points are unearned display scaffolding. Only allocation uses UI controls. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('CE UI', 'necromancer');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 6, skillPoints: 2,
    skills: [], skillLevels: { ...prerequisites, [CE]: 1 }, comboOrder: [], ...patch }); });
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
  if (!value) throw new Error('Missing CE stat section');
  return value;
}
function row(panel: HTMLElement, label: string): HTMLElement {
  const value = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error('Missing CE stat value');
  return value;
}
function stats(panel: HTMLElement, locale: keyof typeof copy, min: number, max: number, next = false): void {
  const text = copy[locale];
  expect(row(panel, text.damage).textContent.trim()).toBe(`${String(min)} ~ ${String(max)}${next ? '(+80 ~ +80)' : ''}`);
  expect(row(panel, text.mana)).toHaveTextContent(/^20$/);
  expect(row(panel, text.cooldown)).toHaveTextContent(text.seconds);
  expect(row(panel, text.status)).toHaveTextContent(text.ignite);
}
let originalLocale: string;
beforeEach(() => {
  originalLocale = i18n.language;
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
});
afterEach(async () => {
  cleanup(); __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('idle');
  await i18n.changeLanguage(originalLocale);
});

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`finite Corpse Explosion detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each([[1, 50, 80], [2, 130, 160], [20, 1570, 1600]])(
      'shows literal rank%i stats and the finite corpse lifecycle', (rank, min, max) => {
        arrange({ skillLevels: { ...prerequisites, [CE]: rank } }); mount();
        const panel = detail(), text = copy[locale];
        expect(within(panel).getByRole('heading', { name: text.name, level: 2 })).toBeVisible();
        stats(section(panel, text.current), locale, min, max);
        if (rank === 20) {
          expect(section(panel, text.next)).toHaveTextContent(text.maxed);
          expect(within(panel).getByRole('button')).toBeDisabled();
        } else stats(section(panel, text.next), locale, min + 80, max + 80, true);
        expect(panel).toHaveTextContent(text.prose(min, max));
        expect(panel.textContent).not.toMatch(/\{\{|skills\.necromancer|damage-types:/);
      });
    it('previews unlearned rank one without allocating, spending resources or setting a combo', () => {
      arrange({ skillLevels: { ...prerequisites } }); const before = structuredClone(player());
      mount(); const panel = detail(), text = copy[locale];
      expect(section(panel, text.unlearned).querySelector('dl')).toBeNull();
      stats(section(panel, text.preview), locale, 50, 80);
      expect(panel).toHaveTextContent(text.prose(50, 80)); expect(player()).toEqual(before);
    });
    it('learns and upgrades through the allocation button, spending only skill points', () => {
      arrange({ skillLevels: { ...prerequisites } }); const resources = structuredClone(player().derivedStats);
      mount(); const panel = detail(), text = copy[locale], button = within(panel).getByRole('button');
      expect(button).toBeEnabled(); fireEvent.click(button);
      expect(player().skillLevels?.[CE]).toBe(1); expect(player().skillPoints).toBe(1);
      stats(section(panel, text.current), locale, 50, 80);
      expect(panel).toHaveTextContent(text.prose(50, 80));
      fireEvent.click(button);
      expect(player().skillLevels?.[CE]).toBe(2); expect(player().skillPoints).toBe(0);
      stats(section(panel, text.current), locale, 130, 160);
      stats(section(panel, text.next), locale, 210, 240, true);
      expect(panel).toHaveTextContent(text.prose(130, 160)); expect(button).toBeDisabled();
      expect(player().derivedStats).toEqual(resources); expect(player().comboOrder).toEqual([]);
    });
    it('allows a learned Corpse Explosion before Teeth through actual combo selectors', () => {
      arrange(); const resources = structuredClone(player().derivedStats); mount();
      fireEvent.click(screen.getByRole('tab', { name: locale === 'en' ? 'Active Skills' : '主动技能' }));
      fireEvent.change(screen.getByRole('combobox', { name: `${copy[locale].slot} 1` }), { target: { value: AUTHORED } });
      fireEvent.change(screen.getByRole('combobox', { name: `${copy[locale].slot} 2` }), { target: { value: TEETH } });
      expect(player().comboOrder).toEqual([AUTHORED, TEETH]);
      expect(player().derivedStats).toEqual(resources); expect(player().skillPoints).toBe(2);
      fireEvent.click(screen.getByRole('tab', { name: locale === 'en' ? 'Skill Tree' : '技能树' }));
      expect(detail()).toHaveTextContent(copy[locale].prose(50, 80));
    });
    it.each([0, 1])('keeps the original native recording and resources during ordinary allocation from rank%i', rank => {
      const comboOrder = rank === 0 ? [TEETH] : [AUTHORED, TEETH];
      arrange({ skillLevels: { ...prerequisites, ...(rank > 0 ? { [CE]: rank } : {}) }, comboOrder });
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      const before = inspectRecordedWaves().currentPublished?.binding;
      if (!before) throw new Error('Missing native recording');
      expect(before.recording.events.length).toBeGreaterThan(0);
      const events = useCombatStore.getState().recordedEvents, resources = structuredClone(player().derivedStats);
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CE]).toBe(rank + 1); expect(player().skillPoints).toBe(1);
      const after = inspectRecordedWaves().currentPublished?.binding;
      expect(after?.engineInput).toBe(before.engineInput); expect(after?.recording).toBe(before.recording);
      expect(after?.publication).toBe(before.publication); expect(useCombatStore.getState().recordedEvents).toBe(events);
      expect(player().derivedStats).toEqual(resources); expect(player().comboOrder).toEqual(comboOrder);
      expect(panel).toHaveTextContent(copy[locale].prose(50 + 80 * rank, 80 + 80 * rank));
    });
  });
}
it('switches the visible lifecycle description between locales without changing the player', async () => {
  await i18n.changeLanguage('en'); arrange(); const before = structuredClone(player()); mount();
  const panel = detail(); expect(panel).toHaveTextContent(copy.en.prose(50, 80));
  await act(async () => { await i18n.changeLanguage('zh-CN'); });
  expect(panel).toHaveTextContent(copy['zh-CN'].prose(50, 80));
  await act(async () => { await i18n.changeLanguage('en'); });
  expect(panel).toHaveTextContent(copy.en.prose(50, 80)); expect(player()).toEqual(before);
});
