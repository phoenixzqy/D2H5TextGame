/**
 * StatSheet — unified stat-row renderer for the equip-compare flow.
 *
 * Renders a single `<table>` so every row's columns (label / current /
 * candidate(±Δ)) line up vertically without manual width juggling. The
 * table has up to 3 logical columns; column 2 ("current") and/or column
 * 3 ("candidate") are conditionally omitted, but the remaining columns
 * still share a single `<colgroup>`, so all stat rows are guaranteed
 * pixel-aligned.
 *
 * Render modes:
 *   - 'single':       one item, plain values. Used for the read-only
 *                     readout and as the fallback when no candidate is
 *                     selected. Renders 2 columns: [Stat | Current].
 *   - 'compare' (current !== null): 3 columns:
 *                     [Stat | Current | Candidate(±Δ)]
 *   - 'compare' (current === null, "candidate-only" / first equip):
 *                     2 columns: [Stat | Candidate(±Δ)]
 *
 * Pure presentational. All deltas are computed by `compareEquip()`
 * upstream — no engine logic here.
 *
 * Narrow containers: fixed table columns allow labels, complete item names
 * and values to wrap without widening the sidebar. Deltas occupy a separate
 * line so the value and change remain readable at 14px. Numerals use
 * `tabular-nums` for digit alignment.
 */
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { RarityText } from './RarityText';
import { formatAffixRoll } from './affixFormat';
import { tItemName } from './i18nKey';
import {
  STAT_META,
  RESIST_KEYS,
  deltaColorClass,
  deltaTrend,
  deltaArrow,
  formatStatDelta,
  formatStatValue,
  formatResistDelta,
  formatResistValue
} from './statSheetFormat';
import type { ComparableStatKey, StatDelta } from '@/features/inventory/compareEquip';
import type { Resistances } from '@/engine/types/attributes';
import type { Item } from '@/engine/types/items';

