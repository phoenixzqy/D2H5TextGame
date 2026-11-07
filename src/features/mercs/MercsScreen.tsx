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
 * and flavor metadata. Current core stats come from the owned mercenary.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Button,
  EquipmentPanel,
  ItemTooltip,
  Modal,
  Panel,
  ScreenShell,
  Tabs,
  resolveMercArt,
  tDataKey,
  tItemName
} from '@/ui';
import { useMercStore, useInventoryStore, usePlayerStore } from '@/stores';
import {
  MERC_EQUIPMENT_SLOTS,
  isMercEquipmentSlotCompatible,
  type MercEquipment,
  type MercEquipmentResult
} from '@/stores/mercStore';
import type { Mercenary } from '@/engine/types/entities';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import {
  loadMercHireRoster,
  loadMercPool,
  resolveMercSkillLoadout,
  type MercDef
} from '@/data/loaders/mercs';
import { MercSkillPriority, nativeMercSkillDescription } from './MercSkillPriority';
import { MercStarProgress } from './MercStarProgress';
import { projectMercenaryStars } from '@/engine/progression/merc-stars';
import { MercEquipmentCandidates } from './MercEquipmentCandidates';
import { PagedList } from '@/ui/PagedList';
import { GameImage } from '@/ui/GameImage';

