/**
 * EquipPicker — redesigned per UX flow doc (feat/equip-picker-v3).
 *
 * Layout (mobile-first, ≥360px):
 *   ┌────────────────────────────────┐
 *   │ Header (title + close)         │  fixed
 *   ├────────────────────────────────┤
 *   │ <CandidateList>                │  scroll
 *   │  ┌ <CandidateRow>              │
 *   │  │ ↑/↓ Home/End Enter keyboard │
 *   ├────────────────────────────────┤
 *   │ <ComparePanel> (sticky on top) │
 *   │   paired headers (current|cand)│
 *   │   <StatSheet mode="compare">   │  reuses tested 3-col table
 *   │   candidate-only affix list    │  (already inside StatSheet)
 *   │   aria-live announcement       │
 *   ├────────────────────────────────┤
 *   │ <EquipFooter> [Cancel][Equip]  │  sticky bottom + disabled-reason
 *   └────────────────────────────────┘
 *
 * Desktop (≥1024px): list (1/3) and compare panel (2/3) side-by-side
 * inside a max-w-3xl modal.
 *
 * Behavior contracts (asserted by E2E):
 *   - On open with ≥1 eligible candidate, auto-select the first eligible
 *     so the compare panel is populated WITHOUT user interaction.
 *   - aria-live="polite" announces selection changes.
 *   - Same persistent item ID as currently-equipped → render an
 *     "already-equipped" badge, omit the StatSheet body, disable Equip.
 *   - Empty-slot path is handled by StatSheet (data-empty="true").
 *
 * Engine work delegated to:
 *   - slotCandidates / checkEligibility from compareEquip.ts
 *   - compareEquip() for deltas
 *   - inventoryStore.equipItem() for the actual equip action
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button, GameImage, RarityText, getItemIconUrl, tItemName } from '@/ui';
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

function ItemThumb({ item }: { readonly item: Item }) {
  return (
    <GameImage
      src={getItemIconUrl(item)}
      alt=""
      fallbackIcon="?"
      className="!w-12 !h-12 [&_img]:object-contain"
    />
  );
}

function CandidateRow({
  item,
  selected,
  eligible,
  reason,
  onSelect,
  rowRef
}: {
  readonly item: Item;
  readonly selected: boolean;
  readonly eligible: boolean;
  readonly reason: string;
  readonly onSelect: () => void;
  readonly rowRef?: (el: HTMLLIElement | null) => void;
}) {
  const { t } = useTranslation('inventory');
  return (
    <li
      ref={rowRef}
      role="option"
      aria-selected={selected}
      aria-disabled={!eligible}
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
        'w-full flex items-center gap-3 p-3 rounded border text-left cursor-pointer',
        'min-h-[56px] transition-colors',
        selected
          ? 'border-d2-gold bg-d2-gold/10'
          : 'border-d2-border bg-d2-bg/40 hover:border-d2-gold/60',
        eligible ? '' : 'opacity-60'
      ].join(' ')}
    >
      <ItemThumb item={item} />
      <div className="min-w-0 flex-1">
        <RarityText rarity={item.rarity} className="font-serif truncate block">
          {tItemName(t, item)}
        </RarityText>
        <div className="text-xs text-d2-white/60">
          {t('itemLevel')} {item.level}
        </div>
        {!eligible && (
          <div className="text-xs text-d2-red mt-0.5">{reason}</div>
        )}
      </div>
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

  const onListKey = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (items.length === 0) return;
      const idx = Math.max(0, items.findIndex((i) => i.id === selectedId));
      let next = idx;
      if (e.key === 'ArrowDown') next = Math.min(items.length - 1, idx + 1);
      else if (e.key === 'ArrowUp') next = Math.max(0, idx - 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else return;
      e.preventDefault();
      const target = items[next];
      if (target) {
        onSelect(target.id);
        rowRefs.current.get(target.id)?.focus();
      }
    },
    [items, selectedId, onSelect]
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-d2-white/60 italic text-center py-6" data-testid="equip-picker-empty">
        {t('equipFlow.picker.empty')}
      </p>
    );
  }

  return (
    <ul
      className="space-y-2"
      role="listbox"
      aria-label={slotLabel}
      onKeyDown={onListKey}
      data-testid="candidate-list"
    >
      {items.map((it) => {
        const elig = eligibility.get(it.id) ?? { eligible: true, reasons: [] };
        return (
          <CandidateRow
            key={it.id}
            item={it}
            selected={selectedId === it.id}
            eligible={elig.eligible}
            reason={formatReasons(elig, t)}
            onSelect={() => { onSelect(it.id); }}
            rowRef={(el) => {
              if (el) rowRefs.current.set(it.id, el);
              else rowRefs.current.delete(it.id);
            }}
          />
        );
      })}
    </ul>
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
    <footer className="border-t border-d2-border bg-d2-bg/40 p-4 space-y-2">
      <div aria-live="polite" aria-atomic="true">
        {failureMessage && (
          <p className="text-sm text-d2-red text-center" data-testid="equip-picker-error">
            {failureMessage}
          </p>
        )}
      </div>
      {disabledReason && (
        <div
          className="text-xs text-d2-red text-center"
          data-testid="equip-picker-disabled-reason"
        >
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
  const questProgress = useMapStore(s => s.questProgress);
  const backpack = useInventoryStore((s) => s.backpack);
  const equipped = useInventoryStore((s) => s.equipped);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<EquipFailure['reason'] | null>(null);

  useEffect(() => { setFailureReason(null); }, [slot, selectedId]);

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

  // Auto-select the first eligible candidate on open / when list changes.
  useEffect(() => {
    if (!slot) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      const stillThere = prev !== null && candidates.some((c) => c.id === prev);
      if (stillThere) return prev;
      const firstEligible = candidates.find(
        (c) => eligibility.get(c.id)?.eligible !== false
      );
      return firstEligible?.id ?? candidates[0]?.id ?? null;
    });
  }, [slot, candidates, eligibility]);

  // Esc closes.
  useEffect(() => {
    if (!slot) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [slot, onClose]);

  const selected = useMemo(
    () => candidates.find((i) => i.id === selectedId) ?? null,
    [candidates, selectedId]
  );

  const compare = useMemo(() => {
    if (!selected || !playerForCheck || !slot) return null;
    return compareEquip(playerForCheck, selected, slot, equipped, undefined, questProgress);
  }, [selected, playerForCheck, slot, equipped, questProgress]);

  const sameAsEquipped = useMemo(() => {
    if (!compare) return false;
    return isSameItem(compare.current, compare.candidate);
  }, [compare]);

  const equippedAfter = useMemo(() => {
    if (!selected || !compare) return [] as Item[];
    const currentId = compare.current?.id;
    return [
      ...Object.values(equipped).filter((item): item is Item => item !== null && item.id !== currentId),
      selected
    ];
  }, [compare, equipped, selected]);

  const handleEquip = (): void => {
    if (!selected) return;
    const result = equipItem(selected);
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
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="equip-picker-title"
      data-testid="equip-picker"
    >
      <div
        className={[
          'bg-d2-panel border-2 border-d2-gold shadow-2xl shadow-d2-gold/20 animate-fadeIn',
          'w-full rounded-t-lg sm:rounded-lg max-h-[85vh] sm:max-h-[90vh]',
          'sm:max-w-3xl sm:w-full',
          'flex flex-col overflow-hidden'
        ].join(' ')}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <header className="flex items-center justify-between p-4 border-b border-d2-border shrink-0">
          <h2 id="equip-picker-title" className="text-lg sm:text-xl font-serif font-bold text-d2-gold">
            {t('equipFlow.picker.title', { slot: slotLabel })}
          </h2>
          <Button
            variant="secondary"
            className="min-h-[44px] min-w-[44px] !px-3"
            aria-label={t('common:close')}
            onClick={onClose}
            data-testid="equip-picker-close"
          >
            ×
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-d2 p-4">
          <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-4 lg:space-y-0">
            <div className="lg:col-span-1">
              <CandidateList
                items={candidates}
                selectedId={selectedId}
                eligibility={eligibility}
                slotLabel={slotLabel}
                onSelect={setSelectedId}
              />
            </div>
            <div className="lg:col-span-2">
              {compare ? (
                <ItemComparePanel
                  compare={compare}
                  isAlreadyEquipped={sameAsEquipped}
                  selectedName={selectedName}
                  equippedAfter={equippedAfter}
                />
              ) : null}
            </div>
          </div>
        </div>

        <EquipFooter
          onCancel={onClose}
          onEquip={handleEquip}
          disabledReason={disabledReason}
          failureMessage={failureReason === null ? null : failureReason === 'backpack_full'
            ? t('toast.backpackFull') : t('toast.equipFailed', { name: selectedName })}
        />
      </div>
    </div>
  );
}
