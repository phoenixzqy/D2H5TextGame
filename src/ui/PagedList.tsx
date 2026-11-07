import { Fragment, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PagedListProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => ReactNode;
  pageSize?: number;
  className?: string;
  listClassName?: string;
  empty?: ReactNode;
}

/** Scroll compact collections; bound large collections without measuring partial rows. */
export function PagedList<T>({
  items,
  renderItem,
  pageSize = 100,
  className = '',
  listClassName = '',
  empty
}: PagedListProps<T>) {
  const { t } = useTranslation('common');
  const viewport = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const size = Math.max(1, Math.floor(pageSize));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * size;

  const changePage = (next: number) => {
    setPage(next);
    viewport.current?.scrollTo({ top: 0 });
  };

  return (
    <div className={`d2-paged-list ${className}`}>
      <div ref={viewport} className="d2-page-viewport scrollbar-d2">
        <ul className={`d2-page-items ${listClassName}`}>
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
      {pages > 1 && (
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
