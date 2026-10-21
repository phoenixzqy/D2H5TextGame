import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useHydrationStore } from '@/stores/hydrationStore';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { AMPLIFY_DAMAGE_DEFINITION } from '@/engine/combat/amplify-damage-definition';
import { createMockPlayer } from '@/features/character/createMockPlayer';
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

const AUTHORED = 'skills-necromancer-amplify-damage';
const CANONICAL = 'necromancer.amplify_damage';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { name: 'Amplify Damage', current: 'Current', next: 'Next Level', unlearned: 'Not Learned',
    preview: 'Learned at Lv. 1', requirements: 'Requirements', level: 'Character Level',
    mana: 'Mana Cost', cooldown: 'Cooldown', status: 'Applies', maxed: 'Max level reached.',
    prose: 'Curses all living enemies, reducing physical resistance by 50 percentage points for 3 s at every skill rank.' },
  'zh-CN': { name: '加强伤害', current: '当前', next: '下一级', unlearned: '未学习',
    preview: '学习后 Lv.1', requirements: '需求', level: '角色等级',
    mana: '法力消耗', cooldown: '冷却', status: '附加', maxed: '已达到最高等级。',
    prose: '诅咒所有存活敌人，使物理抗性降低50个百分点，持续3 秒，各技能等级相同。' }
} as const;
function player(): Player {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing Amplify UI fixture player');
  return value;
}
/** Imported ranks/points are display scaffolding, not earned progression. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('Amplify UI', 'necromancer');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 1, skillPoints: 2,
    skills: [], skillLevels: { [CANONICAL]: 1 }, comboOrder: [], ...patch }); });
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
  if (!value) throw new Error('Missing Amplify stat section');
  return value;
}
function row(panel: HTMLElement, label: string): HTMLElement {
  const value = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error('Missing Amplify stat value');
  return value;
}
function stats(panel: HTMLElement, locale: keyof typeof copy, mana: number, cooldown: string): void {
  const text = copy[locale];
  expect(row(panel, text.mana)).toHaveTextContent(new RegExp(`^${String(mana)}$`));
  expect(row(panel, text.cooldown).childNodes[0]?.textContent).toBe(`${cooldown} ${locale === 'en' ? 's' : '秒'}`);
}
function recording() {
  return structuredClone(Object.fromEntries(Object.entries(useCombatStore.getState())
    .filter(([, value]) => typeof value !== 'function')));
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`BUG070 Amplify Damage detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each([[1, 15, '3', 15, '3'], [2, 15, '3', 15, '2.9'], [20, 11, '2', 0, ''] ] as const)(
      'shows fixed resistance points/duration and preserves rounded MP/CD at rank%i', (rank, mana, cd, nextMana, nextCd) => {
        arrange({ skillLevels: { [CANONICAL]: rank } });
        mount(); const panel = detail(), text = copy[locale];
        stats(section(panel, text.current), locale, mana, cd);
        const next = section(panel, text.next);
        if (rank === 20) {
          expect(next).toHaveTextContent(text.maxed);
          expect(within(panel).getByRole('button')).toBeDisabled();
        } else stats(next, locale, nextMana, nextCd);
        expect(row(section(panel, text.requirements), text.level))
          .toHaveTextContent(locale === 'en' ? 'Lv. 1' : '等级 1');
        expect(panel).toHaveTextContent(text.prose);
        expect(panel.textContent).not.toMatch(/\{\{|skills\.necromancer|damage-types:|several turns|数回合/);
      });
    it('previews unlearned rank one with no prerequisite and no player mutation', () => {
      arrange({ skillLevels: {} }); const before = structuredClone(player());
      mount(); const panel = detail(), text = copy[locale];
      expect(section(panel, text.unlearned).querySelector('dl')).toBeNull();
      stats(section(panel, text.preview), locale, 15, '3');
      expect(within(panel).getByRole('button')).toBeEnabled();
      expect(player()).toEqual(before);
      expect(panel).toHaveTextContent(text.prose);
    });
    it.each([AUTHORED, CANONICAL])('localizes the canonical curse row with allocation identity %s', (id) => {
      arrange({ skillLevels: { [id]: 2 } }); mount(); const panel = detail(), text = copy[locale];
      stats(section(panel, text.current), locale, 15, '3');
      expect(row(section(panel, text.current), text.status)).toHaveTextContent(text.name);
      expect(row(section(panel, text.next), text.status)).toHaveTextContent(text.name);
    });
    it('maps legacy curse identity but leaves tag-only and unrelated labels unchanged', () => {
      const skills = getSkillsForClass('necromancer');
      const index = skills.findIndex(skill => skill.id === AUTHORED);
      const original = skills[index];
      if (!original) throw new Error('Missing authored Amplify source');
      // In-memory display fixture only, restored even on failure; no JSON/runtime edits.
      skills[index] = { ...original, appliesStatus: ['amplify', 'amp-damage', 'poison'] };
      try {
        arrange(); mount(); const text = copy[locale];
        expect(row(section(detail(), text.current), text.status).textContent)
          .toBe(`${text.name}, ${locale === 'en' ? 'Amplify Damage' : '增幅伤害'}, ${locale === 'en' ? 'Poisoned' : '中毒'}`);
      } finally { skills[index] = original; }
    });
    it('offers the learned curse for native combo selection without adding it automatically', () => {
      arrange({ skillLevels: {} }); mount();
      fireEvent.click(within(detail()).getByRole('button'));
      const tab = document.querySelector<HTMLButtonElement>('button[role="tab"][aria-controls="tabpanel-active"]');
      if (!tab) throw new Error('Missing active skills tab');
      fireEvent.click(tab);
      const select = document.querySelector('select');
      if (!select) throw new Error('Missing combo select');
      expect(within(select).getByRole('option', { name: copy[locale].name })).toHaveValue(AUTHORED);
      expect(player().comboOrder).toEqual([]);
    });
    it('allocates zero to one to two changing only points/ranks without implicit combo inclusion', () => {
      arrange({ skillLevels: {} }); const before = structuredClone(player());
      mount(); const panel = detail(), button = within(panel).getByRole('button');
      fireEvent.click(button);
      expect(player()).toEqual({ ...before, skillPoints: 1, skillLevels: { [CANONICAL]: 1 } });
      fireEvent.click(button);
      expect(player()).toEqual({ ...before, skillPoints: 0, skillLevels: { [CANONICAL]: 2 } });
      stats(section(panel, copy[locale].current), locale, 15, '3');
      stats(section(panel, copy[locale].next), locale, 15, '2.9');
      expect(button).toBeDisabled();
    });
    it('refuses allocation with no skill points without changing player', () => {
      arrange({ skillPoints: 0, skillLevels: {} }); const before = structuredClone(player());
      mount(); const button = within(detail()).getByRole('button');
      expect(button).toBeDisabled(); fireEvent.click(button); expect(player()).toEqual(before);
    });
    it.each([0, 1])('keeps real current recording and event identity frozen while allocating from rank%i', rank => {
      const comboOrder = rank === 0 ? ['skills-necromancer-teeth'] : [AUTHORED];
      arrange({ skillLevels: { 'necromancer.teeth': 1, ...(rank ? { [CANONICAL]: rank } : {}) }, comboOrder });
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
      const before = recording(), events = useCombatStore.getState().recordedEvents;
      const beforePlayer = structuredClone(player());
      mount(); fireEvent.click(within(detail()).getByRole('button'));
      expect(player()).toEqual({ ...beforePlayer, skillPoints: 1,
        skillLevels: { ...beforePlayer.skillLevels, [CANONICAL]: rank + 1 } });
      expect(recording()).toEqual(before); expect(useCombatStore.getState().recordedEvents).toBe(events);
    });
    it('keeps immutable authored potency/duration despite replacing the registered debuff payload', () => {
      const original = getSkill(CANONICAL);
      if (!original) throw new Error('Missing registered Amplify fixture');
      const debuff = original.effects.find(effect => effect.kind === 'debuff');
      if (!debuff) throw new Error('Missing Amplify debuff fixture');
      registerSkill({ ...original, effects: original.effects.map(effect => effect === debuff
        ? { ...debuff, durationMs: 1, physicalResistReductionPct: 1 } : effect) });
      const replaced = getSkill(CANONICAL)?.effects.find(effect => effect.kind === 'debuff');
      expect(replaced).toMatchObject({ durationMs: 1, physicalResistReductionPct: 1 });
      expect(AMPLIFY_DAMAGE_DEFINITION).toEqual({ canonicalStatusId: 'amplify-damage',
        legacyStatusId: 'amplify', physicalResistReductionPct: 50, durationMs: 3000 });
      arrange(); mount(); expect(detail()).toHaveTextContent(copy[locale].prose);
    });
  });
}
