/**
 * Modal overlay component
 */

import { useId, useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from 'react';
import { FloatingFocusManager, useFloating } from '@floating-ui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  initialFocus?: MutableRefObject<HTMLElement | null>;
  returnFocus?: MutableRefObject<HTMLElement | null>;
}

/** Contain keyboard focus and restore the opener when the dialog closes. */
export function Modal({ isOpen, onClose, title, children, className = '', initialFocus, returnFocus }: ModalProps) {
  const titleId = useId();
  const opener = useRef<HTMLElement | null>(null);
  const { refs, context } = useFloating({ open: isOpen });
  useLayoutEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Focus recovery listeners also require the reference, not only returnFocus.
    refs.setReference(opener.current);
    // Enter before the focus manager's passive effect hides the opener.
    // Its queued initial focus can otherwise run after background isolation.
    (initialFocus?.current ?? refs.floating.current)?.focus({ preventScroll: true });
  }, [isOpen, initialFocus, refs]);

  if (!isOpen) return null;

  return (
    <FloatingFocusManager context={context} initialFocus={initialFocus ?? refs.floating}
      returnFocus={returnFocus ?? opener} restoreFocus>
    {/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        if (!event.defaultPrevented) onClose();
      }}
    >
      <div
        ref={refs.setFloating}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`
          bg-d2-panel border-2 border-d2-gold rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-d2
          shadow-2xl shadow-d2-gold/20 animate-fadeIn
          ${className}
        `}
        onClick={(e) => { e.stopPropagation(); }}
      >
        {title && (
          <h2 id={titleId} className="text-2xl font-serif font-bold text-d2-gold mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
    </FloatingFocusManager>
  );
}
