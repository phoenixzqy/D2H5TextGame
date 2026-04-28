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
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GameCard, Panel, ScreenShell, resolveMercArt } from '@/ui';
import { useMercStore } from '@/stores';
import type { Mercenary } from '@/engine/types/entities';
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
              // Strip runtime instance suffix (e.g. `mercs/foo#abc`) when
              // looking up the static def.
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
  const { t } = useTranslation('mercs');
  const rt = RARITY_TO_TEXT[merc.rarity];
  const baseId = merc.id.split('#')[0] ?? merc.id;
  const slug = baseId.includes('/') ? baseId.slice(baseId.indexOf('/') + 1) : baseId;
  const portrait = resolveMercArt(slug) ?? (def ? resolveMercArt(def.classRef) : null);
  const localizedName = t(`byId.${slug}.name`, { defaultValue: merc.name });
  const lore = t(`byId.${slug}.lore`, { defaultValue: def?.flavor ?? '' });
  const archetype = def?.classRef
    ? t(`character:classes.${def.classRef}`, { defaultValue: def.classRef })
    : t(`rarity.${merc.rarity}`);

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
        </div>
        {isFielded && (
          <span className="text-[10px] uppercase tracking-wide text-d2-gold border border-d2-gold/60 rounded px-2 py-0.5 whitespace-nowrap">
            {t('fielded')}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <Button
          variant={isFielded ? 'secondary' : 'primary'}
          className="min-h-[40px] flex-1 text-sm"
          onClick={onField}
          data-testid={`merc-field-${baseId}`}
        >
          {isFielded ? t('unfield') : t('setAsFielded')}
        </Button>
      </div>
    </Panel>
  );
}