const STAT_ORDER: readonly ComparableStatKey[] = [
  'lifeMax',
  'manaMax',
  'attack',
  'defense',
  'magicResist',
  'attackSpeed',
  'critChance',
  'critDamage',
  'physDodge',
  'magicDodge'
];

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
  const { t } = useTranslation(['inventory', 'common', 'items', 'rarity']);
  const [selectedPage, setSelectedPage] = useState(0);
  const { t: tAffix } = useTranslation('affixes');

  // Compare mode always shows 3 columns (even when current is null, the
  // empty-slot placeholder is rendered in the current column) so the
  // header/data-col contract is stable for E2E and so layout doesn't shift
  // when the user equips into an empty slot. Single mode is always 2 cols.
  // showCurrent is always true; kept as a constant for readability.
  const showCandidate = props.mode === 'compare';
  const colCount = 2 + (showCandidate ? 1 : 0);

  const hasResist = RESIST_KEYS.some((k) => {
    if (props.mode === 'single') return props.resistances[k] !== 0;
    const r = props.resistances[k];
    return r.current !== 0 || r.candidate !== 0;
  });

  const affixes = props.mode === 'compare' ? props.candidate.affixes : props.item?.affixes;
  const sections = [0, 1, ...(hasResist ? [2] : []), ...(affixes?.length ? [3] : [])];
  const page = Math.min(selectedPage, sections.length - 1);
  const section = sections[page] ?? 0;

  return (
    <div
      className={[
        'd2-surface bg-d2-bg/95 border-2 border-d2-gold rounded-md p-3 text-sm',
        'shadow-2xl shadow-black/70 w-full max-w-md',
        props.className ?? ''
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      data-testid={props.mode === 'compare' ? 'item-compare' : 'item-stat-sheet'}
      data-mode={props.mode}
    >
      <div className="d2-pager mb-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => {
            setSelectedPage(page - 1);
          }}
          aria-label={t('common:pagination.previous')}
        >
          ‹
        </button>
        <span aria-live="polite">
          {t('common:pagination.page', { current: page + 1, total: sections.length })}
        </span>
        <button
          type="button"
          disabled={page === sections.length - 1}
          onClick={() => {
            setSelectedPage(page + 1);
          }}
          aria-label={t('common:pagination.next')}
        >
          ›
        </button>
      </div>
      <table
        className="d2-stat-table w-full table-fixed border-collapse tabular-nums"
        data-testid="stat-compare-table"
        data-cols={colCount}
      >
        <colgroup>
          <col />
          <col className="w-[34%] sm:w-[32%]" />
          {showCandidate && <col className="w-[40%] sm:w-[36%]" />}
        </colgroup>
        <thead>
          <tr className="align-bottom">
            <th
              scope="col"
              className="text-left text-sm uppercase tracking-wide text-d2-white/60 font-normal pb-2 pr-2"
            >
              {t('equipFlow.compare.statHeader')}
            </th>
            <th
              scope="col"
              className="text-right pb-2 pl-2 font-normal align-bottom"
              data-col="current"
              data-testid="current-item-header"
              data-empty={
                (props.mode === 'single' && (props.emptySlot ?? false)) ||
                (props.mode === 'compare' && props.current === null)
                  ? 'true'
                  : 'false'
              }
            >
              <HeaderCell
                label={t('equipFlow.compare.current')}
                item={props.mode === 'single' ? props.item : props.current}
                emptyAsSlot={props.mode === 'single' && (props.emptySlot ?? false)}
                t={t}
              />
            </th>
            {props.mode === 'compare' && (
              <th
                scope="col"
                className="text-right pb-2 pl-2 font-normal align-bottom"
                data-col="candidate"
                data-testid="candidate-item-header"
              >
                <HeaderCell
                  label={t('equipFlow.compare.candidate')}
                  item={props.candidate}
                  emptyAsSlot={false}
                  t={t}
                />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {(section < 2 ? STAT_ORDER.slice(section * 5, section * 5 + 5) : []).map((key) => {
            const meta = STAT_META[key];
            const label = t(`equipFlow.compare.stat.${key}`);
            if (props.mode === 'single') {
              const value = props.stats[key];
              return (
                <StatRow
                  key={key}
                  label={label}
                  currentCell={
                    <span className="text-d2-white">{formatStatValue(meta.format, value)}</span>
                  }
                  showCurrent
                  showCandidate={false}
                />
              );
            }
            const stat = props.stats[key];
            const deltaText = formatStatDelta(meta.format, stat.delta);
            const trend = deltaTrend(stat.delta, meta.higherIsBetter);
            const arrow = deltaArrow(stat.delta);
            const srKey =
              stat.delta > 0
                ? 'equipFlow.compare.deltaUp'
                : stat.delta < 0
                  ? 'equipFlow.compare.deltaDown'
                  : '';
            const candidateCell = (
              <>
                <span className="text-d2-white">
                  {formatStatValue(meta.format, stat.candidate)}
                </span>
                {deltaText !== '' && (
                  <span
                    className={`block ${deltaColorClass(stat.delta, meta.higherIsBetter)}`}
                    data-trend={trend}
                    data-testid="stat-delta"
                  >
                    <span aria-hidden="true">{arrow}</span>
                    <span aria-hidden="true">({deltaText})</span>
                    {srKey !== '' && (
                      <span className="sr-only">
                        {' '}
                        {t(srKey, { value: deltaText.replace(/^[+-]/, '') })}
                      </span>
                    )}
                  </span>
                )}
              </>
            );
            const currentCell = (
              <span className="text-d2-white/60">
                {props.current === null ? '—' : formatStatValue(meta.format, stat.current)}
              </span>
            );
            return (
              <StatRow
                key={key}
                label={label}
                currentCell={currentCell}
                candidateCell={candidateCell}
                showCurrent
                showCandidate
              />
            );
          })}
        </tbody>

        {section === 2 && hasResist && (
          <tbody className="[&>tr:first-child>th]:border-t [&>tr:first-child>th]:border-d2-border/60 [&>tr:first-child>th]:pt-2 [&>tr:first-child>td]:border-t [&>tr:first-child>td]:border-d2-border/60 [&>tr:first-child>td]:pt-2">
            {RESIST_KEYS.map((key) => {
              const label = t(`equipFlow.compare.resist.${key}`);
              if (props.mode === 'single') {
                const value = props.resistances[key];
                if (value === 0) return null;
                return (
                  <StatRow
                    key={key}
                    label={label}
                    currentCell={<span className="text-d2-white">{formatResistValue(value)}</span>}
                    showCurrent
                    showCandidate={false}
                  />
                );
              }
              const r = props.resistances[key];
              if (r.current === 0 && r.candidate === 0) return null;
              const deltaText = formatResistDelta(r.delta);
              const trend = deltaTrend(r.delta, true);
              const arrow = deltaArrow(r.delta);
              const candidateCell = (
                <>
                  <span className="text-d2-white">{formatResistValue(r.candidate)}</span>
                  {deltaText !== '' && (
                    <span
                      className={`block ${deltaColorClass(r.delta, true)}`}
                      data-trend={trend}
                      data-testid="stat-delta"
                    >
                      <span aria-hidden="true">{arrow}</span>
                      <span aria-hidden="true">({deltaText})</span>
                    </span>
                  )}
                </>
              );
              const currentCell = (
                <span className="text-d2-white/60">
                  {props.current === null ? '—' : formatResistValue(r.current)}
                </span>
              );
              return (
                <StatRow
                  key={key}
                  label={label}
                  currentCell={currentCell}
                  candidateCell={candidateCell}
                  showCurrent
                  showCandidate
                />
              );
            })}
          </tbody>
        )}
      </table>

      {section === 3 &&
        props.mode === 'compare' &&
        props.candidate.affixes &&
        props.candidate.affixes.length > 0 && (
          <ul
            className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5"
            data-testid="stat-sheet-affixes"
          >
            {props.candidate.affixes.map((a, i) => (
              <li key={i} className="text-d2-magic break-words" data-testid="stat-sheet-affix">
                {formatAffixRoll(a, tAffix)}
              </li>
            ))}
          </ul>
        )}
      {section === 3 &&
        props.mode === 'single' &&
        props.item?.affixes &&
        props.item.affixes.length > 0 && (
          <ul
            className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5"
            data-testid="stat-sheet-affixes"
          >
            {props.item.affixes.map((a, i) => (
              <li key={i} className="text-d2-magic break-words" data-testid="stat-sheet-affix">
                {formatAffixRoll(a, tAffix)}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function StatRow({
  label,
  currentCell,
  candidateCell,
  showCurrent,
  showCandidate
}: {
  readonly label: string;
  readonly currentCell?: React.ReactNode;
  readonly candidateCell?: React.ReactNode;
  readonly showCurrent: boolean;
  readonly showCandidate: boolean;
}) {
  return (
    <tr data-testid="stat-row">
      <th
        scope="row"
        className="text-left text-d2-white/70 font-normal py-0.5 pr-2 whitespace-normal break-words"
      >
        {label}
      </th>
      {showCurrent && (
        <td className="text-right py-0.5 pl-2 whitespace-normal break-words">{currentCell}</td>
      )}
      {showCandidate && (
        <td className="text-right py-0.5 pl-2 whitespace-normal break-words">{candidateCell}</td>
      )}
    </tr>
  );
}

function HeaderCell({
  label,
  item,
  emptyAsSlot,
  t
}: {
  readonly label: string;
  readonly item: Item | null;
  readonly emptyAsSlot: boolean;
  readonly t: TFunction;
}) {
  // Bug 2 fix: when current and candidate share the same baseId (e.g. a
  // normal Short Sword vs a magic Short Sword), rendering only the base
  // name produces two visually-identical headers — the user can't tell
  // which column is which. Disambiguate every header with a small badge
  // that shows the rarity tier and (if any) affix count, e.g.:
  //   "短剑"               normal, no affixes
  //   "短剑 · 魔法 +2"     magic, 2 affixes
  //   "Short Sword · Magic +2"
  // Both i18n locales already ship rarity:tier.<r> keys, so we reuse
  // those rather than introducing locale-specific glue.
  const affixCount = item?.affixes?.length ?? 0;
  const rarityLabel = item ? t(`rarity:tier.${item.rarity}`) : '';
  const badgeBits: string[] = [];
  if (rarityLabel) badgeBits.push(rarityLabel);
  if (affixCount > 0) badgeBits.push(`+${String(affixCount)}`);
  const badge = badgeBits.join(' ');

  return (
    <div className="min-w-0 flex flex-col items-end">
      <span className="text-sm uppercase tracking-wide text-d2-white/60">{label}</span>
      {item ? (
        <>
          <RarityText
            rarity={item.rarity}
            className="font-serif text-sm font-bold block break-words max-w-full"
          >
            <span data-testid="header-item-name">{tItemName(t, item)}</span>
          </RarityText>
          {badge !== '' && (
            <span
              className="text-sm text-d2-white/70 break-words max-w-full"
              data-testid="header-item-badge"
            >
              {badge}
            </span>
          )}
        </>
      ) : (
        <span className="text-d2-white/70 italic text-sm">
          {emptyAsSlot ? t('equipFlow.compare.slotEmpty') : t('empty')}
        </span>
      )}
    </div>
  );
}
