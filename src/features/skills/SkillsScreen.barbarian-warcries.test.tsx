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
  ['shout', 'shout', 3, 'Defense', '防御'],
  ['battle-orders', 'battle_orders', 4, 'Life', '生命'],
] as const;
beforeEach(() => {
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useFormationStore]) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });
for (const locale of ['en', 'zh-CN'] as const) {
  describe('Barbarian warcries Skills ' + locale, () => {
    beforeEach(async () => { await i18n.changeLanguage(locale); });
    it.each(cases)('shows truthful automatic %s details and native rank-up', (id, canonical, bonus, en, zh) => {
      const fresh = createMockPlayer('Constructed warcries display fixture', 'barbarian');
      act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 1, comboOrder: [],
        skillLevels: { 'barbarian.howl': 1, 'barbarian.shout': 1, ['barbarian.' + canonical]: 1 } }); });
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
      if (id === 'battle-orders') {
        const manaValue = (title: string) => {
          const section = within(panel).getByRole('heading', { name: title, level: 3 }).closest('section');
          if (!section) throw new Error('Missing recovery details');
          return within(section).getByText(locale === 'en' ? 'Mana Regeneration' : '法力恢复', { selector: 'dt' }).nextElementSibling;
        };
        expect(manaValue(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(/^1%$/);
        expect(manaValue(locale === 'en' ? 'Next Level' : '下一级')).toHaveTextContent(/^2%\s*\(\+1%\)$/);
      }
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Automatically' : '自动生效');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'maximum 20 ranks' : '最高20级');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Barbarian only' : '仅野蛮人');
      expect.soft(panel).toHaveTextContent(locale === 'en' ? 'next wave' : '下一波');
      if (id === 'battle-orders') expect.soft(panel).toHaveTextContent(locale === 'en' ? 'Maximum mana is unchanged' : '不增加最大法力');
      expect(panel).not.toHaveTextContent('{{');
      fireEvent.click(within(panel).getByRole('button'));
      expect(usePlayerStore.getState().player?.skillLevels?.['barbarian.' + canonical]).toBe(2);
      expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent(new RegExp('^' + String(bonus * 2) + '%$'));
    });
  });
}
