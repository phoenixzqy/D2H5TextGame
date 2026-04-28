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
      className={`bg-d2-panel border-2 border-d2-border rounded-lg p-4 shadow-2xl ${className}`}
      data-testid={rest['data-testid']}
    >
      {title && (
        <h2 className="text-2xl font-serif font-bold text-d2-gold mb-4 border-b border-d2-border pb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
