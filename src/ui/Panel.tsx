interface PanelProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  /** Forwarded onto the root `<div>` for component-test queries. */
  'data-testid'?: string;
}

export function Panel({ children, className = '', title, ...rest }: PanelProps) {
  return (
    <div
      className={`d2-panel p-4 ${className}`}
      data-testid={rest['data-testid']}
    >
      {title && (
        <h2 className="d2-panel-title text-xl font-serif text-d2-gold mb-4 pb-3">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
