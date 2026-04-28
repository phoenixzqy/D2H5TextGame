/**
 * Modal overlay component
 */

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`
          bg-d2-panel border-2 border-d2-gold rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-d2
          shadow-2xl shadow-d2-gold/20 animate-fadeIn
          ${className}
        `}
        onClick={(e) => { e.stopPropagation(); }}
      >
        {title && (
          <h2 id="modal-title" className="text-2xl font-serif font-bold text-d2-gold mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
