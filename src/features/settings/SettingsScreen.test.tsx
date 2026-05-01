/**
 * SettingsScreen RTL — mirrors:
 *   - tests/e2e/stealth.spec.ts (toggle-stealth flips meta-store flag,
 *     stealth-indicator presence, body class), and
 *   - tests/e2e/welcome-gate.spec.ts (back-to-home button + hideNav
 *     when no character).
 *
 * What stays Playwright-only (documented for P08):
 *   - The CSS-driven visuals of stealth: img visibility:hidden / opacity:0
 *     and `.text-d2-gold` computed color = rgb(156, 163, 175). Those rely
 *     on the production CSS being applied by the browser; jsdom doesn't
 *     resolve Tailwind class rules, so we keep the Playwright assertion.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '@/i18n';
import { SettingsScreen } from './SettingsScreen';
import { useMetaStore, usePlayerStore } from '@/stores';
import { useStealthMode } from '@/app/useStealthMode';
import { createMockPlayer } from '@/features/character/createMockPlayer';

function StealthHost({ children }: { children: React.ReactNode }) {
  // Mirrors what App.tsx does: applies the body class + renders the
  // hidden indicator span based on the meta store.
  useStealthMode();
  const stealthOn = useMetaStore((s) => s.settings.stealthMode);
  return (
    <>
      {children}
      {stealthOn && (
        <span data-testid="stealth-indicator" aria-hidden="true" className="sr-only">
          stealth
        </span>
      )}
    </>
  );
}

function renderSettings({ withStealthHost = false } = {}) {
  const tree = (
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={['/settings']}
    >
      <Routes>
        <Route
          path="/settings"
          element={
            withStealthHost ? (
              <StealthHost>
                <SettingsScreen />
              </StealthHost>
            ) : (
              <SettingsScreen />
            )
          }
        />
        <Route path="/" element={<div data-testid="home-route">home</div>} />
      </Routes>
    </MemoryRouter>
  );
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>{tree}</Suspense>
    </I18nextProvider>,
  );
}

describe('<SettingsScreen> — stealth toggle (mirrors stealth.spec.ts)', () => {
  beforeEach(async () => {
    act(() => { useMetaStore.getState().reset(); });
    act(() => { usePlayerStore.getState().reset(); });
    document.body.classList.remove('stealth');
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('toggle-stealth starts unchecked when settings.stealthMode is false', () => {
    renderSettings();
    expect(screen.getByTestId('toggle-stealth')).not.toBeChecked();
  });

  it('clicking toggle-stealth flips the meta-store flag to true', () => {
    renderSettings();
    const toggle = screen.getByTestId('toggle-stealth');
    fireEvent.click(toggle);
    expect(useMetaStore.getState().settings.stealthMode).toBe(true);
    expect(toggle).toBeChecked();
  });

  it('clicking toggle-stealth twice returns it to false', () => {
    renderSettings();
    const toggle = screen.getByTestId('toggle-stealth');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(useMetaStore.getState().settings.stealthMode).toBe(false);
    expect(toggle).not.toBeChecked();
  });

  it('toggling stealth ON adds the "stealth" class to document.body', () => {
    renderSettings({ withStealthHost: true });
    expect(document.body.classList.contains('stealth')).toBe(false);
    fireEvent.click(screen.getByTestId('toggle-stealth'));
    expect(document.body.classList.contains('stealth')).toBe(true);
  });

  it('toggling stealth ON renders the stealth-indicator span; OFF removes it', () => {
    renderSettings({ withStealthHost: true });
    expect(screen.queryByTestId('stealth-indicator')).toBeNull();
    fireEvent.click(screen.getByTestId('toggle-stealth'));
    expect(screen.getByTestId('stealth-indicator')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-stealth'));
    expect(screen.queryByTestId('stealth-indicator')).toBeNull();
  });
});

describe('<SettingsScreen> — hideNav / back-button (mirrors welcome-gate.spec.ts)', () => {
  beforeEach(async () => {
    act(() => { useMetaStore.getState().reset(); });
    act(() => { usePlayerStore.getState().reset(); });
    if (i18n.language !== 'zh-CN') await i18n.changeLanguage('zh-CN');
  });

  it('shows the settings-back-home button when no player is set', () => {
    renderSettings();
    expect(screen.getByTestId('settings-back-home')).toBeInTheDocument();
  });

  it('hides BottomNav (no /town nav-link) when no player is set', () => {
    renderSettings();
    // ScreenShell receives hideNav={true} → no <BottomNav>. The /town
    // NavLink should therefore NOT exist in the DOM.
    const townLink = document.querySelector('a[href="/town"]');
    expect(townLink).toBeNull();
  });

  it('does NOT show settings-back-home when a player exists', () => {
    act(() => {
      usePlayerStore.getState().setPlayer(createMockPlayer('Hero', 'amazon'));
    });
    renderSettings();
    expect(screen.queryByTestId('settings-back-home')).toBeNull();
  });

  it('renders BottomNav (/town nav-link present) when a player exists', () => {
    act(() => {
      usePlayerStore.getState().setPlayer(createMockPlayer('Hero', 'amazon'));
    });
    renderSettings();
    const townLink = document.querySelector('a[href="/town"]');
    expect(townLink).not.toBeNull();
  });

  it('clicking settings-back-home navigates to "/"', () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-back-home'));
    expect(screen.getByTestId('home-route')).toBeInTheDocument();
  });

  it('locale buttons reflect aria-pressed for the current locale', () => {
    renderSettings();
    const zhBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === '简体中文',
    );
    const enBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'English',
    );
    expect(zhBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(enBtn?.getAttribute('aria-pressed')).toBe('false');
  });
});
