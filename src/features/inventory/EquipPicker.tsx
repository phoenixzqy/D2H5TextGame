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
 *   - Same-baseId+rarity+affixCount as currently-equipped → render an
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
import { Button, RarityText, StatSheet, resolveItemDisplay, resolveItemIcon, tItemName } from '@/ui';
import { useInventoryStore, usePlayerStore } from '@/stores';
import {
  checkEligibility,
  compareEquip,
  slotCandidates,
  type CompareResult,
  type EligibilityResult
} from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import type { EquipmentSlot, Item } from '@/engine/types/items';

interface Props {
  readonly slot: EquipmentSlot | null;
  readonly onClose: () => void;
  readonly onEquipped?: (item: Item) => void;
  readonly onEquipFailed?: (item: Item) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** True if two items are visually/functionally indistinguishable. */
function isSameItem(a: Item | null, b: Item | null): boolean {
  if (!a || !b) return false;
  if (a.id === b.id) return true;
  return (
    a.baseId === b.baseId &&
    a.rarity === b.rarity &&
    (a.affixes?.length ?? 0) === (b.affixes?.length ?? 0)
  );
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
  const icon = resolveItemIcon(item.baseId);
  return (
    <div className="w-12 h-12 shrink-0 border border-d2-border bg-d2-panel rounded flex items-center justify-center overflow-hidden">
      {icon ? (
        <img src={icon} alt="" loading="lazy" className="w-full h-full object-contain" />
      ) : (
        <span aria-hidden className="font-serif text-d2-border text-xl">
          ?
        </span>
      )}
    </div>
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

function AlreadyEquippedBadge() {
  const { t } = useTranslation('inventory');
  return (
    <div
      className="text-center py-3 px-4 rounded border border-d2-gold/40 bg-d2-gold/10 text-d2-gold text-sm font-serif"
      data-testid="already-equipped-badge"
    >
      ✓ {t('equipFlow.compare.alreadyEquipped')}
    </div>
  );
}

function ComparePanel({
  compare,
  isAlreadyEquipped,
  selectedName,
  equippedAfter
}: {
  readonly compare: CompareResult;
  readonly isAlreadyEquipped: boolean;
  readonly selectedName: string;
  readonly equippedAfter: readonly Item[];
}) {
  const { t } = useTranslation('inventory');
  const candidateDisplay = useMemo(
    () => resolveItemDisplay(compare.candidate, t, equippedAfter),
    [compare.candidate, equippedAfter, t]
  );
  // Net delta = sum of stat deltas (rough but useful upgrade summary).
  const net = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(compare.stats) as (keyof typeof compare.stats)[]) {
      const d = compare.stats[k].delta;
      if (Number.isFinite(d)) n += d;
    }
    return Math.round(n);
  }, [compare]);

  return (
    <section
      data-testid="compare-panel"
      aria-labelledby="equip-picker-compare-title"
      className="border border-d2-border rounded bg-d2-bg/40 p-3 space-y-3"
    >
      <h3
        id="equip-picker-compare-title"
        className="text-xs uppercase tracking-wide text-d2-white/60 font-serif"
      >
        {t('equipFlow.compare.sectionTitle')}
      </h3>

      {/* a11y: announce the candidate change to screen-readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {t('equipFlow.compare.selectionAnnounce', { name: selectedName })}
      </div>

      {isAlreadyEquipped ? (
        <AlreadyEquippedBadge />
      ) : (
        <>
          <StatSheet
            mode="compare"
            current={compare.current}
            candidate={compare.candidate}
            stats={compare.stats}
            resistances={compare.resistances}
          />
          {net !== 0 && (
            <div
              className={`text-xs font-serif ${net > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              data-testid="net-summary"
              data-trend={net > 0 ? 'up' : 'down'}
            >
              {net > 0
                ? t('equipFlow.compare.netUpgrade', { n: net })
                : t('equipFlow.compare.netDowngrade', { n: net })}
            </div>
          )}
          {candidateDisplay.set && candidateDisplay.setBonuses.length > 0 && (
            <div className="rounded border border-d2-set/40 bg-d2-set/5 p-2 text-xs" data-testid="equip-picker-set-bonuses">
              <div className="font-serif text-d2-set">{t('detail.setBonus')}</div>
              {candidateDisplay.setBonuses.map((bonus) => (
                <div key={bonus.threshold} className={bonus.active ? 'text-d2-set' : 'text-d2-white/45'}>
                  {t('detail.setBonusThreshold', { count: bonus.threshold })}
                  {': '}
                  {bonus.lines.map((line) => line.text).join(', ')}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EquipFooter({
  onCancel,
  onEquip,
  disabledReason
}: {
  readonly onCancel: () => void;
  readonly onEquip: () => void;
  readonly disabledReason: string | null;
}) {
  const { t } = useTranslation(['inventory', 'common']);
  return (
    <footer className="border-t border-d2-border bg-d2-bg/40 p-4 space-y-2">
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
  const backpack = useInventoryStore((s) => s.backpack);
  const equipped = useInventoryStore((s) => s.equipped);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    return compareEquip(playerForCheck, selected, slot, equipped);
  }, [selected, playerForCheck, slot, equipped]);

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
      onEquipped?.(selected);
      onClose();
    } else {
      onEquipFailed?.(selected);
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
                <ComparePanel
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
        />
      </div>
    </div>
  );
}
