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


const AUTHORED = 'skills-necromancer-skeleton-mastery';
const CANONICAL = 'necromancer.skeleton_mastery';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    labels: ['Summon Life', 'Summon Attack', 'Summon Defense'], requirements: 'Requirements', level: 'Character Level',
    maxed: 'Max level reached.', prose: 'Passive: Newly created skeleton warriors and mages gain +4% maximum life, +2% Attack and +1% ordinary Defense per allocated skill rank (up to +80%/+40%/+20% at rank 20). Unlocks at character level 1.' },
  'zh-CN': { current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    labels: ['召唤物生命', '召唤物攻击', '召唤物防御'], requirements: '需求', level: '角色等级', maxed: '已达到最高等级。',
    prose: '被动：每投入1点技能点，新召唤的骷髅战士和骷髅法师最大生命+4%、攻击+2%、普通防御+1%（最多20点，合计+80%/+40%/+20%）。角色1级解锁。' }
} as const;
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing Skeleton Mastery UI fixture player');
  return p;
}
/** ImportedL1/ranks/points fixtures are display/boundary checks, not earned progression. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('SkeletonUI', 'necromancer');
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
  const el = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!el) throw new Error('Missing Skeleton Mastery stat section');
  return el;
}
function rowValue(panel: HTMLElement, label: string): HTMLElement {
  const el = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(el instanceof HTMLElement)) throw new Error('Missing Skeleton Mastery stat value');
  return el;
}
function expectStats(panel: HTMLElement, locale: keyof typeof copy, rank: number, next = false): void {
  const totals = [rank * 4, rank * 2, rank];
  const deltas = [4, 2, 1];
  copy[locale].labels.forEach((label, index) => {
    const value = rowValue(panel, label);
    expect(value.textContent.trim()).toBe(`${String(totals[index])}%${next ? `(+${String(deltas[index])}%)` : ''}`);
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
  describe(`Skeleton Mastery detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('shows rank1 current/next, level1 and exact creation-only prose for all three bonuses', () => {
      arrange(); mount(); const panel = detail();
      expectStats(section(panel, copy[locale].current), locale, 1);
      expectStats(section(panel, copy[locale].next), locale, 2, true);
      expect(rowValue(section(panel, copy[locale].requirements), copy[locale].level))
        .toHaveTextContent(locale === 'en' ? 'Lv. 1' : '等级 1');
      expect(panel).toHaveTextContent(copy[locale].prose);
      expect(panel).not.toHaveTextContent('{{');
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
      [{ 'necromancer.skeleton-mastery': 20, 'skills-necromancer-skeleton_mastery': 20 }, 0]
    ])('uses maximum valid exact alias rank once for%j', (ranks, rank) => {
      arrange({ skillLevels: ranks }); mount(); const panel = detail();
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
    it('allocates at the real authored level-one unlock and spends points without a passive combo entry', () => {
      arrange({ skillLevels: {} }); mount(); const panel = detail();
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
      arrange({ level: 24, skillLevels: { 'necromancer.raise_skeleton': 6 }, comboOrder: ['necromancer.raise_skeleton'] }); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      const before = recording(), resources = structuredClone(player().derivedStats);
      expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(recording()).toEqual(before);
      expect(player().derivedStats).toEqual(resources);
    });
  });
}
