import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

/** Styled native button; forwards its DOM ref for dialog focus management. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}, ref) {
  const baseClasses =
    'px-6 py-3 rounded font-serif font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-d2-gold text-d2-bg hover:bg-d2-rare active:scale-95 shadow-lg hover:shadow-d2-gold/50',
    secondary:
      'bg-d2-panel text-d2-gold border-2 border-d2-border hover:border-d2-gold active:scale-95',
    danger:
      'bg-red-900 text-d2-white border-2 border-red-700 hover:bg-red-800 active:scale-95'
  };

  return (
    <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
});
