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
 * `useMetaStore.pullGacha()` → `engine/gacha/recruitment-state.ts`. This component is
 * presentation only.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Panel, ScreenShell, RarityText, Tabs } from '@/ui';
import { PagedList } from '@/ui/PagedList';
import type { GachaPullResult } from '@/stores/metaStore';
import { useMetaStore, useInventoryStore } from '@/stores';
import { recruitmentBalance } from '@/stores/gachaActions';
import { loadMercPool } from '@/data/loaders/mercs';
import type { GachaRarity } from '@/engine/gacha/roller';

const RARITY_TO_TEXT = { R: 'magic', SR: 'rare', SSR: 'unique' } as const;

export function GachaScreen() {
  const { t, i18n } = useTranslation(['gacha', 'mercs', 'common']);
  const earned = useInventoryStore((s) => s.currencies.wishstone ?? 0);
  const legacy = useMetaStore((s) => s.gachaState.currency);
  const balance = recruitmentBalance(earned, legacy);
  const pity = useMetaStore((s) => s.gachaState.pityCounter);
  const recruitment = useMetaStore((s) => s.recruitmentState);
  const addCurrency = useMetaStore((s) => s.addGachaCurrency);
  const pullGacha = useMetaStore((s) => s.pullGacha);

  const [copyStatus, setCopyStatus] = useState<'copied' | 'copyFailed' | null>(null);
  const [resultModal, setResultModal] = useState<GachaPullResult[] | null>(null);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [pullFailed, setPullFailed] = useState(false);

  const banner = useMemo(() => loadMercPool(), []);
  const RATES = banner.rates;
  const PITY_THRESHOLD = banner.pity.ssr.threshold;
  const COST_SINGLE = banner.banner.cost.single;
  const COST_TEN = banner.banner.cost.tenPull;

  const doPulls = (n: number) => {
    setPullFailed(false);
    try {
      const results = pullGacha(n);
      if (!results) {
        setPullFailed(true);
        return;
      }
      setResultModal(results);
    } catch {
      setPullFailed(true);
    }
  };

  return (
    <ScreenShell testId="gacha-screen" title={t('gacha')}>
      <div className="flex min-h-0 min-w-0 w-full max-w-3xl mx-auto flex-1 flex-col gap-2">
        <Tabs
          tabs={[
            {
              id: 'banner',
              label: t('banner'),
              content: (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  <Panel className="!p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm text-d2-white/90">{t('banner')}</div>
                        <div className="text-base font-serif text-d2-gold break-words">
                          {t('bannerName')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-d2-white/90">{t('wishstones')}</div>
                        <div className="text-2xl text-d2-gold font-serif">💠 {balance ?? 0}</div>
                      </div>
                      <div className="min-w-0 max-w-full text-right">
                        <div className="text-sm text-d2-white/90">
                          {t('pityCounter', { count: pity, threshold: PITY_THRESHOLD })}
                        </div>
                        <div
                          className="w-40 max-w-full h-2 bg-d2-bg border border-d2-border rounded overflow-hidden mt-1"
                          role="progressbar"
                          aria-label={t('nextSSR', { count: Math.max(1, PITY_THRESHOLD - pity) })}
                          aria-valuenow={Math.min(pity, PITY_THRESHOLD)}
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
                  </Panel>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      className="min-h-[52px] text-sm sm:text-lg"
                      disabled={balance === null || balance < COST_SINGLE}
                      onClick={() => {
                        doPulls(1);
                      }}
                      data-testid="gacha-pull-1"
                    >
                      {t('singlePull')} · {t('cost', { amount: COST_SINGLE })}
                    </Button>
                    <Button
                      variant="primary"
                      className="min-h-[52px] text-sm sm:text-lg"
                      disabled={balance === null || balance < COST_TEN}
                      onClick={() => {
                        doPulls(10);
                      }}
                      data-testid="gacha-pull-10"
                    >
                      {t('tenPull')} · {t('cost', { amount: COST_TEN })}
                    </Button>
                  </div>

                  {pullFailed && (
                    <p role="alert" className="text-sm text-d2-white">
                      {t('pullFailed')}
                    </p>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRatesOpen(true);
                    }}
                  >
                    {t('rates')}
                  </Button>
                </div>
              )
            },
            {
              id: 'history',
              label: t('recentPulls'),
              content: (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                  <Button
                    className="min-h-[44px] mb-3"
                    variant="secondary"
                    disabled={recruitment.history.length === 0}
                    onClick={() => {
                      void Promise.resolve()
                        .then(() =>
                          navigator.clipboard.writeText(
                            JSON.stringify(recruitment.history, null, 2)
                          )
                        )
                        .then(
                          () => {
                            setCopyStatus('copied');
                          },
                          () => {
                            setCopyStatus('copyFailed');
                          }
                        );
                    }}
                    data-testid="gacha-copy-history"
                  >
                    {t('copyHistory')}
                  </Button>
                  {copyStatus && <p role="status">{t(copyStatus)}</p>}
                  {recruitment.history.length === 0 ? (
                    <p className="text-sm text-d2-white/90 italic">{t('noRecent')}</p>
                  ) : (
                    <PagedList
                      items={[...recruitment.history].reverse()}
                      listClassName="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm"
                      renderItem={(r) => (
                        <li
                          key={r.ordinal}
                          className="d2-plaque border border-d2-border rounded px-2 py-1 break-words min-w-0"
                        >
                          <RarityText rarity={RARITY_TO_TEXT[r.rarity]}>
                            {t(`mercs:byId.${mercSlug(r.mercId)}.name`)}
                          </RarityText>
                          <p className="text-sm text-d2-white/90 [overflow-wrap:anywhere]">
                            {new Date(r.timestamp).toLocaleString(i18n.language)}
                          </p>
                          <p className="text-sm">
                            {r.isNew ? t('isNew') : t('duplicateShards', { count: r.shardCount })}
                          </p>
                        </li>
                      )}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
        <Modal
          isOpen={ratesOpen}
          onClose={() => {
            setRatesOpen(false);
          }}
          title={t('rates')}
        >
          <div className="text-sm space-y-2">
            <p className="text-sm text-d2-white/90 mt-2" data-testid="gacha-sr-pity">
              {t('nextSR', {
                count: Math.max(1, banner.pity.sr.threshold - recruitment.srPityCounter)
              })}
            </p>
            <p className="text-sm text-d2-white/90" data-testid="gacha-ssr-pity">
              {t('nextSSR', { count: Math.max(1, PITY_THRESHOLD - pity) })}
            </p>
            {/* Dev helper: grant currency for local testing. Hidden in prod (Bug #15). */}
            {import.meta.env.DEV && (
              <div className="mt-3 text-right">
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-sm"
                  onClick={() => {
                    addCurrency(COST_TEN);
                  }}
                  data-testid="gacha-add-currency"
                >
                  {t('grant')}
                </Button>
              </div>
            )}
            <div>SSR: {(RATES.SSR * 100).toFixed(1)}%</div>
            <div>SR: {(RATES.SR * 100).toFixed(1)}%</div>
            <div>R: {(RATES.R * 100).toFixed(1)}%</div>
            <div className="text-d2-white/90">
              {t('pityRules', { sr: banner.pity.sr.threshold, ssr: PITY_THRESHOLD })}
            </div>
            <p>
              {t('uniformPool', {
                ssr: banner.banner.pool.SSR.length,
                sr: banner.banner.pool.SR.length,
                r: banner.banner.pool.R.length
              })}
            </p>
          </div>
        </Modal>

        <Modal
          isOpen={!!resultModal}
          onClose={() => {
            setResultModal(null);
          }}
          title={t('result')}
        >
          {resultModal && <RevealResults key={recruitment.totalPulls} results={resultModal} />}
        </Modal>
      </div>
    </ScreenShell>
  );
}

function RevealResults({ results }: { results: readonly GachaPullResult[] }) {
  const { t } = useTranslation('gacha');
  const [visible, setVisible] = useState(() =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? results.length
      : Math.min(1, results.length)
  );
  useEffect(() => {
    if (visible >= results.length) return;
    const timer = window.setTimeout(() => {
      setVisible((current) => Math.min(current + 1, results.length));
    }, 250);
    return () => {
      window.clearTimeout(timer);
    };
  }, [visible, results.length]);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm" aria-live="polite">
          {t('revealProgress', { shown: visible, total: results.length })}
        </p>
        {visible < results.length && (
          <Button
            variant="secondary"
            className="min-h-[44px]"
            data-testid="gacha-skip-reveal"
            onClick={() => {
              setVisible(results.length);
            }}
          >
            {t('skipReveal')}
          </Button>
        )}
      </div>
      <div data-testid="gacha-results" className="flex min-h-0 flex-1 flex-col">
        <PagedList
          items={results.slice(0, visible)}
          listClassName="space-y-1"
          renderItem={(result, index) => (
            <RevealRow
              key={`${result.mercDef.id}-${String(index)}`}
              result={result}
              index={index}
            />
          )}
        />
      </div>
    </div>
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
      className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 min-w-0 border-b border-d2-border/50 py-1
                  motion-safe:transition-opacity ${tone}`}
      style={{ animationDelay: `${String(index * 60)}ms` }}
    >
      <RarityText rarity={rt} className="min-w-0 [overflow-wrap:anywhere]">
        {localizedName}
      </RarityText>
      <span className="max-w-full text-sm text-d2-white/90 [overflow-wrap:anywhere]">
        {result.rarity}
        {` · ${result.isNew ? t('isNew') : t('duplicateShards', { count: result.shardCount })}`}
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
