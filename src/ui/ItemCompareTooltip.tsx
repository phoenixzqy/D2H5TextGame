/**
 * ItemCompareTooltip — two-column "currently equipped" vs "candidate"
 * comparison. Stat lines colored green for upgrades, red for downgrades,
 * dim for unchanged. Affixes listed verbatim under each column.
 *
 * Pure presentational component: deltas are computed by `compareEquip()`
 * upstream — no engine logic here.
 */
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { RarityText } from './RarityText';
import type { CompareResult, ComparableStatKey, StatDelta } from '@/features/inventory/compareEquip';
import type { Item } from '@/engine/types/items';
import type { Resistances } from '@/engine/types/attributes';

interface Props {
  readonly compare: CompareResult;
  readonly className?: string;
}

const STAT_KEYS: readonly ComparableStatKey[] = [
  'lifeMax', 'manaMax', 'attack', 'defense', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
];

const RESIST_KEYS: readonly (keyof Resistances)[] = [
  'fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'
];

const PERCENT_KEYS = new Set<ComparableStatKey>(['critChance', 'physDodge', 'magicDodge']);

function fmt(key: ComparableStatKey, n: number): string {
  if (PERCENT_KEYS.has(key)) return `${(n * 100).toFixed(1)}%`;
  if (key === 'critDamage') return `${n.toFixed(2)}×`;
  return String(Math.round(n));
}

function fmtDelta(key: ComparableStatKey, d: number): string {
  if (d === 0) return '';
  const sign = d > 0 ? '+' : '';
  if (PERCENT_KEYS.has(key)) return `${sign}${(d * 100).toFixed(1)}%`;
  if (key === 'critDamage') return `${sign}${d.toFixed(2)}×`;
  return `${sign}${String(Math.round(d))}`;
}

function deltaClass(delta: number): string {
  if (delta > 0) return 'text-d2-green';
  if (delta < 0) return 'text-d2-red';
  return 'text-d2-white/40';
}

function itemDisplayName(item: Item): string {
  return item.baseId.split('/').pop() ?? item.baseId;
}

export function ItemCompareTooltip({ compare, className = '' }: Props) {
  const { t } = useTranslation(['inventory', 'common']);
  const { current, candidate, stats, resistances } = compare;

  return (
    <div
      className={[
        'bg-d2-bg/95 border-2 border-d2-gold rounded-md p-3 text-xs',
        'shadow-2xl shadow-black/70',
        'w-full max-w-md',
        className
      ].filter(Boolean).join(' ')}
      role="tooltip"
      data-testid="item-compare"
    >
      <div className="grid grid-cols-2 gap-3">
        <Column heading={t('equip.compare.current', { defaultValue: '当前装备' })} item={current} stats={stats} resistances={resistances} side="current" t={t} />
        <Column heading={t('equip.compare.candidate', { defaultValue: '候选装备' })} item={candidate} stats={stats} resistances={resistances} side="candidate" t={t} />
      </div>
    </div>
  );
}

interface ColumnProps {
  readonly heading: string;
  readonly item: Item | null;
  readonly stats: CompareResult['stats'];
  readonly resistances: CompareResult['resistances'];
  readonly side: 'current' | 'candidate';
  readonly t: TFunction;
}

function Column({ heading, item, stats, resistances, side, t }: ColumnProps) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-d2-white/60 mb-1">{heading}</div>
      {item ? (
        <RarityText rarity={item.rarity} className="font-serif text-sm font-bold block truncate mb-2">
          {itemDisplayName(item)}
        </RarityText>
      ) : (
        <div className="text-d2-white/40 italic mb-2">{t('empty', { defaultValue: '空' })}</div>
      )}

      <ul className="space-y-0.5">
        {STAT_KEYS.map((key) => (
          <StatRow key={key} statKey={key} stat={stats[key]} side={side} t={t} />
        ))}
      </ul>

      {RESIST_KEYS.some((k) => resistances[k].current !== 0 || resistances[k].candidate !== 0) && (
        <ul className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5">
          {RESIST_KEYS.map((key) => {
            const r = resistances[key];
            if (r.current === 0 && r.candidate === 0) return null;
            const value = side === 'current' ? r.current : r.candidate;
            const delta = r.delta;
            return (
              <li key={key} className="flex justify-between gap-1">
                <span className="text-d2-white/70">{t(`equip.compare.resist.${key}`, { defaultValue: key })}</span>
                <span className="text-d2-white tabular-nums">{value}</span>
                {side === 'candidate' && delta !== 0 && (
                  <span className={`tabular-nums ${deltaClass(delta)}`}>
                    {delta > 0 ? '+' : ''}{String(Math.round(delta))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {item?.affixes && item.affixes.length > 0 && (
        <ul className="mt-2 pt-2 border-t border-d2-border/60 space-y-0.5">
          {item.affixes.map((a, i) => (
            <li key={i} className="text-d2-magic truncate">{a.affixId}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface StatRowProps {
  readonly statKey: ComparableStatKey;
  readonly stat: StatDelta;
  readonly side: 'current' | 'candidate';
  readonly t: TFunction;
}

function StatRow({ statKey, stat, side, t }: StatRowProps) {
  const value = side === 'current' ? stat.current : stat.candidate;
  return (
    <li className="flex items-baseline justify-between gap-1">
      <span className="text-d2-white/70 truncate">{t(`equip.compare.stat.${statKey}`, { defaultValue: statKey })}</span>
      <span className="text-d2-white tabular-nums">{fmt(statKey, value)}</span>
      {side === 'candidate' && stat.delta !== 0 && (
        <span className={`tabular-nums ${deltaClass(stat.delta)}`} aria-label={fmtDelta(statKey, stat.delta)}>
          {fmtDelta(statKey, stat.delta)}
        </span>
      )}
    </li>
  );
}