/**
 * ScreenShell — common layout for all in-game screens.
 * Provides safe-area-aware container, scrollable main, and slot for BottomNav.
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
      // scrolls. Children — the sidebar/nav and the main column — share
      // its height; only `<main>` is allowed to scroll vertically.
      className="d2-shell h-screen h-[100dvh] text-d2-white flex flex-col md:flex-row overflow-hidden"
      data-testid={testId}
    >
      {!hideNav && <BottomNav />}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <SaveFailureNotice />
        <header
          className="d2-header shrink-0 z-30
                     flex flex-wrap items-center gap-x-3 gap-y-2 empty:hidden
                     px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          {title && (
            <div className="d2-screen-title flex-1 basis-40 min-w-0 break-words text-d2-gold font-serif text-lg">
              {title}
            </div>
          )}
          <CharacterHud />
        </header>
        <main
          className={[
            'd2-main scrollbar-d2 relative flex-1 min-w-0 min-h-0 overflow-y-auto px-3 py-4 md:px-8 md:py-7',
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
          ].join(' ')}
        >
          {children}
        </main>
        {footer && <div className="d2-footer shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
