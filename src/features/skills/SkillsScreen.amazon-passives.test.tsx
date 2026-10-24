import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useFormationStore } from '@/stores/formationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

const cases = [
  ['critical-strike', 'critical_strike', 1, 'Critical Chance', '暴击率'],
  ['penetrate', 'penetrate', 3, 'Attack', '攻击'],
  ['dodge', 'dodge', 1, 'Physical Dodge', '物理闪避'],
  ['avoid', 'avoid', 1, 'Magical Dodge', '魔法闪避'],
  ['evade', 'evade', 0.5, 'Physical Dodge', '物理闪避'],
  ['pierce', 'pierce', 2, 'Physical Damage', '物理伤害'],
] as const;
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useFormationStore];
beforeEach(() => {
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });
function section(panel: HTMLElement, title: string) {
  const el = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
  if (!el) throw new Error('Missing passive display section');
  return el;
}
for (const locale of ['en', 'zh-CN'] as const) {
  describe('Amazon passive detail ' + locale, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(cases)('shows %s rank1/next, truthful automatic prose and native rank-up', (authored, canonical, bonus, en, zh) => {
      const fresh = createMockPlayer('Constructed Amazon display fixture', 'amazon');
      act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 1,
        comboOrder: [], skillLevels: { 'amazon.critical_strike': 1, 'amazon.dodge': 1,
          'amazon.avoid': 1, 'amazon.penetrate': 1, ['amazon.' + canonical]: 1 } }); });
      render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkillsScreen />
        </MemoryRouter>
      </Suspense></I18nextProvider>);
      fireEvent.click(screen.getByTestId('skill-node-skills-amazon-' + authored));
      const panel = screen.getByTestId('skill-detail-panel');
      const label = locale === 'en' ? en : zh;
      const value = (title: string) => within(section(panel, title)).getByText(label, { selector: 'dt' }).nextElementSibling;
      expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(new RegExp('^' + String(bonus) + '%$'));
      expect(value(locale === 'en' ? 'Next Level' : '下一级')).toHaveTextContent(String(bonus * 2) + '%');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Automatically' : '自动生效');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
      expect.soft(panel).toHaveTextContent((authored === 'penetrate' || authored === 'pierce')
        ? (locale === 'en' ? 'equipment-derived Attack' : '装备结算后的攻击力')
        : (locale === 'en' ? 'percentage point' : '个百分点'));
      expect(panel).not.toHaveTextContent('{{');
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['amazon.' + canonical]).toBe(2);
      expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
      expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(new RegExp('^' + String(bonus * 2) + '%$'));
    });
  });
}
