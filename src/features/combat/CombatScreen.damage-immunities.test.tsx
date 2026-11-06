import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { monsters } from '@/data';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { buildMonsterUnit } from '@/engine/combat/monster-factory';
import { createRng } from '@/engine/rng';
import type { CombatUnit, MonsterTier } from '@/engine/combat/types';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { CombatScreen } from './CombatScreen';

const stores = [useCombatStore, useMapStore, useMetaStore, usePlayerStore, useInventoryStore, useFormationStore];
beforeEach(() => {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

function nativeMonster(archetype: string, id: string, tier?: MonsterTier): CombatUnit {
  const def = monsters.find(row => row.id === archetype);
  if (!def) throw new Error(`Missing native monster ${archetype}`);
  return buildMonsterUnit({ def, level: 10, tier: tier ?? (def.canBeBoss ? 'chapter-boss' : 'trash'), id, rng: createRng(13) });
}

function showCombat(enemies: readonly CombatUnit[]) {
  const player = createMockPlayer('Immunity display fixture', 'necromancer');
  usePlayerStore.getState().setPlayer(player);
  useCombatStore.setState({
    inCombat: true, isPaused: true,
    playerTeam: [{ ...playerToCombatUnit(player), gridPosition: { row: 1, col: 1 } }],
    enemyTeam: enemies.map((enemy, index) => ({ ...enemy, gridPosition: { row: Math.floor(index / 3), col: index % 3 } })),
  });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CombatScreen />
  </MemoryRouter></Suspense></I18nextProvider>);
}

for (const locale of ['en', 'zh-CN'] as const) {
  it(`shows selected native champion immunities and keeps ordinary variants unlabelled in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    showCombat([
      nativeMonster('monsters/act5.blood-lord', 'fire-champion', 'champion'),
      nativeMonster('monsters/act5.frozen-terror', 'cold-champion', 'champion'),
      nativeMonster('monsters/act5.blood-lord', 'ordinary-fire'),
      nativeMonster('monsters/act5.frozen-terror', 'ordinary-cold'),
    ]);
    for (const [id, text] of [
      ['fire-champion', locale === 'en' ? 'Immune to fire damage' : '免疫火焰伤害'],
      ['cold-champion', locale === 'en' ? 'Immune to cold damage' : '免疫冰冷伤害'],
    ] as const) {
      const card = within(screen.getByTestId(`unit-card-${id}`));
      const list = card.getByRole('list', { name: locale === 'en' ? 'Damage immunities' : '伤害免疫' });
      expect(list).toHaveTextContent(text);
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    }
    for (const id of ['ordinary-fire', 'ordinary-cold']) {
      expect(within(screen.getByTestId(`unit-card-${id}`)).queryByRole('list')).toBeNull();
    }
  });

  it(`shows native boss damage immunity without mistaking resistance or status protection for it in ${locale}`, async () => {
    await i18n.changeLanguage(locale);
    const ordinary = nativeMonster('monsters/act1.fallen', 'ordinary');
    showCombat([
      nativeMonster('monsters/act1.andariel', 'andariel'),
      nativeMonster('monsters/act3.mephisto', 'mephisto'),
      { ...ordinary, stats: { ...ordinary.stats, resistances: { ...ordinary.stats.resistances, poison: 100 } } },
      { ...ordinary, id: 'status-only', statusImmunities: ['poison', 'plague'], damageImmunities: [] },
    ]);
    for (const id of ['andariel', 'mephisto']) {
      const card = within(screen.getByTestId(`unit-card-${id}`));
      const immunities = card.getByRole('list', { name: locale === 'en' ? 'Damage immunities' : '伤害免疫' });
      expect(within(immunities).getAllByRole('listitem')).toHaveLength(1);
      expect(immunities).toHaveTextContent(locale === 'en' ? 'Immune to poison damage' : '免疫毒素伤害');
    }
    for (const id of ['ordinary', 'status-only']) {
      expect(within(screen.getByTestId(`unit-card-${id}`)).queryByRole('list')).toBeNull();
    }
  });
}

it('localizes every supported type on a mounted card and removes obsolete immunity labels on team replacement', async () => {
  await i18n.changeLanguage('en');
  const enemy: CombatUnit = { ...nativeMonster('monsters/act1.fallen', 'enemy'),
    damageImmunities: ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] };
  showCombat([enemy]);
  const card = within(screen.getByTestId('unit-card-enemy'));
  expect(card.getAllByRole('listitem').map(item => item.textContent)).toEqual([
    'Immune to physical damage', 'Immune to fire damage', 'Immune to cold damage',
    'Immune to lightning damage', 'Immune to arcane damage', 'Immune to poison damage', 'Immune to thorns damage',
  ]);
  await act(async () => { await i18n.changeLanguage('zh-CN'); });
  expect(card.getByRole('list', { name: '伤害免疫' })).toBeVisible();
  expect(card.getAllByRole('listitem').map(item => item.textContent)).toEqual([
    '免疫物理伤害', '免疫火焰伤害', '免疫冰冷伤害', '免疫闪电伤害', '免疫奥术伤害', '免疫毒素伤害', '免疫荆棘伤害',
  ]);
  act(() => { useCombatStore.setState({ enemyTeam: [{ ...enemy, damageImmunities: [], gridPosition: { row: 0, col: 0 } }] }); });
  expect(card.queryByRole('list')).toBeNull();
});
