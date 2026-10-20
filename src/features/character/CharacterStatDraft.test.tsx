/** Real character sheet, i18n, controller, stores and committed-save export. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense, useLayoutEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, exportCurrentSave, useHydrationStore } from '@/stores/persistence';
import { createMockPlayer } from './createMockPlayer';
import { CharacterScreen } from './CharacterScreen';

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing character draft fixture');
  return current;
}
function page(probe?: () => void, revision = 0) {
  return <I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CommitProbe probe={probe} revision={revision} />
    </MemoryRouter>
  </Suspense></I18nextProvider>;
}
function CommitProbe({ probe, revision }: { probe: (() => void) | undefined; revision: number }) {
  useLayoutEffect(() => { probe?.(); }, [probe, revision]);
  return <CharacterScreen />;
}
function increase(stat = 'Energy') { return screen.getByRole('button', { name: `Increase ${stat}` }); }
function decrease(stat = 'Energy') { return screen.getByRole('button', { name: `Decrease ${stat}` }); }
function apply() { return screen.getByRole('button', { name: 'Apply attributes' }); }
function cancel() { return screen.getByRole('button', { name: 'Cancel changes' }); }
function domain() {
  const inventory = useInventoryStore.getState();
  return structuredClone({ player: player(), backpack: inventory.backpack,
    equipped: inventory.equipped, stash: inventory.stash, currencies: inventory.currencies });
}
function derivedPanelText(): string {
  const panel = screen.getByTestId('char-derived-stats').parentElement;
  if (!panel) throw new Error('Missing derived stats panel');
  return panel.textContent;
}
function observe() {
  const before = domain();
  const basis = player();
  const inventory = useInventoryStore.getState();
  const exported = exportCurrentSave();
  const published: unknown[] = [];
  const stop = usePlayerStore.subscribe(state => { published.push(structuredClone(state.player)); });
  const derived = derivedPanelText();
  return { before, basis, inventory, exported, derived, published, stop };
}
function unchanged(observation: ReturnType<typeof observe>) {
  expect(derivedPanelText()).toBe(observation.derived);
  expect(domain()).toEqual(observation.before);
  expect(player()).toBe(observation.basis);
  expect(useInventoryStore.getState()).toBe(observation.inventory);
  expect(exportCurrentSave()).toBe(observation.exported);
  expect(observation.published).toEqual([]);
}

beforeEach(async () => {
  __resetPersistenceForTests();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Cancellable draft', 'sorceress'), statPoints: 5 });
  useHydrationStore.getState().setStatus('ready');
  await i18n.changeLanguage('en');
});
afterEach(() => { __resetPersistenceForTests(); vi.useRealTimers(); });

describe('Character attribute draft', () => {
  it('renders four distinct localized pairs and disabled empty Apply/Cancel in English', () => {
    render(page());
    for (const stat of ['Strength', 'Dexterity', 'Vitality', 'Energy']) {
      expect(increase(stat)).toBeEnabled();
      expect(decrease(stat)).toBeDisabled();
    }
    expect(apply()).toBeDisabled(); expect(cancel()).toBeDisabled();
    expect(screen.getByTestId('char-draft-remaining')).toHaveTextContent('5');
  });

  it('stages, removes and cancels additions without publication or committed-export changes', () => {
    render(page());
    const observation = observe();
    try {
      fireEvent.click(increase()); fireEvent.click(increase('Vitality'));
      expect(screen.getByTestId('char-draft-energy')).toHaveTextContent('35 → 36');
      expect(screen.getByTestId('char-draft-vitality')).toHaveTextContent('10 → 11');
      expect(screen.getByTestId('char-draft-remaining')).toHaveTextContent('3');
      expect(screen.getByTestId('char-derived-stats')).toHaveTextContent('120');
      expect(screen.getByTestId('char-derived-stats')).toHaveTextContent('102');
      unchanged(observation);
      fireEvent.click(decrease());
      expect(screen.getByTestId('char-draft-energy')).toHaveTextContent(/^35$/);
      expect(decrease()).toBeDisabled();
      unchanged(observation);
      fireEvent.click(cancel());
      expect(screen.getByTestId('char-draft-vitality')).toHaveTextContent(/^10$/);
      expect(apply()).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent('Changes cancelled.');
      unchanged(observation);
    } finally { observation.stop(); }
  });


  it('applies a mixed draft once with complete literal stats and no healing', () => {
    render(page());
    const observation = observe();
    try {
      fireEvent.click(increase('Dexterity'));
      fireEvent.click(increase('Vitality')); fireEvent.click(increase('Vitality'));
      fireEvent.click(increase()); fireEvent.click(increase());
      expect(increase()).toBeDisabled();
      expect(screen.getByTestId('char-draft-remaining')).toHaveTextContent(/^0$/);
      unchanged(observation);
      fireEvent.click(apply());
      const physDodge: unknown = expect.closeTo(0.102, 12);
      const expected = { ...observation.before.player, statPoints: 0,
        coreStats: { strength: 10, dexterity: 26, vitality: 12, energy: 37 },
        derivedStats: { ...observation.before.player.derivedStats, lifeMax: 124, manaMax: 105,
          attack: 23, attackSpeed: 126, physDodge } };
      expect(player()).toEqual(expected);
      expect(observation.published).toEqual([expected]);
      expect(observation.basis).toEqual(observation.before.player);
      expect(screen.getByTestId('char-stat-points')).toHaveTextContent(/^0$/);
      expect(screen.getByTestId('char-draft-energy')).toHaveTextContent(/^37$/);
      expect(apply()).toBeDisabled(); expect(cancel()).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent('Attributes applied.');
      const exported: unknown = JSON.parse(exportCurrentSave() ?? 'null');
      expect(exported).toMatchObject({ player: { statPoints: 0, coreStats: player().coreStats,
        derivedStats: { life: 120, lifeMax: 124, mana: 102, manaMax: 105 } } });
    } finally { observation.stop(); }
  });

  it('provides Chinese attribute-specific names and localized Cancel/Apply feedback', async () => {
    await i18n.changeLanguage('zh-CN');
    render(page());
    for (const stat of ['力量', '敏捷', '体力', '精力']) {
      expect(screen.getByRole('button', { name: `增加${stat}` })).toBeEnabled();
      expect(screen.getByRole('button', { name: `减少${stat}` })).toBeDisabled();
    }
    fireEvent.click(screen.getByRole('button', { name: '增加精力' }));
    fireEvent.click(screen.getByRole('button', { name: '取消修改' }));
    expect(screen.getByRole('status')).toHaveTextContent('已取消修改。');
    fireEvent.click(screen.getByRole('button', { name: '增加精力' }));
    fireEvent.click(screen.getByRole('button', { name: '应用属性' }));
    expect(screen.getByRole('status')).toHaveTextContent('属性已应用。');
    expect(player()).toMatchObject({ statPoints: 4, coreStats: { energy: 36 },
      derivedStats: { mana: 102, manaMax: 104 } });
  });

  it.each([0, 0.5, 1.5])('allows only whole available points from pool %s', points => {
    usePlayerStore.getState().setPlayer({ ...player(), statPoints: points });
    render(page());
    const observation = observe();
    try {
      expect(screen.getByTestId('char-draft-remaining')).toHaveTextContent(String(Math.floor(points)));
      if (points < 1) {
        expect(increase()).toBeDisabled(); expect(apply()).toBeDisabled();
        fireEvent.click(increase()); unchanged(observation);
      } else {
        fireEvent.click(increase());
        expect(increase('Strength')).toBeDisabled();
        unchanged(observation);
        fireEvent.click(apply());
        expect(player()).toMatchObject({ statPoints: 0.5, coreStats: { energy: 36 } });
      }
    } finally { observation.stop(); }
  });

  it.each([499.5, 500, 501])('disables additions above prospective base cap from %s without blocking other rows', vitality => {
    usePlayerStore.getState().setPlayer({ ...player(), coreStats: { ...player().coreStats, vitality } });
    render(page());
    expect(increase('Vitality')).toBeDisabled();
    expect(decrease('Vitality')).toBeDisabled();
    fireEvent.click(increase()); fireEvent.click(apply());
    expect(player()).toMatchObject({ statPoints: 4, coreStats: { vitality, energy: 36 } });
  });


  it.each(['experience', 'equipment', 'equal-ID replacement'] as const)(
    'discards pending edits on real %s publication without silently rebasing', cause => {
      render(page());
      const original = player();
      fireEvent.click(increase());
      act(() => {
        if (cause === 'experience') usePlayerStore.getState().gainExperience(1);
        else if (cause === 'equipment') {
          const gear: Item = { id: 'draft-change-helm', baseId: 'items/base/helm-cap', rarity: 'normal',
            level: 1, identified: true, equipped: false, baseRolls: { defense: 13 } };
          useInventoryStore.getState().addItem(gear);
          expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
        } else usePlayerStore.getState().setPlayer({ ...original, name: 'Replaced same ID' });
      });
      const observation = observe();
      try {
        expect(player()).not.toBe(original);
        expect(player().id).toBe(original.id);
        expect(screen.getByTestId('char-draft-energy')).toHaveTextContent(/^35$/);
        expect(apply()).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('Character changed. Pending changes discarded.');
        fireEvent.click(apply()); unchanged(observation);
        fireEvent.click(increase('Vitality')); fireEvent.click(apply());
        expect(player()).toMatchObject({ statPoints: 4, coreStats: { energy: 35, vitality: 11 } });
        expect(observation.published).toHaveLength(1);
      } finally { observation.stop(); }
    }
  );

  it('renders a stale draft empty before passive effects and never resurrects it when its original reference returns', () => {
    const captures: { disabled: boolean; value: string | null }[] = [];
    const view = render(page());
    const original = player();
    fireEvent.click(increase());
    const capture = () => { captures.push({ disabled: (apply() as HTMLButtonElement).disabled,
      value: screen.getByTestId('char-draft-energy').textContent }); };
    act(() => {
      usePlayerStore.getState().setPlayer({ ...original, experience: 1 });
      view.rerender(page(capture, 1));
    });
    expect(captures).toEqual([{ disabled: true, value: '35' }]);
    act(() => { usePlayerStore.getState().setPlayer(original); });
    expect(screen.getByTestId('char-draft-energy')).toHaveTextContent(/^35$/);
    expect(apply()).toBeDisabled();
    expect(player()).toBe(original);
  });

  it('permits base499→500 despite current equipment and never removes a committed point', () => {
    usePlayerStore.getState().setPlayer({ ...player(), coreStats: { ...player().coreStats, vitality: 499 } });
    const gear: Item = { id: 'draft-cap-helm', baseId: 'items/base/helm-cap', rarity: 'magic',
      level: 1, identified: true, equipped: false, baseRolls: { defense: 13 },
      affixes: [{ affixId: 'controlled', values: new Map([['coreStats.vitality', 5]]) }] };
    useInventoryStore.getState().addItem(gear);
    expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
    render(page());
    expect(increase('Vitality')).toBeEnabled();
    fireEvent.click(increase('Vitality'));
    expect(screen.getByTestId('char-draft-vitality')).toHaveTextContent('499 → 500');
    expect(increase('Vitality')).toBeDisabled();
    fireEvent.click(apply());
    expect(player()).toMatchObject({ statPoints: 4, coreStats: { vitality: 500 },
      derivedStats: { life: 120, lifeMax: 800 } });
    expect(decrease('Vitality')).toBeDisabled();
    fireEvent.click(decrease('Vitality'));
    expect(player().coreStats.vitality).toBe(500);
  });


  it('drops local edits on unmount and never publishes while leaving the sheet', () => {
    const view = render(page());
    const observation = observe();
    try {
      fireEvent.click(increase());
      view.unmount();
      render(page());
      expect(screen.getByTestId('char-draft-energy')).toHaveTextContent(/^35$/);
      expect(apply()).toBeDisabled();
      unchanged(observation);
    } finally { observation.stop(); }
  });

  it.each([
    ['en', 'idle'], ['en', 'loading'], ['en', 'error'],
    ['zh-CN', 'idle'], ['zh-CN', 'loading'], ['zh-CN', 'error']
  ] as const)('keeps the draft and reports real %s/%s readiness refusal before retry', async (locale, status) => {
    await i18n.changeLanguage(locale);
    render(page());
    const plus = () => screen.getByRole('button', { name: locale === 'en' ? 'Increase Energy' : '增加精力' });
    const commit = () => screen.getByRole('button', { name: locale === 'en' ? 'Apply attributes' : '应用属性' });
    fireEvent.click(plus());
    act(() => { useHydrationStore.getState().setStatus(status); });
    const observation = observe();
    try {
      fireEvent.click(commit());
      expect(screen.getByRole('status')).toHaveTextContent(locale === 'en'
        ? 'Wait for the save to finish loading or changing.' : '请等待存档加载或更换完成。');
      expect(screen.getByTestId('char-draft-energy')).toHaveTextContent('35 → 36');
      unchanged(observation);
      act(() => { useHydrationStore.getState().setStatus('ready'); });
      fireEvent.click(commit());
      expect(player()).toMatchObject({ statPoints: 4, coreStats: { energy: 36 },
        derivedStats: { life: 120, mana: 102, manaMax: 104 } });
      expect(observation.published).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent(locale === 'en' ? 'Attributes applied.' : '属性已应用。');
    } finally { observation.stop(); }
  });


  it('removes the empty draft after undoing every addition, without a false discard notice on later XP', () => {
    render(page());
    fireEvent.click(increase()); fireEvent.click(decrease());
    expect(apply()).toBeDisabled();
    expect(cancel()).toBeDisabled();
    act(() => { usePlayerStore.getState().gainExperience(1); });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(player()).toMatchObject({ experience: 1, statPoints: 5, coreStats: { energy: 35 } });
  });
});
