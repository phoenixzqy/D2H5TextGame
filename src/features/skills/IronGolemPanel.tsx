import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import { computeSkillDisplayModel, type SkillRankDisplayStats } from '@/engine/skills/displayStats';
import { composeGolemMastery } from '@/engine/skills/golem-mastery';
import { loadItemBases } from '@/data/loaders/loot';
import { Button, Panel, tItemName } from '@/ui';
import { itemBaseSlug } from '@/ui/i18nKey';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import {
  useIronGolemSelectionStore,
  IronGolemAcknowledgementError
} from '@/stores/ironGolemSelectionStore';
import { inspectRecordedWaves, subscribeRecordedWaves } from '@/stores/recordedWaveReceipt';
import {
  readIronGolemPresentation,
  armPresentedIronGolem,
  clearPresentedIronGolem,
  IronGolemPresentationError,
  type PresentedIronGolemAttempt
} from '@/stores/ironGolemPresentation';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import type { SkillTemplate } from '@/stores/skillsHelpers';

interface Props {
  readonly skill: SkillTemplate;
  readonly rank: number;
}
interface Notice {
  readonly key: string;
  readonly failed: boolean;
  readonly selection: ReturnType<typeof useIronGolemSelectionStore.getState>['selection'];
  readonly holder: ReturnType<typeof inspectRecordedWaves>;
}

/** Ephemeral native Skills controls; all qualification, preview math and writes use shared APIs. */
export function IronGolemPanel(props: Props) {
  const player = usePlayerStore((s) => s.player);
  return player ? <HeroIronGolemPanel key={player.id} {...props} player={player} /> : null;
}

