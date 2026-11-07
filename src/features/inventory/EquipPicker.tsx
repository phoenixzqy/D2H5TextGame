/** Browse candidates beside their complete comparison, with scrolling on small screens. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button, Modal, tItemName } from '@/ui';
import { EquipmentCandidateSummary } from './EquipmentCandidateSummary';
import { useInventoryStore, usePlayerStore, useMapStore } from '@/stores';
import type { EquipFailure } from '@/stores/inventoryStore';
import {
  checkEligibility,
  compareEquip,
  slotCandidates,
  type EligibilityResult
} from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import { ItemComparePanel } from './ItemComparePanel';

interface Props {
  readonly slot: EquipmentSlot | null;
  readonly onClose: () => void;
  readonly onEquipped?: (item: Item) => void;
  readonly onEquipFailed?: (item: Item, reason: EquipFailure['reason']) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Only the same owned instance is already equipped; equal rolls may be swapped. */
function isSameItem(a: Item | null, b: Item | null): boolean {
  return a !== null && b !== null && a.id === b.id;
}

function formatReasons(elig: EligibilityResult, t: TFunction): string {
  return elig.reasons
    .map((r) => {
      if (r.kind === 'level') {
        return t('equipFlow.picker.reason.level', {
          required: r.required,
          current: r.current
        });
      }
      const statName = t(`equipFlow.picker.stat.${r.stat ?? ''}`);
      return t('equipFlow.picker.reason.stat', {
        stat: statName,
        required: r.required,
        current: r.current
      });
    })
    .join('，');
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function CandidateRow({
  item,
  selected,
  eligible,
  reason,
  position,
  total,
  onSelect,
  rowRef
}: {
  readonly item: Item;
  readonly selected: boolean;
  readonly eligible: boolean;
  readonly reason: string;
  readonly position: number;
  readonly total: number;
  readonly onSelect: () => void;
  readonly rowRef?: (el: HTMLLIElement | null) => void;
}) {
  return (
    <li
      ref={rowRef}
      role="option"
      aria-selected={selected}
      aria-disabled={!eligible}
      aria-posinset={position}
      aria-setsize={total}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      data-testid={`equip-picker-row-${item.id}`}
      className={[
        'd2-plaque w-full flex items-center gap-3 p-3 rounded border text-left cursor-pointer',
        'min-h-[56px] transition-colors',
        selected
          ? 'border-d2-gold bg-d2-gold/10'
          : 'border-d2-border bg-d2-bg/40 hover:border-d2-gold/60',
        eligible ? '' : 'opacity-60'
      ].join(' ')}
    >
      <EquipmentCandidateSummary item={item}>
        {!eligible && <div className="text-xs text-d2-red mt-0.5">{reason}</div>}
      </EquipmentCandidateSummary>
    </li>
  );
}

function CandidateList({
  items,
  selectedId,
  eligibility,
  slotLabel,
  onSelect
}: {
  readonly items: readonly Item[];
  readonly selectedId: string | null;
  readonly eligibility: ReadonlyMap<string, EligibilityResult>;
  readonly slotLabel: string;
  readonly onSelect: (id: string) => void;
}) {
  const { t } = useTranslation(['inventory', 'common']);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageSize = 100;
  const pendingFocus = useRef<string | null>(null);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === selectedId)
  );
  const page = Math.floor(selectedIndex / pageSize);
  const pages = Math.ceil(items.length / pageSize);
  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);

  // Keyboard targets on another page mount before focus can move to them.
  // Page controls keep their own focus; only list-key navigation requests it.
  useLayoutEffect(() => {
    if (pendingFocus.current !== null) {
      rowRefs.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  }, [selectedId, items]);

  const changePage = (requested: number): void => {
    if (!Number.isFinite(requested)) return;
    const next = Math.max(0, Math.min(pages - 1, Math.trunc(requested)));
    const target = items[next * pageSize];
    if (target) {
      onSelect(target.id);
      viewportRef.current?.scrollTo({ top: 0 });
    }
  };

  const onListKey = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (items.length === 0) return;
      const idx = Math.max(
        0,
        items.findIndex((i) => i.id === selectedId)
      );
      let next = idx;
      if (e.key === 'ArrowDown') next = Math.min(items.length - 1, idx + 1);
      else if (e.key === 'ArrowUp') next = Math.max(0, idx - 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else return;
      e.preventDefault();
      const target = items[next];
      if (target) {
        const mounted = rowRefs.current.get(target.id);
        if (mounted) mounted.focus();
        else pendingFocus.current = target.id;
        onSelect(target.id);
      }
    },
    [items, selectedId, onSelect]
  );

  if (items.length === 0) {
    return (
      <p
        className="text-sm text-d2-white/60 italic text-center py-6"
        data-testid="equip-picker-empty"
      >
        {t('equipFlow.picker.empty')}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {pages > 1 && (
        <nav aria-label={t('pagination.label')} className="min-w-0 shrink-0 space-y-1">
          <p role="status" aria-live="polite" className="sr-only">
            {t('pagination.status', {
              start: start + 1,
              end: start + visible.length,
              total: items.length,
              page: page + 1,
              pages
            })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="min-h-[44px] min-w-[44px]"
              disabled={page === 0}
              onClick={() => {
                changePage(page - 1);
              }}
            >
              {t('pagination.previous')}
            </Button>
            <input
              type="number"
              min={1}
              max={pages}
              step={1}
              value={page + 1}
              aria-label={t('pagination.page')}
              onChange={(event) => {
                changePage(event.target.valueAsNumber - 1);
              }}
              className="d2-field min-h-[44px] w-20 rounded border border-d2-border bg-d2-bg px-2 text-base text-d2-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-d2-gold"
            />
            <Button
              variant="secondary"
              className="min-h-[44px] min-w-[44px]"
              disabled={page === pages - 1}
              onClick={() => {
                changePage(page + 1);
              }}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </nav>
      )}
      <div ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-d2">
        <ul
          className="space-y-2"
          role="listbox"
          aria-label={slotLabel}
          onKeyDown={onListKey}
          data-testid="candidate-list"
        >
          {visible.map((it, index) => {
            const elig = eligibility.get(it.id) ?? { eligible: true, reasons: [] };
            return (
              <CandidateRow
                key={it.id}
                item={it}
                selected={selectedId === it.id}
                eligible={elig.eligible}
                reason={formatReasons(elig, t)}
                position={start + index + 1}
                total={items.length}
                onSelect={() => {
                  onSelect(it.id);
                }}
                rowRef={(el) => {
                  if (el) rowRefs.current.set(it.id, el);
                  else rowRefs.current.delete(it.id);
                }}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function EquipFooter({
  onCancel,
  onEquip,
  disabledReason,
  failureMessage
}: {
  readonly onCancel: () => void;
  readonly onEquip: () => void;
  readonly disabledReason: string | null;
  readonly failureMessage: string | null;
}) {
  const { t } = useTranslation(['inventory', 'common']);
  return (
    <footer className="d2-toolbar border-t border-d2-border bg-d2-bg/40 p-2 shrink-0 space-y-2">
      <div aria-live="polite" aria-atomic="true">
        {failureMessage && (
          <p className="text-sm text-d2-red text-center" data-testid="equip-picker-error">
            {failureMessage}
          </p>
        )}
      </div>
      {disabledReason && (
        <div className="text-xs text-d2-red text-center" data-testid="equip-picker-disabled-reason">
          {disabledReason}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="min-h-[44px] flex-1"
          onClick={onCancel}
          data-testid="equip-picker-cancel"
        >
          {t('common:cancel')}
        </Button>
        <Button
          variant="primary"
          className="min-h-[44px] flex-1"
          disabled={disabledReason !== null}
          onClick={onEquip}
          data-testid="equip-picker-confirm"
        >
          {t('equip')}
        </Button>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export function EquipPicker({ slot, onClose, onEquipped, onEquipFailed }: Props) {
  const { t } = useTranslation(['inventory', 'common']);
  const player = usePlayerStore((s) => s.player);
  const questProgress = useMapStore((s) => s.questProgress);
  const questReceipts = useMapStore((s) => s.questReceipts);
  const questItems = useInventoryStore((s) => s.questItems);
  const backpack = useInventoryStore((s) => s.backpack);
  const equipped = useInventoryStore((s) => s.equipped);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<EquipFailure['reason'] | null>(null);

  useEffect(() => {
    setFailureReason(null);
  }, [slot, selectedId]);

  const candidates = useMemo(() => {
    if (!slot) return [] as Item[];
    return slotCandidates(backpack, slot);
  }, [backpack, slot]);

  const playerForCheck = useMemo(() => {
    if (!player) return null;
    return { level: player.level, coreStats: player.coreStats, derivedStats: player.derivedStats };
  }, [player]);

  const eligibility = useMemo<ReadonlyMap<string, EligibilityResult>>(() => {
    if (!playerForCheck) return new Map();
    const bases = loadItemBases();
    const m = new Map<string, EligibilityResult>();
    for (const it of candidates) {
      m.set(it.id, checkEligibility(it, playerForCheck, bases));
    }
    return m;
  }, [candidates, playerForCheck]);

  // Auto-select the first eligible candidate when the slot changes.
  useEffect(() => {
    if (!slot) return;
    setSelectedId((current) =>
      candidates.some((item) => item.id === current)
        ? current
        : (candidates.find((item) => eligibility.get(item.id)?.eligible)?.id ??
          candidates[0]?.id ??
          null)
    );
  }, [slot, candidates, eligibility]);

  const selected = useMemo(
    () => candidates.find((i) => i.id === selectedId) ?? null,
    [candidates, selectedId]
  );

  const compare = useMemo(() => {
    if (!selected || !playerForCheck || !slot) return null;
    return compareEquip(
      playerForCheck,
      selected,
      slot,
      equipped,
      undefined,
      questProgress,
      questItems,
      questReceipts
    );
  }, [selected, playerForCheck, slot, equipped, questProgress, questItems, questReceipts]);

  const sameAsEquipped = useMemo(() => {
    if (!compare) return false;
    return isSameItem(compare.current, compare.candidate);
  }, [compare]);

  const equippedAfter = useMemo(() => {
    if (!selected || !compare) return [] as Item[];
    const currentId = compare.current?.id;
    return [
      ...Object.values(equipped).filter(
        (item): item is Item => item !== null && item.id !== currentId
      ),
      selected
    ];
  }, [compare, equipped, selected]);

  const handleEquip = (): void => {
    if (!selected || !slot) return;
    const result = equipItem(selected, slot);
    if (result.ok) {
      setFailureReason(null);
      onEquipped?.(selected);
      onClose();
    } else {
      setFailureReason(result.reason);
      onEquipFailed?.(selected, result.reason);
    }
  };

  if (!slot) return null;

  const slotLabel = t(`slots.${slot}`);
  const selectedName = selected ? tItemName(t, selected) : '';
  const selectedElig = selected ? eligibility.get(selected.id) : undefined;

  const disabledReason: string | null = (() => {
    if (!selected) return t('equipFlow.footer.disabledNoSelection');
    if (sameAsEquipped) return t('equipFlow.footer.disabledAlreadyEquipped');
    if (selectedElig && !selectedElig.eligible) {
      return t('equipFlow.footer.disabledIneligible');
    }
    return null;
  })();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('equipFlow.picker.title', { slot: slotLabel })}
      className="!max-w-5xl"
    >
      <div data-testid="equip-picker" className="flex h-[min(75dvh,48rem)] min-h-0 flex-col gap-2">
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto md:grid-cols-2">
          <div className="flex min-h-[12rem] flex-col md:min-h-0">
            <CandidateList
              items={candidates}
              selectedId={selectedId}
              eligibility={eligibility}
              slotLabel={slotLabel}
              onSelect={setSelectedId}
            />{' '}
          </div>
          <div key={selectedId} className="min-w-0 md:overflow-y-auto scrollbar-d2">
            {compare && (
              <ItemComparePanel
                compare={compare}
                isAlreadyEquipped={sameAsEquipped}
                selectedName={selectedName}
                equippedAfter={equippedAfter}
              />
            )}
          </div>
        </div>

        <EquipFooter
          onCancel={onClose}
          onEquip={handleEquip}
          disabledReason={disabledReason}
          failureMessage={
            failureReason === null
              ? null
              : failureReason === 'backpack_full'
                ? t('toast.backpackFull')
                : t('toast.equipFailed', { name: selectedName })
          }
        />
      </div>
    </Modal>
  );
}
