import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useHydrationStore } from '@/stores/hydrationStore';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { SkillDef } from '@/engine/types/skills';
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
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { SkillsScreen } from './SkillsScreen';

const AURA = 'paladin.might';
const AUTHORED = 'skills-paladin-might';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { legend: 'Aura for next wave', none: 'None', might: 'Might', selected: 'Selected: Might',
    cleared: 'Selected: None', unavailable: 'Selected: Might — unavailable',
    rank: 'Spend a skill point on Might first.', cls: 'Requires Paladin.', level: 'Requires character level 1.',
    current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    physical: 'Physical Damage', attack: 'Attack', activeTab: 'Active Skills' },
  'zh-CN': { legend: '下一波光环', none: '无', might: '力量', selected: '已选择：力量',
    cleared: '已选择：无', unavailable: '已选择：力量（当前不可用）',
    rank: '请先为力量投入技能点。', cls: '需要圣骑士。', level: '需要角色等级1。',
    current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    physical: '物理伤害', attack: '攻击', activeTab: '主动技能' }
} as const;

function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing UI fixture player');
  return p;
}
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('MightUI', 'paladin');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 2,
    skills: [], skillLevels: { [AURA]: 1 }, comboOrder: [], ...patch }); });
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
  const el = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!el) throw new Error('Missing skill stat section');
  return el;
}
function rowValue(panel: HTMLElement, label: string): HTMLElement {
  const el = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(el instanceof HTMLElement)) throw new Error('Missing skill stat value');
  return el;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    rewards: s.runRewards, cursor: s.eventCursor, complete: s.playbackComplete, paused: s.isPaused });
}
beforeEach(async () => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
  await i18n.changeLanguage('en');
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`selected Might UI (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('defaults to None and explicitly selects/clears without changing other player data', () => {
      arrange(); mount();
      const before = structuredClone(player());
      const group = screen.getByRole('group', { name: copy[locale].legend });
      expect(group.tagName).toBe('FIELDSET');
      const none = within(group).getByRole('radio', { name: copy[locale].none });
      const might = within(group).getByRole('radio', { name: copy[locale].might });
      expect(none).toBeChecked(); expect(might).not.toBeChecked(); expect(might).toBeEnabled();
      fireEvent.click(might);
      expect(player()).toEqual({ ...before, selectedAuraId: AURA });
      expect(might).toBeChecked(); expect(within(group).getByRole('status')).toHaveTextContent(copy[locale].selected);
      fireEvent.click(none);
      expect(player()).toEqual(before); expect(player()).not.toHaveProperty('selectedAuraId');
      expect(none).toBeChecked(); expect(within(group).getByRole('status')).toHaveTextContent(copy[locale].cleared);
      expect(might).toHaveAccessibleDescription(/下一波|next wave/);
      fireEvent.focus(might); expect(player()).toEqual(before);
    });
    it('does not select by detail focus, allocating a point or editing a combo', () => {
      arrange({ skillLevels: { 'paladin.holy_bolt': 1 } }); mount();
      const node = screen.getByTestId(`skill-node-${AUTHORED}`);
      fireEvent.focus(node); expect(player()).not.toHaveProperty('selectedAuraId');
      const panel = detail();
      fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillPoints).toBe(1);
      expect(player().skillLevels?.[AURA]).toBe(1);
      expect(player()).not.toHaveProperty('selectedAuraId');
      fireEvent.click(screen.getByRole('tab', { name: copy[locale].activeTab }));
      const firstSlot = screen.getAllByRole('combobox')[0];
      if (!firstSlot) throw new Error('Missing actual combo slot');
      fireEvent.change(firstSlot, { target: { value: 'skills-paladin-holy-bolt' } });
      expect(player().comboOrder).toEqual(['skills-paladin-holy-bolt']);
      expect(player()).not.toHaveProperty('selectedAuraId');
    });
    it('shows unlearned preview without inventing rank from legacy skills', () => {
      const legacy: SkillDef = { id: AURA, name: 'fixture', description: 'fixture', trigger: 'passive',
        target: 'self', cooldown: 1, cost: {}, minLevel: 1, level: 1, maxLevel: 20 };
      arrange({ skillLevels: {}, skills: [legacy] }); mount();
      const group = screen.getByRole('group', { name: copy[locale].legend });
      expect(within(group).getByRole('radio', { name: copy[locale].might })).toBeDisabled();
      expect(within(group).getByText(copy[locale].rank)).toBeVisible();
      const panel = detail();
      expect(within(section(panel, copy[locale].unlearned)).queryByText(copy[locale].physical)).toBeNull();
      const preview = section(panel, copy[locale].preview);
      expect(rowValue(preview, copy[locale].physical)).toHaveTextContent(/^3%$/);
      expect(rowValue(preview, copy[locale].attack)).toHaveTextContent(/^1%$/);
    });
    it('shows rank1 current and next separate physical/Attack rows and exact aura prose', () => {
      arrange(); mount(); const panel = detail();
      const current = section(panel, copy[locale].current), next = section(panel, copy[locale].next);
      expect(rowValue(current, copy[locale].physical)).toHaveTextContent(/^3%$/);
      expect(rowValue(current, copy[locale].attack)).toHaveTextContent(/^1%$/);
      expect(rowValue(next, copy[locale].physical)).toHaveTextContent('6%');
      expect(rowValue(next, copy[locale].physical)).toHaveTextContent('(+3%)');
      expect(rowValue(next, copy[locale].attack)).toHaveTextContent('2%');
      expect(rowValue(next, copy[locale].attack)).toHaveTextContent('(+1%)');
      expect(panel).toHaveTextContent(locale === 'en' ? 'These rank bonuses require selecting Might.' : '以下技能等级加成需要选择力量光环才会生效。');
      expect(panel).toHaveTextContent(locale === 'en' ? 'up to +60% and +20% at rank 20' : '20级时分别提高60%和20%');
      expect(panel).toHaveTextContent(locale === 'en' ? 'Aura' : '光环');
      expect(panel).not.toHaveTextContent('50%');
    });
  });
}

it.each([
  [{ [AURA]: 19, [AUTHORED]: 1 }, 19],
  [{ [AUTHORED]: 1, [AURA]: 19 }, 19],
  [{ [AURA]: 100 }, 20],
  [{ [AURA]: NaN, [AUTHORED]: 2 }, 2],
  [{ [AURA]: 1.5, [AUTHORED]: -1 }, 0]
])('uses the authoritative maximum valid alias rank for %j', (levels, rank) => {
  arrange({ skillLevels: levels }); mount(); const panel = detail();
  if (rank === 0) {
    expect(within(panel).getByRole('heading', { name: copy.en.unlearned, level: 3 })).toBeVisible();
  } else {
    const current = section(panel, copy.en.current);
    expect(rowValue(current, copy.en.physical)).toHaveTextContent(new RegExp(`^${String(rank * 3)}%$`));
    expect(rowValue(current, copy.en.attack)).toHaveTextContent(new RegExp(`^${String(rank)}%$`));
    const next = section(panel, copy.en.next);
    if (rank === 20) expect(next).toHaveTextContent('Max level reached.');
    else {
      expect(rowValue(next, copy.en.physical)).toHaveTextContent(`${String((rank + 1) * 3)}%`);
      expect(rowValue(next, copy.en.attack)).toHaveTextContent(`${String(rank + 1)}%`);
    }
  }
});

it.each([
  [{ class: 'barbarian' as const }, copy.en.cls],
  [{ level: 0 }, copy.en.level],
  [{ skillLevels: {} }, copy.en.rank]
])('retains unavailable canonical saved selection and allows explicit clearing: %j', (patch, reason) => {
  arrange({ selectedAuraId: AURA, ...patch }); mount();
  const group = screen.getByRole('group', { name: copy.en.legend });
  const might = within(group).getByRole('radio', { name: copy.en.might });
  expect(might).toBeChecked(); expect(might).toBeDisabled();
  expect(within(group).getByRole('status')).toHaveTextContent(copy.en.unavailable);
  expect(within(group).getByText(reason)).toBeVisible();
  expect(player().selectedAuraId).toBe(AURA);
  fireEvent.click(within(group).getByRole('radio', { name: copy.en.none }));
  expect(player()).not.toHaveProperty('selectedAuraId');
});
it('hides the selector for a different class without a retained selection', () => {
  arrange({ class: 'barbarian' }); mount();
  expect(screen.queryByRole('group', { name: copy.en.legend })).toBeNull();
});
it('selecting and clearing during a real recorded wave leaves its complete recording unchanged', () => {
  arrange(); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
  const before = recording(); expect(before.events.length).toBeGreaterThan(0); expect(before.outcome).not.toBeNull();
  mount(); const group = screen.getByRole('group', { name: copy.en.legend });
  fireEvent.click(within(group).getByRole('radio', { name: copy.en.might }));
  expect(player().selectedAuraId).toBe(AURA); expect(recording()).toEqual(before);
  fireEvent.click(within(group).getByRole('radio', { name: copy.en.none }));
  expect(player()).not.toHaveProperty('selectedAuraId'); expect(recording()).toEqual(before);
});
