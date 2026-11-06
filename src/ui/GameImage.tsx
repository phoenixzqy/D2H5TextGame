import { publicAssetUrl } from '@/ui/publicAssetUrl';
/**
 * GameImage — D2-themed image component with graceful fallback.
 *
 * On load error or missing `src`, renders a styled div with
 * a `fallbackIcon` character (e.g. a class initial or emoji).
 *
 * All images are `loading="lazy"` + `decoding="async"` by default.
 */
import { useRecoverableImage } from './useRecoverableImage';

type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'fill';
type ObjectPosition = 'top' | 'center';

interface GameImageProps {
  /** Image URL. When empty / undefined the fallback is shown immediately. */
  src?: string | null;
  alt: string;
  /** Single character / emoji rendered when the image can't load. */
  fallbackIcon?: string;
  /** Extra Tailwind classes on the outer wrapper. */
  className?: string;
  /** Complete image classes when the parent owns fitting and padding. */
  imageClassName?: string;
  /** Preset size. Defaults to `'md'`. */
  size?: ImageSize;
  /** If true the outer wrapper is a plain span (for inline contexts). */
  inline?: boolean;
  /**
   * Vertical anchor for the cropped image. Defaults to `'center'`. Pass
   * `'top'` for portraits — generated character/monster art has the head in
   * the upper third of the canvas, so center-cropping decapitates them.
   */
  objectPosition?: ObjectPosition;
}

const SIZE_CLASSES: Record<ImageSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  fill: 'w-full h-full text-xs'
};

export function GameImage({
  src,
  alt,
  fallbackIcon = '?',
  className = '',
  imageClassName,
  size = 'md',
  inline = false,
  objectPosition = 'center'
}: GameImageProps) {
  const sizeClass = SIZE_CLASSES[size];
  const Tag = inline ? 'span' : 'div';
  const posClass = objectPosition === 'top' ? 'object-top' : 'object-center';

  return (
    <Tag
      className={[
        'd2-image relative shrink-0 overflow-hidden',
        'rounded border border-d2-border',
        'bg-gradient-to-br from-d2-panel to-d2-bg',
        'flex items-center justify-center',
        sizeClass,
        className
      ].join(' ')}
      aria-hidden
    >
      {/* A source change gets its own loading/error state without replacing the wrapper. */}
      <ImageContent key={src} src={src} alt={alt} fallbackIcon={fallbackIcon} posClass={posClass} imageClassName={imageClassName} />
    </Tag>
  );
}

function ImageContent({
  src,
  alt,
  fallbackIcon,
  posClass,
  imageClassName
}: {
  src: GameImageProps['src'];
  alt: string;
  fallbackIcon: string;
  posClass: string;
  imageClassName: string | undefined;
}) {
  const { errored, onError } = useRecoverableImage();

  return src && !errored ? (
    <img
      src={publicAssetUrl(src)}
      alt={alt}
      className={imageClassName ?? `w-full h-full object-cover ${posClass}`}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  ) : (
    <span className="font-serif text-d2-gold select-none leading-none">{fallbackIcon}</span>
  );
}
