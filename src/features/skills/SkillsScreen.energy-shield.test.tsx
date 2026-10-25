import { afterEach, beforeEach, expect, it } from 'vitest';
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
import { useHydrationStore } from '@/stores/hydrationStore';
import { SkillsScreen } from './SkillsScreen';

beforeEach(() => {
  for (const s of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore]) s.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { cleanup(); useHydrationStore.getState().setStatus('idle'); });

for (const locale of ['en', 'zh-CN'] as const) for (const rank of [1, 19, 20]) {
  it(`shows actual automatic Energy Shield at rank${String(rank)}, exact aliases and native upgrade in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const fresh = createMockPlayer('Synthetic Energy Shield detail', 'sorceress');
    act(() => { usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillPoints: 1, comboOrder: [],
      skillLevels: { 'sorceress.telekinesis': 1, 'sorceress.teleport': 1,
        'skills-sorceress-energy-shield': 1, 'sorceress.energy_shield': rank } }); });
    render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
    </Suspense></I18nextProvider>);
    fireEvent.click(screen.getByTestId('skill-node-skills-sorceress-energy-shield'));
    const panel = screen.getByTestId('skill-detail-panel');
    for (const phrase of locale === 'en' ? ['3% of mitigated damage per rank', '1 MP per prevented HP',
      'ordinary Energy-based mana recovery', 'character level 24', 'next wave'] :
      ['每级转移3%的减伤后伤害', '每抵消1点生命伤害消耗1点法力', '普通精力法力回复', '角色24级', '下一波']) {
      expect.soft(panel).toHaveTextContent(phrase);
    }
    expect(panel).not.toHaveTextContent('{{');
    const value = (heading: string, label: string) => {
      const section = within(panel).getByRole('heading', { name: heading, level: 3 }).closest('section');
      if (!section) throw new Error('Missing detail section');
      return within(section).getByText(label, { selector: 'dt' }).nextElementSibling;
    };
    const label = locale === 'en' ? 'Damage Diverted to Mana' : '伤害转移至法力';
    const current = locale === 'en' ? 'Current' : '当前';
    expect(value(current, label)).toHaveTextContent(`${String(rank * 3)}%`);
    expect(value(current, locale === 'en' ? 'Mana Regeneration' : '法力恢复')).toHaveTextContent(`${String(rank * 2)}%`);
    if (rank < 20) {
      expect(value(locale === 'en' ? 'Next Level' : '下一级', label)).toHaveTextContent(`${String((rank + 1) * 3)}%`);
      fireEvent.click(within(panel).getByRole('button'));
      expect(value(current, label)).toHaveTextContent(`${String((rank + 1) * 3)}%`);
      expect(usePlayerStore.getState().player?.skillPoints).toBe(0);
    } else {
      const next = within(panel).getByRole('heading', { name: locale === 'en' ? 'Next Level' : '下一级' }).closest('section');
      expect(next).toHaveTextContent(locale === 'en' ? 'Max level reached.' : '已达到最高等级。');
      expect(within(panel).getByRole('button')).toBeDisabled();
      expect(usePlayerStore.getState().player?.skillPoints).toBe(1);
    }
  });
}
