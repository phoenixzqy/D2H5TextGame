/**
 * InventoryScreen — Backpack / Stash / Equipment tabs.
 *
 * Layout (mobile):
 *   [ Tabs ]
 *   [ Capacity badge ]
 *   [ Item grid: 1-col on phones, 2-col @sm, 3-col @md ]
 *   [ Side details panel for selected item with action buttons ]
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  GameCard,
  ItemTooltip,
  Panel,
  ScreenShell,
  Tabs,
  Tooltip,
  resolveItemIcon
} from '@/ui';
import { useInventoryStore } from '@/stores';
import { EquipPicker } from './EquipPicker';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item, EquipmentSlot, ItemBase } from '@/engine/types/items';

const SLOT_ORDER: EquipmentSlot[] = [
  'head',
  'amulet',
  'chest',
  'gloves',
  'belt',
  'boots',
  'ring-left',
  'ring-right',
  'weapon',
  'offhand',
];

const MAX_BACKPACK = 40;
const MAX_STASH = 100;

type ToastState = { readonly message: string; readonly tone: 'success' | 'error' } | null;

export function InventoryScreen() {
  const { t } = useTranslation(['inventory', 'common']);
  const backpack = useInventoryStore((s) => s.backpack);
  const stash = useInventoryStore((s) => s.stash);
  const equipped = useInventoryStore((s) => s.equipped);
  const removeItem = useInventoryStore((s) => s.removeItem);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const unequipItem = useInventoryStore((s) => s.unequipItem);
  const moveToStash = useInventoryStore((s) => s.moveToStash);
  const moveToBackpack = useInventoryStore((s) => s.moveToBackpack);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlot | null>(null);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = (message: string, tone: 'success' | 'error'): void => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => { setToast(null); }, 1800);
  };

  const handleUnequip = (slot: EquipmentSlot): void => {
    const item = equipped[slot];
    const result = unequipItem(slot);
    if (item && result.ok) {
      showToast(t('toast.unequipped', { name: itemDisplayName(item) }), 'success');
    }
  };

  return (
    <ScreenShell testId="inventory-screen" title={t('inventory.title', { defaultValue: '背包' })}>
      <div className="max-w-5xl mx-auto">
        <Tabs
          tabs={[
            {
              id: 'backpack',
              label: `${t('backpack')} (${String(backpack.length)}/${String(MAX_BACKPACK)})`,
              content: (
                <ItemGrid
                  items={backpack}
                  emptyKey="emptyBackpack"
                  primaryAction={(it) => {
                    const result = equipItem(it);
                    showToast(
                      result.ok
                        ? t('toast.equipped', { name: itemDisplayName(it) })
                        : t('toast.equipFailed', { name: itemDisplayName(it) }),
                      result.ok ? 'success' : 'error'
                    );
                  }}
                  primaryLabel={t('equip')}
                  secondaryAction={(it) => { moveToStash(it.id); }}
                  secondaryLabel={t('transfer')}
                  destructiveAction={(it) => { removeItem(it.id); }}
                  destructiveLabel={t('sell')}
                />
              ),
            },
            {
              id: 'stash',
              label: `${t('stash')} (${String(stash.length)}/${String(MAX_STASH)})`,
              content: (
                <ItemGrid
                  items={stash}
                  emptyKey="emptyStash"
                  primaryAction={(it) => { moveToBackpack(it.id); }}
                  primaryLabel={t('transfer')}
                  destructiveAction={(it) => { removeItem(it.id); }}
                  destructiveLabel={t('sell')}
                />
              ),
            },
            {
              id: 'equipment',
              label: t('equipment'),
              content: (
                <EquipmentPanel
                  equipped={equipped}
                  onUnequip={handleUnequip}
                  onSlotClick={(slot) => { setPickerSlot(slot); }}
                />
              ),
            },
          ]}
          defaultTab="backpack"
        />
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        data-testid="inventory-toast"
        className="pointer-events-none fixed inset-x-3 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end"
      >
        {toast && (
          <div
            className={`max-w-[calc(100vw-1.5rem)] rounded border px-4 py-3 text-sm shadow-d2 sm:max-w-sm ${
              toast.tone === 'success'
                ? 'border-d2-green/60 bg-d2-panel/95 text-d2-green'
                : 'border-d2-red/60 bg-d2-panel/95 text-d2-red'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
      <EquipPicker
        slot={pickerSlot}
        onClose={() => { setPickerSlot(null); }}
        onEquipped={(it) => { showToast(t('toast.equipped', { name: itemDisplayName(it) }), 'success'); }}
        onEquipFailed={(it) => { showToast(t('toast.equipFailed', { name: itemDisplayName(it) }), 'error'); }}
      />
    </ScreenShell>
  );
}

interface GridProps {
  items: Item[];
  emptyKey: string;
  primaryAction?: (it: Item) => void;
  primaryLabel?: string;
  secondaryAction?: (it: Item) => void;
  secondaryLabel?: string;
  destructiveAction?: (it: Item) => void;
  destructiveLabel?: string;
}

function ItemGrid({
  items,
  emptyKey,
  primaryAction,
  primaryLabel,
  secondaryAction,
  secondaryLabel,
  destructiveAction,
  destructiveLabel,
}: GridProps) {
  const { t } = useTranslation('inventory');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-d2-white/60 italic p-4 text-center">
        {t(emptyKey, { defaultValue: '空空如也' })}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(220px,280px)] gap-3">
      <ul
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2"
        role="listbox"
        aria-label={t('items', { defaultValue: 'Items' })}
      >
        {items.map((it) => (
          <li key={it.id}>
            <Tooltip content={<ItemTooltip item={it} />}>
              <GameCard
                variant="item"
                size="md"
                name={itemDisplayName(it)}
                rarity={it.rarity}
                image={resolveItemIcon(it.baseId) ?? undefined}
                itemGlyph={glyphForItem(it)}
                selected={selectedId === it.id}
                onClick={() => { setSelectedId(it.id); }}
                testId={`inv-item-${it.id}`}
              />
            </Tooltip>
          </li>
        ))}
      </ul>

      <Panel title={t('details', { defaultValue: '详情' })} className="md:sticky md:top-20 h-fit">
        {selected ? (
          <div className="space-y-2 text-sm">
            <ItemTooltip item={selected} />
            <div className="flex flex-wrap gap-2 pt-2 border-t border-d2-border">
              {primaryAction && primaryLabel && (
                <Button
                  variant="primary"
                  className="min-h-[40px] flex-1"
                  data-testid="inv-primary-action"
                  onClick={() => { primaryAction(selected); }}
                >
                  {primaryLabel}
                </Button>
              )}
              {secondaryAction && secondaryLabel && (
                <Button
                  variant="secondary"
                  className="min-h-[40px] flex-1"
                  onClick={() => { secondaryAction(selected); }}
                >
                  {secondaryLabel}
                </Button>
              )}
              {destructiveAction && destructiveLabel && (
                <Button
                  variant="danger"
                  className="min-h-[40px] flex-1"
                  onClick={() => {
                    destructiveAction(selected);
                    setSelectedId(null);
                  }}
                >
                  {destructiveLabel}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-d2-white/60 italic">
            {t('selectItem', { defaultValue: '选择一件物品' })}
          </p>
        )}
      </Panel>
    </div>
  );
}

function EquipmentPanel({
  equipped,
  onUnequip,
  onSlotClick,
}: {
  equipped: Record<string, Item | null>;
  onUnequip: (slot: EquipmentSlot) => void;
  onSlotClick: (slot: EquipmentSlot) => void;
}) {
  const { t } = useTranslation('inventory');
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {SLOT_ORDER.map((slot) => {
        const item = equipped[slot];
        return (
          <li key={slot}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => { onSlotClick(slot); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSlotClick(slot);
                }
              }}
              data-testid={`equip-slot-${slot}`}
              aria-label={t(`slots.${slot}`)}
              className="w-full border border-d2-border rounded p-3 bg-d2-bg/40 min-h-[64px]
                         flex items-center justify-between gap-2 text-left cursor-pointer
                         hover:border-d2-gold/60 focus:outline-none focus:ring-2 focus:ring-d2-gold
                         transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs text-d2-white/60">{t(`slots.${slot}`)}</div>
                {item ? (
                  <div className={`font-serif truncate ${rarityTextClass(item.rarity)}`}>
                    {itemDisplayName(item)}
                  </div>
                ) : (
                  <div className="text-sm text-d2-white/40 italic">
                    {t('empty', { defaultValue: '空' })}
                  </div>
                )}
              </div>
              {item && (
                <Button
                  variant="secondary"
                  className="min-h-[40px] text-xs shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnequip(slot);
                  }}
                >
                  {t('unequip')}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function itemDisplayName(item: Item): string {
  return item.baseId.split('/').pop() ?? item.baseId;
}

/**
 * Map an item's base type / slot to a corner-badge glyph for the inventory
 * card. Bug #18. Pure: looks the base up in the JSON catalog (cached) and
 * falls back to slug heuristics if the base is missing.
 */
