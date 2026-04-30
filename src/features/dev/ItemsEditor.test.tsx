/**
 * ItemsEditor.test — weapon-only conditional rendering of weaponType +
 * handedness selects in the Bases tab. Mocks the dev-data load layer.
 */
import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { BaseFields } from './ItemsEditor';

vi.mock('./devClient', () => ({
  loadDevJson: vi.fn().mockResolvedValue({
    version: 1,
    overrides: { class: {}, monster: {}, item: {}, merc: {} }
  }),
  saveDevJson: vi.fn().mockResolvedValue(undefined)
}));

function renderBase(entry: Record<string, unknown>) {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <BaseFields entry={entry} onChange={() => { /* no-op for these tests */ }} />
      </Suspense>
    </I18nextProvider>
  );
}

describe('ItemsEditor BaseFields — weapon fields', () => {
  it('renders weaponType + handedness when type === "weapon"', () => {
    renderBase({
      id: 'items/base/wp1h-short-sword',
      type: 'weapon',
      slot: 'weapon',
      reqLevel: 1,
      canHaveAffixes: true,
      weaponType: 'sword',
      handedness: 'oneHanded'
    });
    expect(screen.getByTestId('weapon-fields')).toBeDefined();
    expect(screen.getByLabelText(/weapon type|武器类型/i)).toBeDefined();
    expect(screen.getByLabelText(/handedness|持握方式/i)).toBeDefined();
  });

  it('hides weapon fields when type !== "weapon"', () => {
    renderBase({
      id: 'items/base/helm-cap',
      type: 'armor',
      slot: 'head',
      reqLevel: 1,
      canHaveAffixes: true,
      baseDefense: 7
    });
    expect(screen.queryByTestId('weapon-fields')).toBeNull();
    expect(screen.queryByLabelText(/weapon type|武器类型/i)).toBeNull();
    expect(screen.queryByLabelText(/handedness|持握方式/i)).toBeNull();
  });

  it('marks weaponType as invalid when missing on a weapon entry', () => {
    renderBase({
      id: 'items/base/wp1h-broken',
      type: 'weapon',
      slot: 'weapon',
      reqLevel: 1,
      canHaveAffixes: true
    });
    const select = screen.getByLabelText(/weapon type|武器类型/i);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    const handednessSelect = screen.getByLabelText(/handedness|持握方式/i);
    expect(handednessSelect.getAttribute('aria-invalid')).toBe('true');
    // Warning hint is rendered.
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('does not mark weaponType invalid when both fields are present', () => {
    renderBase({
      id: 'items/base/wp1h-short-sword',
      type: 'weapon',
      slot: 'weapon',
      reqLevel: 1,
      canHaveAffixes: true,
      weaponType: 'sword',
      handedness: 'oneHanded'
    });
    const select = screen.getByLabelText(/weapon type|武器类型/i);
    expect(select.getAttribute('aria-invalid')).toBe('false');
  });
});
