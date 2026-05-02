/**
 * InventoryScreen — Backpack / Stash / Equipment tabs.
 *
 * Layout (Issue #1 of the inventory UX overhaul):
 *
 *   Desktop (lg ≥ 1024px):
 *     Two-column CSS grid that *resizes* the grid column when the detail
 *     panel opens — never overlaps. `grid-cols-[1fr_340px]` with
 *     `transition-all` so the grid reflow is animated.
 *
 *   Tablet (md 768–1023px):
 *     Same sidebar approach as desktop, narrower (`280px`) — keeps the
 *     two-finger reach pattern from desktop. Below `md`, falls through
 *     to the mobile sheet.
 *
 *   Mobile (< 768px):
 *     The right column is rendered as a fixed bottom sheet (slide-up)
 *     with a dimmed backdrop. Tap-outside or the explicit close button
 *     dismiss. The grid keeps its full width so the player can keep
 *     browsing while the sheet is up.
 *
 *   ESC dismisses on every breakpoint.
 *
 * Selection state is hoisted up here (not inside ItemGrid) so the same
 * detail panel can be reused for backpack and stash. Each tab gets its
 * own selectedId — switching tabs preserves the per-tab selection.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import {
  Button,
  EquipmentPanel,
  EquippedItemModal,
  Modal,
  Panel,
  ScreenShell,
  Tabs,
  tItemName
} from '@/ui';
import { useInventoryStore, usePlayerStore } from '@/stores';
import { EquipPicker } from './EquipPicker';
import { ItemDetailPanel } from './ItemDetailPanel';
import { BulkDiscardToolbar } from './BulkDiscardToolbar';
import { BackpackGrid } from './BackpackGrid';
import type { Item, EquipmentSlot } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import {
  checkEligibility,
  compareEquip,
  isClearNetUpgrade,
  resolveAutoEquipSlot,
  type CompareResult,
  type PlayerLike
} from './compareEquip';

const MAX_BACKPACK = 100;
const MAX_STASH = 500;

function compareBackpackItem(
  item: Item,
  player: PlayerLike,
  equipped: Readonly<Record<string, Item | null>>,
  bases: ReturnType<typeof loadItemBases>
): CompareResult | null {
  const slot = bases.get(item.baseId)?.slot;
  if (!slot) return null;
  const eligibility = checkEligibility(item, player, bases);
  if (!eligibility.eligible) return null;
  return compareEquip(player, item, resolveAutoEquipSlot(slot, equipped), equipped, bases);
}

type ToastState = { readonly message: string; readonly tone: 'success' | 'error' } | null;

type DiscardConfirm =
  | { readonly kind: 'single'; readonly item: Item; readonly source: 'backpack' | 'stash' }
  | null;

export function InventoryScreen() {
  const { t } = useTranslation(['inventory', 'common']);
  const backpack = useInventoryStore((s) => s.backpack);
  const stash = useInventoryStore((s) => s.stash);
  const equipped = useInventoryStore((s) => s.equipped);
  const discardItem = useInventoryStore((s) => s.discardItem);
  const bulkDiscard = useInventoryStore((s) => s.bulkDiscard);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const unequipItem = useInventoryStore((s) => s.unequipItem);
  const moveToStash = useInventoryStore((s) => s.moveToStash);
  const moveToBackpack = useInventoryStore((s) => s.moveToBackpack);
  const player = usePlayerStore((s) => s.player);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlot | null>(null);
  const [viewSlot, setViewSlot] = useState<EquipmentSlot | null>(null);

  // Selection per-tab so switching tabs keeps each tab's chosen item.
  const [backpackSelectedId, setBackpackSelectedId] = useState<string | null>(null);
  const [stashSelectedId, setStashSelectedId] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState<DiscardConfirm>(null);

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
    <ScreenShell testId="inventory-screen" title={t('inventory.title')}>
      <div className="max-w-6xl mx-auto">
        <Tabs
          tabs={[
            {
              id: 'backpack',
              label: `${t('backpack')} (${String(backpack.length)}/${String(MAX_BACKPACK)})`,
              content: (
                <BackpackTabContent
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
                        : t('toast.equipFailed', { name: itemDisplayName(it) }),
                      result.ok ? 'success' : 'error'
                    );
                    if (result.ok) setBackpackSelectedId(null);
                  }}
                  onTransfer={(it) => { moveToStash(it.id); setBackpackSelectedId(null); }}
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
              label: `${t('stash')} (${String(stash.length)}/${String(MAX_STASH)})`,
              content: (
                <StashTabContent
                  items={stash}
                  selectedId={stashSelectedId}
                  setSelectedId={setStashSelectedId}
                  player={player}
                  onTransfer={(it) => { moveToBackpack(it.id); setStashSelectedId(null); }}
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
      <EquippedItemModal
        slot={viewSlot}
        item={viewSlot ? (equipped[viewSlot] ?? null) : null}
        derivedStats={player?.derivedStats ?? null}
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
    </ScreenShell>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Backpack tab                                                            */
/* ────────────────────────────────────────────────────────────────────── */

