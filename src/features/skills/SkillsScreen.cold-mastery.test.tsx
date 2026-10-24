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


const AUTHORED = 'skills-sorceress-cold-mastery';
const CANONICAL = 'sorceress.cold_mastery';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', unlearned: 'Not Learned', preview: 'Learned at Lv. 1',
    cold: 'Cold Resistance Ignored', requirements: 'Requirements', level: 'Character Level',
    maxed: 'Max level reached.', prose: 'Passive: Your direct cold hits ignore 15 percentage points of enemy cold resistance at rank 1, plus 4 per additional rank (91 at rank 20). Unlocks at character level 30. Applies only to you.' },
  'zh-CN': { current: '当前', next: '下一级', unlearned: '未学习', preview: '学习后 Lv.1',
    cold: '无视冰冷抗性', requirements: '需求', level: '角色等级', maxed: '已达到最高等级。',
    prose: '被动：自身直接冰冷伤害在1级时无视敌人15个百分点的冰冷抗性，之后每级增加4个百分点（20级时共91个百分点）。角色30级解锁，仅对自身生效。' }
} as const;
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing Cold UI fixture player');
  return p;
}
/** ImportedL30/ranks/points fixtures are display/boundary checks, not earned progression. */
function arrange(patch: Partial<Player> = {}): void {
  const fresh = createMockPlayer('ColdUI', 'sorceress');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 2,
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
  if (!el) throw new Error('Missing Cold stat section');
  return el;
}
function rowValue(panel: HTMLElement, label: string): HTMLElement {
  const el = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(el instanceof HTMLElement)) throw new Error('Missing Cold stat value');
  return el;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    rewards: s.runRewards, cursor: s.eventCursor, complete: s.playbackComplete, paused: s.isPaused });
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) {
  describe(`Cold Mastery detail (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('shows authored rank1 current/next, level30 and complete truthful passive prose', () => {
      arrange(); mount(); const panel = detail();
      expect(rowValue(section(panel, copy[locale].current), copy[locale].cold)).toHaveTextContent(/^15%$/);
      expect(rowValue(section(panel, copy[locale].next), copy[locale].cold)).toHaveTextContent(/^19%.*\(\+4%\)$/);
      expect(rowValue(section(panel, copy[locale].requirements), copy[locale].level))
        .toHaveTextContent(locale === 'en' ? 'Lv. 30' : '等级 30');
      expect(panel).toHaveTextContent(copy[locale].prose);
      expect(panel).not.toHaveTextContent('+30%');
      expect(panel).not.toHaveTextContent('{{');
    });
    it('does not infer learned rank from legacy skills without allocated points', () => {
      const legacy: SkillDef = { id: CANONICAL, name: 'fixture', description: 'fixture', trigger: 'passive',
        target: 'self', cooldown: 0, cost: {}, minLevel: 12, level: 20, maxLevel: 20 };
      arrange({ skillLevels: {}, skills: [legacy] }); mount(); const panel = detail();
      expect(within(section(panel, copy[locale].unlearned)).queryByText(copy[locale].cold)).toBeNull();
      expect(rowValue(section(panel, copy[locale].preview), copy[locale].cold)).toHaveTextContent(/^15%$/);
    });
    it.each([
      [{ [CANONICAL]: 19, [AUTHORED]: 1 }, 19],
      [{ [AUTHORED]: 1, [CANONICAL]: 19 }, 19],
      [{ [CANONICAL]: 99 }, 20],
      [{ [CANONICAL]: NaN, [AUTHORED]: 2 }, 2],
      [{ [CANONICAL]: 1.5, [AUTHORED]: -1 }, 0]
    ])('uses maximum valid exact alias rank once for%j', (ranks, rank) => {
      arrange({ skillLevels: ranks }); mount(); const panel = detail();
      if (rank === 0) {
        expect(within(panel).getByRole('heading', { name: copy[locale].unlearned, level: 3 })).toBeVisible();
        expect(rowValue(section(panel, copy[locale].preview), copy[locale].cold)).toHaveTextContent(/^15%$/);
      } else {
        expect(rowValue(section(panel, copy[locale].current), copy[locale].cold))
          .toHaveTextContent(new RegExp(`^${String(15 + (rank - 1) * 4)}%$`));
        const next = section(panel, copy[locale].next);
        if (rank === 20) {
          expect(next).toHaveTextContent(copy[locale].maxed);
          expect(within(panel).getByRole('button')).toBeDisabled();
          expect(panel).toHaveTextContent(locale === 'en' ? 'Lv. 20/20' : '等级 20/20');
        } else {
          expect(rowValue(next, copy[locale].cold)).toHaveTextContent(`${String(15 + rank * 4)}%`);
          expect(rowValue(next, copy[locale].cold)).toHaveTextContent('(+4%)');
        }
      }
    });
    it('gates learning below30 and allocates actual authored/canonical points at30', () => {
      arrange({ level: 29, skillLevels: {} }); mount(); let panel = detail();
      expect(within(panel).getByRole('button')).toBeDisabled();
      act(() => { usePlayerStore.getState().setPlayer({ ...player(), level: 30 }); });
      panel = detail(); expect(within(panel).getByRole('button')).toBeEnabled();
      fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(player().skillPoints).toBe(1);
      expect(rowValue(section(panel, copy[locale].current), copy[locale].cold)).toHaveTextContent(/^15%$/);
      fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(2); expect(player().skillPoints).toBe(0);
      expect(rowValue(section(panel, copy[locale].current), copy[locale].cold)).toHaveTextContent(/^19%$/);
    });
    it('learning during a real recorded wave preserves every current recording/resource field', () => {
      arrange({ skillLevels: {} }); useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
      const before = recording(); expect(before.events.length).toBeGreaterThan(0); expect(before.outcome).not.toBeNull();
      mount(); const panel = detail(); fireEvent.click(within(panel).getByRole('button'));
      expect(player().skillLevels?.[CANONICAL]).toBe(1); expect(recording()).toEqual(before);
    });
  });
}
