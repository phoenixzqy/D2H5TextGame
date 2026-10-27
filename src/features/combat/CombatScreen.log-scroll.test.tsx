import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, playerToCombatUnit } from '@/stores/combatHelpers';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CombatScreen } from './CombatScreen';

beforeEach(() => {
  abortSubAreaRun();
  useCombatStore.getState().reset();
  useMapStore.getState().reset();
  useMetaStore.getState().reset();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});

afterEach(() => {
  cleanup();
  abortSubAreaRun();
  useCombatStore.getState().reset();
  useMapStore.getState().reset();
  useMetaStore.getState().reset();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

function append(message: string) {
  act(() => { useCombatStore.getState().addLogEntry({ type: 'system', actorId: 'system', actorName: 'System', message }); });
}

function touch(log: HTMLElement, type: 'touchStart' | 'touchEnd' | 'touchCancel', active: number[], changed: number[]) {
  fireEvent[type](log, { touches: active.map(identifier => ({ identifier })),
    changedTouches: changed.map(identifier => ({ identifier })) });
}

function pointer(log: HTMLElement, type: 'pointerover' | 'pointerout' | 'pointercancel' | 'pointerdown' | 'pointerup', pointerType: 'mouse' | 'pen' | 'touch') {
  fireEvent(log, Object.assign(new Event(type, { bubbles: true }), { pointerType }));
}

async function logFixture(locale: 'en' | 'zh-CN' = 'en') {
  await i18n.changeLanguage(locale);
  const player = createMockPlayer('Log reader', 'sorceress');
  usePlayerStore.getState().setPlayer(player);
  useCombatStore.setState({ inCombat: true, isPaused: true,
    playerTeam: [playerToCombatUnit(player)], recordedEvents: [], eventCursor: 0 });
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CombatScreen />
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  const log = screen.getByRole('log');
  let height = 1000;
  // jsdom has no layout; only the browser geometry boundary is supplied.
  Object.defineProperties(log, {
    scrollHeight: { configurable: true, get: () => height },
    clientHeight: { configurable: true, value: 100 },
  });
  append('First visible entry');
  return { log, grow: () => { height += 100; } };
}

describe('combat log reading and bounded automatic scrolling', () => {
  it('follows replaced entries after the store and DOM reach the 200-entry cap', async () => {
    const { log, grow } = await logFixture();
    for (let n = 0; n < 200; n++) append('Entry ' + String(n));
    expect(useCombatStore.getState().log).toHaveLength(200);
    expect(log.children).toHaveLength(200);
    expect(log).not.toHaveTextContent('First visible entry');
    grow();
    append('A new wrapped entry after the cap');
    expect(log.scrollTop).toBe(log.scrollHeight);
    expect(log.children).toHaveLength(200);
    expect(log.lastElementChild).toHaveTextContent('A new wrapped entry after the cap');
  });

  for (const locale of ['en', 'zh-CN'] as const) {
    it('reports manual scroll-away and resumes only at the bottom in ' + locale, async () => {
      const { log, grow } = await logFixture(locale);
      expect(log).toHaveAccessibleName(i18n.t('combat:log'));
      log.scrollTop = 100;
      fireEvent.scroll(log);
      expect(screen.getByTestId('log-hover-paused-hint')).toHaveTextContent(i18n.t('combat:logHoverPausedHint'));
      grow();
      append('Arrives while reading older entries');
      expect(log.scrollTop).toBe(100);
      log.scrollTop = log.scrollHeight - log.clientHeight;
      fireEvent.scroll(log);
      expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
      grow();
      append('Follow after reaching the bottom');
      expect(log.scrollTop).toBe(log.scrollHeight);
    });
  }

  it('holds a touch at the bottom and resumes after the last touch ends', async () => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1], [1]);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    grow();
    append('Arrives during touch');
    expect(log.scrollTop).toBe(1000);
    touch(log, 'touchEnd', [], [1]);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it.each(['touchEnd', 'touchCancel'] as const)('keeps remaining touches paused after %s', async event => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1, 2], [1, 2]);
    touch(log, event, [2], [1]);
    grow();
    append('Arrives while one touch remains');
    expect(log.scrollTop).toBe(1000);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    touch(log, event, [], [2]);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it('does not repin a log scrolled away during a touch when the touch ends', async () => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1], [1]);
    fireEvent.touchMove(log, { touches: [{ identifier: 1 }] });
    log.scrollTop = 200;
    fireEvent.scroll(log);
    touch(log, 'touchEnd', [], [1]);
    grow();
    append('Arrives after touch scrolling');
    expect(log.scrollTop).toBe(200);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
  });

  it.each(['mouse', 'pen'] as const)('pauses during %s hover and follows again after leaving', async pointerType => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', pointerType);
    grow();
    append('Arrives during hover');
    expect(log.scrollTop).toBe(1000);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    pointer(log, 'pointerout', pointerType);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it('ends a touch without leaving synthetic touch-pointer hover paused', async () => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'touch');
    touch(log, 'touchStart', [1], [1]);
    touch(log, 'touchEnd', [], [1]);
    grow();
    append('Arrives after finger release');
    expect(log.scrollTop).toBe(log.scrollHeight);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
  });

  it('keeps touch pause when a hovering pointer leaves', async () => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    touch(log, 'touchStart', [1], [1]);
    pointer(log, 'pointerout', 'mouse');
    grow();
    append('Arrives after mouse leaves but finger remains');
    expect(log.scrollTop).toBe(1000);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    touch(log, 'touchEnd', [], [1]);
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it('keeps hover pause when a touch ends and clears a cancelled hover pointer', async () => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'pen');
    touch(log, 'touchStart', [1], [1]);
    touch(log, 'touchEnd', [], [1]);
    grow();
    append('Arrives while the pen still hovers');
    expect(log.scrollTop).toBe(1000);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    pointer(log, 'pointercancel', 'pen');
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it('resumes when the log touch ends even if an unrelated finger remains elsewhere', async () => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1, 2], [1]);
    touch(log, 'touchEnd', [2], [1]);
    grow();
    append('Arrives with only an outside touch remaining');
    expect(log.scrollTop).toBe(log.scrollHeight);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
  });

  it.each(['touch', 'hover'] as const)('does not mistake browser scroll anchoring during %s for reader intent', async mode => {
    const { log, grow } = await logFixture();
    if (mode === 'touch') touch(log, 'touchStart', [1], [1]);
    else pointer(log, 'pointerover', 'mouse');
    grow();
    append('Native layout changes while the reader holds still');
    log.scrollTop = 850;
    fireEvent.scroll(log);
    if (mode === 'touch') touch(log, 'touchEnd', [], [1]);
    else pointer(log, 'pointerout', 'mouse');
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it.each(['wheel', 'keyboard', 'scrollbar'] as const)('respects intentional %s scrolling while hovered', async input => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    if (input === 'wheel') fireEvent.wheel(log, { deltaY: -100 });
    else if (input === 'keyboard') fireEvent.keyDown(log, { key: 'PageUp' });
    else fireEvent(log, Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'mouse' }));
    log.scrollTop = 100;
    fireEvent.scroll(log);
    pointer(log, 'pointerout', 'mouse');
    grow();
    append('Arrives while the reader stays scrolled away');
    expect(log.scrollTop).toBe(100);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
  });

  it.each(['pointerout', 'pointercancel'] as const)('samples a wheel scroll before %s releases hover, even when the scroll event is delayed', async end => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    fireEvent.wheel(log, { deltaY: -100 });
    log.scrollTop = 100;
    pointer(log, end, 'mouse');
    grow();
    append('Arrives before the delayed native scroll event');
    expect(log.scrollTop).toBe(100);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
  });

  it('samples a moved touch before its last release when the scroll event is delayed', async () => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1], [1]);
    fireEvent.touchMove(log, { touches: [{ identifier: 1 }] });
    log.scrollTop = 100;
    touch(log, 'touchEnd', [], [1]);
    grow();
    append('Arrives before the released touch scroll event');
    expect(log.scrollTop).toBe(100);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
  });

  it.each(['touchEnd', 'touchCancel'] as const)('keeps an 8px touch scroll unpinned when the native scroll event arrives after %s', async end => {
    const { log, grow } = await logFixture();
    touch(log, 'touchStart', [1], [1]);
    fireEvent.touchMove(log, { touches: [{ identifier: 1 }] });
    const readingPosition = log.scrollHeight - log.clientHeight - 8;
    log.scrollTop = readingPosition;
    touch(log, end, [], [1]);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    fireEvent.scroll(log);
    expect(log.scrollTop).toBe(readingPosition);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    grow();
    append('Arrives after release and its delayed native scroll');
    expect(log.scrollTop).toBe(readingPosition);
    log.scrollTop = log.scrollHeight - log.clientHeight;
    fireEvent.scroll(log);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    grow();
    append('Follows after returning to the physical bottom');
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  for (const pointerType of ['mouse', 'pen'] as const) {
    it.each(['pointerup', 'pointerout', 'pointercancel'] as const)('keeps an 8px ' + pointerType + ' scroll unpinned through %s and a delayed native scroll', async end => {
      const { log, grow } = await logFixture();
      pointer(log, 'pointerover', pointerType);
      pointer(log, 'pointerdown', pointerType);
      const readingPosition = log.scrollHeight - log.clientHeight - 8;
      log.scrollTop = readingPosition;
      pointer(log, end, pointerType);
      // Releasing a scrollbar drag can precede both leaving and queued scroll.
      if (end === 'pointerup') pointer(log, 'pointerout', pointerType);
      expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
      fireEvent.scroll(log);
      expect(log.scrollTop).toBe(readingPosition);
      expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
      grow();
      append('Arrives after pointer release and its delayed native scroll');
      expect(log.scrollTop).toBe(readingPosition);
      log.scrollTop = log.scrollHeight - log.clientHeight;
      fireEvent.scroll(log);
      expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
      grow();
      append('Follows after returning to the physical bottom');
      expect(log.scrollTop).toBe(log.scrollHeight);
    });
  }

  it('forgets completed reader scrolling after returning to the bottom during hover', async () => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    fireEvent.wheel(log, { deltaY: -100 });
    log.scrollTop = 100;
    fireEvent.scroll(log);
    fireEvent.wheel(log, { deltaY: 100 });
    log.scrollTop = log.scrollHeight - log.clientHeight;
    fireEvent.scroll(log);
    grow();
    append('Native layout changes after the reader reached the bottom');
    log.scrollTop = 850;
    fireEvent.scroll(log);
    pointer(log, 'pointerout', 'mouse');
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it.each(['wheel', 'keyboard'] as const)('does not mistake %s input already at the bottom for scrolling older entries', async input => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    if (input === 'wheel') fireEvent.wheel(log, { deltaY: 100 });
    else fireEvent.keyDown(log, { key: 'End' });
    grow();
    append('Native row replacement after a wheel that could not scroll');
    log.scrollTop = 850;
    pointer(log, 'pointerout', 'mouse');
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
    expect(log.scrollTop).toBe(log.scrollHeight);
  });

  it('retains a smooth keyboard scroll gesture through its first few pixels near the bottom', async () => {
    const { log, grow } = await logFixture();
    pointer(log, 'pointerover', 'mouse');
    fireEvent.keyDown(log, { key: 'PageUp' });
    log.scrollTop = log.scrollHeight - log.clientHeight - 8;
    fireEvent.scroll(log);
    log.scrollTop = 100;
    fireEvent.scroll(log);
    pointer(log, 'pointerout', 'mouse');
    grow();
    append('Arrives after smooth keyboard scrolling finished');
    expect(log.scrollTop).toBe(100);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
  });

  it('pauses following immediately when keyboard reading starts without a hovering pointer', async () => {
    const { log, grow } = await logFixture();
    log.scrollTop = log.scrollHeight - log.clientHeight;
    fireEvent.keyDown(log, { key: 'PageUp' });
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    log.scrollTop -= 8;
    fireEvent.scroll(log);
    const readingPosition = log.scrollTop;
    grow();
    append('Arrives during the first pixels of native keyboard scrolling');
    expect(log.scrollTop).toBe(readingPosition);
    expect(screen.getByTestId('log-hover-paused-hint')).toBeVisible();
    log.scrollTop = log.scrollHeight - log.clientHeight;
    fireEvent.scroll(log);
    expect(screen.queryByTestId('log-hover-paused-hint')).not.toBeInTheDocument();
  });
});
