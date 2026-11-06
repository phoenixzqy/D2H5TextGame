import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHydrationStore } from '@/stores/hydrationStore';
import { OfflineReturnToast } from './OfflineReturnToast';

function mountToast() {
  return render(<StrictMode><I18nextProvider i18n={i18n}>
    <OfflineReturnToast />
  </I18nextProvider></StrictMode>);
}

beforeEach(() => {
  useHydrationStore.setState({ status: 'ready', error: null, offlineReturn: null });
});

afterEach(() => {
  useHydrationStore.setState({ status: 'idle', error: null, offlineReturn: null });
});

describe('committed offline return feedback', () => {
  it.each(['en', 'zh-CN'] as const)('shows the receipt in %s, then stays dismissed across remounts', async locale => {
    await i18n.changeLanguage(locale);
    const mounted = mountToast();
    expect(screen.getByTestId('offline-return-live-region')).toBeEmptyDOMElement();
    expect(screen.getByTestId('offline-return-live-region')).toHaveAttribute('aria-live', 'polite');
    act(() => { useHydrationStore.setState({ offlineReturn: {
      awayMs: (4 * 60 + 12) * 60_000, bonusPct: .336, windowSeconds: 5040
    } }); });
    const english = locale === 'en';
    const toast = screen.getByTestId('offline-return-toast');
    expect(toast).toHaveTextContent(english ? 'Welcome back' : '欢迎归来');
    expect(toast).toHaveTextContent(english ? '4h 12m' : '4 小时 12 分钟');
    expect(toast).toHaveTextContent('+33.6%');
    expect(toast).toHaveTextContent(english ? '84m 0s' : '84 分钟 0 秒');
    expect(toast).toHaveTextContent(english ? 'On return' : '返回时');
    fireEvent.click(screen.getByRole('button', { name: english ? 'Close' : '关闭' }));
    expect(screen.getByTestId('offline-return-live-region')).toBeEmptyDOMElement();
    mounted.unmount();
    mountToast();
    expect(screen.queryByTestId('offline-return-toast')).not.toBeInTheDocument();
  });

  it('keeps a small legitimate bonus visible without rounding it to zero', async () => {
    await i18n.changeLanguage('en');
    useHydrationStore.setState({ offlineReturn: {
      awayMs: 60_000, bonusPct: .08 / 60, windowSeconds: 20
    } });
    mountToast();
    expect(screen.getByTestId('offline-return-toast')).toHaveTextContent('0h 1m');
    expect(screen.getByTestId('offline-return-toast')).toHaveTextContent('+0.13%');
    expect(screen.getByTestId('offline-return-toast')).toHaveTextContent('0m 20s');
  });

  it.each(['loading', 'error'] as const)('hides feedback while hydration is %s', status => {
    useHydrationStore.setState({ status, offlineReturn: {
      awayMs: 3_600_000, bonusPct: .08, windowSeconds: 1200
    } });
    mountToast();
    expect(screen.getByTestId('offline-return-live-region')).toBeEmptyDOMElement();
  });
});
