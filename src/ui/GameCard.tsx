/**
 * GameCard — unified card component for character / monster / item / merc.
 *
 * Owner: frontend-dev. Spec: docs/art/card-design-spec.md.
 *
 * Examples (informal — no Storybook setup):
 * ────────────────────────────────────────────
 *   <GameCard
 *     variant="character"
 *     size="md"
 *     name="Paladin"
 *     subtitle="Holy Order"
 *     image="/assets/d2/generated/class-portraits/classes.paladin.png"
 *     rarity="unique"
 *     stats={[
 *       { label:'STR', value:25 }, { label:'DEX', value:20 },
 *       { label:'VIT', value:25 }, { label:'ENG', value:15 }
 *     ]}
 *     bars={[
 *       { kind:'hp', current:55, max:55 },
 *       { kind:'mp', current:15, max:15 }
 *     ]}
 *   />
 *
 *   <GameCard variant="monster" size="md" name="Fallen" subtitle="Demon"
 *             rarity="common"
 *             stats={[{label:'ATK',value:12},{label:'HP',value:40,tone:'hp'}]}
 *             bars={[{kind:'hp',current:30,max:40}]} />
 *
 *   <GameCard variant="item" size="sm" name="Shako" rarity="unique"
 *             image="/assets/d2/generated/item-icons/items.unique.shako.png" />
 *
 * Mobile-first: all sizes use Tailwind utility classes; aspect ratios
 * are baked into per-variant size maps so cards never collapse.
 *
 * A11y: when `onClick` is provided the card renders as <button> with
 * `aria-label = name + ' · ' + (subtitle ?? variant)` and 44dp+ hit
 * target. Otherwise it's an <article>. Selected/focus states share the
 * same gold ring so keyboard ↔ mouse parity is preserved.
 */
import {
  memo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode
} from 'react';
import { useTranslation } from 'react-i18next';

export type CardVariant = 'character' | 'monster' | 'item' | 'merc';
export type CardSize = 'sm' | 'md' | 'lg';
export type CardRarity =
  | 'normal'
  | 'magic'
  | 'rare'
  | 'set'
  | 'unique'
  | 'runeword'
  | 'common'
  | 'champion'
  | 'elite'
  | 'boss';

export interface CardStat {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: 'atk' | 'hp' | 'mp' | 'def';
}

export interface CardBar {
  readonly kind: 'hp' | 'mp' | 'stamina';
  readonly current: number;
  readonly max: number;
}

export interface GameCardProps {
  readonly variant: CardVariant;
  readonly image?: string | undefined;
  readonly name: string;
  readonly subtitle?: string | undefined;
  readonly rarity?: CardRarity | undefined;
  readonly stats?: readonly CardStat[] | undefined;
  readonly bars?: readonly CardBar[] | undefined;
  readonly footer?: ReactNode | undefined;
  readonly size?: CardSize | undefined;
  readonly selected?: boolean | undefined;
  readonly onClick?: (() => void) | undefined;
  readonly className?: string | undefined;
  readonly testId?: string | undefined;
  /**
   * Item-type glyph for the corner badge (variant='item' only).
   * Bug #18 — lets players distinguish weapon vs ring vs charm at a glance.
   */
  readonly itemGlyph?: ItemTypeGlyphKey | undefined;
}

// ── size maps ────────────────────────────────────────────────────────────

const SIZE_MAP: Record<CardVariant, Record<CardSize, string>> = {
  character: {
    sm: 'w-24 h-32',
    md: 'w-40 h-56',
    lg: 'w-64 h-[22rem]'
  },
  monster: {
    sm: 'w-20 h-28',
    md: 'w-36 h-48',
    lg: 'w-72 h-96'
  },
  item: {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  },
  merc: {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-48 h-64'
  }
};

// ── rarity → tailwind class lookups ──────────────────────────────────────

const RARITY_TEXT: Record<CardRarity, string> = {
  normal: 'text-d2-white',
  magic: 'text-d2-magic',
  rare: 'text-d2-rare',
  set: 'text-d2-set',
  unique: 'text-d2-unique',
  runeword: 'text-d2-runeword',
  common: 'text-d2-white',
  champion: 'text-d2-magic',
  elite: 'text-d2-rare',
  boss: 'text-d2-boss'
};

const RARITY_BORDER: Record<CardRarity, string> = {
  normal: 'border-d2-white/40',
  magic: 'border-d2-magic',
  rare: 'border-d2-rare',
  set: 'border-d2-set',
  unique: 'border-d2-unique',
  runeword: 'border-d2-runeword',
  common: 'border-d2-white/40',
  champion: 'border-d2-magic',
  elite: 'border-d2-rare',
  boss: 'border-d2-boss'
};

