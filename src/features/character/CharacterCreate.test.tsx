/**
 * CharacterCreate RTL — mirrors the ClassSelect coverage of
 * tests/e2e/welcome-gate.spec.ts (the 7 class-card render) plus the
 * obvious selection / start-button gating UX.
 *
 * What stays Playwright-only (documented for P08):
 *   - End-to-end navigation through the welcome → class-create → town
 *     happy path. We assert the click leads to /town via MemoryRouter
 *     here, but the cross-screen flow with persistence is browser-only.
 */
import { afterEach, assert, describe, it, expect, beforeEach, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '@/i18n';
import { CharacterCreate } from './CharacterCreate';
import { usePlayerStore } from '@/stores';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/persistence';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { CHARACTER_CLASSES, createMockPlayer, type CharacterClass } from './createMockPlayer';
import * as playerFactory from './createMockPlayer';

const realEquip = useInventoryStore.getState().equipItem;
const realRecompute = usePlayerStore.getState().recomputeDerived;

function item(id: string, baseId = 'items/base/helm-cap'): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false };
}

function fillCreation(cls: CharacterClass = 'amazon', name = 'NewHero') {
  fireEvent.click(screen.getByTestId(`class-${cls}`));
  fireEvent.change(screen.getByTestId('character-name-input'), { target: { value: name } });
}

function inventoryData() {
  const { backpack, stash, equipped, currencies } = useInventoryStore.getState();
  return { backpack, stash, equipped, currencies };
}

function expectInventoryReferences(before: ReturnType<typeof inventoryData>) {
  const after = inventoryData();
  for (const key of ['backpack', 'stash', 'equipped', 'currencies'] as const) {
    expect(after[key], key).toBe(before[key]);
  }
}

