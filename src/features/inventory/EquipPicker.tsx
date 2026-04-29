/**
 * EquipPicker — slot-filtered backpack picker.
 *
 * Mobile (≤640px): bottom-sheet, full-width, max-height 85vh, tap-outside
 * or Esc dismisses. Touch targets ≥ 44px.
 * Desktop: centered modal, max-w-3xl, side-by-side compare always visible.
 *
 * Engine work delegated to:
 *   - `slotCandidates`/`checkEligibility` in compareEquip.ts
 *   - `compareEquip()` for deltas
 *   - `inventoryStore.equipItem()` for the actual equip action
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button, ItemCompareTooltip, RarityText, StatSheet, resolveItemIcon, tItemName } from '@/ui';
import { useInventoryStore, usePlayerStore } from '@/stores';
import {
  checkEligibility,
  compareEquip,
  slotCandidates,
  type ComparableStatKey,
  type EligibilityResult
} from './compareEquip';
import { loadItemBases } from '@/data/loaders/loot';
import type { DerivedStats, Resistances } from '@/engine/types/attributes';
import type { EquipmentSlot, Item } from '@/engine/types/items';

interface Props {
  readonly slot: EquipmentSlot | null;
  readonly onClose: () => void;
  readonly onEquipped?: (item: Item) => void;
  readonly onEquipFailed?: (item: Item) => void;
}

export function EquipPicker({ slot, onClose, onEquipped, onEquipFailed }: Props) {
  const { t } = useTranslation(['inventory', 'common']);
  const player = usePlayerStore((s) => s.player);
  const backpack = useInventoryStore((s) => s.backpack);
  const equipped = useInventoryStore((s) => s.equipped);
  const equipItem = useInventoryStore((s) => s.equipItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { setSelectedId(null); }, [slot]);

  useEffect(() => {
    if (!slot) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [slot, onClose]);

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

  const selected = useMemo(
    () => candidates.find((i) => i.id === selectedId) ?? null,
    [candidates, selectedId]
  );

  const compare = useMemo(() => {
    if (!selected || !playerForCheck || !slot) return null;
    return compareEquip(playerForCheck, selected, slot, equipped);
  }, [selected, playerForCheck, slot, equipped]);

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
        <header className="flex items-center justify-between p-4 border-b border-d2-border">
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

        <div className="flex-1 overflow-y-auto scrollbar-d2 p-4 space-y-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-d2-white/60 italic text-center py-6">
              {t('equipFlow.picker.empty')}
            </p>
          ) : (
            <ul className="space-y-2" role="listbox" aria-label={slotLabel}>
              {candidates.map((it, idx) => {
                const elig = eligibility.get(it.id) ?? { eligible: true, reasons: [] };
                const isSelected = selectedId === it.id;
                return (
                  <li key={`${it.id}-${String(idx)}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={!elig.eligible}
                      onClick={() => { setSelectedId(it.id); }}
                      data-testid={`equip-picker-row-${it.id}`}
                      className={[
                        'w-full flex items-center gap-3 p-3 rounded border text-left',
                        'min-h-[44px] transition-colors',
                        isSelected
                          ? 'border-d2-gold bg-d2-gold/10'
                          : 'border-d2-border bg-d2-bg/40 hover:border-d2-gold/60',
                        elig.eligible ? '' : 'opacity-50 cursor-not-allowed'
                      ].join(' ')}
                    >
                      <ItemThumb item={it} />
                      <div className="min-w-0 flex-1">
                        <RarityText rarity={it.rarity} className="font-serif truncate block">
                          {tItemName(t, it)}
                        </RarityText>
                        <div className="text-xs text-d2-white/60">
                          {t('itemLevel')} {it.level}
                        </div>
                        {!elig.eligible && (
                          <div className="text-xs text-d2-red mt-0.5">
                            {formatReasons(elig, t)}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {compare ? (
            <ItemCompareTooltip compare={compare} />
          ) : (
            <CurrentEquippedSheet
              slot={slot}
              equipped={equipped}
              derivedStats={player?.derivedStats ?? null}
            />
          )}
        </div>

        <footer className="flex flex-wrap gap-2 p-4 border-t border-d2-border bg-d2-bg/40">
          <Button variant="secondary" className="min-h-[44px] flex-1" onClick={onClose}>
            {t('common:cancel')}
          </Button>
          <Button
            variant="primary"
            className="min-h-[44px] flex-1"
            disabled={!selected || !(eligibility.get(selected.id)?.eligible ?? false)}
            onClick={handleEquip}
            data-testid="equip-picker-confirm"
          >
            {t('equip')}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function ItemThumb({ item }: { readonly item: Item }) {
  const icon = resolveItemIcon(item.baseId);
  return (
    <div className="w-12 h-12 shrink-0 border border-d2-border bg-d2-panel rounded flex items-center justify-center overflow-hidden">
      {icon ? (
        <img src={icon} alt="" loading="lazy" className="w-full h-full object-contain" />
      ) : (
        <span aria-hidden className="font-serif text-d2-border text-xl">?</span>
      )}
    </div>
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

/**
 * "Current equipment" readout shown when no candidate is selected.
 * Pulls the player's live derived stats (already incorporates equipped
 * gear) and renders them via `<StatSheet mode="single">`.
 */
const STAT_KEYS: readonly ComparableStatKey[] = [
  'lifeMax', 'manaMax', 'attack', 'defense', 'attackSpeed',
  'critChance', 'critDamage', 'physDodge', 'magicDodge'
];

function CurrentEquippedSheet({
  slot,
  equipped,
  derivedStats
}: {
  readonly slot: EquipmentSlot;
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly derivedStats: DerivedStats | null;
}) {
  if (!derivedStats) return null;
  const item = equipped[slot] ?? null;
  const stats = {} as Record<ComparableStatKey, number>;
  for (const k of STAT_KEYS) stats[k] = derivedStats[k];
  const resistances: Record<keyof Resistances, number> = { ...derivedStats.resistances };
  return (
    <StatSheet
      mode="single"
      item={item}
      stats={stats}
      resistances={resistances}
      emptySlot={item === null}
    />
  );
}