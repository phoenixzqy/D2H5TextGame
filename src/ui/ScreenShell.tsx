/**
 * ScreenShell — common layout for all in-game screens.
 * Provides safe-area-aware container, scrollable main, and slot for BottomNav.
 */
import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface ScreenShellProps {
  children: ReactNode;
  testId?: string;
  /** Optional title rendered as a sticky top header */
  title?: ReactNode;
  /** Hide bottom nav (e.g. for combat screen takeover, or before character creation) */
  hideNav?: boolean;
}

export function ScreenShell({ children, testId, title, hideNav = false }: ScreenShellProps) {
  return (
    <div
      className="min-h-[100dvh] bg-d2-bg text-d2-white flex flex-col md:flex-row overflow-x-hidden"
      data-testid={testId}
    >
      {!hideNav && <BottomNav />}
      <div className="flex-1 flex flex-col min-w-0">
        {title && (
          <header
            className="sticky top-0 z-30 bg-d2-panel/95 backdrop-blur border-b border-d2-border
                       px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          >
            <div className="text-d2-gold font-serif text-lg">{title}</div>
          </header>
        )}
        <main
          className={[
            'flex-1 min-w-0 overflow-y-auto px-3 py-3 md:px-6 md:py-4',
            hideNav ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-4',
          ].join(' ')}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
