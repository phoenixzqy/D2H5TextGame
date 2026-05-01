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
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '@/i18n';
import { CharacterCreate } from './CharacterCreate';
import { usePlayerStore } from '@/stores';
import { CHARACTER_CLASSES } from './createMockPlayer';

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
    act(() => { usePlayerStore.getState().reset(); });
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
});
