/**
 * ItemDetailPanel — rich, rarity-themed read-out for the selected item
 * shown in the inventory side-panel (desktop) or bottom sheet (mobile).
 *
 * No engine logic. Reads bases via `loadItemBases()` and `loadAffixPool()`
 * (cached catalog selectors). Comparing requirements vs the player's
 * stats is local: red text for unmet entries.
 *
 * Sockets:
 *   Native instance capacity is the slot count. `item.socketContents` maps each
 *   filled socket in order, otherwise `[ ]`.
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
import { GameImage } from '@/ui/GameImage';
import { getItemIconUrl } from '@/ui/imageHelpers';
import { formatAffixRoll } from '@/ui/affixFormat';
import { resolveItemDisplay, resolveSocketDisplayLines } from '@/ui/itemDisplay';
import { tDataKey } from '@/ui/i18nKey';
import { loadItemBases, resolveItemReqLevel } from '@/data/loaders/loot';
import type { CoreStats } from '@/engine/types/attributes';
import type { Item, ItemBase } from '@/engine/types/items';
import { materialCatalog } from '@/data/loaders/materials';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import type { CompareResult } from './compareEquip';
import { ItemComparePanel } from './ItemComparePanel';

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
  /** Optional equipment comparison for equippable backpack items. */
  readonly compare?: CompareResult | null;
  readonly equippedAfterCompare?: readonly Item[];
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
  equippedItems = [],
  compare = null,
  equippedAfterCompare = []
}: ItemDetailPanelProps): JSX.Element {
  const { t } = useTranslation(['inventory', 'items', 'affixes']);
  const { t: tItems } = useTranslation('items');
  const { t: tAffix } = useTranslation('affixes');

  const base: ItemBase | undefined = loadItemBases().get(item.baseId);
  const display = resolveItemDisplay(item, t, equippedItems);
  const specialStatLines = [...display.definitionStatLines, ...resolveSocketDisplayLines(item, t)];
  const displayName = display.name;
  const icon = getItemIconUrl(item);
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
  const socketCount = base ? effectiveSocketCapacity(item, base) : 0;
  const contents = item.socketContents ?? [];
  const socketBoxes: string[] = [];
  for (let i = 0; i < socketCount; i++) {
    const content = contents[i];
    if (content) {
      const definition = materialCatalog.get(content.id);
      const runeName = definition ? tDataKey(tItems, definition.nameKey) : content.id;
      socketBoxes.push(t('detail.filledSocket', { name: runeName }));
    } else {
      socketBoxes.push(t('detail.emptySocket'));
    }
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-3 break-words text-sm"
      data-testid="inv-detail-panel"
      data-rarity={item.rarity}
    >
      {/* Header: icon + name + type line + close */}
      <div className="flex items-start gap-3 border-b border-d2-border/60 pb-2">
        <GameImage
          src={icon}
          alt={displayName}
          size="lg"
          className="border-d2-border/70 bg-none bg-d2-bg/60"
          imageClassName="w-full h-full object-contain"
        />
        <div className="min-w-0 flex-1">
          <RarityText
            rarity={item.rarity}
            className="font-serif text-base font-bold block break-words"
          >
            {displayName}
          </RarityText>
          <div className="text-sm text-d2-white/70 mt-0.5">{typeLine}</div>
          {item.personalizedBy && <div className="text-sm text-d2-gold break-words" data-testid="inv-detail-personalization">
            {t('detail.personalizedBy', { name: item.personalizedBy.name })}
          </div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="d2-control shrink-0 min-h-[44px] min-w-[44px] -mt-1 px-2 py-1 text-d2-white/60 hover:text-d2-gold focus:outline-none focus:ring-2 focus:ring-d2-gold rounded"
          data-testid="inv-detail-close"
        >
          ×
        </button>
      </div>

      {/* Requirements */}
      {reqRows.length > 0 && (
        <section data-testid="inv-detail-required">
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1">
            {t('detail.required')}
          </h3>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
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
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1">
            {t('detail.baseStats')}
          </h3>
          <ul className="space-y-0.5 text-sm text-d2-white">
            {baseStatLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Affixes */}
      {item.affixes && item.affixes.length > 0 && (
        <section data-testid="inv-detail-affixes">
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1">
            {t('detail.affixes')}
          </h3>
          <ul className="space-y-0.5 text-sm">
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
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1">
            {t('detail.sockets')}
          </h3>
          <div className="flex flex-wrap gap-1 text-sm font-mono text-d2-white/85">
            {socketBoxes.map((box, i) => (
              <span key={i}>{box}</span>
            ))}
          </div>
        </section>
      )}

      {/* Set / unique flavor */}
      {specialStatLines.length > 0 && (
        <section data-testid="inv-detail-definition-stats">
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1">
            {t('detail.specialStats')}
          </h3>
          <ul className="space-y-0.5 text-sm">
            {specialStatLines.map((line, index) => (
              <li key={`${line.key}-${String(index)}`} className={rarityTextClass(item.rarity)}>
                {line.text}
              </li>
            ))}
          </ul>
        </section>
      )}
      {item.rarity === 'set' && display.set && (
        <section data-testid="inv-detail-set" className="text-sm text-d2-set">
          <h3 className="d2-section-title text-sm uppercase tracking-wide text-d2-white/70 mb-1 not-italic">
            {t('detail.setBonus')}
          </h3>
          <p className="italic">{t('detail.setName', { name: tDataKey(t, display.set.name) })}</p>
          <ul className="mt-1 space-y-1">
            {display.setBonuses.map((bonus) => (
              <li
                key={bonus.threshold}
                data-active={bonus.active}
                className={bonus.active ? 'text-d2-set' : 'text-d2-white/70'}
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
        <section data-testid="inv-detail-unique" className="text-sm italic text-d2-unique">
          <p>{display.flavor ?? t('detail.uniqueFlavor')}</p>
        </section>
      )}

      {compare ? (
        <ItemComparePanel
          compare={compare}
          selectedName={displayName}
          equippedAfter={equippedAfterCompare}
          titleId={`inv-detail-compare-title-${item.id}`}
        />
      ) : null}

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
