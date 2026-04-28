/**
 * QuestsScreen smoke tests — verifies real quests from `quests/main.json` and
 * `quests/side.json` are surfaced and that statuses from `useMapStore`
 * override the default.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { QuestsScreen } from './QuestsScreen';
import { useMapStore } from '@/stores';

function renderScreen() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <MemoryRouter>
          <QuestsScreen />
        </MemoryRouter>
      </Suspense>
    </I18nextProvider>
  );
}

describe('QuestsScreen', () => {
  beforeEach(() => {
    act(() => {
      useMapStore.getState().reset();
    });
  });

  it('renders the main quest tab with real Act 1 quests by default', () => {
    renderScreen();
    // "Den of Evil" is the first main quest in act1.
    expect(screen.getByTestId('quest-quests/act1-den-of-evil')).toBeInTheDocument();
    expect(screen.getByTestId('quest-quests/act1-sisters-burial-grounds'))
      .toBeInTheDocument();
  });

  it('renders side quests when the side tab is selected', () => {
    renderScreen();
    const sideTab = screen.getByRole('tab', { name: /支线|side/i });
    fireEvent.click(sideTab);
    expect(
      screen.getByTestId('quest-quests/side-act1-charsis-imbue')
    ).toBeInTheDocument();
  });

  it('reflects in-progress status from useMapStore', () => {
    act(() => {
      useMapStore.getState().updateQuestProgress('quests/act1-den-of-evil', {
        status: 'inProgress',
        objectives: { 'obj-clear-den': false }
      });
    });
    renderScreen();
    const card = screen.getByTestId('quest-quests/act1-den-of-evil');
    expect(card.textContent).toMatch(/进行中|in progress/i);
  });
});
