/**
 * MercsScreen — owned mercs roster, star upgrade, set fielded.
 */
import { useTranslation } from 'react-i18next';
import { Button, Panel, RarityText, ScreenShell, StatBar } from '@/ui';
import { useMercStore } from '@/stores';
import type { Mercenary } from '@/engine/types/entities';

export function MercsScreen() {
  const { t } = useTranslation(['mercs', 'common']);
  const ownedMercs = useMercStore((s) => s.ownedMercs);
  const fieldedMercId = useMercStore((s) => s.fieldedMercId);
  const setFielded = useMercStore((s) => s.setFieldedMerc);
  const upgrade = useMercStore((s) => s.upgradeMerc);

  return (
    <ScreenShell testId="mercs-screen" title={t('mercenaries')}>
      <div className="max-w-4xl mx-auto space-y-3">
        {ownedMercs.length === 0 ? (
          <Panel>
            <p className="text-sm text-d2-white/60 italic text-center py-6">
              {t('empty', { defaultValue: '尚未招募任何雇佣兵' })}
            </p>
          </Panel>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ownedMercs.map((m) => (
              <li key={m.id}>
                <MercCard
                  merc={m}
                  isFielded={m.id === fieldedMercId}
                  onField={() => { setFielded(m.id === fieldedMercId ? null : m.id); }}
                  onUpgrade={() => { upgrade(m.id); }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
}

function MercCard({
  merc,
  isFielded,
  onField,
  onUpgrade,
}: {
  merc: Mercenary;
  isFielded: boolean;
  onField: () => void;
  onUpgrade: () => void;
}) {
  const { t } = useTranslation('mercs');
  const rarityToTextRarity = { R: 'magic', SR: 'rare', SSR: 'unique' } as const;
  const rt = rarityToTextRarity[merc.rarity];

  return (
    <Panel className={isFielded ? 'border-d2-gold' : ''}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <RarityText rarity={rt} className="font-serif text-lg truncate block">
            {merc.name}
          </RarityText>
          <div className="text-xs text-d2-white/60">
            {t(`rarity.${merc.rarity}`)} · {t('level')} {merc.level}
          </div>
        </div>
        {isFielded && (
          <span className="text-xs text-d2-gold border border-d2-gold/60 rounded px-2 py-0.5">
            {t('fielded')}
          </span>
        )}
      </div>
      <StatBar
        current={merc.derivedStats.life}
        max={merc.derivedStats.lifeMax}
        color="hp"
        label="HP"
      />
      <div className="flex gap-2 mt-3">
        <Button
          variant={isFielded ? 'secondary' : 'primary'}
          className="min-h-[40px] flex-1 text-sm"
          onClick={onField}
        >
          {isFielded ? t('unfield', { defaultValue: '撤下' }) : t('setAsFielded')}
        </Button>
        <Button variant="secondary" className="min-h-[40px] flex-1 text-sm" onClick={onUpgrade}>
          ⭐ {t('upgrade')}
        </Button>
      </div>
    </Panel>
  );
}