afterEach(() => {
  act(() => {
    useInventoryStore.setState({ equipItem: realEquip });
    usePlayerStore.setState({ recomputeDerived: realRecompute });
  });
  vi.restoreAllMocks();
});

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          initialEntries={['/character/new']}
        >
          <Routes>
            <Route path="/character/new" element={<CharacterCreate />} />
            <Route path="/town" element={<div data-testid="town-route">town</div>} />
            <Route path="/" element={<div data-testid="home-route">home</div>} />
          </Routes>
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('<CharacterCreate> — class picker (mirrors welcome-gate.spec.ts)', () => {
  beforeEach(async () => {
    act(() => {
      usePlayerStore.getState().reset();
      useInventoryStore.getState().reset();
      useMercStore.getState().reset();
      useHydrationStore.getState().setStatus('ready');
    });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('renders the screen container with all 7 class cards', () => {
    renderScreen();
    expect(screen.getByTestId('character-create')).toBeInTheDocument();
    for (const cls of CHARACTER_CLASSES) {
      expect(
        screen.getByTestId(`class-${cls}`),
        `missing class card for ${cls}`,
      ).toBeInTheDocument();
    }
  });

  // Per-class card render — one it() per class so any single missing
  // class fixture surfaces as its own failing test (matches qa-engineer
  // §6 coverage map: per-class scan).
  for (const cls of CHARACTER_CLASSES) {
    it(`renders the class card for ${cls}`, () => {
      renderScreen();
      const card = screen.getByTestId(`class-${cls}`);
      expect(card).toBeInTheDocument();
    });
  }

  it('start button is disabled until both class and name are provided', () => {
    renderScreen();
    const startBtn = screen.getByTestId('character-start-btn');
    expect(startBtn).toBeDisabled();

    // Pick a class — still disabled (no name).
    fireEvent.click(screen.getByTestId('class-amazon'));
    expect(startBtn).toBeDisabled();

    // Add a name — now enabled.
    fireEvent.change(screen.getByTestId('character-name-input'), {
      target: { value: 'Hero' },
    });
    expect(startBtn).toBeEnabled();
  });

  it('start button stays disabled when only a name is provided (no class)', () => {
    renderScreen();
    fireEvent.change(screen.getByTestId('character-name-input'), {
      target: { value: 'Solo' },
    });
    expect(screen.getByTestId('character-start-btn')).toBeDisabled();
  });

  it('selecting a class displays the starting-stats preview panel', () => {
    renderScreen();
    fireEvent.click(screen.getByTestId('class-barbarian'));
    // Barbarian preview lands strength=30 — visible in the dl.
    const body = document.body.textContent || '';
    expect(body).toMatch(/30/);
  });

  it('changing the selected class updates the stat preview', () => {
    renderScreen();
    fireEvent.click(screen.getByTestId('class-barbarian'));
    const afterBarb = document.body.textContent || '';
    fireEvent.click(screen.getByTestId('class-sorceress'));
    const afterSorc = document.body.textContent || '';
    expect(afterBarb).not.toEqual(afterSorc);
  });

  it('clicking start with valid input creates the player and navigates to /town', () => {
    renderScreen();
    fireEvent.click(screen.getByTestId('class-amazon'));
    fireEvent.change(screen.getByTestId('character-name-input'), {
      target: { value: 'TestGateHero' },
    });
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(screen.getByTestId('town-route')).toBeInTheDocument();
    const player = usePlayerStore.getState().player;
    expect(player).not.toBeNull();
    expect(player?.class).toBe('amazon');
    expect(player?.name).toBe('TestGateHero');
  });

  it('back button navigates to "/"', () => {
    renderScreen();
    // Header back button is the first <button> with text "← 返回" / "← Back".
    const backBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => (b.textContent || '').includes('←'),
    );
    expect(backBtn).toBeDefined();
    if (backBtn) fireEvent.click(backBtn);
    expect(screen.getByTestId('home-route')).toBeInTheDocument();
  });

  it('gender toggle reflects aria-pressed on the active option', () => {
    renderScreen();
    const buttons = Array.from(document.querySelectorAll('button[aria-pressed]'));
    // 2 gender buttons + locale-style toggles? Filter to only male/female pair.
    const genders = buttons.filter((b) => /男|女|Male|Female/.test(b.textContent || ''));
    expect(genders.length).toBe(2);
    const female = genders.find((b) => /女|Female/.test(b.textContent || ''));
    expect(female).toBeDefined();
    if (female) fireEvent.click(female);
    expect(female?.getAttribute('aria-pressed')).toBe('true');
  });

  it('enters town with one canonical starter, empty legacy gear and attack 35', () => {
    const map = useMapStore.getState();
    const meta = useMetaStore.getState();
    renderScreen();
    fillCreation('amazon', '  Archer  ');
    fireEvent.click(screen.getByTestId('character-start-btn'));
    const player = usePlayerStore.getState().player;
    const inventory = useInventoryStore.getState();
    assert(player);
    expect(player.name).toBe('Archer');
    expect(player.equipment).toEqual([]);
    expect(player.derivedStats.attack).toBe(35);
    expect(inventory.equipped.weapon).toMatchObject({
      baseId: 'items/base/weapon-bow-training', baseRolls: { attack: 13 },
      level: 1, ilvl: 1, identified: true, equipped: true
    });
    expect(inventory.backpack).toEqual([]);
    expect(Object.values(inventory.equipped).filter(Boolean)).toHaveLength(1);
    expect(screen.getByTestId('town-route')).toBeInTheDocument();
    expect(useMapStore.getState()).toBe(map);
    expect(useMetaStore.getState()).toBe(meta);
  });

  it.each(CHARACTER_CLASSES.filter((cls) => cls !== 'amazon'))('creates %s through the same path without a starter', (cls) => {
    renderScreen();
    fillCreation(cls);
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toMatchObject({ class: cls, equipment: [] });
    expect(inventoryData()).toEqual({ backpack: [], stash: [], equipped: {}, currencies: {} });
    expect(screen.getByTestId('town-route')).toBeInTheDocument();
  });

  it('revisiting creation preserves the existing player and singleton starter', () => {
    const firstScreen = renderScreen();
    fillCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    const player = usePlayerStore.getState().player;
    const inventory = inventoryData();
    firstScreen.unmount();
    renderScreen();
    fillCreation('sorceress', 'Replacement');
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBe(player);
    expectInventoryReferences(inventory);
    expect(useInventoryStore.getState().equipped.weapon?.baseId).toBe('items/base/weapon-bow-training');
  });

  it('preserves an existing saved player with contradictory legacy and canonical gear', () => {
    const saved = { ...createMockPlayer('Saved', 'sorceress'), equipment: [item('stale', 'items/base/weapon-bow')] };
    usePlayerStore.getState().setPlayer(saved);
    useInventoryStore.setState({ backpack: [item('pack')], stash: [item('stash')], equipped: { weapon: null }, currencies: { wishstone: 7 } });
    const before = inventoryData();
    renderScreen();
    fillCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBe(saved);
    expectInventoryReferences(before);
  });

  it.each(['idle', 'loading', 'error'] as const)('cannot create while hydration is %s', (status) => {
    renderScreen();
    fillCreation();
    act(() => { useHydrationStore.getState().setStatus(status); });
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBeNull();
    expect(inventoryData()).toEqual({ backpack: [], stash: [], equipped: {}, currencies: {} });
    expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
  });

  it('keeps retained gear/stash/currencies and recomputes no-kit character stats', () => {
    const sword = { ...item('retained-weapon', 'items/base/wp1h-short-sword'), baseRolls: { attack: 6 }, equipped: true };
    useInventoryStore.setState({ backpack: [item('pack')], stash: [item('stash')], equipped: { weapon: sword }, currencies: { wishstone: 7 } });
    const before = inventoryData();
    renderScreen();
    fillCreation('sorceress');
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expectInventoryReferences(before);
    expect(usePlayerStore.getState().player?.derivedStats.attack).toBe(createMockPlayer('Base', 'sorceress').derivedStats.attack + 6);
  });

  it.each(['refusal', 'post-mutation throw'] as const)('rolls back %s and allows a clean retry', (failure) => {
    useInventoryStore.setState({ backpack: [item('pack')], stash: [item('stash')], equipped: { weapon: null }, currencies: { wishstone: 7 } });
    const before = inventoryData();
    const merc = useMercStore.getState();
    if (failure === 'refusal') {
      useInventoryStore.setState({ equipItem: () => ({ ok: false, reason: 'backpack_full' }) });
    } else {
      usePlayerStore.setState({ recomputeDerived: () => { throw new Error('test post-commit recompute failure'); } });
    }
    renderScreen();
    fillCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBeNull();
    expectInventoryReferences(before);
    expect(useMercStore.getState()).toBe(merc);
    expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
    act(() => {
      useInventoryStore.setState({ equipItem: realEquip });
      usePlayerStore.setState({ recomputeDerived: realRecompute });
    });
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(screen.getByTestId('town-route')).toBeInTheDocument();
    expect(useInventoryStore.getState().equipped.weapon?.baseRolls).toEqual({ attack: 13 });
    expect(useInventoryStore.getState().backpack).toEqual(before.backpack);
    expect(useInventoryStore.getState().stash).toBe(before.stash);
    expect(useInventoryStore.getState().currencies).toBe(before.currencies);
    expect(usePlayerStore.getState().player?.equipment).toEqual([]);
  });

  it.each(['backpack', 'stash', 'equipped', 'mercEquipment', 'mercLegacy'] as const)('refuses a fixed-clock starter-ID collision in %s without mutation', (container) => {
    const date = vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
    const collision = item('starter-amazon-bow-2000000');
    if (container === 'backpack' || container === 'stash') useInventoryStore.setState({ [container]: [collision] });
    if (container === 'equipped') useInventoryStore.setState({ equipped: { head: collision } });
    if (container === 'mercEquipment') useMercStore.setState({ mercEquipment: { retained: { head: collision } } });
    if (container === 'mercLegacy') {
      const merc: Mercenary = { ...createMockPlayer('Merc', 'barbarian'), id: 'retained', type: 'mercenary', archetype: 'back', rarity: 'R', equipment: [collision] };
      useMercStore.setState({ ownedMercs: [merc] });
    }
    const before = inventoryData();
    const merc = useMercStore.getState();
    renderScreen();
    fillCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBeNull();
    expectInventoryReferences(before);
    expect(useMercStore.getState()).toBe(merc);
    expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
    date.mockReturnValue(2_000_001);
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(screen.getByTestId('town-route')).toBeInTheDocument();
    expect(useInventoryStore.getState().equipped.weapon?.id).toBe('starter-amazon-bow-2000001');
    expect(useMercStore.getState()).toBe(merc);
  });

  it('rejects an internally duplicated prepared kit before any grant', () => {
    const prepared = createMockPlayer('Duplicate', 'amazon');
    const bow = prepared.equipment[0];
    assert(bow);
    vi.spyOn(playerFactory, 'createMockPlayer').mockReturnValueOnce({ ...prepared, equipment: [bow, { ...bow }] });
    const before = inventoryData();
    renderScreen();
    fillCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(usePlayerStore.getState().player).toBeNull();
    expectInventoryReferences(before);
    expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
  });
});