function HeroIronGolemPanel({ skill, rank, player }: Props & { readonly player: Player }) {
  const { t, i18n } = useTranslation(['skills', 'items', 'rarity']);
  const inventory = useInventoryStore();
  useMercStore((s) => s.mercEquipment);
  const selection = useIronGolemSelectionStore((s) => s.selection);
  const holder = useSyncExternalStore(
    subscribeRecordedWaves,
    inspectRecordedWaves,
    inspectRecordedWaves
  );
  const [draftId, setDraftId] = useState<string | null>(null);
  const [acknowledgedItem, setAcknowledgedItem] = useState<Item | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const id = useId();
  const model = readIronGolemPresentation(draftId);
  const source = model.draft.eligible ? model.draft.item : null;
  const acknowledged = source !== null && acknowledgedItem === source;
  useEffect(() => {
    setAcknowledgedItem(null);
  }, [source]);
  const preview = model.draft.eligible
    ? computeSkillDisplayModel(
        skill,
        rank,
        undefined,
        model.draft.bonuses,
        composeGolemMastery(player)
      )
    : null;
  const name = (item: Item) =>
    loadItemBases().has(item.baseId) && i18n.exists(`items:base.${itemBaseSlug(item.baseId)}`)
      ? tItemName(t, item)
      : t('ironGolem.unknownItem');
  const refusal = (code: string) =>
    t(
      code === 'configurationUnavailable'
        ? 'ironGolem.configurationUnavailable'
        : `ironGolem.refusal.${code}`
    );
  const act = (clear: boolean) => {
    let key = clear ? 'ironGolem.clearDone' : 'ironGolem.armDone';
    let failed = false;
    try {
      if (clear) clearPresentedIronGolem(player.id, model.selection);
      else {
        // Notifications may have been interrupted after a same-ID item replacement.
        const liveDraft = readIronGolemPresentation(draftId).draft;
        armPresentedIronGolem(
          player.id,
          draftId ?? '',
          liveDraft.eligible && liveDraft.item === acknowledgedItem
        );
      }
    } catch (error) {
      failed = true;
      key =
        error instanceof IronGolemPresentationError
          ? error.code === 'configurationUnavailable'
            ? 'ironGolem.configurationUnavailable'
            : `ironGolem.refusal.${error.code}`
          : error instanceof IronGolemAcknowledgementError
            ? 'ironGolem.refusal.acknowledgementRequired'
            : error instanceof WaveGuardError &&
                (error.code === 'waveBusy' || error.code === 'restorePending')
              ? `ironGolem.refusal.${error.code}`
              : 'ironGolem.actionUnverified';
    }
    // Force a live reread even if an earlier store subscriber threw after the write.
    setNotice({
      key,
      failed,
      selection: useIronGolemSelectionStore.getState().selection,
      holder: inspectRecordedWaves()
    });
  };
  const visibleNotice =
    notice && notice.selection === selection && notice.holder === holder ? notice : null;
  return (
    <Panel
      title={t('ironGolem.title')}
      data-testid="iron-golem-panel"
      className="min-w-0 space-y-4 text-sm text-d2-white"
    >
      <div className="space-y-2 text-d2-white/90">
        <p>{t('ironGolem.rules')}</p>
        <p>{t('ironGolem.timing')}</p>
        <p>{t('ironGolem.attemptTiming')}</p>
      </div>
      <div className="space-y-2">
        <label htmlFor={id} className="block font-bold text-d2-gold">
          {t('ironGolem.choose')}
        </label>
        <select
          id={id}
          value={draftId ?? ''}
          onChange={(event) => {
            setDraftId(event.target.value || null);
            setAcknowledgedItem(null);
            setNotice(null);
          }}
          className="d2-field min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-bg px-3 text-base focus:outline-none focus:ring-2 focus:ring-d2-gold"
        >
          <option value="">{t('ironGolem.empty')}</option>
          {draftId !== null && !inventory.backpack.some((item) => item.id === draftId) ? (
            <option value={draftId}>{t('ironGolem.refusal.notInBackpack')}</option>
          ) : null}
          {inventory.backpack.map((item, index) => (
            <option key={index} value={item.id}>
              {t('ironGolem.option', {
                position: index + 1,
                rarity: t(`rarity:tier.${item.rarity}`),
                item: name(item)
              })}
            </option>
          ))}
        </select>
        {inventory.backpack.length === 0 ? <p>{t('ironGolem.emptyBackpack')}</p> : null}
        {draftId !== null && !model.draft.eligible ? (
          <p role="alert">{refusal(model.draft.reason)}</p>
        ) : null}
        {!model.configurationReady ? <p>{t('ironGolem.configurationUnavailable')}</p> : null}
      </div>
      {preview && model.draft.eligible ? (
        <section
          aria-labelledby={`${id}-preview`}
          className="space-y-2 border-y border-d2-border py-3"
        >
          <h3 id={`${id}-preview`} className="d2-section-title font-serif text-lg text-d2-gold">
            {t('ironGolem.preview')}
          </h3>
          <p>
            {t('ironGolem.bonuses', {
              life: format(model.draft.bonuses.life),
              attack: format(model.draft.bonuses.attack),
              defense: format(model.draft.bonuses.defense)
            })}
          </p>
          <p>{t('ironGolem.previewScope')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewRank stats={preview.current} next={false} />
            <PreviewRank stats={preview.next} next />
          </div>
        </section>
      ) : null}
      <label className="d2-plaque flex min-h-[44px] cursor-pointer items-start gap-3 rounded border border-d2-gold/60 bg-d2-bg p-3">
        <input
          type="checkbox"
          checked={acknowledged}
          disabled={!model.draft.eligible}
          onChange={(event) => {
            setAcknowledgedItem(event.target.checked ? source : null);
          }}
          className="h-5 w-5 shrink-0 accent-d2-gold focus:ring-2 focus:ring-d2-gold"
        />
        <span>{t('ironGolem.acknowledge')}</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="danger"
          className="min-h-[44px]"
          disabled={!acknowledged || !model.configurationReady}
          onClick={() => {
            act(false);
          }}
        >
          {t('ironGolem.arm')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px]"
          disabled={selection === null}
          onClick={() => {
            act(true);
          }}
        >
          {t('ironGolem.clear')}
        </Button>
      </div>
      {visibleNotice?.failed ? <p role="alert">{t(visibleNotice.key)}</p> : null}
      <div role="status" aria-live="polite" aria-atomic="true" className="space-y-3">
        {visibleNotice && !visibleNotice.failed ? <p>{t(visibleNotice.key)}</p> : null}
        <p>
          {selection === null
            ? t('ironGolem.notArmed')
            : model.armed.eligible
              ? t('ironGolem.armed', { item: name(model.armed.item) })
              : t('ironGolem.armedInvalid', { reason: refusal(model.armed.reason) })}
        </p>
        <RecordedAttempt attempt={model.attempt} itemName={name} />
      </div>
    </Panel>
  );
}

function format(value: number) {
  return String(Number(value.toFixed(4)));
}
function PreviewRank({
  stats,
  next
}: {
  readonly stats: SkillRankDisplayStats | undefined;
  readonly next: boolean;
}) {
  const { t } = useTranslation('skills');
  return (
    <section
      data-testid={next ? 'iron-preview-next' : 'iron-preview-current'}
      className="d2-surface rounded border border-d2-border bg-d2-bg p-3"
    >
      <h4 className="d2-section-title mb-2 font-bold text-d2-gold">
        {t(next ? 'details.next' : 'details.current')}
      </h4>
      {stats?.summonUnit ? (
        <dl className="space-y-1">
          {stats.summonUnit.stats.map((row) => (
            <div key={row.id} className="flex justify-between gap-3">
              <dt>{t(row.labelKey)}</dt>
              <dd>{format(row.value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>
          {t(
            stats
              ? 'ironGolem.refusal.invalidRolls'
              : next
                ? 'details.maxLevel'
                : 'details.currentEmpty'
          )}
        </p>
      )}
    </section>
  );
}

function RecordedAttempt({
  attempt,
  itemName
}: {
  readonly attempt: PresentedIronGolemAttempt;
  readonly itemName: (item: Item) => string;
}) {
  const { t } = useTranslation('skills');
  let outcome: string;
  switch (attempt.kind) {
    case 'none':
      outcome = t('ironGolem.noAttempt');
      break;
    case 'unverified':
      outcome = t('ironGolem.unverified');
      break;
    case 'pendingPublication':
      outcome =
        attempt.payment.kind === 'verified'
          ? t('ironGolem.pendingPaid', {
              item: itemName(attempt.payment.item),
              mana: format(attempt.payment.paidMp)
            })
          : t('ironGolem.pendingNoDebit');
      break;
    case 'summoned':
      outcome = t('ironGolem.summoned', {
        item: itemName(attempt.item),
        mana: format(attempt.paidMp)
      });
      break;
    case 'notPrepared':
      outcome = t('ironGolem.notPrepared');
      break;
    case 'replay':
      outcome = t('ironGolem.replay');
      break;
  }
  const pendingReplay =
    (attempt.kind === 'unverified' || attempt.kind === 'pendingPublication') && attempt.isReplay;
  return (
    <section className="space-y-2">
      <h3 className="d2-section-title font-serif text-lg text-d2-gold">{t('ironGolem.recorded')}</h3>
      <p>{outcome}</p>
      {pendingReplay ? <p>{t('ironGolem.replay')}</p> : null}
      {attempt.kind !== 'none' ? (
        <p>{t(attempt.replayLocked ? 'ironGolem.locked' : 'ironGolem.unlocked')}</p>
      ) : null}
    </section>
  );
}
