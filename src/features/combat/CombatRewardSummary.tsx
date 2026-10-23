import { useTranslation } from 'react-i18next';
import { materialCatalog } from '@/data/loaders/materials';
import type { KillRewards } from '@/engine/loot/award';
import { tDataKey, tItemName } from '@/ui';

const RARITY_COLORS: Record<string, string> = {
  normal: 'text-d2-white',
  magic: 'text-blue-300',
  rare: 'text-yellow-300',
  set: 'text-green-400',
  unique: 'text-d2-gold',
  runeword: 'text-orange-400',
};

/** Present the committed reward bag without deriving holdings from summaries. */
export function CombatRewardSummary({ rewards }: { readonly rewards: KillRewards }) {
  const { t, i18n } = useTranslation(['combat', 'items']);
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language);
  const materials = [...materialCatalog.values()].filter(material => (rewards.materials[material.id] ?? 0) > 0);
  if (rewards.items.length === 0 && rewards.runeShards === 0 && rewards.wishstones === 0 && materials.length === 0) return null;
  const line = (quantity: number, name: string) => t('rewardLine', { quantity: formatter.format(quantity), name });

  return (
    <section className="mb-2 min-w-0 break-words" aria-label={t('rewards')} data-testid="loot-summary">
      {rewards.runeShards > 0 && (
        <div className="text-d2-gold text-sm mb-1">{line(rewards.runeShards, t('runeShard'))}</div>
      )}
      {rewards.items.length > 0 && (
        <ul className="space-y-1 text-sm" data-testid="loot-items">
          {rewards.items.map(item => (
            <li key={item.id} className={RARITY_COLORS[item.rarity] ?? 'text-d2-white'}>
              {tItemName(t, item)}{' '}
              <span className="text-xs text-d2-white/50">[{item.rarity} · iLvl {item.level}]</span>
            </li>
          ))}
        </ul>
      )}
      {materials.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-d2-white/80">
          {materials.map(material => (
            <li key={material.id}>{line(rewards.materials[material.id] ?? 0, tDataKey(t, material.nameKey))}</li>
          ))}
        </ul>
      )}
      {rewards.wishstones > 0 && (
        <div className="mt-2 text-sm text-d2-white/80">{line(rewards.wishstones, t('wishstones'))}</div>
      )}
    </section>
  );
}
