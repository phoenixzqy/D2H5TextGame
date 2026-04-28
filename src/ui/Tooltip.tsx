/**
 * Tooltip component for hover/long-press hints
 */

import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => { setIsVisible(true); }}
      onMouseLeave={() => { setIsVisible(false); }}
      onTouchStart={() => { setIsVisible(true); }}
      onTouchEnd={() => { setIsVisible(false); }}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2
            bg-d2-bg border-2 border-d2-gold rounded p-3 text-sm text-d2-white
            shadow-2xl shadow-d2-gold/20 pointer-events-none whitespace-normal
            max-w-xs min-w-max
            animate-fadeIn
            ${className}
          `}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px
                       border-8 border-transparent border-t-d2-gold"
          />
        </div>
      )}
    </div>
  );
}
