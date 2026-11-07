/** Inventory collections use tabs, bounded pages, and item detail dialogs. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  Button,
  EquipmentPanel,
  EquippedItemModal,
  Modal,
  ScreenShell,
  Tabs,
  tItemName
} from '@/ui';
import { useInventoryStore, usePlayerStore, useMapStore } from '@/stores';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from '@/stores/inventoryCapacity';
import { EquipPicker } from './EquipPicker';
import { ItemDetailPanel } from './ItemDetailPanel';
import { BulkDiscardToolbar } from './BulkDiscardToolbar';
import { BackpackGrid } from './BackpackGrid';
import { useInventoryPage, type InventoryPage } from './useInventoryPage';
import { LegacyGearQuarantinePanel } from './LegacyGearQuarantinePanel';
import { QuestItemsPanel } from './QuestItemsPanel';
import { MaterialsPanel } from './MaterialsPanel';
import { CraftingPanel } from './CraftingPanel';
import type { Item, EquipmentSlot } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import {
  checkEligibility,
  prepareCompareEquip,
  isClearNetUpgrade,
  resolveAutoEquipSlot,
  type CompareResult,
  type PlayerLike
} from './compareEquip';

function compareBackpackItem(
  item: Item,
  player: PlayerLike,
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReturnType<typeof loadItemBases>,
  compare: ReturnType<typeof prepareCompareEquip>
): CompareResult | null {
  const slot = bases.get(item.baseId)?.slot;
  if (!slot) return null;
  const eligibility = checkEligibility(item, player, bases);
  if (!eligibility.eligible) return null;
  return compare(item, resolveAutoEquipSlot(slot, equipped));
}

type ToastState = { readonly message: string; readonly tone: 'success' | 'error' } | null;

type DiscardConfirm =
  | { readonly kind: 'single'; readonly item: Item; readonly source: 'backpack' | 'stash' }
  | null;

export function InventoryScreen() {
  const { t } = useTranslation(['inventory', 'common']);

  return (
    <ScreenShell testId="inventory-screen" title={t('inventory.title')}>
      <InventoryGear />
    </ScreenShell>
  );
}

// Each collection is a focused tab; subscriptions retain live ownership data.
function InventoryGear() {
  const { t } = useTranslation(['inventory', 'common']);
  const backpack = useInventoryStore((s) => s.backpack);
  const stash = useInventoryStore((s) => s.stash);
  const equipped = useInventoryStore((s) => s.equipped);
  const player = usePlayerStore((s) => s.player);
  const discardItem = useInventoryStore((s) => s.discardItem);
  const bulkDiscard = useInventoryStore((s) => s.bulkDiscard);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const unequipItem = useInventoryStore((s) => s.unequipItem);
  const moveToStash = useInventoryStore((s) => s.moveToStash);
  const moveToBackpack = useInventoryStore((s) => s.moveToBackpack);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlot | null>(null);
  const [viewSlot, setViewSlot] = useState<EquipmentSlot | null>(null);

  // Selection per-tab so switching tabs keeps each tab's chosen item.
  const [backpackSelectedId, setBackpackSelectedId] = useState<string | null>(null);
  const [stashSelectedId, setStashSelectedId] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState<DiscardConfirm>(null);
  const backpackPage = useInventoryPage(backpack, BACKPACK_CAPACITY, () => { setBackpackSelectedId(null); });
  const stashPage = useInventoryPage(stash, Math.min(STASH_CAPACITY, Math.max(60, stash.length + 20)), () => { setStashSelectedId(null); });

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
    } else if (!result.ok && result.reason === 'backpack_full') {
      showToast(t('toast.backpackFull'), 'error');
    }
  };

  return (
    <>
      <div className="flex min-h-0 w-full max-w-6xl flex-1 flex-col mx-auto">
        <Tabs
          tabs={[
            {
              id: 'backpack',
              label: `${t('backpack')} (${String(backpack.length)}/${String(BACKPACK_CAPACITY)})`,
              content: (
                <BackpackTabContent
                  page={backpackPage}
                  items={backpack}
                  equipped={equipped}
                  selectedId={backpackSelectedId}
                  setSelectedId={setBackpackSelectedId}
                  player={player}
                  onEquip={(it) => {
                    const result = equipItem(it);
                    showToast(
                      result.ok
                        ? t('toast.equipped', { name: itemDisplayName(it) })
                        : result.reason === 'backpack_full'
                          ? t('toast.backpackFull')
                          : t('toast.equipFailed', { name: itemDisplayName(it) }),
                      result.ok ? 'success' : 'error'
                    );
                    if (result.ok) setBackpackSelectedId(null);
                  }}
                  onTransfer={(it) => {
                    const result = moveToStash(it.id);
                    if (result.ok) setBackpackSelectedId(null);
                    else showToast(t(result.reason === 'stash_full' ? 'toast.stashFull' : 'toast.transferFailed'), 'error');
                  }}
                  onDiscardRequest={(it) => { setDiscardConfirm({ kind: 'single', item: it, source: 'backpack' }); }}
                  onBulkDiscard={(ids) => {
                    bulkDiscard(ids);
                    setBackpackSelectedId(null);
                    showToast(t('toast.bulkDiscarded', { count: ids.length }), 'success');
                  }}
                />
              ),
            },
            {
              id: 'stash',
              label: `${t('stash')} (${String(stash.length)}/${String(STASH_CAPACITY)})`,
              content: (
                <StashTabContent
                  page={stashPage}
                  items={stash}
                  equipped={equipped}
                  selectedId={stashSelectedId}
                  setSelectedId={setStashSelectedId}
                  player={player}
                  onTransfer={(it) => {
                    const result = moveToBackpack(it.id);
                    if (result.ok) setStashSelectedId(null);
                    else showToast(t(result.reason === 'backpack_full' ? 'toast.backpackFull' : 'toast.transferFailed'), 'error');
                  }}
                  onDiscardRequest={(it) => { setDiscardConfirm({ kind: 'single', item: it, source: 'stash' }); }}
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
                  onViewSlot={(slot) => { setViewSlot(slot); }}
                />
              ),
            },
            { id: 'materials', label: t('materials.title'), content: <MaterialsPanel /> },
            { id: 'crafting', label: t('crafting.title'), content: <CraftingPanel /> },
            { id: 'quest-items', label: t('questItems.title'), content: <QuestItemsPanel /> },
            { id: 'quarantine', label: t('quarantine.title'), content: <LegacyGearQuarantinePanel /> },
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
            className={`d2-surface max-w-[calc(100vw-1.5rem)] rounded border px-4 py-3 text-sm shadow-d2 sm:max-w-sm ${
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
      />
      <EquippedItemModal
        slot={viewSlot}
        item={viewSlot ? (equipped[viewSlot] ?? null) : null}
        onClose={() => { setViewSlot(null); }}
      />

      {/* Single-item discard confirm */}
      <Modal
        isOpen={discardConfirm !== null}
        onClose={() => { setDiscardConfirm(null); }}
        title={t('discardConfirm.title')}
      >
        {discardConfirm && (
          <div className="space-y-3 text-sm">
            <p className="text-d2-white">
              {t('discardConfirm.body', { name: itemDisplayName(discardConfirm.item) })}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="min-h-[44px] flex-1"
                onClick={() => { setDiscardConfirm(null); }}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                className="min-h-[44px] flex-1"
                data-testid="inv-discard-confirm"
                onClick={() => {
                  // TODO(game-designer): replace with salvage→materials when crafting ships
                  const it = discardConfirm.item;
                  discardItem(it.id);
                  if (discardConfirm.source === 'backpack') setBackpackSelectedId(null);
                  else setStashSelectedId(null);
                  setDiscardConfirm(null);
                  showToast(t('toast.discarded', { name: itemDisplayName(it) }), 'success');
                }}
              >
                {t('discard')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Backpack tab                                                            */
/* ────────────────────────────────────────────────────────────────────── */

interface BackpackTabProps {
  readonly page: InventoryPage;
  readonly items: readonly Item[];
  readonly equipped: Record<string, Item | null>;
  readonly selectedId: string | null;
  readonly setSelectedId: (id: string | null) => void;
  readonly player: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly onEquip: (it: Item) => void;
  readonly onTransfer: (it: Item) => void;
  readonly onDiscardRequest: (it: Item) => void;
  readonly onBulkDiscard: (ids: readonly string[]) => void;
}

function BackpackTabContent({
  page,
  items,
  equipped,
  selectedId,
  setSelectedId,
  player,
  onEquip,
  onTransfer,
  onDiscardRequest,
  onBulkDiscard
}: BackpackTabProps): JSX.Element {
  const questProgress = useMapStore(s => s.questProgress);
  const questReceipts = useMapStore(s => s.questReceipts);
  const questItems = useInventoryStore(s => s.questItems);
  const { t } = useTranslation('inventory');
  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
  const equippedItems = useMemo(
    () => Object.values(equipped).filter((item): item is Item => item !== null),
    [equipped]
  );
  const playerForCompare = useMemo<PlayerLike | null>(() => {
    if (!player) return null;
    return { level: player.level, coreStats: player.coreStats, derivedStats: player.derivedStats };
  }, [player]);
  const bases = useMemo(() => loadItemBases(), []);
  const compare = useMemo(() => playerForCompare
    ? prepareCompareEquip(playerForCompare, equipped, bases, questProgress, questItems, questReceipts)
    : null, [playerForCompare, equipped, bases, questProgress, questItems, questReceipts]);
  const selectedCompare = useMemo(
    () => selected && playerForCompare && compare
      ? compareBackpackItem(selected, playerForCompare, equipped, bases, compare)
      : null,
    [bases, equipped, playerForCompare, selected, compare]
  );
  const selectedEquippedAfter = useMemo(() => {
    if (!selected || !selectedCompare) return [] as Item[];
    const currentId = selectedCompare.current?.id;
    return [
      ...Object.values(equipped).filter((item): item is Item => item !== null && item.id !== currentId),
      selected
    ];
  }, [equipped, selected, selectedCompare]);
  // Each memoized cell owns its comparison. Transfers preserve unchanged item
  // references; player, equipment and quest changes still invalidate every badge.
  const isUpgrade = useCallback((item: Item): boolean => {
    if (!playerForCompare || !compare) return false;
    const result = compareBackpackItem(item, playerForCompare, equipped, bases, compare);
    return result !== null && isClearNetUpgrade(result);
  }, [bases, equipped, playerForCompare, compare]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BulkDiscardToolbar backpack={items} equipped={equipped} onDiscard={onBulkDiscard} />
      <ItemGridLayout
        items={page.items}
        capacity={page.capacity}
        pagination={page.controls}
        viewportRef={page.viewportRef}
        emptyKey="emptyBackpack"
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        isUpgrade={isUpgrade}
        detailPanel={selected && player ? (
          <ItemDetailPanel
            item={selected}
            playerLevel={player.level}
            playerCoreStats={player.coreStats}
            equipLabel={t('equip')}
            transferLabel={t('transfer')}
            equippedItems={equippedItems}
            compare={selectedCompare}
            equippedAfterCompare={selectedEquippedAfter}
            onEquip={() => { onEquip(selected); }}
            onTransfer={() => { onTransfer(selected); }}
            onDiscard={() => { onDiscardRequest(selected); }}
            onClose={() => { setSelectedId(null); }}
          />
        ) : null}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Stash tab                                                               */
/* ────────────────────────────────────────────────────────────────────── */

interface StashTabProps {
  readonly page: InventoryPage;
  readonly items: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly selectedId: string | null;
  readonly setSelectedId: (id: string | null) => void;
  readonly player: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly onTransfer: (it: Item) => void;
  readonly onDiscardRequest: (it: Item) => void;
}

function StashTabContent({
  page,
  items,
  equipped,
  selectedId,
  setSelectedId,
  player,
  onTransfer,
  onDiscardRequest
}: StashTabProps): JSX.Element {
  const { t } = useTranslation('inventory');
  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
  const equippedItems = useMemo(
    () => Object.values(equipped).filter((item): item is Item => item !== null),
    [equipped]
  );

  return (
    <ItemGridLayout
      items={page.items}
      capacity={page.capacity}
      pagination={page.controls}
        viewportRef={page.viewportRef}
      emptyKey="emptyStash"
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      detailPanel={selected && player ? (
        <ItemDetailPanel
          item={selected}
          playerLevel={player.level}
          playerCoreStats={player.coreStats}
          transferLabel={t('transfer')}
          equippedItems={equippedItems}
          onTransfer={() => { onTransfer(selected); }}
          onDiscard={() => { onDiscardRequest(selected); }}
          onClose={() => { setSelectedId(null); }}
        />
      ) : null}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Item grid with detail dialog                                            */
/* ────────────────────────────────────────────────────────────────────── */

interface GridLayoutProps {
  readonly pagination: React.ReactNode;
  readonly viewportRef: InventoryPage['viewportRef'];
  readonly items: readonly Item[];
  readonly capacity: number;
  readonly emptyKey: string;
  readonly selectedId: string | null;
  readonly setSelectedId: (id: string | null) => void;
  readonly isUpgrade?: ((item: Item) => boolean) | undefined;
  /** Already-rendered detail panel; null when nothing is selected. */
  readonly detailPanel: React.ReactNode | null;
}

function ItemGridLayout({
  items,
  capacity,
  emptyKey,
  selectedId,
  setSelectedId,
  isUpgrade,
  pagination,
  viewportRef,
  detailPanel
}: GridLayoutProps): JSX.Element {
  const { t } = useTranslation('inventory');
  const open = selectedId !== null && detailPanel !== null;
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      setWide(query.matches);
    };
    update();
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
    };
  }, []);
  return (
    <div
      className="flex min-h-0 flex-1 gap-3"
      data-testid="inventory-layout"
      data-detail-open={open}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div ref={viewportRef} className="min-w-0 min-h-0 flex-1 overflow-y-auto scrollbar-d2">
          {items.length === 0 ? (
            <p className="text-sm text-d2-white/60 italic p-4 text-center">{t(emptyKey)}</p>
          ) : (
            <BackpackGrid
              items={items}
              capacity={capacity}
              selectedId={selectedId}
              onSelect={setSelectedId}
              isUpgrade={isUpgrade}
            />
          )}
        </div>
        {pagination}
      </div>
      {wide && open && (
        <aside
          key={selectedId}
          aria-label={t('details')}
          className="d2-surface w-[26rem] max-w-[50%] shrink-0 overflow-y-auto scrollbar-d2 p-3"
        >
          {detailPanel}
        </aside>
      )}
      <Modal
        isOpen={!wide && open}
        onClose={() => {
          setSelectedId(null);
        }}
        title={t('details')}
      >
        {detailPanel}
      </Modal>
    </div>
  );
}

function itemDisplayName(item: Item): string {
  return tItemName(i18n.t.bind(i18n), item);
}
