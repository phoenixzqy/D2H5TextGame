/**
 * GachaScreen — Wishstone gacha banner.
 *
 * Layout (mobile-first 360×640):
 *   [Banner header — name, currency, pity bar]
 *   [Single Pull]  [10× Pull]
 *   [ⓘ Rates tooltip]
 *   [Recent Pulls]
 *   ──── on pull ──── modal with rarity-tinted reveals ────
 *
 * All randomness, currency math, and roster mutation live in
 * `useMetaStore.pullGacha()` → `engine/gacha/roller.ts`. This component is
 * presentation only.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Panel, ScreenShell, Tooltip, RarityText } from '@/ui';
import type { GachaPullResult } from '@/stores/metaStore';
import { useMetaStore } from '@/stores';
import { loadMercPool } from '@/data/loaders/mercs';
import type { GachaRarity } from '@/engine/gacha/roller';

const RARITY_TO_TEXT = { R: 'magic', SR: 'rare', SSR: 'unique' } as const;

export function GachaScreen() {
  const { t } = useTranslation(['gacha', 'mercs', 'common']);
  const balance = useMetaStore((s) => s.gachaState.currency);
  const pity = useMetaStore((s) => s.gachaState.pityCounter);
  const addCurrency = useMetaStore((s) => s.addGachaCurrency);
  const pullGacha = useMetaStore((s) => s.pullGacha);

  const [recent, setRecent] = useState<GachaPullResult[]>([]);
  const [resultModal, setResultModal] = useState<GachaPullResult[] | null>(null);

  const banner = useMemo(() => loadMercPool(), []);
  const RATES = banner.rates;
  const PITY_THRESHOLD = banner.pity.ssr.threshold;
  const COST_SINGLE = banner.banner.cost.single;
  const COST_TEN = banner.banner.cost.tenPull;

  const doPulls = (n: number) => {
    const results = pullGacha(n);
    if (!results) return;
    setRecent((prev) => [...results, ...prev].slice(0, banner.banner.uiHistoryCap));
    setResultModal(results);
  };

  return (
    <ScreenShell testId="gacha-screen" title={t('gacha')}>
      <div className="max-w-3xl mx-auto space-y-4">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-d2-white/60">{t('banner')}</div>
              <div className="text-lg font-serif text-d2-gold truncate">
                {t('bannerName')}
              </div>
            </div>
            <div>
              <div className="text-xs text-d2-white/60">{t('wishstones')}</div>
              <div className="text-2xl text-d2-gold font-serif">💠 {balance}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-d2-white/60">
                {t('pityCounter', { count: pity })}
              </div>
              <div
                className="w-40 h-2 bg-d2-bg border border-d2-border rounded overflow-hidden mt-1"
                role="progressbar"
                aria-valuenow={pity}
                aria-valuemin={0}
                aria-valuemax={PITY_THRESHOLD}
              >
                <div
                  className="h-full bg-d2-gold transition-all"
                  style={{
                    width: `${String(Math.min(100, (pity / PITY_THRESHOLD) * 100))}%`
                  }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
          {/* Dev helper: grant currency for local testing. Hidden in prod (Bug #15). */}
          {import.meta.env.DEV && (
            <div className="mt-3 text-right">
              <Button
                variant="secondary"
                className="min-h-[40px] text-xs"
                onClick={() => { addCurrency(COST_TEN); }}
                data-testid="gacha-add-currency"
              >
                {t('grant')}
              </Button>
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="primary"
            className="min-h-[64px] text-lg"
            disabled={balance < COST_SINGLE}
            onClick={() => { doPulls(1); }}
            data-testid="gacha-pull-1"
          >
            {t('singlePull')} · {t('cost', { amount: COST_SINGLE })}
          </Button>
          <Button
            variant="primary"
            className="min-h-[64px] text-lg"
            disabled={balance < COST_TEN}
            onClick={() => { doPulls(10); }}
            data-testid="gacha-pull-10"
          >
            {t('tenPull')} · {t('cost', { amount: COST_TEN })}
          </Button>
        </div>

        <Tooltip
          content={
            <div className="text-xs space-y-1">
              <div>SSR: {(RATES.SSR * 100).toFixed(1)}%</div>
              <div>SR: {(RATES.SR * 100).toFixed(1)}%</div>
              <div>R: {(RATES.R * 100).toFixed(1)}%</div>
              <div className="text-d2-white/60">
                {t('pityCounter', { count: PITY_THRESHOLD })}
              </div>
            </div>
          }
        >
          <button
            type="button"
            className="text-xs text-d2-white/70 underline-offset-2 hover:underline min-h-[32px]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold rounded"
          >
            ⓘ {t('rates')}
          </button>
        </Tooltip>

        <Panel title={t('recentPulls')}>
          {recent.length === 0 ? (
            <p className="text-sm text-d2-white/60 italic">{t('noRecent')}</p>
          ) : (
            <ul
              className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-sm"
              data-testid="gacha-recent"
            >
              {recent.map((r, i) => (
                <li
                  key={`${r.mercDef.id}-${String(i)}`}
                  className="border border-d2-border rounded px-2 py-1 truncate"
                >
                  <RarityText rarity={RARITY_TO_TEXT[r.rarity]}>
                    {t(`mercs:byId.${mercSlug(r.mercDef.id)}.name`, { defaultValue: r.mercDef.name })}
                  </RarityText>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Modal
          isOpen={!!resultModal}
          onClose={() => { setResultModal(null); }}
          title={t('result')}
        >
          {resultModal && (
            <ul className="space-y-1" data-testid="gacha-results">
              {resultModal.map((r, i) => (
                <RevealRow key={`${r.mercDef.id}-${String(i)}`} result={r} index={i} />
              ))}
            </ul>
          )}
        </Modal>
      </div>
    </ScreenShell>
  );
}

function RevealRow({ result, index }: { result: GachaPullResult; index: number }) {
  const { t } = useTranslation(['gacha', 'mercs']);
  const rt = RARITY_TO_TEXT[result.rarity];
  const slug = mercSlug(result.mercDef.id);
  const localizedName = t(`mercs:byId.${slug}.name`);
  const tone = rarityTone(result.rarity);
  return (
    <li
      className={`flex items-center justify-between border-b border-d2-border/50 py-1
                  motion-safe:transition-opacity ${tone}`}
      style={{ animationDelay: `${String(index * 60)}ms` }}
    >
      <RarityText rarity={rt}>{localizedName}</RarityText>
      <span className="text-xs text-d2-white/60">
        {result.rarity}
        {result.isNew ? ` · ${t('isNew')}` : ''}
      </span>
    </li>
  );
}

function rarityTone(r: GachaRarity): string {
  switch (r) {
    case 'SSR':
      return 'bg-d2-unique/10';
    case 'SR':
      return 'bg-d2-rare/10';
    default:
      return '';
  }
}

function mercSlug(id: string): string {
  const idx = id.indexOf('/');
  return idx >= 0 ? id.slice(idx + 1) : id;
}
