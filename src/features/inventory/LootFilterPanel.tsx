import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_LOOT_FILTER,
  LOOT_FILTER_RARITIES,
  type LootFilterAction,
  type LootFilterSettings
} from '@/engine/loot/filter';
import { useMetaStore } from '@/stores/metaStore';

/** Edit persistent rules for future combat loot without touching owned items. */
export function LootFilterPanel(): JSX.Element {
  const { t } = useTranslation('inventory');
  const id = useId();
  const filter = useMetaStore((state) => state.settings.lootFilter ?? DEFAULT_LOOT_FILTER);
  const [levelDraft, setLevelDraft] = useState(String(filter.maxItemLevel));
  const levelValid = /^\d+$/.test(levelDraft) && Number.isSafeInteger(Number(levelDraft));

  useEffect(() => {
    setLevelDraft(String(filter.maxItemLevel));
  }, [filter.maxItemLevel]);

  const update = (patch: Partial<LootFilterSettings>): void => {
    const current = useMetaStore.getState().settings.lootFilter ?? DEFAULT_LOOT_FILTER;
    useMetaStore.getState().updateSettings({ lootFilter: { ...current, ...patch } });
  };

  return (
    <section
      aria-label={t('lootFilter.title')}
      data-testid="loot-filter-panel"
      className="min-w-0 space-y-4 text-sm text-d2-white"
    >
      <p className="leading-relaxed">{t('lootFilter.scope')}</p>
      <div className="d2-panel space-y-3 p-3">
        <button
          type="button"
          role="switch"
          aria-checked={filter.enabled}
          aria-label={t('lootFilter.enable')}
          data-testid="loot-filter-enabled"
          onClick={() => {
            update({ enabled: !filter.enabled });
          }}
          className="d2-control flex min-h-[44px] w-full items-center justify-between gap-3 rounded border border-d2-border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
        >
          <span>{t('lootFilter.enable')}</span>
          <span className="shrink-0 text-d2-gold">
            {t(filter.enabled ? 'lootFilter.enabled' : 'lootFilter.disabled')}
          </span>
        </button>
        <p className="leading-relaxed text-d2-white/80">{t('lootFilter.immediate')}</p>
        <div className="space-y-2">
          <label htmlFor={`${id}-level`} className="block">
            {t('lootFilter.maxItemLevel')}
          </label>
          <input
            id={`${id}-level`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={levelDraft}
            aria-invalid={!levelValid}
            aria-describedby={`${id}-level-help${levelValid ? '' : ` ${id}-level-error`}`}
            onChange={(event) => {
              const value = event.target.value;
              setLevelDraft(value);
              if (/^\d+$/.test(value) && Number.isSafeInteger(Number(value))) {
                update({ maxItemLevel: Number(value) });
              }
            }}
            className="d2-control min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-panel px-3 py-2 text-base text-d2-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
          />
          <p id={`${id}-level-help`} className="leading-relaxed text-d2-white/80">
            {t('lootFilter.levelHelp')}
          </p>
          {!levelValid && (
            <p id={`${id}-level-error`} role="alert" className="text-d2-red">
              {t('lootFilter.levelError')}
            </p>
          )}
        </div>
      </div>
      <fieldset className="min-w-0 space-y-2">
        <legend className="mb-2 font-serif text-base text-d2-gold">
          {t('lootFilter.rarityRules')}
        </legend>
        {LOOT_FILTER_RARITIES.map((rarity) => (
          <div
            key={rarity}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-3"
          >
            <label htmlFor={`${id}-${rarity}`}>{t(`lootFilter.rarity.${rarity}`)}</label>
            <select
              id={`${id}-${rarity}`}
              aria-label={t('lootFilter.actionLabel', { rarity: t(`lootFilter.rarity.${rarity}`) })}
              data-testid={`loot-filter-${rarity}`}
              value={filter.actions[rarity]}
              onChange={(event) => {
                const current = useMetaStore.getState().settings.lootFilter ?? DEFAULT_LOOT_FILTER;
                update({
                  actions: { ...current.actions, [rarity]: event.target.value as LootFilterAction }
                });
              }}
              className="d2-control min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-panel px-2 py-2 text-base text-d2-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
            >
              {(['keep', 'salvage', 'discard'] as const).map((action) => (
                <option key={action} value={action}>
                  {t(`lootFilter.action.${action}`)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>
      <div className="space-y-2 border-t border-d2-border pt-3 leading-relaxed text-d2-white/80">
        <p>{t('lootFilter.protected')}</p>
        <p>{t('lootFilter.salvageHelp')}</p>
      </div>
    </section>
  );
}
