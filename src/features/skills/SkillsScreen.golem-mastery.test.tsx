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


const AUTHORED = 'skills-necromancer-golem-mastery';
const CANONICAL = 'necromancer.golem_mastery';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    labels: ['Golem Life', 'Golem Attack Speed'], requirements: 'Requirements', level: 'Character Level',
    maxed: 'Max level reached.', prose: 'Passive: Newly created Clay, Blood, Iron and Fire Golems gain +6% maximum life and +1 flat Attack Speed per allocated skill rank (up to +120% life and +20 Attack Speed at rank 20). Unlocks at character level 12.' },
  'zh-CN': { current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    labels: ['石魔生命', '石魔攻击速度'], requirements: '需求', level: '角色等级', maxed: '已达到最高等级。',
    prose: '被动：每投入1点技能点，新召唤的黏土石魔、血魔像、钢铁石魔和火焰石魔最大生命+6%、攻击速度+1点（最多20点，合计生命+120%、攻击速度+20点）。角色12级解锁。' }
} as const;
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing Golem Mastery UI fixture player');
  return p;
}
/** ImportedL12/ranks/points fixtures are display/boundary checks, not earned progression. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('GolemUI', 'necromancer');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 12, skillPoints: 2,
    skills: [], skillLevels: { 'necromancer.clay_golem': 1, [CANONICAL]: 1 }, comboOrder: [], ...patch }); });
}
function mount(): void {
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SkillsScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
}
function detail(id = AUTHORED): HTMLElement {
  fireEvent.click(screen.getByTestId(`skill-node-${id}`));
  return screen.getByTestId('skill-detail-panel');
}
function section(panel: HTMLElement, title: string): HTMLElement {
  const el = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!el) throw new Error('Missing Golem Mastery stat section');
  return el;
}
function rowValue(panel: HTMLElement, label: string): HTMLElement {
  const el = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(el instanceof HTMLElement)) throw new Error('Missing Golem Mastery stat value');
  return el;
}
function expectStats(panel: HTMLElement, locale: keyof typeof copy, rank: number, next = false): void {
  const totals = [rank * 6, rank];
  const deltas = [6, 1];
  copy[locale].labels.forEach((label, index) => {
    const value = rowValue(panel, label);
    expect(value.textContent.trim()).toBe(`${String(totals[index])}${index === 0 ? '%' : ''}${next ? `(+${String(deltas[index])}${index === 0 ? '%' : ''})` : ''}`);
  });
}
function recording() {
  const state = useCombatStore.getState();
  // Preserve every serializable combat-store field, excluding actions only.
  return structuredClone(Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== 'function')));
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`Golem Mastery detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('shows rank1 current/next, level12 and exact creation-only prose for both bonuses', () => {
      arrange(); mount(); const panel = detail();
      expectStats(section(panel, copy[locale].current), locale, 1);
      expectStats(section(panel, copy[locale].next), locale, 2, true);
      expect(rowValue(section(panel, copy[locale].requirements), copy[locale].level))
        .toHaveTextContent(locale === 'en' ? 'Lv. 12' : '等级 12');
      expect(panel).toHaveTextContent(copy[locale].prose);
      expect(panel).not.toHaveTextContent('{{');
      expect(section(panel, copy[locale].requirements)).toHaveTextContent(locale === 'en' ? 'Clay Golem' : '黏土石魔');
    });
    it('does not infer learned rank from legacy skills without allocated points', () => {
      const legacy: SkillDef = { id: CANONICAL, name: 'fixture', description: 'fixture', trigger: 'passive',
        target: 'self', cooldown: 0, cost: {}, minLevel: 1, level: 20, maxLevel: 20 };
      arrange({ skillLevels: {}, skills: [legacy] }); mount(); const panel = detail();
      for (const label of copy[locale].labels) {
        expect(within(section(panel, copy[locale].unlearned)).queryByText(label)).toBeNull();
      }
      expectStats(section(panel, copy[locale].preview), locale, 1);
    });
    it.each([
      [{ [CANONICAL]: 19, [AUTHORED]: 1 }, 19],
      [{ [AUTHORED]: 1, [CANONICAL]: 19 }, 19],
      [{ [CANONICAL]: 99 }, 20],
      [{ [CANONICAL]: NaN, [AUTHORED]: 2 }, 2],
      [{ [CANONICAL]: 1.5, [AUTHORED]: -1 }, 0],
      [{ 'necromancer.golem-mastery': 20, 'skills-necromancer-golem_mastery': 20 }, 0]
    ])('uses maximum valid exact alias rank once for%j', (ranks, rank) => {
      arrange({ skillLevels: { 'necromancer.clay_golem': 1, ...ranks } }); mount(); const panel = detail();
      if (rank === 0) {
        expect(within(panel).getByRole('heading', { name: copy[locale].unlearned, level: 3 })).toBeVisible();
        expectStats(section(panel, copy[locale].preview), locale, 1);
      } else {
        expectStats(section(panel, copy[locale].current), locale, rank);
        const next = section(panel, copy[locale].next);
        if (rank === 20) {
          expect(next).toHaveTextContent(copy[locale].maxed);
          expect(within(panel).getByRole('button')).toBeDisabled();
          expect(panel).toHaveTextContent(locale === 'en' ? 'Lv. 20/20' : '等级 20/20');
        } else {
          expectStats(next, locale, rank + 1, true);
        }
      }
    });
    it('allocates at the real authored level-twelve unlock and spends points without a passive combo entry', () => {
      arrange({ skillLevels: { 'necromancer.clay_golem': 1 } }); mount(); const panel = detail();
      expect(within(panel).getByRole('button')).toBeEnabled();
      fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(player().skillPoints).toBe(1);
      expectStats(section(panel, copy[locale].current), locale, 1);
      fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(2); expect(player().skillPoints).toBe(0);
      expectStats(section(panel, copy[locale].current), locale, 2);
      expect(within(panel).getByRole('button')).toBeDisabled();
      expect(player().comboOrder).toEqual([]);
    });
    it('learning during a real recorded wave preserves every current recording/resource field', () => {
      arrange({ level: 24, skillLevels: { 'necromancer.clay_golem': 1 }, comboOrder: ['necromancer.clay_golem'] }); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      const before = recording(), resources = structuredClone(player().derivedStats);
      expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(recording()).toEqual(before);
      expect(player().derivedStats).toEqual(resources);
    });
    it.each([
      ['clay-golem', 1, 233.2, 252.28, 56, 24, 34], ['clay-golem', 20, 484, 523.6, 75, 24, 34],
      ['blood-golem', 1, 190.8, 205.64, 71, 34, 24], ['blood-golem', 20, 396, 426.8, 90, 34, 24],
      ['iron-golem', 1, 275.6, 292.56, 61, 36, 48], ['iron-golem', 20, 572, 607.2, 80, 36, 48],
      ['fire-golem', 1, 254.4, 269.24, 66, 42, 36], ['fire-golem', 20, 528, 558.8, 85, 42, 36]
    ] as const)('shows %s current/next base previews with eligible Mastery%s', (slug, rank, life, nextLife, speed, attack, defense) => {
      const canonical = `necromancer.${slug.replaceAll('-', '_')}`;
      arrange({ level: 30, skillLevels: { 'necromancer.clay_golem': 1, [canonical]: 1, [CANONICAL]: rank } });
      mount(); const panel = detail(`skills-necromancer-${slug}`);
      const current = section(panel, copy[locale].current), next = section(panel, copy[locale].next);
      const labels: readonly [string, string, string, string] = locale === 'en'
        ? ['Life', 'Attack', 'Defense', 'Attack Speed'] : ['生命', '攻击', '防御', '攻击速度'];
      labels.forEach((label, index) => {
        expect(rowValue(current, label).childNodes[0]?.textContent).toBe(String([life, attack, defense, speed][index]));
      });
      expect(rowValue(next, labels[0]).childNodes[0]?.textContent).toBe(String(nextLife));
      expect(rowValue(next, labels[3]).textContent).toBe(String(speed));
      expect(player().skillLevels?.[CANONICAL]).toBe(rank);
    });
    it.each([
      { level: 11, skillLevels: { 'necromancer.clay_golem': 1, 'necromancer.blood_golem': 1, [CANONICAL]: 20 } },
      { level: 30, skillLevels: { 'necromancer.blood_golem': 1, [CANONICAL]: 20 } }
    ])('keeps base previews when actual hero eligibility is absent: %j', patch => {
      arrange(patch); mount(); const panel = detail('skills-necromancer-blood-golem');
      const current = section(panel, copy[locale].current);
      expect(rowValue(current, locale === 'en' ? 'Life' : '生命').textContent).toBe('180');
      expect(rowValue(current, locale === 'en' ? 'Attack Speed' : '攻击速度').textContent).toBe('70');
    });
    it('uses current Mastery for unlearned and capped summons without learning or payment', () => {
      arrange({ level: 30, skillLevels: { 'necromancer.clay_golem': 20, [CANONICAL]: 20 } });
      const resources = structuredClone(player().derivedStats); mount();
      const unlearned = detail('skills-necromancer-fire-golem');
      expect(within(unlearned).getByRole('heading', { name: copy[locale].unlearned, level: 3 })).toBeVisible();
      expect(rowValue(section(unlearned, copy[locale].preview), locale === 'en' ? 'Life' : '生命').textContent).toBe('528');
      const capped = detail('skills-necromancer-clay-golem');
      expect(rowValue(section(capped, copy[locale].current), locale === 'en' ? 'Life' : '生命').textContent).toBe('1236.4');
      expect(section(capped, copy[locale].next)).toHaveTextContent(copy[locale].maxed);
      expect(player().derivedStats).toEqual(resources);
      expect(player().skillLevels?.['necromancer.fire_golem']).toBeUndefined();
    });
  });
}
