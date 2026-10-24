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
  ['increased-stamina', 'increased_stamina', 3, 'Life', '生命'],
  ['increased-speed', 'increased_speed', 1, 'Attack Speed', '攻击速度'],
  ['natural-resistance', 'natural_resistance', 2, 'All Resist', '全抗'],
] as const;
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  describe('Barbarian endurance Skills ' + locale, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(cases)('shows truthful automatic %s details and native rank-up', (id, canonical, bonus, en, zh) => {
      const fresh = createMockPlayer('Constructed endurance display fixture', 'barbarian');
      act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 1, comboOrder: [],
        skillLevels: { 'barbarian.iron_skin': 1, 'barbarian.increased_stamina': 1, ['barbarian.' + canonical]: 1 } }); });
      render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
      </Suspense></I18nextProvider>);
      fireEvent.click(screen.getByTestId('skill-node-skills-barbarian-' + id));
      const panel = screen.getByTestId('skill-detail-panel');
      const value = (title: string) => {
        const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
        if (!section) throw new Error('Missing rank details');
        return within(section).getByText(locale === 'en' ? en : zh, { selector: 'dt' }).nextElementSibling;
      };
      expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(new RegExp('^' + String(bonus) + '%$'));
      expect(value(locale === 'en' ? 'Next Level' : '下一级')).toHaveTextContent(
        new RegExp('^' + String(bonus * 2) + '%\\s*\\(\\+' + String(bonus) + '%\\)$'));
      if (id !== 'increased-stamina') {
        const dodge = locale === 'en' ? (id === 'increased-speed' ? 'Physical Dodge' : 'Magical Dodge')
          : (id === 'increased-speed' ? '物理闪避' : '魔法闪避');
        const stat = (title: string) => {
          const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
          if (!section) throw new Error('Missing dodge rank details');
          return within(section).getByText(dodge, { selector: 'dt' }).nextElementSibling;
        };
        expect.soft(stat(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(/^0\.5%$/);
        expect.soft(stat(locale === 'en' ? 'Next Level' : '下一级')).toHaveTextContent(/^1%\s*\(\+0\.5%\)$/);
      }
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Automatically' : '自动生效');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Barbarian only' : '仅野蛮人');
      expect(panel).not.toHaveTextContent('{{');
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['barbarian.' + canonical]).toBe(2);
      expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(new RegExp('^' + String(bonus * 2) + '%$'));
    });
  });
}