function glyphForItem(item: Item):
  | 'weapon'
  | 'shield'
  | 'jewelry'
  | 'scroll'
  | 'charm'
  | 'gem'
  | 'rune'
  | 'armor'
  | undefined {
  const base: ItemBase | undefined = loadItemBases().get(item.baseId);
  const slug = item.baseId.split('/').pop() ?? '';
  if (base) {
    if (base.type === 'weapon') return 'weapon';
    if (base.type === 'jewelry') return 'jewelry';
    if (base.type === 'charm') return 'charm';
    if (base.type === 'gem') return 'gem';
    if (base.type === 'rune') return 'rune';
    if (base.type === 'armor') {
      // Shields are armor-typed but use the offhand slot.
      if (base.slot === 'offhand' || slug.startsWith('sh-')) return 'shield';
      return 'armor';
    }
    if (base.type === 'material') return 'scroll';
  }
  // Fallbacks when the base catalog doesn't know this id.
  if (slug.startsWith('sh-')) return 'shield';
  if (slug.startsWith('wp')) return 'weapon';
  if (slug.startsWith('ring-') || slug.startsWith('amu-')) return 'jewelry';
  return undefined;
}

function rarityTextClass(rarity: Item['rarity']): string {
  switch (rarity) {
    case 'magic':
      return 'text-d2-magic';
    case 'rare':
      return 'text-d2-rare';
    case 'unique':
      return 'text-d2-unique';
    case 'set':
      return 'text-d2-set';
    case 'runeword':
      return 'text-d2-runeword';
    case 'normal':
    default:
      return 'text-d2-white';
  }
}
