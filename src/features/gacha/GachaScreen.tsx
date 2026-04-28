/**
 * GachaScreen — Wishstone gacha (single + 10-pull, pity, recent).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Panel, ScreenShell, Tooltip, RarityText } from '@/ui';
import { useMetaStore } from '@/stores';

interface PullResult {
  id: string;
  name: string;
  rarity: 'R' | 'SR' | 'SSR';
}

const RATES: Record<PullResult['rarity'], number> = {
  R: 0.79,
  SR: 0.18,
  SSR: 0.03,
};

const PITY_THRESHOLD = 90;

const MOCK_POOL: PullResult[] = [
  { id: 'm-rogue-1', name: 'Rogue Scout', rarity: 'R' },
  { id: 'm-iron-1', name: 'Iron Wolf', rarity: 'R' },
  { id: 'm-desert-1', name: 'Desert Mercenary', rarity: 'SR' },
  { id: 'm-barb-1', name: 'Barbarian Warrior', rarity: 'SR' },
  { id: 'm-act5-1', name: 'Champion of the North', rarity: 'SSR' },
];

function rollOne(pity: number): PullResult {
  const force = pity + 1 >= PITY_THRESHOLD;
  const r = Math.random();
  let rarity: PullResult['rarity'];
  if (force) rarity = 'SSR';
  else if (r < RATES.SSR) rarity = 'SSR';
  else if (r < RATES.SSR + RATES.SR) rarity = 'SR';
  else rarity = 'R';
  const candidates = MOCK_POOL.filter((m) => m.rarity === rarity);
  const list = candidates.length > 0 ? candidates : MOCK_POOL;
  const idx = Math.floor(Math.random() * list.length);
  const picked = list[idx];
  if (picked) return picked;
  // List is guaranteed non-empty (MOCK_POOL is non-empty); throw to satisfy the type.
  throw new Error('gacha pool is empty');
}

export function GachaScreen() {
  const { t } = useTranslation(['gacha', 'common']);
  const balance = useMetaStore((s) => s.gachaState.currency);
  const pity = useMetaStore((s) => s.gachaState.pityCounter);
  const spend = useMetaStore((s) => s.spendGachaCurrency);
  const addCurrency = useMetaStore((s) => s.addGachaCurrency);
  const incrementPity = useMetaStore((s) => s.incrementPity);
  const resetPity = useMetaStore((s) => s.resetPity);

  const [recent, setRecent] = useState<PullResult[]>([]);
  const [resultModal, setResultModal] = useState<PullResult[] | null>(null);

  const doPulls = (n: number) => {
    if (!spend(n)) return;
    const results: PullResult[] = [];
    let currentPity = pity;
    for (let i = 0; i < n; i++) {
      const r = rollOne(currentPity);
      results.push(r);
      if (r.rarity === 'SSR') {
        resetPity();
        currentPity = 0;
      } else {
        incrementPity();
        currentPity += 1;
      }
    }
    setRecent((prev) => [...results, ...prev].slice(0, 30));
    setResultModal(results);
  };

  return (
    <ScreenShell testId="gacha-screen" title={t('gacha')}>
      <div className="max-w-3xl mx-auto space-y-4">
        <Panel className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-d2-white/60">{t('wishstones')}</div>
            <div className="text-2xl text-d2-gold font-serif">💠 {balance}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-d2-white/60">{t('pityCounter', { count: pity })}</div>
            <div className="w-40 h-2 bg-d2-bg border border-d2-border rounded overflow-hidden mt-1">
              <div
                className="h-full bg-d2-gold transition-all"
                style={{ width: `${String(Math.min(100, (pity / PITY_THRESHOLD) * 100))}%` }}
                aria-hidden
              />
            </div>
          </div>
          {/* dev helper to add currency for testing */}
          <Button
            variant="secondary"
            className="min-h-[40px] text-xs"
            onClick={() => { addCurrency(10); }}
          >
            +10 💠 (dev)
          </Button>
        </Panel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="primary"
            className="min-h-[64px] text-lg"
            disabled={balance < 1}
            onClick={() => { doPulls(1); }}
            data-testid="gacha-pull-1"
          >
            {t('singlePull')} · {t('cost', { amount: 1 })}
          </Button>
          <Button
            variant="primary"
            className="min-h-[64px] text-lg"
            disabled={balance < 10}
            onClick={() => { doPulls(10); }}
            data-testid="gacha-pull-10"
          >
            {t('tenPull')} · {t('cost', { amount: 10 })}
          </Button>
        </div>

        <Tooltip
          content={
            <div className="text-xs space-y-1">
              <div>SSR: {(RATES.SSR * 100).toFixed(1)}%</div>
              <div>SR: {(RATES.SR * 100).toFixed(1)}%</div>
              <div>R: {(RATES.R * 100).toFixed(1)}%</div>
              <div className="text-d2-white/60">{t('pityCounter', { count: PITY_THRESHOLD })}</div>
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
            <p className="text-sm text-d2-white/60 italic">
              {t('noRecent', { defaultValue: '暂无记录' })}
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-sm">
              {recent.map((r, i) => (
                <li key={i} className="border border-d2-border rounded px-2 py-1 truncate">
                  <RarityText rarity={rarityToTextRarity(r.rarity)}>{r.name}</RarityText>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Modal
          isOpen={!!resultModal}
          onClose={() => { setResultModal(null); }}
          title={t('result', { defaultValue: '招募结果' })}
        >
          {resultModal && (
            <ul className="space-y-1">
              {resultModal.map((r, i) => (
                <li key={i} className="flex items-center justify-between border-b border-d2-border/50 py-1">
                  <RarityText rarity={rarityToTextRarity(r.rarity)}>{r.name}</RarityText>
                  <span className="text-xs text-d2-white/60">{r.rarity}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      </div>
    </ScreenShell>
  );
}

function rarityToTextRarity(r: 'R' | 'SR' | 'SSR') {
  return r === 'SSR' ? 'unique' : r === 'SR' ? 'rare' : 'magic';
}
