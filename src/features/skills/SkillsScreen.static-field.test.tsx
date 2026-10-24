import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

const id = 'sorceress.static_field', authored = 'skills-sorceress-static-field';
const stores = [usePlayerStore, useInventoryStore, useCombatStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
const copy = {
  en: { current: 'Current', next: 'Next Level', preview: 'Learned at Lv. 1',
    health: 'Current Health Damage', floor: 'Nightmare Health Floor', mana: 'Mana Cost', cooldown: 'Cooldown' },
  'zh-CN': { current: '当前', next: '下一级', preview: '学习后 Lv.1',
    health: '当前生命伤害', floor: '噩梦生命下限', mana: '法力消耗', cooldown: '冷却' }
} as const;
function section(panel: HTMLElement, title: string): HTMLElement {
  const el = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!el) throw new Error('Missing Static Field section'); return el;
}
function value(panel: HTMLElement, label: string): HTMLElement {
  const el = within(panel).getByText(label, { selector: 'dt' }).nextElementSibling;
  if (!(el instanceof HTMLElement)) throw new Error('Missing Static Field value'); return el;
}
function mount(levels: Record<string, number>): HTMLElement {
  const fresh = createMockPlayer('StaticUI', 'sorceress');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 24, skillPoints: 2,
    skillLevels: levels, comboOrder: [] }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId(`skill-node-${authored}`));
  return screen.getByTestId('skill-detail-panel');
}
beforeEach(() => { for (const store of stores) store.getState().reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  describe(`Static Field details (${locale})`, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it('shows current/next health fraction, floor, real cost/cadence and mitigation/nonlethal prose', () => {
      const panel = mount({ [id]: 1 }), current = section(panel, copy[locale].current);
      for (const area of [current, section(panel, copy[locale].next)]) {
        expect(value(area, copy[locale].health)).toHaveTextContent(/^25%$/);
        expect(value(area, copy[locale].floor)).toHaveTextContent(/^33%$/);
      }
      expect(value(current, copy[locale].mana)).toHaveTextContent(/^10$/);
      expect(value(current, copy[locale].cooldown)).toHaveTextContent(/^2/);
      expect(panel).toHaveTextContent(locale === 'en' ? 'Cannot kill' : '无法击杀');
      expect(panel).toHaveTextContent(locale === 'en' ? 'magic resist' : '魔法抗性');
      expect(panel).not.toHaveTextContent('{{');
      expect(within(panel).queryByText(locale === 'en' ? 'Lightning Damage' : '闪电伤害', { selector: 'dt' })).toBeNull();
    });
    it('does not hide the higher alias rank and clamps it to the actual cap', () => {
      const panel = mount({ [id]: 99, [authored]: 1 }), current = section(panel, copy[locale].current);
      expect(value(current, copy[locale].health)).toHaveTextContent(/^25%$/);
      expect(value(current, copy[locale].mana)).toHaveTextContent(/^8$/);
      expect(value(current, copy[locale].cooldown)).toHaveTextContent(/^1 /);
    });
    it('shows learned preview for invalid allocations without manufacturing a learned rank', () => {
      const panel = mount({ [id]: 1.5, [authored]: -1 });
      expect(value(section(panel, copy[locale].preview), copy[locale].health)).toHaveTextContent(/^25%$/);
    });
  });
}
