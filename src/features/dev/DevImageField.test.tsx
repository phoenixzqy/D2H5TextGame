/**
 * DevImageField.test — renders override vs inferred badge correctly,
 * loads overrides from the dev-data endpoint, and clears via persist.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { DevImageField } from './DevImageField';
import * as devClient from './devClient';

function renderField(props: Parameters<typeof DevImageField>[0]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <DevImageField {...props} />
      </Suspense>
    </I18nextProvider>
  );
}

const baseFile = {
  version: 1 as const,
  overrides: {
    class: { barbarian: '/custom/barb.png' },
    monster: {},
    item: {},
    merc: {}
  }
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('DevImageField', () => {
  it('renders the Override badge when an override exists', async () => {
    vi.spyOn(devClient, 'loadDevJson').mockResolvedValue(baseFile);
    renderField({ kind: 'class', entityId: 'barbarian', inferredPath: '/inferred/barb.png' });
    const field = await screen.findByTestId('dev-image-field');
    await waitFor(() => {
      expect(field.dataset.overrideState).toBe('override');
    });
    expect(screen.getByTestId('dev-image-field-badge').textContent).toMatch(/override|已覆盖/i);
    // The preview img should be the override path.
    const img = field.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/custom/barb.png');
  });

  it('renders the Inferred badge when no override exists', async () => {
    vi.spyOn(devClient, 'loadDevJson').mockResolvedValue(baseFile);
    renderField({ kind: 'class', entityId: 'sorceress', inferredPath: '/inferred/sorc.png' });
    const field = await screen.findByTestId('dev-image-field');
    await waitFor(() => {
      expect(field.dataset.overrideState).toBe('inferred');
    });
    expect(screen.getByTestId('dev-image-field-badge').textContent).toMatch(/inferred|推断/i);
    const img = field.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/inferred/sorc.png');
  });

  it('renders silhouette when both override and inferred are absent', async () => {
    vi.spyOn(devClient, 'loadDevJson').mockResolvedValue(baseFile);
    renderField({ kind: 'item', entityId: 'unique.unknown', inferredPath: null });
    const field = await screen.findByTestId('dev-image-field');
    expect(field.querySelector('img')).toBeNull();
  });

  it('Clear override calls saveDevJson with the entry removed', async () => {
    vi.spyOn(devClient, 'loadDevJson').mockResolvedValue(baseFile);
    const saveSpy = vi.spyOn(devClient, 'saveDevJson').mockResolvedValue(undefined);
    renderField({ kind: 'class', entityId: 'barbarian', inferredPath: '/inferred/barb.png' });
    const clearBtn = await screen.findByRole('button', { name: /clear|清除/i });
    await waitFor(() => { expect((clearBtn as HTMLButtonElement).disabled).toBe(false); });
    await act(() => {
      fireEvent.click(clearBtn);
      return Promise.resolve();
    });
    await waitFor(() => { expect(saveSpy).toHaveBeenCalled(); });
    const [path, json] = saveSpy.mock.calls[0] ?? [];
    expect(path).toBe('src/data/imageOverrides.json');
    const written = json as { overrides: { class: Record<string, string> } };
    expect(written.overrides.class.barbarian).toBeUndefined();
  });

  it('Save persists the draft override path', async () => {
    vi.spyOn(devClient, 'loadDevJson').mockResolvedValue(baseFile);
    const saveSpy = vi.spyOn(devClient, 'saveDevJson').mockResolvedValue(undefined);
    renderField({ kind: 'class', entityId: 'paladin', inferredPath: null });
    const input = await screen.findByLabelText(/override path|覆盖路径/i);
    await act(() => {
      fireEvent.change(input, { target: { value: '/custom/pal.webp' } });
      return Promise.resolve();
    });
    const saveBtn = await screen.findByRole('button', { name: /save override|保存覆盖/i });
    await act(() => {
      fireEvent.click(saveBtn);
      return Promise.resolve();
    });
    await waitFor(() => { expect(saveSpy).toHaveBeenCalled(); });
    const [, json] = saveSpy.mock.calls[0] ?? [];
    const written = json as { overrides: { class: Record<string, string> } };
    expect(written.overrides.class.paladin).toBe('/custom/pal.webp');
    // Existing barbarian override is preserved.
    expect(written.overrides.class.barbarian).toBe('/custom/barb.png');
  });
});
