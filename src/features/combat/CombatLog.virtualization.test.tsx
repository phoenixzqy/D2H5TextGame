import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import type { CombatLogEntry } from '@/stores/combatStore';
import { CombatLog } from './CombatLog';

let width = 320;
const heights = new Map<string, number>();
const observers = new Set<LayoutObserver>();
class LayoutObserver {
  targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) { observers.add(this); }
  observe(target: Element) { this.targets.add(target); }
  disconnect() { this.targets.clear(); observers.delete(this); }
  unobserve(target: Element) { this.targets.delete(target); }
}
function resize(target: Element) {
  act(() => {
    for (const observer of [...observers]) if (observer.targets.has(target))
      observer.callback([{ target } as ResizeObserverEntry], observer as unknown as ResizeObserver);
  });
}
const rowHeight = (el: HTMLElement) => heights.get(el.dataset.combatLogRow ?? '') ?? 20;
const contentHeight = (el: HTMLElement) => Array.from(el.children).reduce((sum, child) => sum +
  (child instanceof HTMLElement ? child.hasAttribute('data-combat-log-row') ? rowHeight(child) :
    Number.parseFloat(child.style.height || '0') : 0), 0);

beforeEach(async () => {
  await i18n.changeLanguage('en');
  width = 320; heights.clear();
  vi.stubGlobal('ResizeObserver', LayoutObserver);
  // Supply only browser geometry and observer delivery; the real component owns scrolling/windowing.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return new DOMRect(0, 0, width, this.hasAttribute('data-combat-log-row') ? rowHeight(this) : 100);
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return Math.max(100, contentHeight(this));
  });
  const positions = new WeakMap<HTMLElement, number>();
  vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockImplementation(function (this: HTMLElement) {
    return positions.get(this) ?? 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(function (this: HTMLElement, value: number) {
    positions.set(this, Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)));
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); expect(observers.size).toBe(0); });

const entry = (n: number): CombatLogEntry => ({ id: String(n), timestamp: 0,
  type: 'system', actorId: 'test', actorName: 'Test', message: `Message ${String(n)}` });
const entries = (count = 200) => Array.from({ length: count }, (_, n) => entry(n));
function fixture(initial = entries()) {
  const view = (rows: CombatLogEntry[]) => <I18nextProvider i18n={i18n}><CombatLog entries={rows} /></I18nextProvider>;
  const mounted = render(view(initial));
  return { log: screen.getByRole('log'), replace: (rows: CombatLogEntry[]) => { mounted.rerender(view(rows)); } };
}
function scrollTo(log: HTMLElement, position: number) {
  log.scrollTop = position; fireEvent.scroll(log);
}
function visibleAnchor(log: HTMLElement) {
  let top = 0;
  for (const child of Array.from(log.children)) {
    if (!(child instanceof HTMLElement)) continue;
    const height = child.hasAttribute('data-combat-log-row') ? rowHeight(child) : Number.parseFloat(child.style.height || '0');
    if (child.hasAttribute('data-combat-log-row') && top + height > log.scrollTop)
      return { id: child.dataset.combatLogRow, offset: top - log.scrollTop };
    top += height;
  }
  throw new Error('No mounted row covers the viewport');
}

it('preserves the visible message and partial offset when retained history drops its oldest entry', () => {
  const original = entries();
  const { log, replace } = fixture(original);
  scrollTo(log, 1007);
  const anchor = visibleAnchor(log);
  replace([...original.slice(1), { ...entry(0), id: 'new', message: 'New arrival' }]);
  expect(visibleAnchor(log)).toEqual(anchor);
  expect(log.querySelectorAll('[data-combat-log-row]').length).toBeLessThan(30);
  expect(log).not.toHaveTextContent('New arrival');
});

it('lets native scrolling move through newly measured rows without restoring the previous reading anchor', () => {
  const { log } = fixture();
  // Home/PageUp animate through unmeasured history in a real browser. Measuring
  // the overscan rows must not move each native scroll frame back down the log.
  for (let n = 20; n < 60; n++) heights.set(String(n), 80);
  scrollTo(log, 1007);
  expect(log.scrollTop).toBe(1007);
  scrollTo(log, 0);
  expect(log.scrollTop).toBe(0);
});

