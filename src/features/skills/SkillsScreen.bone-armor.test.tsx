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
for (const locale of ['en', 'zh-CN'] as const) it('shows finite automatic Bone Armor and native rank-up in ' + locale, async () => {
  await i18n.changeLanguage(locale);
  const fresh = createMockPlayer('Bone Armor detail fixture', 'necromancer');
  act(() => { usePlayerStore.getState().setPlayer({ ...fresh, skillPoints: 1, comboOrder: [],
    skillLevels: { 'necromancer.bone_armor': 1 } }); });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  fireEvent.click(screen.getByTestId('skill-node-skills-necromancer-bone-armor'));
  const panel = screen.getByTestId('skill-detail-panel');
  expect.soft(panel).toHaveTextContent(locale === 'en' ? '12 absorption per rank' : '每级提供12点吸收');
  expect.soft(panel).toHaveTextContent(locale === 'en' ? 'next fresh area run' : '下次新区域挑战');
  expect.soft(panel).toHaveTextContent(locale === 'en' ? 'does not refill between waves' : '波次之间不补充');
  expect.soft(panel).not.toHaveTextContent(locale === 'en' ? '100-point' : '100 点');
  expect(panel).not.toHaveTextContent('{{');
  const value = (name: string) => {
    const section = within(panel).getByRole('heading', { name, level: 3 }).closest('section');
    if (!section) throw new Error('Missing shield section');
    return within(section).getByText(locale === 'en' ? 'Bone Armor Absorb' : '骨甲吸收', { selector: 'dt' }).nextElementSibling;
  };
  expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent('12');
  expect(value(locale === 'en' ? 'Next Level' : '下一级')).toHaveTextContent('24');
  fireEvent.click(within(panel).getByRole('button'));
  expect(usePlayerStore.getState().player?.skillLevels?.['necromancer.bone_armor']).toBe(2);
  expect(value(locale === 'en' ? 'Current' : '当前')).toHaveTextContent('24');
});