const RARITY_GEM: Record<CardRarity, string> = {
  normal: 'bg-d2-white/60',
  magic: 'bg-d2-magic',
  rare: 'bg-d2-rare',
  set: 'bg-d2-set',
  unique: 'bg-d2-unique',
  runeword: 'bg-d2-runeword',
  common: 'bg-d2-white/60',
  champion: 'bg-d2-magic',
  elite: 'bg-d2-rare',
  boss: 'bg-d2-boss'
};

const STROKE_BY_RARITY: Partial<Record<CardRarity, string>> = {
  champion: 'border-2',
  elite: 'border-2',
  boss: 'border-[3px] motion-safe:animate-d2-shimmer motion-reduce:animate-none',
  runeword: 'border-2 motion-safe:animate-d2-shimmer motion-reduce:animate-none'
};

// ── bar palette ──────────────────────────────────────────────────────────

const BAR_BG: Record<CardBar['kind'], string> = {
  hp: 'bg-red-600',
  mp: 'bg-blue-600',
  stamina: 'bg-yellow-600'
};

// ── item-type glyphs ─────────────────────────────────────────────────────
// Bug #18: small badge in the corner of variant=item cards so the player
// can distinguish weapon vs armor vs ring vs charm at a glance, without
// opening the tooltip. Unicode-only — no asset pipeline.
type ItemTypeGlyphKey =
  | 'weapon'
  | 'shield'
  | 'jewelry'
  | 'scroll'
  | 'charm'
  | 'gem'
  | 'rune'
  | 'armor';

const ITEM_TYPE_GLYPH: Record<ItemTypeGlyphKey, string> = {
  weapon: '⚔️',
  shield: '🛡️',
  jewelry: '💍',
  scroll: '📜',
  charm: '🧿',
  gem: '💎',
  rune: '🔮',
  armor: '🥋'
};

// ── silhouettes ──────────────────────────────────────────────────────────

function Silhouette({ variant }: { variant: CardVariant }): JSX.Element {
  const { t } = useTranslation('card');
  const label = t('silhouette', { defaultValue: 'Missing artwork' });
  // Single-path 24×24 SVGs — currentColor so the parent tints them.
  let d = '';
  switch (variant) {
    case 'character':
    case 'merc':
      d =
        'M12 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-7 20a7 7 0 1 1 14 0v1H5v-1z';
      break;
    case 'monster':
      d =
        'M12 2c4 0 7 3 7 7v3l-2 2v3l-3 3-2-2-2 2-3-3v-3l-2-2V9c0-4 3-7 7-7zm-2 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z';
      break;
    case 'item':
    default:
      d =
        'M3 7h18v3H3zM5 10h14v10H5zM9 4h6l1 3H8z';
      break;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className="w-1/2 h-1/2 text-d2-border"
      fill="currentColor"
    >
      <path d={d} />
    </svg>
  );
}

// ── parts ────────────────────────────────────────────────────────────────