it('resolves End against the measured tail while keeping hover pause for later arrivals', () => {
  const { log, replace } = fixture();
  fireEvent.pointerOver(log);
  fireEvent.wheel(log, { deltaY: -100 });
  scrollTo(log, 1007);
  fireEvent.keyDown(log, { key: 'End' });
  expect(log.scrollTop).toBe(log.scrollHeight - log.clientHeight);
  expect(log.querySelector('[data-combat-log-row="199"]')).not.toBeNull();
  const position = log.scrollTop;
  replace([...entries().slice(1), entry(200)]);
  expect(log.scrollTop).toBeLessThanOrEqual(position);
});

it('keeps the surviving oldest message reachable when the message under the reader is evicted', () => {
  const original = entries();
  const { log, replace } = fixture(original);
  scrollTo(log, 0);
  replace([...original.slice(1), { ...entry(0), id: 'new', message: 'New arrival' }]);
  expect(visibleAnchor(log)).toEqual({ id: '1', offset: 0 });
  expect(log.scrollTop).toBe(0);
});

it('preserves the reader through wrapped-row measurement changes above the viewport', () => {
  const { log } = fixture();
  scrollTo(log, 1007);
  const anchor = visibleAnchor(log);
  const preceding = log.querySelector<HTMLElement>('[data-combat-log-row]');
  if (!preceding?.dataset.combatLogRow) throw new Error('Missing overscan row');
  expect(preceding.dataset.combatLogRow).not.toBe(anchor.id);
  heights.set(preceding.dataset.combatLogRow, 80);
  resize(preceding);
  expect(visibleAnchor(log)).toEqual(anchor);
});

it('invalidates wrapped heights on viewport resize while keeping the same reading anchor', () => {
  const { log } = fixture();
  scrollTo(log, 1007);
  const anchor = visibleAnchor(log);
  width = 200;
  for (let n = 0; n < 200; n++) heights.set(String(n), 40);
  resize(log);
  expect(visibleAnchor(log)).toEqual(anchor);
  expect(log.querySelectorAll('[data-combat-log-row]').length).toBeLessThan(30);
});

it('keeps the same message visible when reflow shrinks it past the saved partial offset', () => {
  const { log } = fixture();
  heights.set('50', 80);
  scrollTo(log, 1067);
  expect(visibleAnchor(log)).toEqual({ id: '50', offset: -67 });
  width = 400;
  heights.set('50', 20);
  resize(log);
  expect(visibleAnchor(log)).toEqual({ id: '50', offset: -19 });
});

it('follows the bottom of a newly appended message taller than the viewport', () => {
  const original = entries();
  const { log, replace } = fixture(original);
  heights.set('new', 300);
  replace([...original.slice(1), { ...entry(0), id: 'new', message: 'A very long wrapped message' }]);
  expect(log).toHaveTextContent('A very long wrapped message');
  expect(log.scrollHeight - log.scrollTop).toBe(log.clientHeight);
});

it('announces new arrivals without reannouncing recycled history during scrolling', () => {
  const original = entries();
  const { log, replace } = fixture(original);
  const announcements = screen.getByTestId('combat-log-announcements');
  expect(log).toHaveAttribute('aria-live', 'off');
  expect(announcements).toHaveAttribute('aria-live', 'polite');
  expect(announcements).toBeEmptyDOMElement();
  replace([...original.slice(1), { ...entry(0), id: 'new', message: 'Only this arrival' }]);
  expect(announcements).toHaveTextContent('Only this arrival');
  const announcedNode = announcements.firstChild;
  scrollTo(log, 0);
  expect(announcements.firstChild).toBe(announcedNode);
  expect(announcements).not.toHaveTextContent('Message');
  expect(log).not.toHaveTextContent('Only this arrival');
});

it('clears row state with the log and follows a fresh short log', () => {
  const { log, replace } = fixture();
  scrollTo(log, 1007);
  replace([]);
  expect(log).toHaveTextContent(i18n.t('combat:logEmpty'));
  expect(log.querySelector('[data-combat-log-row]')).toBeNull();
  replace(entries(1));
  expect(log).toHaveTextContent('Message 0');
  expect(log.scrollTop).toBe(0);
});
