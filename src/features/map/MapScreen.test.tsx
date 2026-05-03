/**
 * MapScreen — Bug #4 (Stop Farming row toggle), Bug #5 (idle gated
 * behind first clear). Tests focus on the gating + toggle states; the
 * end-to-end navigation flow is covered by Playwright.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from '@/i18n';
import { MapScreen } from './MapScreen';
import { useMapStore, useMetaStore } from '@/stores';
import { tDataKey } from '@/ui';

const RAW_MAP_KEY_PATTERN = /\b(?:maps|map)\.[A-Za-z0-9_.-]+/;

/** Wait for i18next to finish loading all namespaces. */
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => { i18n.on('initialized', resolve); });
  }
});

function renderMap() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/map']}>
          <Routes>
            <Route path="/map" element={<MapScreen />} />
            <Route path="/combat" element={<div data-testid="combat-route">c</div>} />
          </Routes>
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('MapScreen — idle gating + stop toggle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN');
    useMapStore.getState().reset();
    useMetaStore.getState().setIdleTarget(undefined);
  });

  it('Bug #5 — Farm Here is locked (disabled) on undefeated areas', async () => {
    renderMap();
    const locked = await screen.findByTestId('farm-locked-a1-blood-moor');
    expect(locked).toBeInTheDocument();
    expect(locked).toBeDisabled();
    expect(locked.getAttribute('aria-label')).toBeTruthy();
    // Active "Farm Here" button should not be present yet.
    expect(screen.queryByTestId('farm-here-a1-blood-moor')).toBeNull();
  });

  it('Bug #5 — Farm Here is enabled once the area is cleared', async () => {
    // Mark via plan-id form (engine emits this on victory) — MapScreen
    // resolves through subAreaResolver so the alias-form id matches.
    useMapStore.getState().markCleared('areas/act1-blood-moor');
    renderMap();
    const farm = await screen.findByTestId('farm-here-a1-blood-moor');
    expect(farm).toBeInTheDocument();
    expect(farm).not.toBeDisabled();
  });

  it('starts map farming by setting the idle target and navigating to combat', async () => {
    useMapStore.getState().markCleared('areas/act1-blood-moor');
    renderMap();
    const farm = await screen.findByTestId('farm-here-a1-blood-moor');
    act(() => { fireEvent.click(farm); });
    expect(useMetaStore.getState().idleState.idleTarget).toBe('a1-blood-moor');
    expect(await screen.findByTestId('combat-route')).toBeInTheDocument();
  });

  it.each([
    { lng: 'zh-CN', outerSteppes: '外缘草原' },
    { lng: 'en', outerSteppes: 'Outer Steppes' }
  ])('renders localized map data labels without raw keys in $lng', async ({ lng, outerSteppes }) => {
    await i18n.changeLanguage(lng);
    const { container } = renderMap();
    await screen.findByTestId('map-screen');

    const actToggles = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'));
    expect(actToggles).toHaveLength(5);
    expect(container.textContent).not.toMatch(RAW_MAP_KEY_PATTERN);

    for (let index = 1; index < actToggles.length; index += 1) {
      const toggle = actToggles[index];
      if (!toggle) throw new Error(`Missing act toggle at index ${String(index)}`);
      act(() => { fireEvent.click(toggle); });
      expect(container.textContent).not.toMatch(RAW_MAP_KEY_PATTERN);
      if (index === 3) {
        expect(screen.getByText(outerSteppes)).toBeInTheDocument();
      }
    }
  });

  it('resolves the canonical maps.area.act4-outer-steppes key in both locales', async () => {
    await i18n.changeLanguage('zh-CN');
    expect(tDataKey(i18n.getFixedT('zh-CN'), 'maps.area.act4-outer-steppes')).toBe('外缘草原');

    await i18n.changeLanguage('en');
    expect(tDataKey(i18n.getFixedT('en'), 'maps.area.act4-outer-steppes')).toBe('Outer Steppes');
  });
});
