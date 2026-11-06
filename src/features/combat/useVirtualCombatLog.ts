import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { CombatLogEntry } from '@/stores/combatStore';

const ESTIMATED_HEIGHT = 20;
const OVERSCAN = 6;
interface Layout { ids: string[]; offsets: number[]; height: number }
interface Anchor { layout: Layout; index: number; offset: number }

function makeLayout(ids: string[], heights: Map<string, number>): Layout {
  const offsets = [0];
  for (const id of ids) offsets.push((offsets[offsets.length - 1] ?? 0) + (heights.get(id) ?? ESTIMATED_HEIGHT));
  return { ids, offsets, height: offsets[offsets.length - 1] ?? 0 };
}
function rowAt(layout: Layout, top: number) {
  const index = layout.ids.findIndex((_, n) => (layout.offsets[n + 1] ?? 0) > top);
  return index < 0 ? Math.max(0, layout.ids.length - 1) : index;
}
function readingAnchor(layout: Layout, top: number, padding: number): Anchor | null {
  if (!layout.ids.length) return null;
  const index = rowAt(layout, top - padding);
  return { layout, index, offset: top - padding - (layout.offsets[index] ?? 0) };
}
function anchorTop(anchor: Anchor | null, layout: Layout, padding: number): number | null {
  if (!anchor) return null;
  for (let n = anchor.index; n < anchor.layout.ids.length; n++) {
    const id = anchor.layout.ids[n];
    if (id === undefined) continue;
    const index = layout.ids.indexOf(id);
    if (index >= 0) {
      const start = layout.offsets[index] ?? 0;
      const height = (layout.offsets[index + 1] ?? start) - start;
      const oldHeight = (anchor.layout.offsets[anchor.index + 1] ?? 0) - (anchor.layout.offsets[anchor.index] ?? 0);
      // Reflow can remove the saved pixel offset. Keep this message visible
      // at its last remaining pixel instead of skipping into a later message.
      const offset = height < oldHeight ? Math.min(anchor.offset, Math.max(0, height - 1)) : anchor.offset;
      return n === anchor.index ? padding + start + offset : index === 0 ? 0 : padding + start;
    }
  }
  return 0;
}

/** Window retained log rows; preserve message identity/offset through measurement and head eviction. */
export function useVirtualCombatLog(
  entries: readonly CombatLogEntry[], container: RefObject<HTMLDivElement>, paused: boolean,
) {
  const ids = useMemo(() => entries.map(entry => entry.id), [entries]);
  const heights = useRef(new Map<string, number>());
  const viewport = useRef({ top: 0, height: 280, width: 0, padding: 0 });
  const committed = useRef<Layout>({ ids: [], offsets: [0], height: 0 });
  const pendingAnchor = useRef<Anchor | null>(null);
  const nativeScroll = useRef(false);
  const endRequested = useRef(false);
  const [, repaint] = useState(0);
  const layout = makeLayout(ids, heights.current);
  const following = !paused || endRequested.current;
  const top = following ? Math.max(0, layout.height - viewport.current.height) :
    anchorTop(pendingAnchor.current, layout, viewport.current.padding) ?? viewport.current.top;
  const start = Math.max(0, rowAt(layout, Math.max(0, top - viewport.current.padding)) - OVERSCAN);
  const end = Math.min(entries.length, rowAt(layout, top + viewport.current.height) + OVERSCAN + 1);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const view = viewport.current;
    // A native Home/PageUp/wheel animation owns its current scroll position.
    // Anchor only stationary readers, including subsequent appends and resizes.
    const anchor = !following && !nativeScroll.current ?
      pendingAnchor.current ?? readingAnchor(committed.current, view.top, view.padding) : null;
    const width = el.getBoundingClientRect().width;
    const height = el.clientHeight || view.height;
    let changed = height !== view.height;
    if (width !== view.width) { heights.current.clear(); view.width = width; changed = true; }
    view.height = height;
    view.padding = Number.parseFloat(getComputedStyle(el).paddingTop) || 0;
    const retained = new Set(ids);
    for (const id of heights.current.keys()) if (!retained.has(id)) heights.current.delete(id);
    for (const row of el.querySelectorAll<HTMLElement>('[data-combat-log-row]')) {
      const id = row.dataset.combatLogRow;
      if (id === undefined) continue;
      const measured = row.getBoundingClientRect().height;
      if (measured > 0 && Math.abs(measured - (heights.current.get(id) ?? ESTIMATED_HEIGHT)) > 0.1) {
        heights.current.set(id, measured); changed = true;
      }
    }
    if (changed) {
      // Re-render spacers before restoring scrollTop, or the browser could clamp
      // the target against stale geometry. Keep one anchor across measurement passes.
      pendingAnchor.current = anchor;
      repaint(value => value + 1);
      return;
    }
    const previousTop = view.top;
    if (following) el.scrollTop = el.scrollHeight;
    else {
      const target = anchorTop(anchor, layout, view.padding);
      if (target !== null && Math.abs(el.scrollTop - Math.max(0, target)) > 0.5) el.scrollTop = Math.max(0, target);
    }
    view.top = el.scrollTop;
    committed.current = layout;
    pendingAnchor.current = null;
    nativeScroll.current = false;
    endRequested.current = false;
    if (paused && previousTop !== view.top) repaint(value => value + 1);
  }, [container, following, paused, ids, layout]);

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') {
      const resize = () => { repaint(value => value + 1); };
      window.addEventListener('resize', resize);
      return () => { window.removeEventListener('resize', resize); };
    }
    let active = true;
    const observer = new ResizeObserver(() => {
      if (!active) return;
      const view = viewport.current;
      if (el.getBoundingClientRect().width !== view.width || (el.clientHeight > 0 && el.clientHeight !== view.height) ||
        Array.from(el.querySelectorAll<HTMLElement>('[data-combat-log-row]')).some(row => {
          const height = row.getBoundingClientRect().height;
          return height > 0 && Math.abs(height - (heights.current.get(row.dataset.combatLogRow ?? '') ?? ESTIMATED_HEIGHT)) > 0.1;
        })) repaint(value => value + 1);
    });
    observer.observe(el);
    for (const row of el.querySelectorAll('[data-combat-log-row]')) observer.observe(row);
    return () => { active = false; observer.disconnect(); };
  }, [container, ids, start, end]);

  const syncViewport = useCallback(() => {
    const el = container.current;
    if (el && viewport.current.top !== el.scrollTop) {
      nativeScroll.current = true;
      pendingAnchor.current = null;
      viewport.current.top = el.scrollTop;
      repaint(value => value + 1);
    }
  }, [container]);
  const scrollToEnd = useCallback(() => {
    // End's native destination can become stale as wrapped rows are measured.
    // Resolve the tail once, without changing hover/touch pause for new entries.
    endRequested.current = true;
    repaint(value => value + 1);
  }, []);

  return {
    visibleEntries: entries.slice(start, end),
    before: layout.offsets[start] ?? 0,
    after: layout.height - (layout.offsets[end] ?? 0),
    syncViewport,
    scrollToEnd,
  };
}
