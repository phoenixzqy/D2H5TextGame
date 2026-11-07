import '@/styles/viewport.css';
/**
 * ScreenShell — common layout for all in-game screens.
 * Provides safe-area-aware container, bounded main, and slot for BottomNav.
 */
import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { CharacterHud } from './CharacterHud';
import { SaveFailureNotice } from './SaveFailureNotice';

interface ScreenShellProps {
  children: ReactNode;
  testId?: string;
  /** Optional title rendered as a sticky top header */
  title?: ReactNode;
  /** Hide bottom nav (e.g. for combat screen takeover, or before character creation) */
  hideNav?: boolean;
  /** Persistent screen controls with reserved space outside the scrolling main. */
  footer?: ReactNode;
}

export function ScreenShell({ children, testId, title, hideNav = false, footer }: ScreenShellProps) {
  return (
    <div
      // Bug #10: outer shell is exactly 100dvh (fallback 100vh) and never
      // scrolls. Each screen allocates the remaining height to its active panel.
      className="d2-shell h-screen h-[100dvh] text-d2-white flex flex-col md:flex-row overflow-hidden"
      data-testid={testId}
    >
      {!hideNav && <BottomNav />}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <SaveFailureNotice />
        <header
          className="d2-header shrink-0 z-30
                     flex items-center gap-x-2 gap-y-1 empty:hidden
                     px-3 py-1 pt-[max(0.25rem,env(safe-area-inset-top))]"
        >
          {title && (
            <div className="d2-screen-title flex-1 min-w-0 break-words text-d2-gold font-serif text-lg">
              {title}
            </div>
          )}
          <CharacterHud />
        </header>
        <main
          className={[
            'd2-main relative flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden px-2 py-2 md:px-4 md:py-3',
            'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          ].join(' ')}
        >
          {children}
        </main>
        {footer && <div className="d2-footer shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
