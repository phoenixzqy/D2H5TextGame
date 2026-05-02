/**
 * ItemDetailPanel — rich, rarity-themed read-out for the selected item
 * shown in the inventory side-panel (desktop) or bottom sheet (mobile).
 *
 * No engine logic. Reads bases via `loadItemBases()` and `loadAffixPool()`
 * (cached catalog selectors). Comparing requirements vs the player's
 * stats is local: red text for unmet entries.
 *
 * Sockets:
 *   `base.sockets` is the slot count. `item.runes` (if present) maps each
 *   filled socket. We render `base.sockets` boxes, filled with rune name
 *   in order, otherwise `[ ]`. If the item has `runes` but no
 *   `base.sockets`, we render `item.runes.length` filled boxes — there
 *   are no orphan empties to invent.
 *
 * Affix lines reuse `formatAffixRoll()` for the value formatting and
 * `RarityText` for color tier (per-affix tiering is deferred to Bug
 * follow-up #21 and falls back to base rarity color today).
 *
 * Tablet (768–1023): rendered the same as desktop sidebar but width is
 * inherited from the parent grid (`340px`). The bottom-sheet path is
 * used only below `lg`. The decision lives here so callers don't have
 * to duplicate the breakpoint check.
 */
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { RarityText } from '@/ui/RarityText';
import { resolveItemIcon } from '@/ui/cardAssets';
import { formatAffixRoll } from '@/ui/affixFormat';
import { resolveItemDisplay } from '@/ui/itemDisplay';
import { tDataKey } from '@/ui/i18nKey';
import { loadItemBases, resolveItemReqLevel } from '@/data/loaders/loot';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item, ItemBase } from '@/engine/types/items';

export interface ItemDetailPanelProps {
  readonly item: Item;
  readonly playerLevel: number;
  readonly playerCoreStats: CoreStats;
  readonly onEquip?: () => void;
  readonly onTransfer?: () => void;
  readonly onDiscard: () => void;
  readonly onClose: () => void;
  /** Optional label override for the transfer button (Backpack ↔ Stash). */
  readonly transferLabel?: string;
  /** Optional label override for the equip button. Hides when undefined. */
  readonly equipLabel?: string;
  /** Equipped items used to mark set bonuses active/inactive in the detail readout. */
  readonly equippedItems?: readonly Item[];
}

