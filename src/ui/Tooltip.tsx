/**
 * Tooltip — viewport-edge-aware hover/long-press hint.
 *
 * Uses @floating-ui/react with `flip()` + `shift({ padding: 8 })` + `offset()`
 * middlewares so the tooltip never clips off-screen on small viewports
 * (Bug #8). The triggering element keeps its layout role; we render the
 * floating panel through a portal at `document.body` so transformed/clipping
 * ancestors (Tailwind `overflow-hidden`, `transform`, etc.) cannot crop it.
 *
 * Sources (fetched 2026-04-28; do not implement from memory):
 *   - https://floating-ui.com/docs/react           (useFloating, hooks)
 *   - https://floating-ui.com/docs/flip            (flip middleware)
 *   - https://floating-ui.com/docs/shift           (shift middleware)
 *   - https://floating-ui.com/docs/offset          (offset middleware)
 *   - https://floating-ui.com/docs/useHover        (interaction hook)
 *
 * Width policy: replaced legacy `min-w-max` with
 * `max-w-[min(18rem,calc(100vw-1rem))]` so the panel can shrink below 18rem
 * on a 360-px viewport instead of forcing horizontal page scroll.
 */
import { useState, type ReactNode } from 'react';
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  useRole,
  flip,
  shift,
  offset,
  autoUpdate,
  FloatingPortal,
  safePolygon
} from '@floating-ui/react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8, fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 })
    ]
  });

  const hover = useHover(context, {
    move: false,
    handleClose: safePolygon({ blockPointerEvents: false })
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      {/*
        Wrap children in a span we control for the reference ref. We keep it
        inline-block so the wrapped card retains its natural footprint.
      */}
      <span
        ref={refs.setReference}
        className="relative inline-block"
        // Touch support: tap-to-show, tap-elsewhere-to-dismiss (via useDismiss).
        onTouchStart={() => { setOpen(true); }}
        {...getReferenceProps()}
      >
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={[
              'z-50 pointer-events-none',
              'bg-d2-bg border-2 border-d2-gold rounded p-3 text-sm text-d2-white',
              'shadow-2xl shadow-d2-gold/20 whitespace-normal',
              'max-w-[min(18rem,calc(100vw-1rem))]',
              'motion-safe:animate-fadeIn',
              className
            ]
              .filter(Boolean)
              .join(' ')}
            role="tooltip"
            data-testid="tooltip"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
