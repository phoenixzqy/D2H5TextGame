import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RESPEC_POLICY } from '@/data/loaders/respec';
import { readRespecsRemaining, type RespecKind } from '@/engine/progression/respec';
import { usePlayerStore, useInventoryStore, useMapStore } from '@/stores';
import { prepareTownRespec, executeTownRespec, type TownRespecResult, type TownRespecRequest } from '@/stores/respecActions';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button } from '@/ui';

interface Confirmation { request: TownRespecRequest; refund: number; cost: number }
function ResetConfirmation({ pending, close, confirm }: {
  pending: Confirmation; close: () => void; confirm: () => void;
}) {
  const { t } = useTranslation('town');
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current?.showModal(); cancel.current?.focus();
    return () => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="town-reset-title" onCancel={event => { event.preventDefault(); close(); }}
    className="fixed inset-0 m-auto w-11/12 max-w-md max-h-[90dvh] overflow-y-auto rounded border-2 border-d2-gold bg-d2-panel p-4 text-d2-white backdrop:bg-black/80">
    <h2 id="town-reset-title" className="font-serif text-lg text-d2-gold">{t(`respec.confirmTitle.${pending.request.kind}`)}</h2>
    <p className="mt-3">{t(`respec.refund.${pending.request.kind}`, { count: pending.refund })}</p>
    <p className="mt-2">{pending.cost === 0 ? t('respec.freeConfirmation') : t('respec.paidConfirmation', { count: pending.cost })}</p>
    <p className="mt-2 text-sm">{t('respec.noHealing')}</p>
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button ref={cancel} type="button" data-testid="town-reset-cancel" onClick={close}
        className="min-h-[44px] rounded border border-d2-border p-2 focus-visible:ring-2 focus-visible:ring-d2-gold">{t('respec.cancel')}</button>
      <Button type="button" data-testid="town-reset-confirm" className="min-h-[44px] whitespace-normal" onClick={confirm}>{t('respec.confirm')}</Button>
    </div>
  </dialog>;
}

/** Independent stat/skill allowances at the authored current-town NPC, with explicit confirmation. */
export function TownRespecPanel({ npcId }: { npcId: string }) {
  const { t } = useTranslation('town');
  const player = usePlayerStore(state => state.player);
  const currencies = useInventoryStore(state => state.currencies);
  const currentAct = useMapStore(state => state.currentAct);
  const [pending, setPending] = useState<Confirmation | null>(null);
  const [feedback, setFeedback] = useState<TownRespecResult | 'busy' | 'restoration-failed' | null>(null);
  const key = String(currentAct) as keyof typeof RESPEC_POLICY.townNpcs;
  if (!player || RESPEC_POLICY.townNpcs[key] !== npcId) return null;
  let counters;
  try { counters = readRespecsRemaining(player, true); } catch { return <p role="alert">{t('respec.feedback.invalid-player')}</p>; }
  function handleError(error: unknown) {
    if (error instanceof AggregateError) setFeedback('restoration-failed');
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
    else throw error;
  }
  function prepare(kind: RespecKind) {
    setFeedback(null);
    try {
      const quote = prepareTownRespec(npcId, kind);
      if (quote.kind === 'ok') setPending(quote);
      else setFeedback(quote.kind);
    } catch (error) { handleError(error); }
  }
  return <div data-testid="town-respec" className="space-y-2 border-t border-d2-border pt-3">
    <h4 className="font-serif text-d2-gold">{t('respec.title')}</h4>
    <p className="text-sm">{t('respec.policy', { free: RESPEC_POLICY.freeUses, cost: RESPEC_POLICY.paidCost })}</p>
    <p className="text-sm">{t('respec.balance', { count: currencies[RESPEC_POLICY.currency] ?? 0 })}</p>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {(['stat', 'skill'] as const).map(kind => <Button type="button" key={kind} variant="secondary"
        className="min-h-[44px] whitespace-normal break-words" data-testid={`town-reset-${kind}`} onClick={() => { prepare(kind); }}>
        {t(`respec.action.${kind}`)} · {counters[kind] > 0 ? t('respec.remaining', { count: counters[kind] }) : t('respec.price', { count: RESPEC_POLICY.paidCost })}
      </Button>)}
    </div>
    {feedback && <p data-testid="town-reset-feedback" role={feedback === 'ok' ? 'status' : 'alert'} className="text-sm" aria-live="polite">{t(`respec.feedback.${feedback}`)}</p>}
    {pending && <ResetConfirmation pending={pending} close={() => { setPending(null); }} confirm={() => {
      try { setFeedback(executeTownRespec(pending.request)); }
      catch (error) { handleError(error); }
      finally { setPending(null); }
    }} />}
  </div>;
}
