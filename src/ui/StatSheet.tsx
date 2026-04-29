/**
 * StatSheet — unified stat-row renderer for the equip-compare flow.
 *
 * Two render modes:
 *   - 'single':  one item, plain values. Used when no candidate is
 *                selected (current equipment readout) or to view an
 *                equipped slot read-only outside swap mode.
 *   - 'compare': current vs candidate. Each row shows
 *                  label  |  current value  |  candidate (±Δ)
 *                with ±Δ inline in the candidate cell, color coded:
 *                green improvement / red regression / muted on equal.
 *
 * Pure presentational. All deltas are computed by `compareEquip()`
 * upstream — no engine logic here.
 *
 * Layout note (mobile, 360w): rows are a 3-col grid
 * `grid-cols-[minmax(0,1fr)_auto_auto]` so labels truncate but never
 * push numerical columns off-screen. Numerals use `tabular-nums` so
 * the +/-Δ portion doesn't shift the candidate value horizontally.
 */
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { RarityText } from './RarityText';
import { formatAffixRoll } from './affixFormat';
import {
  STAT_META,
  RESIST_KEYS,
  deltaColorClass,
  formatStatDelta,
  formatStatValue,
  formatResistDelta,
  formatResistValue
} from './statSheetFormat';
import type { ComparableStatKey, StatDelta } from '@/features/inventory/compareEquip';
import type { Resistances } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';

const STAT_ORDER: readonly ComparableStatKey[] = [
  'lifeMax', 'manaMax', 'attack', 'defense', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
];

function itemDisplayName(item: Item): string {
  return item.baseId.split('/').pop() ?? item.baseId;
}

interface SingleProps {
  readonly mode: 'single';
  readonly item: Item | null;
  readonly stats: Readonly<Record<ComparableStatKey, number>>;
  readonly resistances: Readonly<Record<keyof Resistances, number>>;
  /** When true, render the slot's "(empty)" placeholder instead of stats. */
  readonly emptySlot?: boolean;
  readonly className?: string;
}

interface CompareProps {
  readonly mode: 'compare';
  readonly current: Item | null;
  readonly candidate: Item;
  readonly stats: Readonly<Record<ComparableStatKey, StatDelta>>;
  readonly resistances: Readonly<Record<keyof Resistances, StatDelta>>;
  readonly className?: string;
}

export type StatSheetProps = SingleProps | CompareProps;

