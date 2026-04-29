/**
 * MercsScreen — owned mercenary roster.
 *
 * Layout (mobile-first 360×640):
 *   ┌─────────────────────────────┐
 *   │ [portrait]  Name  ⭐⭐⭐     │
 *   │             R/SR/SSR · Lv12 │
 *   │ Signature: <skill name>     │
 *   │ STR 32 DEX 18 VIT 24 ENG 10 │
 *   │ [Set as Fielded] [⭐ Up]    │
 *   └─────────────────────────────┘
 *
 * Joins owned-merc runtime entities (`useMercStore`) with their static
 * defs from `gacha/mercenaries.json` to read portrait paths, signature skill,
 * and base stats.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GameCard, Modal, Panel, ScreenShell, resolveMercArt } from '@/ui';
import { useMercStore, useInventoryStore } from '@/stores';
import { MERC_EQUIPMENT_SLOTS, type MercEquipment } from '@/stores/mercStore';
import type { Mercenary } from '@/engine/types/entities';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import { loadMercPool, type MercDef } from '@/data/loaders/mercs';

const RARITY_TO_TEXT = { R: 'magic', SR: 'rare', SSR: 'unique' } as const;

export function MercsScreen() {
  const { t } = useTranslation(['mercs', 'common']);
  const ownedMercs = useMercStore((s) => s.ownedMercs);
  const fieldedMercId = useMercStore((s) => s.fieldedMercId);
  const setFielded = useMercStore((s) => s.setFieldedMerc);

  const defsById = useMemo(() => {
    const pool = loadMercPool();
    const m = new Map<string, MercDef>();
    for (const d of pool.pool) m.set(d.id, d);
    return m;
  }, []);

  return (
    <ScreenShell testId="mercs-screen" title={t('mercenaries')}>
      <div className="max-w-4xl mx-auto space-y-3">
        {ownedMercs.length === 0 ? (
          <Panel>
            <p className="text-sm text-d2-white/60 italic text-center py-6">
              {t('empty')}
            </p>
          </Panel>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ownedMercs.map((m) => {
              const baseId = m.id.split('#')[0] ?? m.id;
              const def = defsById.get(baseId);
              return (
                <li key={m.id}>
                  <MercCard
                    merc={m}
                    def={def}
                    isFielded={m.id === fieldedMercId}
                    onField={() => {
                      setFielded(m.id === fieldedMercId ? null : m.id);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
}

function MercCard({
  merc,
  def,
  isFielded,
  onField
}: {
  merc: Mercenary;
  def: MercDef | undefined;
  isFielded: boolean;
  onField: () => void;
}) {
  const { t } = useTranslation(['mercs', 'common']);
  const dismissMerc = useMercStore((s) => s.dismissMerc);
  const equipment = useMercStore((s) => s.mercEquipment[merc.id]) ?? {};
  const progress = useMercStore((s) => s.mercProgress[merc.id]) ?? { experience: 0, experienceToNextLevel: 50 };
  const addItem = useInventoryStore((s) => s.addItem);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);

  const rt = RARITY_TO_TEXT[merc.rarity];
  const baseId = merc.id.split('#')[0] ?? merc.id;
  const slug = baseId.includes('/') ? baseId.slice(baseId.indexOf('/') + 1) : baseId;
  const portrait = resolveMercArt(slug) ?? (def ? resolveMercArt(def.classRef) : null);
  const localizedName = t(`byId.${slug}.name`, { defaultValue: merc.name });
  const lore = t(`byId.${slug}.lore`, { defaultValue: def?.flavor ?? '' });
  const archetype = def?.classRef
    ? t(`character:classes.${def.classRef}`, { defaultValue: def.classRef })
    : t(`rarity.${merc.rarity}`);

  const xpPct = Math.min(100, Math.floor((progress.experience / Math.max(1, progress.experienceToNextLevel)) * 100));
  const equippedCount = MERC_EQUIPMENT_SLOTS.reduce((n, s) => n + (equipment[s] ? 1 : 0), 0);

  const handleConfirmDismiss = () => {
    dismissMerc(merc.id, (item: Item) => { addItem(item); });
    setConfirmOpen(false);
  };

  return (
    <Panel
      className={isFielded ? 'border-d2-gold' : ''}
      data-testid={`merc-card-${baseId}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <GameCard
          variant="merc"
          size="md"
          name={localizedName}
          subtitle={archetype}
          rarity={rt}
          image={portrait ?? undefined}
          stats={
            def
              ? [
                  { label: 'LVL', value: merc.level },
                  { label: 'STR', value: def.baseStats.strength },
                  { label: 'DEX', value: def.baseStats.dexterity },
                  { label: 'VIT', value: def.baseStats.vitality }
                ]
              : [{ label: 'LVL', value: merc.level }]
          }
          footer={def?.signatureSkillId}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-d2-white/60 flex flex-wrap gap-x-2">
            <span>{t(`rarity.${merc.rarity}`)}</span>
            <span>·</span>
            <span>{t('level')} {merc.level}</span>
          </div>
          {def?.signatureSkillId && (
            <div className="text-xs text-d2-gold/80 mt-1 truncate" title={def.signatureSkillId}>
              {t('signature', { defaultValue: 'Signature' })}: {def.signatureSkillId}
            </div>
          )}
          {lore && (
            <p className="text-[11px] text-d2-white/50 italic mt-1 line-clamp-3">{lore}</p>
          )}
          {/* Bug #12 — XP bar */}
          <div className="mt-2" data-testid={`merc-xp-${baseId}`}>
            <div className="flex justify-between text-[10px] text-d2-white/60">
              <span>{t('xp', { defaultValue: 'XP' })}</span>
              <span>{progress.experience} / {progress.experienceToNextLevel}</span>
            </div>
            <div className="h-1.5 bg-d2-bg/60 border border-d2-border rounded overflow-hidden mt-0.5">
              <div className="h-full bg-d2-gold/70" style={{ width: `${String(xpPct)}%` }} />
            </div>
          </div>
        </div>
        {isFielded && (
          <span className="text-[10px] uppercase tracking-wide text-d2-gold border border-d2-gold/60 rounded px-2 py-0.5 whitespace-nowrap">
            {t('fielded')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          variant={isFielded ? 'secondary' : 'primary'}
          className="min-h-[40px] flex-1 min-w-[120px] text-sm"
          onClick={onField}
          data-testid={`merc-field-${baseId}`}
        >
          {isFielded ? t('unfield') : t('setAsFielded')}
        </Button>
        <Button
          variant="secondary"
          className="min-h-[40px] flex-1 min-w-[120px] text-sm"
          onClick={() => { setEquipOpen(true); }}
          data-testid={`merc-equipment-${baseId}`}
        >
          {t('equipment', { defaultValue: '装备' })} ({equippedCount}/{MERC_EQUIPMENT_SLOTS.length})
        </Button>
        <Button
          variant="secondary"
          className="min-h-[40px] flex-1 min-w-[120px] text-sm border-red-700/60 text-red-300 hover:border-red-500"
          onClick={() => { setConfirmOpen(true); }}
          data-testid={`merc-dismiss-${baseId}`}
        >
          {t('dismiss', { defaultValue: '解雇' })}
        </Button>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); }} title={t('confirmDismissTitle', { defaultValue: '解雇佣兵？' })}>
        <p className="text-sm text-d2-white/80 mb-4">
          {t('confirmDismissBody', { name: localizedName, defaultValue: `确认解雇 ${localizedName}？已装备的物品会归还到背包。` })}
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => { setConfirmOpen(false); }}>
            {t('common:cancel', { defaultValue: '取消' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmDismiss}
            data-testid={`merc-dismiss-confirm-${baseId}`}
            className="border-red-600 text-red-200"
          >
            {t('confirmDismiss', { defaultValue: '确认解雇' })}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={equipOpen} onClose={() => { setEquipOpen(false); }} title={`${localizedName} — ${t('equipment', { defaultValue: '装备' })}`}>
        <MercEquipmentEditor mercId={merc.id} equipment={equipment} />
      </Modal>
    </Panel>
  );
}

