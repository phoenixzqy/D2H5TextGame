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
  return (
    <button ref={ref} type="button" className={`d2-button d2-button--${variant} px-4 py-2 ${className}`} {...props}>
      {children}
    </button>
  );
});
