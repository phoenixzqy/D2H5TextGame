/**
 * GameImage — D2-themed image component with graceful fallback.
 *
 * On load error or missing `src`, renders a styled div with
 * a `fallbackIcon` character (e.g. a class initial or emoji).
 *
 * All images are `loading="lazy"` + `decoding="async"` by default.
 */
import { useState } from 'react';

type ImageSize = 'xs' | 'sm' | 'md' | 'lg';

interface GameImageProps {
  /** Image URL. When empty / undefined the fallback is shown immediately. */
  src?: string | null;
  alt: string;
  /** Single character / emoji rendered when the image can't load. */
  fallbackIcon?: string;
  /** Extra Tailwind classes on the outer wrapper. */
  className?: string;
  /** Preset size. Defaults to `'md'`. */
  size?: ImageSize;
  /** If true the outer wrapper is a plain span (for inline contexts). */
  inline?: boolean;
}

const SIZE_CLASSES: Record<ImageSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
};

export function GameImage({
  src,
  alt,
  fallbackIcon = '?',
  className = '',
  size = 'md',
  inline = false,
}: GameImageProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  const sizeClass = SIZE_CLASSES[size];
  const Tag = inline ? 'span' : 'div';

  return (
    <Tag
      className={[
        'relative shrink-0 overflow-hidden',
        'rounded border border-d2-border',
        'bg-gradient-to-br from-d2-panel to-d2-bg',
        'flex items-center justify-center',
        sizeClass,
        className,
      ].join(' ')}
      aria-hidden
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => { setErrored(true); }}
        />
      ) : (
        <span className="font-serif text-d2-gold select-none leading-none">
          {fallbackIcon}
        </span>
      )}
    </Tag>
  );
}
