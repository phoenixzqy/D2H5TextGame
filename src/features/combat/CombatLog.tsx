import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/ui';
import type { CombatLogEntry } from '@/stores/combatStore';
import { useVirtualCombatLog } from './useVirtualCombatLog';

/** Render the bounded log and follow new entries unless the reader pauses it. */
export function CombatLog({
  entries,
  onAutoScrollPausedChange,
}: {
  entries: CombatLogEntry[];
  onAutoScrollPausedChange?: (paused: boolean) => void;
}) {
  const { t } = useTranslation('combat');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const activeTouchIds = useRef(new Set<number>());
  const scrollGesture = useRef(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [touchPaused, setTouchPaused] = useState(false);
  const [pinned, setPinned] = useState(true);
  const paused = hoverPaused || touchPaused || !pinned;
  const { visibleEntries, before, after, syncViewport, scrollToEnd } = useVirtualCombatLog(entries, logContainerRef, paused);
  const previousIds = useRef(new Set(entries.map(entry => entry.id)));
  const [announcements, setAnnouncements] = useState<CombatLogEntry[]>([]);

  useEffect(() => {
    setAnnouncements(entries.filter(entry => !previousIds.current.has(entry.id)));
    previousIds.current = new Set(entries.map(entry => entry.id));
  }, [entries]);

  useEffect(() => {
    const el = logContainerRef.current;
    if (!el) return;
    // Observe the scroll container's native keyboard scrolling without turning
    // the live log into a custom keyboard widget or preventing browser defaults.
    const onKeyDown = (event: KeyboardEvent) => {
      syncViewport();
      if (event.key === 'End') scrollToEnd();
      const up = ['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey);
      const down = ['ArrowDown', 'PageDown', 'End'].includes(event.key) || (event.key === ' ' && !event.shiftKey);
      if (up && el.scrollTop > 0) {
        scrollGesture.current = true;
        setPinned(false);
      } else if (down && el.scrollTop + el.clientHeight < el.scrollHeight) scrollGesture.current = true;
    };
    el.addEventListener('keydown', onKeyDown);
    return () => { el.removeEventListener('keydown', onKeyDown); };
  }, [syncViewport, scrollToEnd]);

  useEffect(() => {
    onAutoScrollPausedChange?.(paused);
  }, [paused, onAutoScrollPausedChange]);

  const onScroll = () => {
    syncViewport();
    // Row replacement can trigger native scroll anchoring during a stationary
    // hover/touch. Only reader input should unpin that paused viewport.
    if ((hoverPaused || touchPaused) && !scrollGesture.current) return;
    const el = logContainerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Release can clear the gesture before its queued native scroll arrives.
    // An unpinned reader still has to reach the physical bottom to follow again.
    const atBottom = scrollGesture.current || !pinned ? distance <= 1 : distance < 24;
    setPinned(atBottom);
    if (distance <= 1) scrollGesture.current = false;
  };

  const endTouches = (event: TouchEvent<HTMLDivElement>) => {
    onScroll();
    for (const touch of Array.from(event.changedTouches)) activeTouchIds.current.delete(touch.identifier);
    setTouchPaused(activeTouchIds.current.size > 0);
    if (activeTouchIds.current.size === 0) scrollGesture.current = false;
  };

  return (
    <Panel
      title={t('log')}
      className="combat-log-panel flex min-h-0 flex-1 flex-col"
    >
      <div
        ref={logContainerRef}
        onScroll={onScroll}
        onPointerEnter={event => { if (event.pointerType !== 'touch') setHoverPaused(true); }}
        onPointerLeave={event => {
          if (event.pointerType !== 'touch') { onScroll(); setHoverPaused(false); scrollGesture.current = false; }
        }}
        onPointerCancel={event => {
          if (event.pointerType !== 'touch') { onScroll(); setHoverPaused(false); scrollGesture.current = false; }
        }}
        onPointerDown={event => { if (event.pointerType !== 'touch') scrollGesture.current = true; }}
        onPointerUp={event => { if (event.pointerType !== 'touch') { onScroll(); scrollGesture.current = false; } }}
        onWheel={event => {
          const el = logContainerRef.current;
          if (!el) return;
          // A wheel that cannot move this viewport must not make subsequent
          // row anchoring look like an intentional scroll away.
          if ((event.deltaY < 0 && el.scrollTop > 0) ||
              (event.deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight)) scrollGesture.current = true;
        }}
        onTouchStart={event => {
          if (activeTouchIds.current.size === 0) scrollGesture.current = false;
          for (const touch of Array.from(event.changedTouches)) activeTouchIds.current.add(touch.identifier);
          setTouchPaused(true);
        }}
        onTouchMove={() => { scrollGesture.current = true; }}
        onTouchEnd={endTouches}
        onTouchCancel={endTouches}
        className="d2-log min-h-0 flex-1 overflow-y-auto [overflow-anchor:none] bg-black/40 rounded p-2
                   font-mono text-xs leading-relaxed scrollbar-d2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-d2-gold"
        role="log"
        tabIndex={0}
        aria-label={t('log')}
        aria-live="off"
        aria-relevant="additions"
        data-testid="combat-log"
      >
        {entries.length === 0 ? (
          <p className="text-d2-white/40 italic">
            {t('logEmpty')}
          </p>
        ) : (
          <>
            <div aria-hidden="true" style={{ height: before }} />
            {visibleEntries.map((e) => (
              <div key={e.id} data-combat-log-row={e.id} className={`${logTypeClass(e.type)} break-words`}>
                <span className="text-d2-white/40 mr-1">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span>{e.message}</span>
              </div>
            ))}
            <div aria-hidden="true" style={{ height: after }} />
          </>
        )}
      </div>
      <div className="sr-only" aria-live="polite" aria-relevant="additions" aria-atomic="false"
        data-testid="combat-log-announcements">
        {announcements.map(entry => <div key={entry.id}>{entry.message}</div>)}
      </div>
    </Panel>
  );
}

function logTypeClass(type: CombatLogEntry['type']): string {
  switch (type) {
    case 'damage':
      return 'text-red-300';
    case 'heal':
      return 'text-green-300';
    case 'buff':
      return 'text-blue-300';
    case 'debuff':
      return 'text-purple-300';
    case 'death':
      return 'text-d2-rare';
    case 'skill':
      return 'text-d2-gold';
    case 'system':
    default:
      return 'text-d2-white/80';
  }
}