export function ItemDetailPanel({
  item,
  playerLevel,
  playerCoreStats,
  onEquip,
  onTransfer,
  onDiscard,
  onClose,
  transferLabel,
  equipLabel,
  equippedItems = []
}: ItemDetailPanelProps): JSX.Element {
  const { t } = useTranslation(['inventory', 'items', 'affixes']);
  const { t: tItems } = useTranslation('items');
  const { t: tAffix } = useTranslation('affixes');

  const base: ItemBase | undefined = loadItemBases().get(item.baseId);
  const display = resolveItemDisplay(item, t, equippedItems);
  const displayName = display.name;
  const icon = resolveItemIcon(item.baseId);
  const ilvl = item.ilvl ?? item.level;
  const reqLevel = resolveItemReqLevel(item, base);

  const typeLabel = base ? tItems(`types.${base.type}`) : '';
  const slotLabel = base?.slot ? tItems(`slots.${base.slot}`) : '';
  const typeLine = base
    ? slotLabel
      ? t('detail.typeLine', { type: typeLabel, slot: slotLabel, ilvl })
      : t('detail.typeLineNoSlot', { type: typeLabel, ilvl })
    : t('detail.typeLineNoSlot', { type: '?', ilvl });

  // Requirements with met-or-not flag for red coloring
  const reqRows: { readonly key: string; readonly label: string; readonly met: boolean }[] = [];
  if (base) {
    if (reqLevel > 1) {
      reqRows.push({
        key: 'level',
        label: t('detail.reqLevel', { value: reqLevel }),
        met: playerLevel >= reqLevel
      });
    }
    const rs = base.reqStats;
    const statKeys: (readonly [keyof CoreStats, 'reqStr' | 'reqDex' | 'reqVit' | 'reqEng'])[] = [
      ['strength', 'reqStr'],
      ['dexterity', 'reqDex'],
      ['vitality', 'reqVit'],
      ['energy', 'reqEng']
    ];
    if (rs) {
      for (const [statKey, i18nKey] of statKeys) {
        const required = rs[statKey];
        if (!required) continue;
        reqRows.push({
          key: statKey,
          label: t(`detail.${i18nKey}`, { value: required }),
          met: playerCoreStats[statKey] >= required
        });
      }
    }
  }

  // Base stat block (rolled values from baseRolls)
  const baseStatLines: string[] = [];
  if (base?.type === 'weapon' && base.baseDamage) {
    const min = item.baseRolls?.attack ?? base.baseDamage.min;
    const max = item.baseRolls?.attack ?? base.baseDamage.max;
    baseStatLines.push(t('detail.damage', { min, max }));
  }
  if (base?.type === 'armor' && typeof base.baseDefense === 'number' && base.baseDefense > 0) {
    baseStatLines.push(t('detail.defense', { value: item.baseRolls?.defense ?? base.baseDefense }));
  }

  // Sockets
  const socketCount = base?.sockets ?? item.runes?.length ?? 0;
  const runes = item.runes ?? [];
  const socketBoxes: string[] = [];
  for (let i = 0; i < socketCount; i++) {
    const runeId = runes[i];
    if (runeId) {
      const runeName = tItems(`rune.${runeId}`);
      socketBoxes.push(t('detail.filledSocket', { name: runeName }));
    } else {
      socketBoxes.push(t('detail.emptySocket'));
    }
  }

  return (
    <div
      className="flex flex-col gap-3 text-sm"
      data-testid="inv-detail-panel"
      data-rarity={item.rarity}
    >
      {/* Header: icon + name + type line + close */}
      <div className="flex items-start gap-3 border-b border-d2-border/60 pb-2">
        <div className="w-16 h-16 shrink-0 border border-d2-border/70 bg-d2-bg/60 rounded flex items-center justify-center overflow-hidden">
          {icon ? (
            <img src={icon} alt={displayName} loading="lazy" className="w-full h-full object-contain" />
          ) : (
            <span aria-hidden className="font-serif text-d2-border text-2xl">?</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <RarityText
            rarity={item.rarity}
            className="font-serif text-base font-bold block break-words"
          >
            {displayName}
          </RarityText>
          <div className="text-[11px] text-d2-white/70 mt-0.5">{typeLine}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="shrink-0 -mr-1 -mt-1 px-2 py-1 text-d2-white/60 hover:text-d2-gold focus:outline-none focus:ring-2 focus:ring-d2-gold rounded"
          data-testid="inv-detail-close"
        >
          ×
        </button>
      </div>

      {/* Requirements */}
      {reqRows.length > 0 && (
        <section data-testid="inv-detail-required">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1">
            {t('detail.required')}
          </h3>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {reqRows.map((r) => (
              <li
                key={r.key}
                className={r.met ? 'text-d2-white/85' : 'text-d2-red font-bold'}
                data-met={r.met}
              >
                {r.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Base stats */}
      {baseStatLines.length > 0 && (
        <section data-testid="inv-detail-base-stats">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1">
            {t('detail.baseStats')}
          </h3>
          <ul className="space-y-0.5 text-xs text-d2-white">
            {baseStatLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Affixes */}
      {item.affixes && item.affixes.length > 0 && (
        <section data-testid="inv-detail-affixes">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1">
            {t('detail.affixes')}
          </h3>
          <ul className="space-y-0.5 text-xs">
            {item.affixes.map((a, i) => (
              <li key={i} className={rarityTextClass(item.rarity)} data-testid="inv-detail-affix">
                {formatAffixRoll(a, tAffix)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sockets */}
      {socketCount > 0 && (
        <section data-testid="inv-detail-sockets">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1">
            {t('detail.sockets')}
          </h3>
          <div className="flex flex-wrap gap-1 text-xs font-mono text-d2-white/85">
            {socketBoxes.map((box, i) => (
              <span key={i}>{box}</span>
            ))}
          </div>
        </section>
      )}

      {/* Set / unique flavor */}
      {display.definitionStatLines.length > 0 && (
        <section data-testid="inv-detail-definition-stats">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1">
            {t('detail.specialStats')}
          </h3>
          <ul className="space-y-0.5 text-xs">
            {display.definitionStatLines.map((line) => (
              <li key={line.key} className={rarityTextClass(item.rarity)}>
                {line.text}
              </li>
            ))}
          </ul>
        </section>
      )}
      {item.rarity === 'set' && display.set && (
        <section data-testid="inv-detail-set" className="text-xs text-d2-set">
          <h3 className="text-[10px] uppercase tracking-wide text-d2-white/50 mb-1 not-italic">
            {t('detail.setBonus')}
          </h3>
          <p className="italic">{t('detail.setName', { name: tDataKey(t, display.set.name) })}</p>
          <ul className="mt-1 space-y-1">
            {display.setBonuses.map((bonus) => (
              <li
                key={bonus.threshold}
                data-active={bonus.active}
                className={bonus.active ? 'text-d2-set' : 'text-d2-white/45'}
              >
                <div className="font-semibold">
                  {t('detail.setBonusThreshold', { count: bonus.threshold })}
                  {' · '}
                  {bonus.active ? t('detail.setBonusActive') : t('detail.setBonusInactive')}
                </div>
                <ul className="pl-3">
                  {bonus.lines.map((line) => (
                    <li key={line.key}>{line.text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
      {item.rarity === 'unique' && (display.flavor ?? !display.unique) && (
        <section data-testid="inv-detail-unique" className="text-xs italic text-d2-unique">
          <p>{display.flavor ?? t('detail.uniqueFlavor')}</p>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-d2-border/60">
        {onEquip && equipLabel && (
          <Button
            variant="primary"
            className="min-h-[44px] flex-1"
            data-testid="inv-primary-action"
            onClick={onEquip}
          >
            {equipLabel}
          </Button>
        )}
        {onTransfer && transferLabel && (
          <Button
            variant="secondary"
            className="min-h-[44px] flex-1"
            data-testid="inv-secondary-action"
            onClick={onTransfer}
          >
            {transferLabel}
          </Button>
        )}
        <Button
          variant="danger"
          className="min-h-[44px] flex-1"
          data-testid="inv-discard-action"
          onClick={onDiscard}
        >
          {t('discard')}
        </Button>
      </div>
    </div>
  );
}

function rarityTextClass(rarity: Item['rarity']): string {
  switch (rarity) {
    case 'magic': return 'text-d2-magic';
    case 'rare': return 'text-d2-rare';
    case 'unique': return 'text-d2-unique';
    case 'set': return 'text-d2-set';
    case 'runeword': return 'text-d2-runeword';
    case 'normal':
    default:
      return 'text-d2-white';
  }
}
