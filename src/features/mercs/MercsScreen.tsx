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
import type { TFunction } from 'i18next';
import { Button, EquipmentPanel, EquippedItemModal, Modal, Panel, ScreenShell, resolveMercArt, tDataKey, tItemName } from '@/ui';
import { useMercStore, useInventoryStore, usePlayerStore } from '@/stores';
import { MERC_EQUIPMENT_SLOTS, type MercEquipment } from '@/stores/mercStore';
import type { Mercenary } from '@/engine/types/entities';
import type { EquipmentSlot } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import { loadMercHireRoster, loadMercPool, resolveMercSkillLoadout, type MercDef } from '@/data/loaders/mercs';

export function MercsScreen() {
  const { t } = useTranslation(['mercs', 'common', 'inventory']);
  const ownedMercs = useMercStore((s) => s.ownedMercs);
  const fieldedMercId = useMercStore((s) => s.fieldedMercId);
  const setFielded = useMercStore((s) => s.setFieldedMerc);
  const hireMerc = useMercStore((s) => s.hireMerc);
  const playerLevel = usePlayerStore((s) => s.player?.level ?? 1);

  const defsById = useMemo(() => {
    const pool = loadMercPool();
    const m = new Map<string, MercDef>();
    for (const d of pool.pool) m.set(d.id, d);
    return m;
  }, []);

  const hireActs = useMemo(() => loadMercHireRoster(), []);
  const ownedBaseIds = useMemo(
    () => new Set(ownedMercs.map((merc) => merc.id.split('#')[0] ?? merc.id)),
    [ownedMercs]
  );

  return (
    <ScreenShell testId="mercs-screen" title={t('mercenaries')}>
      <div className="max-w-4xl mx-auto space-y-3">
        <Panel title={t('hirePanelTitle')}>
          <div className="space-y-4">
            <p className="text-sm text-d2-white/70">{t('hirePanelBody')}</p>
            {hireActs.map((act) => {
              const locked = playerLevel < act.unlockReqLevel;
              return (
                <section key={act.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-serif text-d2-gold">{t(act.labelKey)}</h2>
                    {locked && (
                      <span className="text-xs text-d2-white/50">
                        {t('unlockReqLevel', { level: act.unlockReqLevel })}
                      </span>
                    )}
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {act.mercs.map((def) => {
                      const owned = ownedBaseIds.has(def.id);
                      const mercName = localizedMercName(t, def);
                      const portraitSrc = resolveMercArt(def.id);
                      return (
                        <li
                          key={def.id}
                          className="rounded border border-d2-border bg-d2-bg/40 p-3"
                          data-testid={`hire-merc-${def.id}`}
                        >
                          <div className="-mx-3 -mt-3 mb-2 overflow-hidden rounded-t">
                            {portraitSrc ? (
                              <img
                                src={portraitSrc}
                                alt=""
                                aria-hidden="true"
                                className="aspect-[3/4] w-full rounded-t object-cover object-top"
                              />
                            ) : (
                              <div className="aspect-[3/4] w-full rounded-t bg-black/40" aria-hidden="true" />
                            )}
                          </div>
                          <div className="font-serif text-d2-gold">{mercName}</div>
                          <div className="text-xs text-d2-white/60">{t(`type.${def.classRef}`)} · {t('level')} {def.reqLevel}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {resolveMercSkillLoadout(def).slice(0, 3).map((skillId) => (
                              <span key={skillId} className="rounded border border-d2-border/70 bg-black/30 px-2 py-0.5 text-[11px] text-d2-white/75">
                                {tDataKey(t, `mercs.skillName.${skillId}`)}
                              </span>
                            ))}
                          </div>
                          <Button
                            variant={owned ? 'secondary' : 'primary'}
                            className="mt-3 min-h-[40px] w-full text-sm"
                            disabled={owned || locked}
                            onClick={() => { hireMerc(def); }}
                          >
                            {owned ? t('owned') : t('hire')}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </Panel>

        {ownedMercs.length === 0 ? (
          <Panel>
            <p className="text-sm text-d2-white/60 italic text-center py-6">
              {t('empty')}
            </p>
          </Panel>
        ) : (
          <ul className="grid grid-cols-1 gap-3">
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);

  const baseId = merc.id.split('#')[0] ?? merc.id;
  const slug = baseId.includes('/') ? baseId.slice(baseId.indexOf('/') + 1) : baseId;
  const portrait = resolveMercArt(slug) ?? (def ? resolveMercArt(def.classRef) : null);
  const localizedName = def ? localizedMercName(t, def) : t(`byId.${slug}.name`, { defaultValue: merc.name });
  const lore = t(`byId.${slug}.lore`);
  const archetype = def?.classRef
    ? t(`type.${def.classRef}`)
    : t(`rarity.${merc.rarity}`);

  const xpPct = Math.min(100, Math.floor((progress.experience / Math.max(1, progress.experienceToNextLevel)) * 100));
  const equippedCount = MERC_EQUIPMENT_SLOTS.reduce((n, s) => n + (equipment[s] ? 1 : 0), 0);
  const equippedSlots = MERC_EQUIPMENT_SLOTS.filter((slot) => equipment[slot]);

  const handleConfirmDismiss = () => {
    if (dismissMerc(merc.id)) setConfirmOpen(false);
  };

  return (
    <Panel
      className={isFielded ? 'border-d2-gold' : ''}
      data-testid={`merc-card-${baseId}`}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.6fr)]">
        <div className="relative min-h-[260px] overflow-hidden rounded-lg border-2 border-d2-gold/60 bg-black shadow-[inset_0_0_24px_rgba(0,0,0,0.75),0_0_24px_rgba(214,176,86,0.12)]">
          {portrait ? (
            <img
              src={portrait}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(214,176,86,0.22),rgba(0,0,0,0.88)_62%)]" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" aria-hidden="true" />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-d2-gold shadow-[0_0_10px_rgba(214,176,86,0.9)]" aria-hidden="true" />
            <span className="rounded border border-d2-gold/50 bg-black/65 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-d2-gold/90">
              {t(`rarity.${merc.rarity}`)}
            </span>
          </div>
          {isFielded && (
            <span className="absolute right-3 top-3 rounded border border-d2-gold/70 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-wide text-d2-gold shadow-[0_0_12px_rgba(214,176,86,0.24)]">
              {t('fielded')}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-3">
            <h3 className="truncate font-serif text-2xl font-bold leading-tight text-d2-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
              {localizedName}
            </h3>
            <div className="text-xs text-d2-white/75">
              {archetype} · {t('level')} {merc.level}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-lg border border-d2-border/70 bg-black/25 p-3">
            {def?.signatureSkillId && (
              <div className="mb-2 text-sm text-d2-gold/90" title={def.signatureSkillId}>
                <span className="text-d2-white/55">{t('signature')}: </span>
                {tDataKey(t, `mercs.skillName.${def.signatureSkillId}`)}
              </div>
            )}
            {lore && (
              <p className="text-sm italic leading-6 text-d2-white/55">{lore}</p>
            )}
          </div>

          <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-d2-border/80 bg-d2-bg/45 text-center">
            <MercStat label="LVL" value={merc.level} />
            {def ? (
              <>
                <MercStat label="STR" value={def.baseStats.strength} />
                <MercStat label="DEX" value={def.baseStats.dexterity} />
                <MercStat label="VIT" value={def.baseStats.vitality} />
              </>
            ) : (
              <>
                <MercStat label="STR" value="-" />
                <MercStat label="DEX" value="-" />
                <MercStat label="VIT" value="-" />
              </>
            )}
          </div>

          <div data-testid={`merc-xp-${baseId}`}>
            <div className="mb-1 flex justify-between text-xs text-d2-white/60">
              <span>{t('xp')}</span>
              <span>{progress.experience} / {progress.experienceToNextLevel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-d2-border bg-black/55">
              <div className="h-full bg-gradient-to-r from-d2-gold/55 via-d2-gold to-amber-200" style={{ width: `${String(xpPct)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant={isFielded ? 'secondary' : 'primary'}
          className="min-h-[44px] text-sm"
          onClick={onField}
          data-testid={`merc-field-${baseId}`}
        >
          {isFielded ? t('unfield') : t('setAsFielded')}
        </Button>
        <Button
          variant="secondary"
          className="min-h-[44px] text-sm"
          onClick={() => { setEquipOpen(true); }}
          data-testid={`merc-equipment-${baseId}`}
        >
          {t('equipment')} ({equippedCount}/{MERC_EQUIPMENT_SLOTS.length})
        </Button>
        <Button
          variant="secondary"
          className="min-h-[44px] text-sm border-red-700/60 text-red-300 hover:border-red-500"
          onClick={() => { setConfirmOpen(true); }}
          data-testid={`merc-dismiss-${baseId}`}
        >
          {t('dismiss')}
        </Button>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); }} title={t('confirmDismissTitle')}>
        {equippedCount > 0 ? (
          <div className="space-y-3 text-sm text-d2-white/80">
            <p>{t('dismissBlockedBody', { name: localizedName })}</p>
            <ul className="list-disc pl-5 text-d2-gold/90">
              {equippedSlots.map((slot) => {
                const item = equipment[slot];
                return (
                  <li key={slot}>
                    {t(`inventory:slots.${slot}`)}: {item ? tItemName(t, item) : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-d2-white/80 mb-4">
            {t('confirmDismissBody', { name: localizedName })}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => { setConfirmOpen(false); }}>
            {t('common:cancel')}
          </Button>
          {equippedCount === 0 && (
            <Button
              variant="primary"
              onClick={handleConfirmDismiss}
              data-testid={`merc-dismiss-confirm-${baseId}`}
              className="border-red-600 text-red-200"
            >
              {t('confirmDismiss')}
            </Button>
          )}
        </div>
      </Modal>

      <Modal isOpen={equipOpen} onClose={() => { setEquipOpen(false); }} title={`${localizedName} — ${t('equipment')}`}>
        <MercEquipmentEditor mercId={merc.id} equipment={equipment} />
      </Modal>
    </Panel>
  );
}

function MercStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-r border-d2-border/70 px-2 py-2 last:border-r-0">
      <div className="text-[10px] uppercase tracking-[0.18em] text-d2-white/45">{label}</div>
      <div className="font-serif text-2xl font-bold leading-none text-d2-gold">{value}</div>
    </div>
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
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlot | null>(null);
  const [viewSlot, setViewSlot] = useState<EquipmentSlot | null>(null);

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

  const candidates = pickerSlot ? candidatesForSlot(pickerSlot) : [];

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <EquipmentPanel
        equipped={equipment}
        testIdPrefix="merc-equip-slot"
        onSlotClick={setPickerSlot}
        onViewSlot={setViewSlot}
        onUnequip={(slot) => {
          const it = unequipFromMerc(mercId, slot);
          if (it) addItem(it);
        }}
      />

      {pickerSlot && (
        <Panel title={t('inventory:equip')}>
          <div className="space-y-2">
            <div className="text-xs text-d2-white/60">
              {t('selectSlotItem', { slot: t(`inventory:slots.${pickerSlot}`) })}
            </div>
            {candidates.length === 0 ? (
              <p className="text-sm text-d2-white/50 italic">{t('noCompatibleItems')}</p>
            ) : (
              <ul className="space-y-2">
                {candidates.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded border border-d2-border bg-black/20 p-2">
                    <span className="min-w-0 truncate text-sm text-d2-white/85">{tItemName(t, item)}</span>
                    <Button
                      variant="primary"
                      className="min-h-[36px] text-xs"
                      onClick={() => {
                        const displaced = equipOnMerc(mercId, pickerSlot, item);
                        if (displaced) addItem(displaced);
                        removeItem(item.id);
                        setPickerSlot(null);
                      }}
                    >
                      {t('inventory:equip')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      )}

      <EquippedItemModal
        slot={viewSlot}
        item={viewSlot ? (equipment[viewSlot] ?? null) : null}
        derivedStats={null}
        onClose={() => { setViewSlot(null); }}
      />
    </div>
  );
}

function mercSlug(id: string): string {
  const baseId = id.split('#')[0] ?? id;
  const idx = baseId.indexOf('/');
  return idx >= 0 ? baseId.slice(idx + 1) : baseId;
}

function localizedMercName(t: TFunction, def: MercDef): string {
  return t(`byId.${mercSlug(def.id)}.name`, { defaultValue: def.name });
}

