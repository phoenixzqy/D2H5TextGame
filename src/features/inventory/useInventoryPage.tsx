import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import { Button } from '@/ui/Button';

/** Visible item cards and controls without changing the owned collection. */
export interface InventoryPage {
  readonly items: readonly Item[];
  readonly capacity: number;
  readonly controls: ReactNode;
  readonly viewportRef: (node: HTMLDivElement | null) => void;
}

/** Keep UI work bounded while retaining every item and the owning tab's page. */
export function useInventoryPage(items: readonly Item[], capacity: number, onChange: () => void): InventoryPage {
  const { t } = useTranslation('inventory');
  const [requestedPage, setRequestedPage] = useState(0);
  const [pageSize, setPageSize] = useState(4);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const viewportRef = useCallback((node: HTMLDivElement | null) => { setViewport(node); }, []);
  useEffect(() => {
    if (!viewport) return;
    const measure = () => {
      const columns = Math.max(1, Math.floor((viewport.clientWidth + 8) / 72));
      const cellSize = (viewport.clientWidth - (columns - 1) * 8) / columns;
      const rows = Math.max(1, Math.floor((viewport.clientHeight + 8) / (cellSize + 8)));
      setPageSize(columns * rows);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => { observer.disconnect(); };
  }, [viewport]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pages - 1);
  useEffect(() => { setRequestedPage(page); }, [page]);
  const start = page * pageSize;
  const visible = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);
  const change = (value: number): void => {
    if (!Number.isFinite(value)) return;
    setRequestedPage(Math.max(0, Math.min(pages - 1, Math.trunc(value))));
    onChange();
  };
  const controls = (
    <nav aria-label={t('pagination.label')} className="min-w-0 shrink-0 space-y-1">
      <p role="status" aria-live="polite" className="text-sm text-d2-white/80">
        {t('pagination.status', { start: items.length ? start + 1 : 0, end: start + visible.length, total: items.length, page: page + 1, pages })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="min-h-[44px] min-w-[44px]" disabled={page === 0} onClick={() => { change(page - 1); }}>{t('pagination.previous')}</Button>
        <input type="number" min={1} max={pages} step={1} value={page + 1}
          aria-label={t('pagination.page')} onChange={event => { change(event.target.valueAsNumber - 1); }}
          className="d2-field min-h-[44px] w-20 rounded border border-d2-border bg-d2-bg px-2 text-d2-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-d2-gold" />
        <Button variant="secondary" className="min-h-[44px] min-w-[44px]" disabled={page === pages - 1} onClick={() => { change(page + 1); }}>{t('pagination.next')}</Button>
      </div>
    </nav>
  );
  return { items: visible, capacity: Math.min(pageSize, Math.max(visible.length, capacity - start)), controls, viewportRef };
}