interface BackpackTabProps {
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
  const selectedCompare = useMemo(
    () => selected && playerForCompare
      ? compareBackpackItem(selected, playerForCompare, equipped, bases)
      : null,
    [bases, equipped, playerForCompare, selected]
  );
  const selectedEquippedAfter = useMemo(() => {
    if (!selected || !selectedCompare) return [] as Item[];
    const currentId = selectedCompare.current?.id;
    return [
      ...Object.values(equipped).filter((item): item is Item => item !== null && item.id !== currentId),
      selected
    ];
  }, [equipped, selected, selectedCompare]);
  const upgradeItemIds = useMemo(() => {
    if (!playerForCompare) return new Set<string>();
    const ids = new Set<string>();
    for (const item of items) {
      const compare = compareBackpackItem(item, playerForCompare, equipped, bases);
      if (compare && isClearNetUpgrade(compare)) ids.add(item.id);
    }
    return ids;
  }, [bases, equipped, items, playerForCompare]);

  return (
    <div className="flex flex-col">
      <BulkDiscardToolbar backpack={items} equipped={equipped} onDiscard={onBulkDiscard} />
      <ItemGridLayout
        items={items}
        capacity={MAX_BACKPACK}
        emptyKey="emptyBackpack"
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        upgradeItemIds={upgradeItemIds}
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
  readonly items: readonly Item[];
  readonly selectedId: string | null;
  readonly setSelectedId: (id: string | null) => void;
  readonly player: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly onTransfer: (it: Item) => void;
  readonly onDiscardRequest: (it: Item) => void;
}

function StashTabContent({
  items,
  selectedId,
  setSelectedId,
  player,
  onTransfer,
  onDiscardRequest
}: StashTabProps): JSX.Element {
  const { t } = useTranslation('inventory');
  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  return (
    <ItemGridLayout
      items={items}
      capacity={Math.min(MAX_STASH, Math.max(60, items.length + 20))}
      emptyKey="emptyStash"
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      detailPanel={selected && player ? (
        <ItemDetailPanel
          item={selected}
          playerLevel={player.level}
          playerCoreStats={player.coreStats}
          transferLabel={t('transfer')}
          onTransfer={() => { onTransfer(selected); }}
          onDiscard={() => { onDiscardRequest(selected); }}
          onClose={() => { setSelectedId(null); }}
        />
      ) : null}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Two-column grid + bottom-sheet shell                                    */
/* ────────────────────────────────────────────────────────────────────── */

interface GridLayoutProps {
  readonly items: readonly Item[];
  readonly capacity: number;
  readonly emptyKey: string;
  readonly selectedId: string | null;
  readonly setSelectedId: (id: string | null) => void;
  readonly upgradeItemIds?: ReadonlySet<string> | undefined;
  /** Already-rendered detail panel; null when nothing is selected. */
  readonly detailPanel: React.ReactNode | null;
}

function ItemGridLayout({
  items,
  capacity,
  emptyKey,
  selectedId,
  setSelectedId,
  upgradeItemIds,
  detailPanel
}: GridLayoutProps): JSX.Element {
  const { t } = useTranslation('inventory');

  // ESC dismisses on every breakpoint.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [selectedId, setSelectedId]);

  const open = selectedId !== null && detailPanel !== null;
  const isDesktop = useIsDesktop();

  return (
    <div
      className={[
        'grid gap-3 transition-all duration-200',
        // md (tablet) gets a narrower sidebar; lg+ uses 340px.
        open ? 'md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_340px]' : 'grid-cols-1'
      ].join(' ')}
      data-testid="inventory-layout"
      data-detail-open={open}
    >
      <div className="min-w-0">
        {items.length === 0 ? (
          <p className="text-sm text-d2-white/60 italic p-4 text-center">
            {t(emptyKey)}
          </p>
        ) : (
            <BackpackGrid
              items={items}
              capacity={capacity}
              selectedId={selectedId}
              onSelect={setSelectedId}
              upgradeItemIds={upgradeItemIds}
            />
        )}
      </div>

      {/* Desktop / tablet sidebar OR mobile bottom sheet — exclusive render
          based on viewport so testids never collide between the two trees. */}
      {open && isDesktop && (
        <Panel
          className="md:sticky md:top-20 h-fit"
          data-testid="inv-detail-sidebar"
        >
          {detailPanel}
        </Panel>
      )}
      {open && !isDesktop && (
        <MobileBottomSheet onClose={() => { setSelectedId(null); }}>
          {detailPanel}
        </MobileBottomSheet>
      )}
    </div>
  );
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(min-width: 768px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent): void => { setIsDesktop(e.matches); };
    mql.addEventListener('change', onChange);
    return () => { mql.removeEventListener('change', onChange); };
  }, []);
  return isDesktop;
}

function MobileBottomSheet({
  children,
  onClose
}: {
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <div className="md:hidden fixed inset-0 z-40" data-testid="inv-detail-sheet">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="absolute inset-0 bg-black/60 motion-safe:animate-fadeIn"
        onClick={onClose}
        aria-hidden
        data-testid="inv-detail-backdrop"
      />
      <div
        className="absolute left-0 right-0 bottom-0 bg-d2-panel border-t-2 border-d2-gold rounded-t-lg p-4 max-h-[85vh] overflow-y-auto scrollbar-d2 motion-safe:animate-fadeIn"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function itemDisplayName(item: Item): string {
  return tItemName(i18n.t.bind(i18n), item);
}
