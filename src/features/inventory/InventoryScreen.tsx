/**
 * InventoryScreen — Backpack / Stash / Equipment tabs.
 *
 * Layout (mobile):
 *   [ Tabs ]
 *   [ Capacity badge ]
 *   [ Item grid: 1-col on phones, 2-col @sm, 3-col @md ]
 *   [ Side details panel for selected item with action buttons ]
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GameImage, ItemTooltip, Panel, ScreenShell, Tabs, Tooltip, getItemIconUrl } from '@/ui';
import { useInventoryStore } from '@/stores';
import type { Item, EquipmentSlot } from '@/engine/types/items';

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
                    if (it.equipSlot) {
                      equipItem(it, it.equipSlot);
                    }
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
                <EquipmentPanel equipped={equipped} onUnequip={(slot) => { unequipItem(slot); }} />
              ),
            },
          ]}
          defaultTab="backpack"
        />
      </div>
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
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
        role="listbox"
        aria-label={t('items', { defaultValue: 'Items' })}
      >
        {items.map((it) => (
          <li key={it.id}>
            <Tooltip content={<ItemTooltip item={it} />}>
              <button
                type="button"
                onClick={() => { setSelectedId(it.id); }}
                aria-selected={selectedId === it.id}
                role="option"
                className={[
                  'w-full text-left min-h-[56px] px-3 py-2 rounded border bg-d2-bg/40',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold',
                  'flex items-center gap-2',
                  selectedId === it.id ? 'border-d2-gold' : 'border-d2-border hover:border-d2-gold/60',
                ].join(' ')}
                data-testid={`inv-item-${it.id}`}
              >
                <GameImage
                  src={getItemIconUrl(it)}
                  alt=""
                  fallbackIcon={(it.equipSlot ?? it.baseId).charAt(0).toUpperCase() || '?'}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className={`font-serif truncate ${rarityTextClass(it.rarity)}`}>
                    {it.baseId}
                  </div>
                  <div className="text-xs text-d2-white/60">
                    {t('itemLevel', { defaultValue: '物品等级' })} {it.level}
                  </div>
                </div>
              </button>
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
}: {
  equipped: Record<string, Item | null>;
  onUnequip: (slot: EquipmentSlot) => void;
}) {
  const { t } = useTranslation('inventory');
  return (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {SLOT_ORDER.map((slot) => {
        const item = equipped[slot];
        return (
          <li
            key={slot}
            className="border border-d2-border rounded p-3 bg-d2-bg/40 min-h-[64px]
                       flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {item && (
                <GameImage
                  src={getItemIconUrl(item)}
                  alt=""
                  fallbackIcon={(item.equipSlot ?? slot).charAt(0).toUpperCase()}
                  size="sm"
                />
              )}
              <div className="min-w-0">
                <div className="text-xs text-d2-white/60">{t(`slots.${slot}`)}</div>
                {item ? (
                  <div className={`font-serif truncate ${rarityTextClass(item.rarity)}`}>
                    {item.baseId}
                  </div>
                ) : (
                  <div className="text-sm text-d2-white/40 italic">
                    {t('empty', { defaultValue: '空' })}
                  </div>
                )}
              </div>
            </div>
            {item && (
              <Button
                variant="secondary"
                className="min-h-[40px] text-xs"
                onClick={() => { onUnequip(slot); }}
              >
                {t('unequip')}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
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
