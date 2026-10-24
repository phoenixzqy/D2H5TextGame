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

beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  describe('weapon-mastery details ' + locale, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(['sword', 'axe', 'mace'])('explains and upgrades %s with fractional current/next stats while unarmed', key => {
      const fresh = createMockPlayer('Weapon mastery display fixture', 'barbarian');
      act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 1, skillPoints: 1, comboOrder: [],
        skillLevels: { ['barbarian.' + key + '_mastery']: 1 } }); });
      render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
      </Suspense></I18nextProvider>);
      fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-' + key + '-mastery'));
      const panel = screen.getByTestId('skill-detail-panel');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Automatically' : '自动生效');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'weapon slot' : '武器栏');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
      expect.soft(panel).not.toHaveTextContent(locale === 'en' ? 'attack rating' : '命中率');
      const value = (title: string, en: string, zh: string) => {
        const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
        if (!section) throw new Error('Missing rank detail');
        return within(section).getByText(locale === 'en' ? en : zh, { selector: 'dt' }).nextElementSibling;
      };
      expect(value(locale === 'en' ? 'Current' : '当前', 'Physical Damage', '物理伤害')).toHaveTextContent(/^3%$/);
      expect(value(locale === 'en' ? 'Current' : '当前', 'Critical Chance', '暴击率')).toHaveTextContent(/^0\.5%$/);
      expect(value(locale === 'en' ? 'Next Level' : '下一级', 'Critical Chance', '暴击率')).toHaveTextContent(/^1%\s*\(\+0\.5%\)$/);
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['barbarian.' + key + '_mastery']).toBe(2);
      expect(value(locale === 'en' ? 'Current' : '当前', 'Physical Damage', '物理伤害')).toHaveTextContent(/^6%$/);
      expect(panel).not.toHaveTextContent('{{');
    });
  });
}