function CardBanner({
  name,
  subtitle,
  rarity,
  size
}: {
  name: string;
  subtitle: string | undefined;
  rarity: CardRarity;
  size: CardSize;
}): JSX.Element {
  const titleClass =
    size === 'sm'
      ? 'font-serif text-sm font-semibold tracking-wide truncate'
      : 'font-serif text-base font-semibold tracking-wide truncate';
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 border-b border-d2-border/60 bg-black/30">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${RARITY_GEM[rarity]}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 leading-tight">
        <div className={`${titleClass} ${RARITY_TEXT[rarity]}`}>{name}</div>
        {subtitle && size !== 'sm' && (
          <div className="font-sans text-[10px] uppercase tracking-[0.12em] text-d2-white/60 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function CardArt({
  image,
  name,
  variant
}: {
  image: string | undefined;
  name: string;
  variant: CardVariant;
}): JSX.Element {
  const [errored, setErrored] = useState(false);
  const showImg = image && !errored;
  // Portraits (character/monster/merc) are generated with the head in the
  // upper third of the canvas — center crop chops it off, so anchor to top.
  // Item icons stay center-cropped so the icon sits dead-center in its slot.
  const objectPosCls = variant === 'item' ? 'object-center' : 'object-top';
  return (
    <div
      className="relative flex-1 overflow-hidden bg-d2-bg/80 flex items-center justify-center"
      aria-hidden={!showImg}
    >
      {showImg ? (
        <img
          src={image}
          alt={name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover ${objectPosCls}`}
          onError={() => {
            setErrored(true);
          }}
        />
      ) : (
        <Silhouette variant={variant} />
      )}
    </div>
  );
}

function StatPlate({ stat, size }: { stat: CardStat; size: CardSize }): JSX.Element {
  const numClass =
    size === 'lg'
      ? 'font-serif text-stat-lg font-bold tabular-nums'
      : size === 'md'
        ? 'font-serif text-lg font-bold tabular-nums'
        : 'font-serif text-sm font-bold tabular-nums';
  const tone =
    stat.tone === 'hp'
      ? 'text-red-400'
      : stat.tone === 'mp'
        ? 'text-blue-300'
        : stat.tone === 'atk'
          ? 'text-d2-rare'
          : stat.tone === 'def'
            ? 'text-d2-white'
            : 'text-d2-gold';
  return (
    <div className="flex flex-col items-center justify-center bg-black/40 border border-d2-border/70 rounded px-1 py-0.5 min-w-[2rem]">
      <span className="font-sans text-micro uppercase tracking-widest text-d2-white/60 leading-none">
        {stat.label}
      </span>
      <span className={`${numClass} ${tone} leading-none`}>{stat.value}</span>
    </div>
  );
}

function ResourceBar({ bar }: { bar: CardBar }): JSX.Element {
  const pct = bar.max <= 0 ? 0 : Math.max(0, Math.min(100, (bar.current / bar.max) * 100));
  const style: CSSProperties = { width: `${pct.toFixed(2)}%` };
  return (
    <div
      className="h-1 w-full bg-black/60 border border-d2-border/40 rounded-sm overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.max(0, Math.floor(bar.current))}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.floor(bar.max))}
      aria-label={bar.kind}
    >
      <div
        className={`${BAR_BG[bar.kind]} h-full transition-[width] duration-300`}
        style={style}
      />
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────

function GameCardImpl({
  variant,
  image,
  name,
  subtitle,
  rarity = 'normal',
  stats,
  bars,
  footer,
  size = 'md',
  selected = false,
  onClick,
  className = '',
  testId,
  itemGlyph
}: GameCardProps): JSX.Element {
  const isItemCompact = variant === 'item';

  const sizeCls = SIZE_MAP[variant][size];
  const padCls =
    size === 'lg' ? 'p-3' : size === 'md' ? 'p-2' : 'p-1.5';
  const strokeCls = STROKE_BY_RARITY[rarity] ?? (size === 'sm' ? 'border' : 'border-2');
  const ringCls = selected
    ? 'ring-2 ring-d2-gold motion-safe:-translate-y-0.5 motion-reduce:translate-y-0'
    : 'focus-visible:ring-2 focus-visible:ring-d2-gold';

  // Compose classes
  const frameCls = [
    'relative inline-flex flex-col rounded-md overflow-hidden',
    'bg-d2-panel text-d2-white shadow-inner shadow-black/60',
    'transition-transform duration-150',
    sizeCls,
    strokeCls,
    RARITY_BORDER[rarity],
    ringCls,
    onClick ? 'cursor-pointer focus:outline-none' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Hit-target enforcement: the smallest tappable cards (item/sm = 48dp)
  // already clear the 44dp threshold. Larger sizes naturally do so too.

  const ariaLabel = `${name}${subtitle ? ` · ${subtitle}` : ` · ${variant}`}`;

  const inner = (
    <>
      {!isItemCompact && (
        <CardBanner name={name} subtitle={subtitle} rarity={rarity} size={size} />
      )}

      <CardArt image={image} name={name} variant={variant} />

      {isItemCompact && (
        <span
          className={`pointer-events-none absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${RARITY_GEM[rarity]}`}
          aria-hidden
        />
      )}

      {isItemCompact && itemGlyph && (
        // ≤14px corner badge so it never crowds a 48dp item slot.
        <span
          className="pointer-events-none absolute bottom-0.5 left-0.5 leading-none
                     bg-black/70 border border-d2-border/80 rounded-sm
                     w-3.5 h-3.5 flex items-center justify-center
                     text-[9px] select-none"
          aria-hidden
          data-testid="item-type-badge"
        >
          {ITEM_TYPE_GLYPH[itemGlyph]}
        </span>
      )}

      {!isItemCompact && ((stats?.length ?? 0) > 0 || (bars?.length ?? 0) > 0 || footer) && (
        <div className={`bg-black/30 border-t border-d2-border/60 ${padCls} space-y-1`}>
          {stats && stats.length > 0 && (
            <div
              className={`grid gap-1 ${
                stats.length >= 4
                  ? 'grid-cols-4'
                  : stats.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
              }`}
            >
              {stats.map((s) => (
                <StatPlate key={s.label} stat={s} size={size} />
              ))}
            </div>
          )}

          {bars && bars.length > 0 && (
            <div className="space-y-0.5 pt-0.5">
              {bars.map((b) => (
                <ResourceBar key={b.kind} bar={b} />
              ))}
            </div>
          )}

          {footer && size !== 'sm' && (
            <div className="font-serif italic text-xs text-d2-white/60 pt-0.5 truncate">
              {footer}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-pressed={selected ? true : undefined}
        data-testid={testId}
        className={`${frameCls} text-left`}
      >
        {inner}
      </button>
    );
  }

  return (
    <article
      aria-label={ariaLabel}
      data-testid={testId}
      className={frameCls}
    >
      {inner}
    </article>
  );
}

export const GameCard = memo(GameCardImpl);