export function StatSheet(props: StatSheetProps): JSX.Element {
  const { t } = useTranslation(['inventory', 'common']);
  const { t: tAffix } = useTranslation('affixes');
  return (
    <div
      className={[
        'bg-d2-bg/95 border-2 border-d2-gold rounded-md p-3 text-xs',
        'shadow-2xl shadow-black/70 w-full max-w-md',
        props.className ?? ''
      ].filter(Boolean).join(' ')}
      role="group"
      data-testid={props.mode === 'compare' ? 'item-compare' : 'item-stat-sheet'}
      data-mode={props.mode}
    >
      {props.mode === 'compare' ? (
        <CompareHeader t={t} current={props.current} candidate={props.candidate} />
      ) : (
        <SingleHeader t={t} item={props.item} emptySlot={props.emptySlot ?? false} />
      )}

      <ul className="mt-2 space-y-0.5">
        {STAT_ORDER.map((key) => {
          const meta = STAT_META[key];
          const label = t(`equipFlow.compare.stat.${key}`);
          if (props.mode === 'single') {
            const value = props.stats[key];
            return (
              <Row key={key} label={label}>
                <span className="text-d2-white tabular-nums">
                  {formatStatValue(meta.format, value)}
                </span>
              </Row>
            );
          }
          const stat = props.stats[key];
          const deltaText = formatStatDelta(meta.format, stat.delta);
          return (
            <Row key={key} label={label}>
              <span className="text-d2-white/60 tabular-nums text-right">
                {formatStatValue(meta.format, stat.current)}
              </span>
              <span className="tabular-nums text-right whitespace-nowrap">
                <span className="text-d2-white">{formatStatValue(meta.format, stat.candidate)}</span>
                {deltaText !== '' && (
                  <span className={`ml-1 ${deltaColorClass(stat.delta, meta.higherIsBetter)}`}>
                    ({deltaText})
                  </span>
                )}
              </span>
            </Row>
          );
        })}
      </ul>

      {/* Resistances — only render if any side has a non-zero value. */}
      {RESIST_KEYS.some((k) => {
        if (props.mode === 'single') return props.resistances[k] !== 0;
        const r = props.resistances[k];
        return r.current !== 0 || r.candidate !== 0;
      }) && (
        <ul className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5">
          {RESIST_KEYS.map((key) => {
            const label = t(`equipFlow.compare.resist.${key}`);
            if (props.mode === 'single') {
              const value = props.resistances[key];
              if (value === 0) return null;
              return (
                <Row key={key} label={label}>
                  <span className="text-d2-white tabular-nums">{formatResistValue(value)}</span>
                </Row>
              );
            }
            const r = props.resistances[key];
            if (r.current === 0 && r.candidate === 0) return null;
            const deltaText = formatResistDelta(r.delta);
            return (
              <Row key={key} label={label}>
                <span className="text-d2-white/60 tabular-nums text-right">
                  {formatResistValue(r.current)}
                </span>
                <span className="tabular-nums text-right whitespace-nowrap">
                  <span className="text-d2-white">{formatResistValue(r.candidate)}</span>
                  {deltaText !== '' && (
                    <span className={`ml-1 ${deltaColorClass(r.delta, true)}`}>
                      ({deltaText})
                    </span>
                  )}
                </span>
              </Row>
            );
          })}
        </ul>
      )}

      {props.mode === 'compare' && props.candidate.affixes && props.candidate.affixes.length > 0 && (
        <ul className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5">
          {props.candidate.affixes.map((a, i) => (
            <li key={i} className="text-d2-magic truncate">{formatAffixRoll(a, tAffix)}</li>
          ))}
        </ul>
      )}
      {props.mode === 'single' && props.item?.affixes && props.item.affixes.length > 0 && (
        <ul className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5">
          {props.item.affixes.map((a, i) => (
            <li key={i} className="text-d2-magic truncate">{formatAffixRoll(a, tAffix)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 items-baseline">
      <span className="text-d2-white/70 truncate">{label}</span>
      {/* When the caller renders just a single value we still want it
          right-aligned in the rightmost cell. Empty cell preserves grid. */}
      {Array.isArray(children) ? children : <><span aria-hidden /><>{children}</></>}
    </li>
  );
}

function SingleHeader({
  t,
  item,
  emptySlot
}: {
  t: TFunction;
  item: Item | null;
  emptySlot: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-d2-white/60 mb-1">
        {t('equipFlow.compare.current')}
      </div>
      {item ? (
        <RarityText
          rarity={item.rarity}
          className="font-serif text-sm font-bold block truncate"
        >
          {itemDisplayName(item)}
        </RarityText>
      ) : (
        <div className="text-d2-white/40 italic">
          {emptySlot ? t('equipFlow.compare.slotEmpty') : t('empty')}
        </div>
      )}
    </div>
  );
}

function CompareHeader({
  t,
  current,
  candidate
}: {
  t: TFunction;
  current: Item | null;
  candidate: Item;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
      <span aria-hidden />
      <div className="min-w-0 text-right">
        <div className="text-[10px] uppercase tracking-wide text-d2-white/60">
          {t('equipFlow.compare.current')}
        </div>
        {current ? (
          <RarityText
            rarity={current.rarity}
            className="font-serif text-xs font-bold block truncate"
          >
            {itemDisplayName(current)}
          </RarityText>
        ) : (
          <div className="text-d2-white/40 italic text-xs">{t('empty')}</div>
        )}
      </div>
      <div className="min-w-0 text-right">
        <div className="text-[10px] uppercase tracking-wide text-d2-white/60">
          {t('equipFlow.compare.candidate')}
        </div>
        <RarityText
          rarity={candidate.rarity}
          className="font-serif text-xs font-bold block truncate"
        >
          {itemDisplayName(candidate)}
        </RarityText>
      </div>
    </div>
  );
}
