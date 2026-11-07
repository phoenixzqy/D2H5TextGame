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
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Tabs } from './Tabs';
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

function pickStats(ds: DerivedStats): Record<ComparableStatKey, number> {
  const out = {} as Record<ComparableStatKey, number>;
  for (const k of STAT_KEYS) out[k] = ds[k];
  return out;
}

function pickResists(ds: DerivedStats): Record<keyof Resistances, number> {
  return { ...ds.resistances };
}

export function EquippedItemModal({
  slot,
  item,
  derivedStats,
  onClose
}: Props): JSX.Element | null {
  const { t } = useTranslation(['inventory', 'common']);

  if (slot === null) return null;

  const slotLabel = t(`slots.${slot}`);
  const stats = derivedStats ? pickStats(derivedStats) : null;
  const resistances = derivedStats ? pickResists(derivedStats) : null;

  return (
    <Modal isOpen onClose={onClose} title={slotLabel}>
      <Tabs
        tabs={[
          {
            id: 'item',
            label: t('details'),
            content: (
              <div className="flex justify-center" data-testid="equipped-item-modal">
                {item ? <ItemTooltip item={item} /> : <p>{t('empty')}</p>}
              </div>
            )
          },
          {
            id: 'stats',
            label: t('equipFlow.compare.statHeader'),
            content:
              stats && resistances ? (
                <StatSheet
                  mode="single"
                  item={item}
                  stats={stats}
                  resistances={resistances}
                  emptySlot={item === null}
                />
              ) : null
          }
        ]}
      />
    </Modal>
  );
}