function MercEquipmentEditor({
  mercId,
  equipment
}: {
  mercId: string;
  equipment: MercEquipment;
}) {
  const { t } = useTranslation(['mercs', 'inventory', 'common']);
  const backpack = useInventoryStore((s) => s.backpack);
  const removeItem = useInventoryStore((s) => s.removeItem);
  const addItem = useInventoryStore((s) => s.addItem);
  const equipOnMerc = useMercStore((s) => s.equipOnMerc);
  const unequipFromMerc = useMercStore((s) => s.unequipFromMerc);

  const bases = useMemo(() => loadItemBases(), []);

  const candidatesForSlot = (slot: EquipmentSlot) =>
    backpack.filter((it) => {
      const b = bases.get(it.baseId);
      if (!b?.slot) return false;
      if (b.slot === slot) return true;
      if ((b.slot === 'ring-left' || b.slot === 'ring-right') &&
          (slot === 'ring-left' || slot === 'ring-right')) return true;
      return false;
    });

  return (
    <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
      {MERC_EQUIPMENT_SLOTS.map((slot) => {
        const equipped = equipment[slot] ?? null;
        const candidates = candidatesForSlot(slot);
        return (
          <li key={slot} className="flex items-center gap-2 border border-d2-border rounded p-2 bg-d2-bg/40">
            <span className="w-20 shrink-0 text-xs text-d2-gold/80 uppercase">
              {t(`inventory:slot.${slot}`, { defaultValue: slot })}
            </span>
            <span className="flex-1 min-w-0 truncate text-sm text-d2-white/80">
              {equipped ? equipped.baseId : <em className="text-d2-white/40">{t('empty', { defaultValue: '空' })}</em>}
            </span>
            {equipped && (
              <Button
                variant="secondary"
                className="text-xs min-h-[36px]"
                onClick={() => {
                  const it = unequipFromMerc(mercId, slot);
                  if (it) addItem(it);
                }}
              >
                {t('inventory:unequip', { defaultValue: '卸下' })}
              </Button>
            )}
            <select
              className="bg-d2-bg border border-d2-border rounded px-2 py-1 text-xs min-h-[36px] max-w-[40%]"
              value=""
              onChange={(e) => {
                const itemId = e.target.value;
                if (!itemId) return;
                const item = backpack.find((it) => it.id === itemId);
                if (!item) return;
                const displaced = equipOnMerc(mercId, slot, item);
                if (displaced) addItem(displaced);
                removeItem(item.id);
              }}
              aria-label={t('equip', { slot, defaultValue: `Equip ${slot}` })}
            >
              <option value="">{t('inventory:equip', { defaultValue: '装备' })}…</option>
              {candidates.map((it) => (
                <option key={it.id} value={it.id}>{it.baseId}</option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );
}
