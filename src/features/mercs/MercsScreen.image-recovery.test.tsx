import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { MercsScreen } from './MercsScreen';

function image(card: HTMLElement): HTMLImageElement {
  const found = card.querySelector('img');
  if (!found) throw new Error('Expected mercenary portrait');
  return found;
}

describe.each(['en', 'zh-CN'])('mercenary portrait recovery in %s', locale => {
  beforeEach(async () => {
    await i18n.changeLanguage(locale);
    useMercStore.getState().reset();
  });

  it.each(['hire', 'owned'])('recovers the failed %s portrait while keeping the neighboring portrait mounted', surface => {
    const def = loadMercPool().pool[0];
    if (!def) throw new Error('Expected an authored mercenary');
    act(() => { useMercStore.getState().addMerc(createMercFromDef(def)); });
    render(<I18nextProvider i18n={i18n}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MercsScreen />
      </MemoryRouter>
    </I18nextProvider>);
    const hire = screen.getByTestId(`hire-merc-${def.id}`);
    const owned = screen.getByTestId(`merc-card-${def.id}`);
    const card = surface === 'hire' ? hire : owned;
    const neighbor = surface === 'hire' ? owned : hire;
    const healthy = image(neighbor);
    const first = image(card);
    const src = first.getAttribute('src');
    expect(src).toBeTruthy();
    const text = card.textContent;
    fireEvent.online(window);
    expect(image(card)).toBe(first);
    fireEvent.error(first);
    expect(card.querySelector('img')).toBeNull();
    expect(image(neighbor)).toBe(healthy);
    expect(card.textContent).toBe(text);
    fireEvent.offline(window);
    expect(card.querySelector('img')).toBeNull();
    fireEvent.online(window);
    const retry = image(card);
    expect(retry).not.toBe(first);
    expect(retry).toHaveAttribute('src', src);
    expect(retry).toHaveAttribute('alt', '');
    expect(retry).toHaveClass('object-top');
    expect(image(neighbor)).toBe(healthy);
    fireEvent.online(window);
    expect(image(card)).toBe(retry);
    fireEvent.error(retry);
    expect(card.querySelector('img')).toBeNull();
    expect(card.textContent).toBe(text);
  });
});
