import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PagedListProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  pageSize?: number;
  className?: string;
  listClassName?: string;
  empty?: ReactNode;
}

/** Page a collection using the space and natural row size available to it. */
export function PagedList<T>({
  items,
  renderItem,
  pageSize,
  className = '',
  listClassName = '',
  empty
}: PagedListProps<T>) {
  const { t } = useTranslation('common');
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const measurement = useRef({ rowHeight: 0, width: 0 });
  const [capacity, setCapacity] = useState(1);
  const [page, setPage] = useState(0);
  const size = Math.max(1, Math.min(capacity, pageSize ?? 100));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * size;

  useLayoutEffect(() => {
    const container = viewport.current;
    const rows = list.current;
    if (!container || !rows || typeof ResizeObserver === 'undefined') return;
    // Keep the largest observed row at this width so mixed-height pages do not
    // repeatedly grow/shrink and move the user's selection between pages.
    const measured = measurement.current;
    const measure = () => {
      if (container.clientHeight === 0) return;
      if (measured.width !== container.clientWidth) {
        measured.rowHeight = 0;
        measured.width = container.clientWidth;
      }
      const style = getComputedStyle(rows);
      const columns = style.display === 'grid' ? style.gridTemplateColumns.split(' ').length : 1;
      const gap = Number.parseFloat(style.rowGap) || 0;
      for (const child of rows.children) {
        const margins = getComputedStyle(child);
        measured.rowHeight = Math.max(
          measured.rowHeight,
          child.getBoundingClientRect().height +
            (Number.parseFloat(margins.marginTop) || 0) +
            (Number.parseFloat(margins.marginBottom) || 0)
        );
      }
      if (measured.rowHeight > 0)
        setCapacity(
          Math.max(1, Math.floor((container.clientHeight + gap) / (measured.rowHeight + gap))) *
            columns
        );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(rows);
    measure();
    return () => {
      observer.disconnect();
    };
  }, [items, listClassName]);

  const changePage = (next: number) => {
    setPage(next);
    viewport.current?.scrollTo({ top: 0 });
  };

  return (
    <div className={`d2-paged-list ${className}`}>
      <div ref={viewport} className="d2-page-viewport scrollbar-d2">
        <ul ref={list} className={`d2-page-items ${listClassName}`}>
          {items.length ? (
            items
              .slice(start, start + size)
              .map((item, index) => (
                <Fragment key={start + index}>{renderItem(item, start + index)}</Fragment>
              ))
          ) : (
            <li>{empty}</li>
          )}
        </ul>
      </div>
      {items.length > 1 && (
        <div className="d2-pager" aria-label={t('pagination.label')}>
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => {
              changePage(currentPage - 1);
            }}
            aria-label={t('pagination.previous')}
          >
            ‹
          </button>
          <span aria-live="polite">
            {t('pagination.page', { current: currentPage + 1, total: pages })}
          </span>
          <button
            type="button"
            disabled={currentPage + 1 >= pages}
            onClick={() => {
              changePage(currentPage + 1);
            }}
            aria-label={t('pagination.next')}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
