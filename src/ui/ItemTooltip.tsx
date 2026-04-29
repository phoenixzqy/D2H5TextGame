/**
 * ItemTooltip — D2-style expanded item card.
 *
 * Layout (per Bug #7 spec):
 *   1. Item name colored by rarity.
 *   2. Sub-line: localized type + slot, e.g. "武器 · 武器槽".
 *   3. Damage block (weapons) OR Defense block (armor/shield).
 *   4. Requirements (level / str / dex / vit / eng).
 *      NOTE: We do NOT compare against the wearing character's stats here —
 *      that would require either a store call or props plumbing the player's
 *      stats through every Tooltip caller. Per task spec, we render
 *      requirements in neutral color in that case. Requirement-vs-character
 *      coloring is deferred to Bug #9 (`<EquipPicker>`) which already needs
 *      character context.
 *   5. Affix lines (existing).
 *
 * Item base lookup goes through `loadItemBases()` from the data-loader layer
 * (the project's selector pattern for catalog data — there is no items
 * Zustand store).
 */
import { useTranslation } from 'react-i18next';
import { RarityText } from './RarityText';
import { resolveItemIcon } from './cardAssets';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item, ItemBase, EquipmentSlot } from '@/engine/types/items';

interface ItemTooltipProps {
  item: Item;
  className?: string;
}

const RARITY_BORDER: Record<Item['rarity'], string> = {
  normal: 'border-d2-white/40',
  magic: 'border-d2-magic',
  rare: 'border-d2-rare',
  set: 'border-d2-set',
  unique: 'border-d2-unique',
  runeword: 'border-d2-runeword'
};

/** Slot key in i18n inventory.slots / items.slots — same enum strings. */
const SLOT_KEYS: readonly EquipmentSlot[] = [
  'head',
  'chest',
  'gloves',
  'belt',
  'boots',
  'amulet',
  'ring-left',
  'ring-right',
  'weapon',
  'offhand'
];

/** Pull the trailing slug from `items/base/<slug>` for the items.base lookup. */
function baseSlug(baseId: string): string {
  return baseId.split('/').pop() ?? baseId;
}

export function ItemTooltip({ item, className = '' }: ItemTooltipProps): JSX.Element {
  const { t } = useTranslation('items');
  const icon = resolveItemIcon(item.baseId);
  const base: ItemBase | undefined = loadItemBases().get(item.baseId);

  const slug = baseSlug(item.baseId);
  const displayName = t(`base.${slug}`);

  const typeLabel = base ? t(`types.${base.type}`) : '';
  const slotLabel =
    base?.slot && SLOT_KEYS.includes(base.slot)
      ? t(`slots.${base.slot}`)
      : '';
  const subtitle = base
    ? slotLabel
      ? t('tooltip.subtitle', { type: typeLabel, slot: slotLabel })
      : t('tooltip.subtitleNoSlot', { type: typeLabel })
    : null;

  // Pre-compute damage/defense lines so JSX doesn't need ?. dance.
  const damageLine =
    base?.type === 'weapon' && base.baseDamage
      ? t('tooltip.damage', {
          min: base.baseDamage.min,
          max: base.baseDamage.max
        })
      : null;
  const defenseLine =
    base?.type === 'armor' && typeof base.baseDefense === 'number' && base.baseDefense > 0
      ? t('tooltip.defense', { value: base.baseDefense })
      : null;

  const reqRows: string[] = [];
  if (base) {
    if (base.reqLevel > 1) reqRows.push(t('tooltip.reqLevel', { value: base.reqLevel }));
    const rs = base.reqStats;
    if (rs?.strength) reqRows.push(t('tooltip.reqStr', { value: rs.strength }));
    if (rs?.dexterity) reqRows.push(t('tooltip.reqDex', { value: rs.dexterity }));
    if (rs?.vitality) reqRows.push(t('tooltip.reqVit', { value: rs.vitality }));
    if (rs?.energy) reqRows.push(t('tooltip.reqEng', { value: rs.energy }));
  }

  return (
    <div
      className={[
        'bg-d2-bg/95 border-2 rounded-md p-3 text-sm w-56 max-w-[18rem]',
        'shadow-2xl shadow-black/70',
        RARITY_BORDER[item.rarity],
        className
      ]
        .filter(Boolean)
        .join(' ')}
      role="tooltip"
      data-testid="item-tooltip"
    >
      {/* (1) Name */}
      <div className="text-center mb-1">
        <RarityText rarity={item.rarity} className="font-serif text-base font-bold block">
          {displayName}
        </RarityText>
        {/* (2) Type · Slot */}
        {subtitle && (
          <div
            className="text-[11px] text-d2-white/70 truncate"
            data-testid="item-tooltip-subtitle"
          >
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex justify-center my-2">
        <div className="w-20 h-20 border border-d2-border/70 bg-d2-panel rounded flex items-center justify-center overflow-hidden">
          {icon ? (
            <img
              src={icon}
              alt={displayName}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          ) : (
            <span aria-hidden className="font-serif text-d2-border text-3xl">
              ?
            </span>
          )}
        </div>
      </div>

      {/* (3) Damage / Defense */}
      {damageLine !== null && (
        <div className="text-center text-d2-white text-xs mb-1" data-testid="item-tooltip-damage">
          {damageLine}
        </div>
      )}
      {defenseLine !== null && (
        <div className="text-center text-d2-white text-xs mb-1" data-testid="item-tooltip-defense">
          {defenseLine}
        </div>
      )}

      <div className="text-d2-white/70 text-[11px] text-center mb-2">
        {t('tooltip.ilvl', { value: item.level })}
        {base?.sockets ? ` · ${t('tooltip.sockets', { value: base.sockets })}` : ''}
      </div>

      {/* (4) Requirements */}
      {reqRows.length > 0 && (
        <div className="pt-2 border-t border-d2-border/60 text-[11px] text-d2-white/80 text-center">
          <div className="text-d2-white/50 uppercase tracking-wide text-[10px] mb-0.5">
            {t('tooltip.required')}
          </div>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
            {reqRows.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </div>
      )}

      {/* (5) Affixes */}
      {item.affixes && item.affixes.length > 0 && (
        <ul className="space-y-0.5 pt-2 border-t border-d2-border/60 mt-2">
          {item.affixes.map((affix, idx) => (
            <li key={idx} className="text-d2-magic text-xs">
              {affix.affixId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
