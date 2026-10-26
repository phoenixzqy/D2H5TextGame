import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CombatScreen } from '@/features/combat/CombatScreen';
import { payBoneWall } from '@/engine/skills/bone-wall';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import type { CombatUnit } from '@/engine/combat/types';

function reset() { abortSubAreaRun(); for (const s of [useCombatStore, useMapStore, useMetaStore, usePlayerStore]) s.getState().reset(); }
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { cleanup(); reset(); useHydrationStore.getState().setStatus('idle'); });
// Paused display fixtures use a real paid Wall pool; they do not establish campaign acceptance.
for (const locale of ['en', 'zh-CN'] as const) it('shows paid Wall capacity as a buff and localizes finite Prison in ' + locale, async () => {
  await i18n.changeLanguage(locale);
  const english = locale === 'en', player = { ...createMockPlayer('Bone chip fixture', 'necromancer'), level: 30,
    skillLevels: { 'necromancer.bone_armor': 1, 'necromancer.bone_wall': 1, 'necromancer.bone_prison': 1 }, comboOrder: [] };
  usePlayerStore.getState().setPlayer(player);
  const hero = payBoneWall(playerToCombatUnit(player), 1, 0), frozen = structuredClone(hero);
  const enemy: CombatUnit = { ...hero, id: 'bone-chip-enemy', side: 'enemy', kind: 'monster', statuses: [
    { id: 'bone-prison', sourceId: hero.id, stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000, bonePrison: true }
  ] };
  useCombatStore.setState({ inCombat: true, isPaused: true, playerTeam: [hero], enemyTeam: [enemy] });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
  const card = screen.getByTestId('unit-card-' + hero.id), chips = within(card).getByTestId('unit-effect-chips');
  const wall = Array.from(chips.children).find(node => /Bone Wall|骨墙/.test(node.textContent));
  expect.soft(wall).toHaveTextContent(english ? 'Bone Wall: 40' : '骨墙：40');
  expect.soft(wall).toHaveClass('text-blue-200');
  const prison = within(screen.getByTestId('unit-card-bone-chip-enemy')).getByTestId('unit-effect-chips');
  expect.soft(prison).toHaveTextContent(english ? 'Bone Prison' : '骨牢');
  expect.soft(prison.children[0]).toHaveClass('text-purple-200');
  expect.soft(i18n.t('combat:effect.buff.bone-wall')).toBe(english ? 'Bone Wall' : '骨墙');
  const spent = { ...hero, statuses: hero.statuses.map(s => s.id === 'bone-wall' && s.boneWall
    ? { ...s, boneWall: { ...s.boneWall, remaining: 27 } } : s) };
  act(() => { useCombatStore.setState({ playerTeam: [spent] }); });
  expect.soft(chips).toHaveTextContent(english ? 'Bone Wall: 27' : '骨墙：27');
  expect(hero).toEqual(frozen);
  act(() => { useCombatStore.setState({ playerTeam: [{ ...hero, statuses: hero.statuses.filter(s => s.id !== 'bone-wall') }],
    enemyTeam: [{ ...enemy, statuses: [] }] }); });
  expect(within(card).queryByText(/Bone Wall|骨墙/)).not.toBeInTheDocument();
  expect(within(screen.getByTestId('unit-card-bone-chip-enemy')).queryByTestId('unit-effect-chips')).not.toBeInTheDocument();
});
