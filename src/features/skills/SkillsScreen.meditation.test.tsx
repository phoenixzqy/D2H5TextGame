import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useHydrationStore } from '@/stores/hydrationStore';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import type { SkillDef } from '@/engine/types/skills';
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

const AURA = 'paladin.meditation', AUTHORED = 'skills-paladin-meditation';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { legend: 'Aura for next wave', none: 'None', might: 'Might', meditation: 'Meditation',
    selected: 'Selected: Meditation', cleared: 'Selected: None', unavailable: 'Selected: Meditation — unavailable',
    cls: 'Meditation requires Paladin.', level: 'Meditation requires character level 24.',
    rank: 'Spend a skill point on Meditation first.', current: 'Current', next: 'Next Level',
    unlearned: 'Not Learned', preview: 'Learned at Lv. 1', regen: 'Mana Regeneration', activeTab: 'Active Skills',
    needsSelection: 'These rank bonuses require selecting Meditation.',
    description: 'Selected aura: adds 3% of your normal mana regeneration per second per allocated rank to you and your living fielded mercenary (up to 60% at rank 20). Each recipient retains their own normal recovery. Unlocks at character level 24.' },
  'zh-CN': { legend: '下一波光环', none: '无', might: '力量', meditation: '冥想',
    selected: '已选择：冥想', cleared: '已选择：无', unavailable: '已选择：冥想（当前不可用）',
    cls: '冥想需要圣骑士。', level: '冥想需要角色等级24。', rank: '请先为冥想投入技能点。',
    current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1', regen: '法力恢复', activeTab: '主动技能',
    needsSelection: '以下技能等级加成需要选择冥想光环才会生效。',
    description: '选择此光环后：每投入1点技能点，每秒为自身与存活的上阵佣兵额外恢复相当于角色自身正常法力恢复速度3%的法力（最多20点，合计60%）。各自原有的正常恢复仍然生效。角色24级解锁。' }
} as const;
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing Meditation UI fixture');
  return p;
}
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('MeditationUI', 'paladin');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 24, skillPoints: 2, skills: [],
    skillLevels: { [AURA]: 1, 'paladin.might': 1, 'paladin.prayer': 1, 'paladin.cleansing': 1 }, comboOrder: [], ...patch }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${AUTHORED}`));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string): HTMLElement {
  const element = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!element) throw new Error('Missing Meditation rank section');
  return element;
}
function value(panel: HTMLElement, label: string): HTMLElement {
  const element = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(element instanceof HTMLElement)) throw new Error('Missing Meditation rank value');
  return element;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    rewards: s.runRewards, cursor: s.eventCursor, complete: s.playbackComplete, paused: s.isPaused });
}
beforeEach(async () => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  await i18n.changeLanguage('en');
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`exclusive Meditation UI (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('selects None→Meditation→Might→None exclusively without changing resources or allocations', () => {
      arrange(); mount(); const before = structuredClone(player());
      const group = screen.getByRole('group', { name: copy[locale].legend });
      expect(group.tagName).toBe('FIELDSET');
      const none = within(group).getByRole('radio', { name: copy[locale].none });
      const meditation = within(group).getByRole('radio', { name: copy[locale].meditation });
      const might = within(group).getByRole('radio', { name: copy[locale].might });
      expect(within(group).getAllByRole('radio')).toHaveLength(13);
      expect(none).toBeChecked(); expect(meditation).toBeEnabled(); expect(might).toBeEnabled();
      fireEvent.click(meditation); expect(player()).toEqual({ ...before, selectedAuraId: AURA });
      expect(meditation).toBeChecked(); expect(none).not.toBeChecked(); expect(might).not.toBeChecked();
      expect(within(group).getByRole('status')).toHaveTextContent(copy[locale].selected);
      expect(meditation).toHaveAccessibleDescription(/下一波|next wave/);
      fireEvent.click(might); expect(player()).toEqual({ ...before, selectedAuraId: 'paladin.might' });
      expect(might).toBeChecked(); expect(meditation).not.toBeChecked(); expect(none).not.toBeChecked();
      fireEvent.click(none); expect(player()).toEqual(before); expect(player()).not.toHaveProperty('selectedAuraId');
      expect(none).toBeChecked(); expect(within(group).getByRole('status')).toHaveTextContent(copy[locale].cleared);
    });
    it('does not select from focus, learning or combo editing, and never offers Meditation as an active slot', () => {
      arrange({ skillLevels: { 'paladin.prayer': 1, 'paladin.cleansing': 1, 'paladin.holy_bolt': 1 } }); mount();
      fireEvent.focus(screen.getByTestId(`skill-node-${AUTHORED}`)); expect(player()).not.toHaveProperty('selectedAuraId');
      const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillPoints).toBe(1); expect(player().skillLevels?.[AURA]).toBe(1);
      expect(player()).not.toHaveProperty('selectedAuraId');
      fireEvent.click(screen.getByRole('tab', { name: copy[locale].activeTab }));
      const slots = screen.getAllByRole('combobox'); const slot = slots[0];
      if (!slot) throw new Error('Missing actual combo slot');
      for (const select of slots) {
        for (const option of within(select).getAllByRole('option')) {
          expect([AURA, AUTHORED]).not.toContain(option.getAttribute('value'));
        }
      }
      fireEvent.change(slot, { target: { value: 'skills-paladin-holy-bolt' } });
      expect(player().comboOrder).toEqual(['skills-paladin-holy-bolt']); expect(player()).not.toHaveProperty('selectedAuraId');
    });
    it('renders current3%/next6% with explicit source-baseline denominator, selection and unlock copy', () => {
      arrange(); mount(); const panel = detail();
      expect(value(section(panel, copy[locale].current), copy[locale].regen)).toHaveTextContent(/^3%$/);
      expect(value(section(panel, copy[locale].next), copy[locale].regen)).toHaveTextContent('6%');
      expect(value(section(panel, copy[locale].next), copy[locale].regen)).toHaveTextContent('(+3%)');
      expect(panel).toHaveTextContent(copy[locale].description); expect(panel).toHaveTextContent(copy[locale].needsSelection);
      expect(panel).toHaveTextContent(locale === 'en' ? 'Aura' : '光环');
      expect(panel).not.toHaveTextContent(/5 mana per turn|每回合恢复\s*5|manaMax|最大法力/);
    });
    it('keeps Might eligible while Meditation has its independent level24 gate', () => {
      arrange({ level: 23 }); mount(); const group = screen.getByRole('group', { name: copy[locale].legend });
      expect(within(group).getByRole('radio', { name: copy[locale].might })).toBeEnabled();
      expect(within(group).getByRole('radio', { name: copy[locale].meditation })).toBeDisabled();
      expect(within(group).getByText(copy[locale].level)).toBeVisible();
    });
    it('requires actual allocated rank rather than legacy skills/combo', () => {
      const legacy: SkillDef = { id: AURA, name: 'fixture', description: 'fixture', trigger: 'passive',
        target: 'self', cooldown: 1, cost: {}, minLevel: 24, level: 1, maxLevel: 20 };
      arrange({ skillLevels: {}, skills: [legacy], comboOrder: [AURA] }); mount();
      const group = screen.getByRole('group', { name: copy[locale].legend });
      expect(within(group).getByRole('radio', { name: copy[locale].meditation })).toBeDisabled();
      expect(within(group).getByText(copy[locale].rank)).toBeVisible();
      const panel = detail();
      expect(within(section(panel, copy[locale].unlearned)).queryByText(copy[locale].regen)).toBeNull();
      expect(value(section(panel, copy[locale].preview), copy[locale].regen)).toHaveTextContent(/^3%$/);
    });
  });
}
it.each([
  [{ [AURA]: 19, [AUTHORED]: 1 }, 19], [{ [AUTHORED]: 1, [AURA]: 19 }, 19],
  [{ [AURA]: 100 }, 20], [{ [AURA]: NaN, [AUTHORED]: 2 }, 2], [{ [AURA]: 1.5, [AUTHORED]: -1 }, 0]
])('uses maximum finite allocated alias rank %j', (levels, rank) => {
  arrange({ skillLevels: levels }); mount(); const panel = detail();
  if (rank === 0) expect(within(panel).getByRole('heading', { name: copy.en.unlearned, level: 3 })).toBeVisible();
  else {
    expect(value(section(panel, copy.en.current), copy.en.regen)).toHaveTextContent(new RegExp(`^${String(rank * 3)}%$`));
    if (rank === 20) expect(section(panel, copy.en.next)).toHaveTextContent('Max level reached.');
    else expect(value(section(panel, copy.en.next), copy.en.regen)).toHaveTextContent(`${String((rank + 1) * 3)}%`);
  }
});
it.each([
  [{ class: 'barbarian' as const }, copy.en.cls], [{ level: 23 }, copy.en.level], [{ skillLevels: {} }, copy.en.rank]
])('retains canonical ineligible Meditation selection and lets None physically clear it %j', (patch, reason) => {
  arrange({ selectedAuraId: AURA, ...patch }); mount();
  const group = screen.getByRole('group', { name: copy.en.legend });
  const meditation = within(group).getByRole('radio', { name: copy.en.meditation });
  expect(meditation).toBeChecked(); expect(meditation).toBeDisabled();
  expect(within(group).getByRole('radio', { name: copy.en.none })).not.toBeChecked();
  expect(within(group).getByRole('status')).toHaveTextContent(copy.en.unavailable);
  expect(within(group).getByText(reason)).toBeVisible(); expect(player().selectedAuraId).toBe(AURA);
  fireEvent.click(within(group).getByRole('radio', { name: copy.en.none }));
  expect(player()).not.toHaveProperty('selectedAuraId');
});
it('selects/replaces/clears during a real wave while its complete recording stays frozen', () => {
  arrange(); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  const before = recording(); expect(before.events.length).toBeGreaterThan(0);
  mount(); const group = screen.getByRole('group', { name: copy.en.legend });
  for (const label of [copy.en.meditation, copy.en.might, copy.en.none]) {
    fireEvent.click(within(group).getByRole('radio', { name: label })); expect(recording()).toEqual(before);
  }
});