export function MercsScreen() {
  const { t } = useTranslation(['mercs', 'common', 'inventory', 'gacha']);
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

  const [hireAct, setHireAct] = useState(hireActs[0]?.id ?? '');
  const activeAct = hireActs.find((act) => act.id === hireAct) ?? hireActs[0];
  return (
    <ScreenShell testId="mercs-screen" title={t('mercenaries')}>
      <div className="flex min-h-0 w-full max-w-5xl mx-auto flex-1 flex-col gap-2">
        <Tabs
          tabs={[
            {
              id: 'owned',
              label: `${t('owned')} (${String(ownedMercs.length)})`,
              content: (
                <PagedList
                  items={ownedMercs}
                  listClassName="grid content-start gap-2 lg:grid-cols-2"
                  empty={<p>{t('empty')}</p>}
                  renderItem={(m) => {
                    const baseId = m.id.split('#')[0] ?? m.id;
                    return (
                      <li key={m.id}>
                        <MercCard
                          merc={m}
                          def={defsById.get(baseId)}
                          isFielded={m.id === fieldedMercId}
                          onField={() => {
                            setFielded(m.id === fieldedMercId ? null : m.id);
                          }}
                        />
                      </li>
                    );
                  }}
                />
              )
            },
            {
              id: 'hire',
              label: t('hire'),
              content: (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={hireAct}
                      aria-label={t('hirePanelTitle')}
                      onChange={(event) => {
                        setHireAct(event.target.value);
                      }}
                      className="d2-field min-h-[44px] min-w-0 flex-1 rounded border border-d2-border bg-d2-bg px-3"
                    >
                      {hireActs.map((act) => (
                        <option key={act.id} value={act.id}>
                          {t(act.labelKey)}
                        </option>
                      ))}
                    </select>
                    <Link
                      to="/gacha"
                      data-testid="merc-gacha-link"
                      className="d2-control inline-flex min-h-[44px] items-center px-3"
                    >
                      {t('gacha:openBanner')}
                    </Link>
                  </div>
                  {activeAct && (
                    <>
                      {playerLevel < activeAct.unlockReqLevel && (
                        <p>{t('unlockReqLevel', { level: activeAct.unlockReqLevel })}</p>
                      )}
                      <PagedList
                        key={hireAct}
                        items={activeAct.mercs}
                        listClassName="grid content-start gap-2 lg:grid-cols-2"
                        renderItem={(def) => {
                          const owned = ownedBaseIds.has(def.id);
                          const locked = playerLevel < activeAct.unlockReqLevel;
                          return (
                            <li
                              key={def.id}
                              className="d2-plaque grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2 rounded border border-d2-border p-2 sm:grid-cols-[64px_minmax(0,1fr)_auto]"
                              data-testid={`hire-merc-${def.id}`}
                            >
                              <GameImage
                                src={resolveMercArt(def.id)}
                                alt=""
                                size="fill"
                                fallbackIcon=""
                                className="!h-16 !w-16 shrink-0 bg-black"
                                imageClassName="h-full w-full object-cover object-top"
                              />
                              <div className="min-w-0 flex-1 space-y-2">
                                <h2 className="font-serif text-d2-gold">
                                  {localizedMercName(t, def)}
                                </h2>
                                <p className="text-sm">
                                  {t(`type.${def.classRef}`)} · {t('level')} {def.reqLevel}
                                </p>
                                <p className="text-sm text-d2-white/75">
                                  {resolveMercSkillLoadout(def)
                                    .slice(0, 3)
                                    .map((id) => tDataKey(t, `mercs.skillName.${id}`))
                                    .join(' · ')}
                                </p>
                              </div>
                              <Button
                                className="col-span-2 sm:col-span-1"
                                variant={owned ? 'secondary' : 'primary'}
                                disabled={owned || locked}
                                onClick={() => {
                                  hireMerc(def);
                                }}
                              >
                                {t(owned ? 'owned' : 'hire')}
                              </Button>
                            </li>
                          );
                        }}
                      />
                    </>
                  )}
                </div>
              )
            }
          ]}
        />
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
  const savedProgress = useMercStore((s) => s.mercProgress[merc.id]);
  const getMercProgress = useMercStore((s) => s.getMercProgress);
  const progress = savedProgress ?? getMercProgress(merc.id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [equipOpen, setEquipOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const baseId = merc.id.split('#')[0] ?? merc.id;
  const stars = useMercStore((state) => state.recruitmentProgress[baseId]?.stars ?? 0);
  const projected = useMemo(() => projectMercenaryStars(merc, stars), [merc, stars]);
  const slug = baseId.includes('/') ? baseId.slice(baseId.indexOf('/') + 1) : baseId;
  const portrait = resolveMercArt(slug) ?? (def ? resolveMercArt(def.classRef) : null);
  const localizedName = def
    ? localizedMercName(t, def)
    : t(`byId.${slug}.name`, { defaultValue: merc.name });
  const lore = t(`byId.${slug}.lore`);
  const archetype = def?.classRef ? t(`type.${def.classRef}`) : t(`rarity.${merc.rarity}`);

  const xpPct = Math.min(
    100,
    Math.floor((progress.experience / Math.max(1, progress.experienceToNextLevel)) * 100)
  );
  const signatureDescription = merc.signatureSkillId ? nativeMercSkillDescription(merc.signatureSkillId) : undefined;
  const equippedCount = MERC_EQUIPMENT_SLOTS.reduce((n, s) => n + (equipment[s] ? 1 : 0), 0);
  const equippedSlots = MERC_EQUIPMENT_SLOTS.filter((slot) => equipment[slot]);

  const handleConfirmDismiss = () => {
    if (dismissMerc(merc.id)) setConfirmOpen(false);
  };

  return (
    <Panel className={isFielded ? 'border-d2-gold' : ''} data-testid={`merc-card-${baseId}`}>
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 sm:grid-cols-[80px_minmax(0,1fr)]">
        <GameImage
          src={portrait}
          alt=""
          size="fill"
          fallbackIcon=""
          className="!h-24 bg-black"
          imageClassName="h-full w-full object-cover object-top"
        />
        <div className="min-w-0 space-y-2">
          <h2 className="font-serif text-lg text-d2-gold">{localizedName}</h2>
          <p className="text-sm">
            {archetype} · {t('level')} {merc.level} ·{' '}
            {isFielded ? t('fielded') : t(`rarity.${merc.rarity}`)}
          </p>
          <p className="text-sm text-d2-gold">
            {t('stars.count', { stars, max: loadMercPool().banner.shardConversion.maxStars })}
          </p>
          <div className="grid grid-cols-3 rounded border border-d2-border text-center">
            <MercStat label="STR" value={Number(projected.coreStats.strength.toFixed(2))} />
            <MercStat label="DEX" value={Number(projected.coreStats.dexterity.toFixed(2))} />
            <MercStat label="VIT" value={Number(projected.coreStats.vitality.toFixed(2))} />
          </div>
          <div data-testid={`merc-xp-${baseId}`}>
            <p className="text-sm text-d2-white/70">
              {t('xp')} {progress.experience} / {progress.experienceToNextLevel}
            </p>
            <div className="h-2 rounded border border-d2-border bg-black">
              <div className="h-full bg-d2-gold" style={{ width: `${String(xpPct)}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        <Button
          variant={isFielded ? 'secondary' : 'primary'}
          onClick={onField}
          data-testid={`merc-field-${baseId}`}
        >
          {t(isFielded ? 'unfield' : 'setAsFielded')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDetailsOpen(true);
          }}
        >
          {t('baseAbilities')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setEquipOpen(true);
          }}
          data-testid={`merc-equipment-${baseId}`}
        >
          {t('equipment')} ({equippedCount}/{MERC_EQUIPMENT_SLOTS.length})
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setConfirmOpen(true);
          }}
          data-testid={`merc-dismiss-${baseId}`}
        >
          {t('dismiss')}
        </Button>
      </div>
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
        }}
        title={localizedName}
      >
        <Tabs
          tabs={[
            {
              id: 'abilities',
              label: t('baseAbilities'),
              content: (
                <div className="space-y-3">
                  {def?.signatureSkillId && (
                    <p className="text-d2-gold">
                      {t('signature')}: {tDataKey(t, `mercs.skillName.${def.signatureSkillId}`)}
                    </p>
                  )}
                  {signatureDescription && <p className="text-sm text-d2-white/75">
                    {tDataKey(t, signatureDescription)}
                    {stars > 0 && <span> {t('priority.signatureBaseValues')}</span>}
                  </p>}
                  <p className="text-sm">{lore}</p>
                  <MercStat label="ENG" value={projected.coreStats.energy} />
                </div>
              )
            },
            {
              id: 'stars',
              label: t('stars.title'),
              content: <MercStarProgress mercId={merc.id} />
            },
            {
              id: 'priority',
              label: t('priority.title'),
              content: <MercSkillPriority merc={merc} equipment={equipment} />
            }
          ]}
        />
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
        title={t('confirmDismissTitle')}
      >
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
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
            }}
          >
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

      <Modal
        isOpen={equipOpen}
        onClose={() => {
          setEquipOpen(false);
        }}
        title={`${localizedName} — ${t('equipment')}`}
      >
        <MercEquipmentEditor merc={projected} equipment={equipment} />
      </Modal>
    </Panel>
  );
}

function MercStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-r border-d2-border/70 px-2 py-2 last:border-r-0">
      <div className="text-sm uppercase tracking-[0.18em] text-d2-white/70">{label}</div>
      <div className="font-serif text-lg font-bold leading-none text-d2-gold">{value}</div>
    </div>
  );
}

function MercEquipmentEditor({ merc, equipment }: { merc: Mercenary; equipment: MercEquipment }) {
  const { t } = useTranslation(['mercs', 'inventory', 'common']);
  const backpack = useInventoryStore((s) => s.backpack);
  const equipOnMerc = useMercStore((s) => s.equipOnMerc);
  const unequipFromMerc = useMercStore((s) => s.unequipFromMerc);
  const [pickerSlot, setPickerSlot] = useState<EquipmentSlot | null>(null);
  const [viewSlot, setViewSlot] = useState<EquipmentSlot | null>(null);
  const [feedback, setFeedback] = useState<{ result: MercEquipmentResult; item: Item | null; action: 'equipped' | 'returned' } | null>(null);
  const bases = useMemo(() => loadItemBases(), []);
  const candidates = useMemo(() => pickerSlot
    ? backpack.filter(item => isMercEquipmentSlotCompatible(bases.get(item.baseId), pickerSlot))
    : [], [backpack, bases, pickerSlot]);
  const selectSlot = (slot: EquipmentSlot) => {
    setPickerSlot(slot);
    setFeedback(null);
  };
  const reportResult = (result: MercEquipmentResult, item: Item | null, action: 'equipped' | 'returned') => {
    setFeedback({ result, item, action });
    return result.ok;
  };
  const name = feedback?.item ? tItemName(t, feedback.item) : t('inventory:equipment');
  const feedbackText = !feedback ? '' : feedback.result.ok ? t(`equipmentFlow.${feedback.action}`, { name })
    : feedback.result.reason === 'backpack_full' ? t('inventory:toast.backpackFull')
      : feedback.result.reason === 'requirements_not_met' ? t('inventory:equipFlow.footer.disabledIneligible')
        : t('inventory:toast.equipFailed', { name });

  return (
    <div className="min-w-0 shrink-0 space-y-3">
      <p role="status" aria-live="polite" className="sticky top-0 z-10 bg-d2-panel text-sm text-d2-gold">{feedbackText}</p>
      {viewSlot !== null ? <div className="space-y-3" data-testid="merc-equipped-item-details">
        <Button variant="secondary" onClick={() => { setViewSlot(null); }}>{t('equipmentFlow.back')}</Button>
        <h3 className="font-serif text-d2-gold">{t(`inventory:slots.${viewSlot}`)}</h3>
        {equipment[viewSlot] && <ItemTooltip item={equipment[viewSlot]} className="w-full" />}
      </div> : pickerSlot === null ? <EquipmentPanel
        equipped={equipment}
        slotOrder={MERC_EQUIPMENT_SLOTS}
        testIdPrefix="merc-equip-slot"
        onSlotClick={selectSlot}
        onViewSlot={(slot) => { setViewSlot(slot); setFeedback(null); }}
        onUnequip={(slot) => {
          reportResult(unequipFromMerc(merc.id, slot), equipment[slot] ?? null, 'returned');
        }}
      /> : <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => { setPickerSlot(null); setFeedback(null); }}>
            {t('equipmentFlow.back')}
          </Button>
          <h3 className="font-serif text-d2-gold">{t(`inventory:slots.${pickerSlot}`)}</h3>
          {equipment[pickerSlot] && <Button variant="secondary" onClick={() => {
            reportResult(unequipFromMerc(merc.id, pickerSlot), equipment[pickerSlot] ?? null, 'returned');
          }}>{t('inventory:unequip')}</Button>}
        </div>
        <MercEquipmentCandidates
          key={pickerSlot}
          candidates={candidates}
          equipment={equipment}
          slot={pickerSlot}
          merc={merc}
          onSelect={() => { setFeedback(null); }}
          onEquip={(item) => reportResult(equipOnMerc(merc.id, pickerSlot, item), item, 'equipped')}
        />
      </>}
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
