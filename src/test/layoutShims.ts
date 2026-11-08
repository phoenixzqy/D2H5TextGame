import { vi } from 'vitest';

/** Install jsdom stand-ins only for tests that render responsive navigation. */
export function stubResizeObserver(): void {
  vi.stubGlobal('ResizeObserver', class implements ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  });
}

export function stubMatchMedia(): void {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => false
  }));
}
