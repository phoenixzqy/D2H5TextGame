/**
 * BottomNav / ScreenShell.hideNav RTL — mirrors the nav-link absence
 * checks in tests/e2e/welcome-gate.spec.ts.
 *
 * The `hideNav` prop lives on ScreenShell (not BottomNav itself) — it
 * gates whether <BottomNav /> renders at all. So we test ScreenShell
 * to validate the contract every screen relies on.
 *
 * Mirrored assertions:
 *   - hideNav={true}  → no nav links to /town, /map, …
 *   - hideNav={false} → all 9 nav-bar entries render with their hrefs.
 *   - default (omitted) → behaves like false.
 */
import { describe, it, expect } from 'vitest';
import { Suspense } from 'react';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { ScreenShell } from './ScreenShell';

const NAV_HREFS = [
  '/town', '/map', '/combat', '/inventory',
  '/skills', '/mercs', '/gacha', '/quests', '/settings',
] as const;

function renderShell(props: { hideNav?: boolean } = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          initialEntries={['/town']}
        >
          <ScreenShell testId="shell-test" {...props}>
            <div data-testid="shell-child">child</div>
          </ScreenShell>
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>,
  );
}

describe('<ScreenShell hideNav /> — BottomNav gate', () => {
  it('renders BottomNav with all 9 nav-links when hideNav is false', () => {
    renderShell({ hideNav: false });
    for (const href of NAV_HREFS) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link, `missing nav link ${href}`).not.toBeNull();
    }
  });

  it('renders BottomNav by default (hideNav omitted)', () => {
    renderShell();
    const link = document.querySelector('a[href="/town"]');
    expect(link).not.toBeNull();
  });

  it('does NOT render BottomNav when hideNav is true', () => {
    renderShell({ hideNav: true });
    for (const href of NAV_HREFS) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link, `unexpected nav link ${href}`).toBeNull();
    }
  });

  it('still renders the child content when hideNav is true', () => {
    const { getByTestId } = renderShell({ hideNav: true });
    expect(getByTestId('shell-child')).toBeInTheDocument();
  });

  it('exposes the testId on the outer container', () => {
    const { getByTestId } = renderShell({ hideNav: false });
    expect(getByTestId('shell-test')).toBeInTheDocument();
  });
});
