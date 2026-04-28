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
import { Button, Panel, RarityText, ScreenShell } from '@/ui';
import { useMercStore } from '@/stores';
import type { Mercenary } from '@/engine/types/entities';
import { loadMercPool, type MercDef } from '@/data/loaders/mercs';

const RARITY_TO_TEXT = { R: 'magic', SR: 'rare', SSR: 'unique' } as const;

/** Map data-driven `classRef` → an existing class portrait file. */
function classPortrait(classRef: string): string | null {
  // The current generated set is the seven core character classes.
  const known = [
    'amazon',
    'assassin',
    'barbarian',
    'druid',
    'necromancer',
    'paladin',
    'sorceress'
  ];
  if (known.includes(classRef)) {
    return `/assets/d2/generated/class-portraits/classes.${classRef}.png`;
  }
  return null;
}

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
  const portrait = def ? classPortrait(def.classRef) : null;
  const localizedName = t(`byId.${slug}.name`, { defaultValue: merc.name });
  const lore = t(`byId.${slug}.lore`, { defaultValue: def?.flavor ?? '' });

  return (
    <Panel
      className={isFielded ? 'border-d2-gold' : ''}
      data-testid={`merc-card-${baseId}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <Portrait portrait={portrait} name={localizedName} rarity={merc.rarity} />
        <div className="min-w-0 flex-1">
          <RarityText rarity={rt} className="font-serif text-base sm:text-lg truncate block">
            {localizedName}
          </RarityText>
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
        </div>
        {isFielded && (
          <span className="text-[10px] uppercase tracking-wide text-d2-gold border border-d2-gold/60 rounded px-2 py-0.5 whitespace-nowrap">
            {t('fielded')}
          </span>
        )}
      </div>

      {def && (
        <dl className="grid grid-cols-4 gap-1 text-[11px] text-d2-white/80 mb-2">
          <Stat label="STR" value={def.baseStats.strength} />
          <Stat label="DEX" value={def.baseStats.dexterity} />
          <Stat label="VIT" value={def.baseStats.vitality} />
          <Stat label="ENG" value={def.baseStats.energy} />
        </dl>
      )}

      {lore && (
        <p className="text-[11px] text-d2-white/50 italic mb-2 line-clamp-3">{lore}</p>
      )}

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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-d2-bg/40 border border-d2-border/60 rounded py-0.5">
      <dt className="text-[9px] text-d2-white/50 uppercase tracking-wider">{label}</dt>
      <dd className="text-d2-white">{value}</dd>
    </div>
  );
}

function Portrait({
  portrait,
  name,
  rarity
}: {
  portrait: string | null;
  name: string;
  rarity: 'R' | 'SR' | 'SSR';
}) {
  const ringClass =
    rarity === 'SSR' ? 'ring-d2-unique' : rarity === 'SR' ? 'ring-d2-rare' : 'ring-d2-magic';
  if (portrait) {
    return (
      <img
        src={portrait}
        alt=""
        loading="lazy"
        className={`w-14 h-14 rounded object-cover ring-2 ${ringClass} flex-none`}
      />
    );
  }
  const letter = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      aria-hidden
      className={`w-14 h-14 rounded ring-2 ${ringClass} bg-d2-panel flex items-center justify-center text-d2-gold font-serif text-xl flex-none`}
    >
      {letter}
    </div>
  );
}
