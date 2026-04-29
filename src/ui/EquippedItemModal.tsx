/**
 * EquippedItemModal — read-only stat sheet for an equipped item.
 *
 * Triggered from the Character / Inventory equipment slot tiles when the
 * user just wants to inspect, not swap. Reuses `<StatSheet mode="single">`
 * so formatting stays in lockstep with the equip-picker compare panel.
 *
 * Strategy: rather than recomputing per-item contribution (which would
 * require re-running the engine pipeline), we pull the player's current
 * derived stats — which already incorporate all equipped gear — and
 * display them next to the item's name. This matches the spec's intent
 * ("show the currently equipped item's full stat sheet") while keeping
 * the component pure-presentational.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { StatSheet } from './StatSheet';
import { ItemTooltip } from './ItemTooltip';
import type { ComparableStatKey } from '@/features/inventory/compareEquip';
import type { DerivedStats, Resistances } from '@/engine/types/attributes';
import type { Item, EquipmentSlot } from '@/engine/types/items';

interface Props {
  readonly slot: EquipmentSlot | null;
  readonly item: Item | null;
  readonly derivedStats: DerivedStats | null;
  readonly onClose: () => void;
}

const STAT_KEYS: readonly ComparableStatKey[] = [
  'lifeMax', 'manaMax', 'attack', 'defense', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
];

function pickStats(ds: DerivedStats): Record<ComparableStatKey, number> {
  const out = {} as Record<ComparableStatKey, number>;
  for (const k of STAT_KEYS) out[k] = ds[k];
  return out;
}

function pickResists(ds: DerivedStats): Record<keyof Resistances, number> {
  return { ...ds.resistances };
}

export function EquippedItemModal({ slot, item, derivedStats, onClose }: Props): JSX.Element | null {
  const { t } = useTranslation(['inventory', 'common']);

  useEffect(() => {
    if (slot === null) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [slot, onClose]);

  if (slot === null) return null;

  const slotLabel = t(`slots.${slot}`);
  const stats = derivedStats ? pickStats(derivedStats) : null;
  const resistances = derivedStats ? pickResists(derivedStats) : null;

  return (
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipped-item-modal-title"
      data-testid="equipped-item-modal"
    >
      <div
        className={[
          'bg-d2-panel border-2 border-d2-gold shadow-2xl shadow-d2-gold/20 animate-fadeIn',
          'w-full rounded-t-lg sm:rounded-lg max-h-[85vh] sm:max-h-[90vh]',
          'sm:max-w-md sm:w-full flex flex-col overflow-hidden'
        ].join(' ')}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <header className="flex items-center justify-between p-4 border-b border-d2-border">
          <h2 id="equipped-item-modal-title" className="text-lg font-serif font-bold text-d2-gold">
            {slotLabel}
          </h2>
          <Button
            variant="secondary"
            className="min-h-[44px] min-w-[44px] !px-3"
            aria-label={t('common:close')}
            onClick={onClose}
            data-testid="equipped-item-modal-close"
          >
            ×
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-d2 p-4 space-y-3">
          {item && (
            <div className="flex justify-center">
              <ItemTooltip item={item} />
            </div>
          )}
          {stats && resistances && (
            <StatSheet
              mode="single"
              item={item}
              stats={stats}
              resistances={resistances}
              emptySlot={item === null}
            />
          )}
        </div>

        <footer className="p-4 border-t border-d2-border bg-d2-bg/40">
          <Button
            variant="primary"
            className="min-h-[44px] w-full"
            onClick={onClose}
            data-testid="equipped-item-modal-ok"
          >
            {t('common:close')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
