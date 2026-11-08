/** Character sheet with paged sections and persistent, cancellable attribute drafts. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EquippedItemModal,
  Modal,
  Tabs,
  Panel,
  ScreenShell,
  StatBar,
  RarityText,
  GameImage,
  resolveClassPortrait,
  tItemName
} from '@/ui';
import { PagedList } from '@/ui/PagedList';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import type { Player } from '@/engine/types/entities';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import type { CoreStats, DamageType } from '@/engine/types/attributes';
import { CORE_STAT_HARD_CAP } from '@/engine/progression/stats';
import { applyStatDraft, type ApplyStatDraftResult } from './applyStatDraft';
import {
  composeEquippedPlayerStats,
  type PlayerVitalityComposition
} from '@/engine/progression/equipped-stats';

const RESIST_KEYS: readonly Exclude<DamageType, 'thorns'>[] = [
  'fire',
  'cold',
  'lightning',
  'poison',
  'arcane',
  'physical'
];

const SLOT_ORDER: readonly EquipmentSlot[] = [
  'head',
  'amulet',
  'chest',
  'gloves',
  'belt',
  'boots',
  'ring-left',
  'ring-right',
  'weapon',
  'offhand',
  'charm'
];

export function CharacterScreen() {
  const { t } = useTranslation(['character', 'common', 'inventory', 'damage-types']);
  const player = usePlayerStore((s) => s.player);
  const equipped = useInventoryStore((s) => s.equipped);
  const questItems = useInventoryStore((s) => s.questItems);
  const questProgress = useMapStore((s) => s.questProgress);
  const questReceipts = useMapStore((s) => s.questReceipts);
  const [viewSlot, setViewSlot] = useState<EquipmentSlot | null>(null);

  if (!player) {
    return (
      <ScreenShell testId="character-screen" title={t('character:screen.title')}>
        <p className="text-d2-white/60 italic p-4 text-center">
          {t('character:screen.noCharacter')}
        </p>
      </ScreenShell>
    );
  }

  const vitality = composeEquippedPlayerStats(
    player,
    player.level,
    equipped,
    questProgress,
    questItems,
    questReceipts
  ).vitality;
  return (
    <ScreenShell testId="character-screen" title={t('character:screen.title')}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-2">
        <div className="shrink-0" data-testid="hero-strip">
                  <HeroStrip player={player} vitality={vitality} />
                </div>
              <Tabs
          keepMounted
          tabs={[
            {
              id: 'attributes',
              label: t('common:stats.title'),
              content: <CoreAttributesPanel player={player} />
            },
            {
              id: 'derived',
              label: t('character:screen.derived'),
              content: <DerivedStatsPanel player={player} />
            },
            {
              id: 'resistances',
              label: t('character:screen.resistances'),
              content: <ResistancesPanel player={player} />
            },
            {
              id: 'equipment',
              label: t('character:screen.equipment'),
              content: <EquipmentSummaryPanel equipped={equipped} onSlotClick={setViewSlot} />
            }
          ]}
        />
      </div>
      <EquippedItemModal
        slot={viewSlot}
        item={viewSlot ? (equipped[viewSlot] ?? null) : null}
        onClose={() => {
          setViewSlot(null);
        }}
      />
    </ScreenShell>
  );
}

function HeroStrip({ player, vitality }: { player: Player; vitality: PlayerVitalityComposition }) {
  const { t } = useTranslation(['character', 'common']);
  const xpMax = Math.max(1, player.experienceToNextLevel);
  const ds = player.derivedStats;
  const portrait = resolveClassPortrait(player.class);
  return (
    <Panel className="!p-2 flex">
      <div className="grid min-w-0 flex-1 grid-cols-[48px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[64px_minmax(0,1fr)_minmax(120px,180px)]"
        data-testid="hero-card"
      >
        {portrait && (
          <div className="h-16 w-12 sm:h-20 sm:w-16 row-span-2 sm:row-span-1">
            <GameImage
              src={portrait}
              alt=""
              fallbackIcon={player.class.slice(0, 1).toUpperCase()}
              size="fill"
              imageClassName="h-full w-full object-contain"
              className="rounded"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-serif text-d2-gold truncate" data-testid="char-name">
            {player.name}
          </div>
          <div className="flex flex-wrap gap-x-2 text-xs text-d2-white/80">
            <span data-testid="char-class">{t(`character:classes.${player.class}`)}</span>
            <span data-testid="char-level">
              {t('common:level')} {player.level}
            </span>
          </div>
          <StatBar
            current={Math.min(player.experience, xpMax)}
            max={xpMax}
            color="xp"
            label={t('common:xp')}
          />
        </div>
        <div className="col-start-2 min-w-0 sm:col-start-auto">
          <StatBar
            current={ds.life}
            max={Math.max(1, ds.lifeMax)}
            color="hp"
            label={t('common:life')}
          />
          <StatBar
            current={ds.mana}
            max={Math.max(1, ds.manaMax)}
            color="mp"
            label={t('common:mana')}
          />
          <span className="sr-only">{vitality.sheet}</span>
        </div>
      </div>
    </Panel>
  );
}

const EMPTY_STAT_DRAFT: CoreStats = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
const ATTRIBUTE_KEYS = ['strength', 'dexterity', 'vitality', 'energy'] as const;
type DraftFeedback = ApplyStatDraftResult | 'cancelled' | 'discarded';

function CoreAttributesPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['common', 'character']);
  const equipped = useInventoryStore((s) => s.equipped);
  const questItems = useInventoryStore((s) => s.questItems);
  const questProgress = useMapStore((s) => s.questProgress);
  const questReceipts = useMapStore((s) => s.questReceipts);
  const [draft, setDraft] = useState<{ basis: Player; deltas: CoreStats } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState<DraftFeedback | null>(null);
  const stale = draft !== null && draft.basis !== player;
  // Render fencing precedes effect cleanup: interrupted edits are never rebased.
  const deltas = !stale && draft ? draft.deltas : EMPTY_STAT_DRAFT;
  const total = ATTRIBUTE_KEYS.reduce((sum, stat) => sum + deltas[stat], 0);
  const remaining = Math.max(0, Math.floor(player.statPoints)) - total;
  const message = stale ? 'discarded' : feedback;
  const current = composeEquippedPlayerStats(
    player,
    player.level,
    equipped,
    questProgress,
    questItems,
    questReceipts
  );
  const preview = composeEquippedPlayerStats(
    {
      ...player,
      coreStats: {
        strength: player.coreStats.strength + deltas.strength,
        dexterity: player.coreStats.dexterity + deltas.dexterity,
        vitality: player.coreStats.vitality + deltas.vitality,
        energy: player.coreStats.energy + deltas.energy
      }
    },
    player.level,
    equipped,
    questProgress,
    questItems,
    questReceipts
  );
  useEffect(() => {
    if (stale) {
      setDraft(null);
      setFeedback('discarded');
    }
  }, [stale]);

  const edit = (stat: keyof CoreStats, amount: 1 | -1) => {
    setDraft((current) => {
      const pending = current?.basis === player ? current.deltas : EMPTY_STAT_DRAFT;
      const available =
        Math.max(0, Math.floor(player.statPoints)) -
        ATTRIBUTE_KEYS.reduce((sum, key) => sum + pending[key], 0);
      if (amount < 0 && pending[stat] === 0) return current;
      if (
        amount > 0 &&
        (available < 1 || player.coreStats[stat] + pending[stat] + 1 > CORE_STAT_HARD_CAP)
      )
        return current;
      const next = { ...pending, [stat]: pending[stat] + amount };
      return ATTRIBUTE_KEYS.every((key) => next[key] === 0)
        ? null
        : { basis: player, deltas: next };
    });
    setFeedback(null);
  };
  const commit = () => {
    if (!draft || stale) return;
    const result = applyStatDraft(draft.deltas, draft.basis);
    setFeedback(result);
    if (result === 'ok') setDraft(null);
  };
  const buttonClass =
    'min-h-[44px] min-w-[44px] rounded border border-d2-border bg-d2-bg/60 text-d2-gold focus:outline-none focus:ring-2 focus:ring-d2-gold hover:border-d2-gold disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <Panel className="!p-2 flex min-h-0 flex-1 flex-col" data-testid="core-attributes-panel">
      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-sm text-d2-white/80">
        <span>
          {t('character:screen.statPoints')}{': '}
          <span className="font-bold text-d2-gold" data-testid="char-stat-points">{player.statPoints}</span>
        </span>
        <span>
          {t('character:screen.skillPoints')}{': '}
          <span className="font-bold text-d2-gold" data-testid="char-skill-points">{player.skillPoints}</span>
        </span>
        <span>
          {t('character:draft.remaining')}{': '}
          <span className="font-bold text-d2-gold" data-testid="char-draft-remaining">{remaining}</span>
        </span>
      </div>
      <div
        data-testid="char-core-stats"
        className="flex min-h-0 flex-1 flex-col gap-2 sm:grid sm:grid-cols-2"
      >
        <PagedList
          items={ATTRIBUTE_KEYS}
          pageSize={4}
          renderItem={(stat) => (
            <li
              key={stat}
              className="d2-plaque flex items-center gap-2 rounded border border-d2-border/60 px-3 py-2 bg-d2-bg/40"
            >
              <div className="min-w-0 flex-1">
                <span className="block text-sm text-d2-white/80">{t(`common:stats.${stat}`)}</span>
                <span
                  className="text-sm font-serif text-d2-gold"
                  data-testid={`char-draft-${stat}`}
                >
                  {player.coreStats[stat]}
                  {deltas[stat] > 0 && ` → ${String(player.coreStats[stat] + deltas[stat])}`}
                </span>
              </div>
              <button
                type="button"
                className={'d2-control ' + buttonClass}
                disabled={deltas[stat] === 0}
                aria-label={t('character:draft.decrease', { attribute: t(`common:stats.${stat}`) })}
                onClick={() => {
                  edit(stat, -1);
                }}
              >
                −
              </button>
              <button
                type="button"
                className={'d2-control ' + buttonClass}
                disabled={
                  remaining < 1 || player.coreStats[stat] + deltas[stat] + 1 > CORE_STAT_HARD_CAP
                }
                aria-label={t('character:draft.increase', { attribute: t(`common:stats.${stat}`) })}
                onClick={() => {
                  edit(stat, 1);
                }}
              >
                +
              </button>
            </li>
          )}
        />
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            className="d2-control shrink-0 min-h-11 text-sm text-d2-gold"
            onClick={() => {
              setDetailsOpen(true);
            }}
          >
            {t('common:viewport.details')}
          </button>
          <Modal
            isOpen={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
            }}
            title={t('common:stats.vitality')}
          >
            <p className="mb-2 text-sm">{t('character:draft.instructions')}</p>
            <div
              className="space-y-1 break-words text-sm text-d2-white/90"
              data-testid="char-vitality-composition"
            >
              <p>{t('character:vitality.effective', { ...current.vitality })}</p>
              <p>{t('character:vitality.breakdown', { ...current.vitality })}</p>
              <p>{t('character:vitality.allocation')}</p>
              {total > 0 && (
                <p className="text-d2-gold" data-testid="char-vitality-preview">
                  {t('character:vitality.preview', {
                    sheet: preview.vitality.sheet,
                    lifeMax: preview.derivedStats.lifeMax
                  })}
                </p>
              )}
            </div>
          </Modal>
          <div className="shrink-0 flex gap-2">
            <button
              type="button"
              className={`d2-control ${buttonClass} flex-1 px-3 text-sm`}
              disabled={total === 0}
              onClick={commit}
            >
              {t('character:draft.apply')}
            </button>
            <button
              type="button"
              className={`d2-control ${buttonClass} flex-1 px-3 text-sm`}
              disabled={total === 0}
              onClick={() => {
                setDraft(null);
                setFeedback('cancelled');
              }}
            >
              {t('character:draft.cancel')}
            </button>
          </div>
          <p role="status" className="shrink-0 text-sm text-d2-white/80">
            {message ? t(`character:draft.results.${message}`) : ''}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function DerivedStatsPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['common', 'character']);
  const ds = player.derivedStats;
  return (
    <Panel className="!p-2 flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="char-derived-stats">
        <StatBar
          current={ds.life}
          max={Math.max(1, ds.lifeMax)}
          color="hp"
          label={t('common:life')}
        />
        <StatBar
          current={ds.mana}
          max={Math.max(1, ds.manaMax)}
          color="mp"
          label={t('common:mana')}
        />
      </div>
      <PagedList
        items={[
          <KvRow key="14202" label={t('common:stats.attackRating')} value={ds.attack} />,
          <KvRow key="14280" label={t('common:stats.defense')} value={ds.defense} />,
          <KvRow key="14354" label={t('character:derived.magicResist')} value={ds.magicResist} />,
          <KvRow key="14441" label={t('common:stats.attackSpeed')} value={ds.attackSpeed} />,
          <KvRow
            key="14523"
            label={t('common:stats.critChance')}
            value={formatPercent(ds.critChance)}
          />,
          <KvRow
            key="14618"
            label={t('common:stats.critDamage')}
            value={`${String(Math.round(ds.critDamage * 100))}%`}
          />,
          <KvRow
            key="14764"
            label={t('common:stats.physicalDodge')}
            value={formatPercent(ds.physDodge)}
          />,
          <KvRow
            key="14861"
            label={t('common:stats.magicalDodge')}
            value={formatPercent(ds.magicDodge)}
          />,
          <KvRow
            key="14958"
            label={t('common:stats.magicFind')}
            value={`${String(Math.round(ds.magicFind))}%`}
          />,
          <KvRow
            key="15096"
            label={t('common:stats.goldFind')}
            value={`${String(Math.round(ds.goldFind))}%`}
          />
        ]}
        renderItem={(row, index) => <li key={index}>{row}</li>}
      />
    </Panel>
  );
}

function ResistancesPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['damage-types', 'character']);
  const res = player.derivedStats.resistances;
  return (
    <Panel className="!p-2 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1" data-testid="char-resistances">
        <PagedList
          items={RESIST_KEYS}
          renderItem={(k) => {
            const v = res[k];
            return (
              <li
                key={k}
                className="d2-plaque flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40"
              >
                <span className="text-d2-white/80">{t(`damage-types:resist.${k}`)}</span>
                <span className={resistClass(v)}>{String(v)}%</span>
              </li>
            );
          }}
        />
      </div>
    </Panel>
  );
}

function EquipmentSummaryPanel({
  equipped,
  onSlotClick
}: {
  equipped: Record<string, Item | null>;
  onSlotClick: (slot: EquipmentSlot) => void;
}) {
  const { t } = useTranslation(['character', 'inventory']);
  const entries = SLOT_ORDER.map((slot) => ({ slot, item: equipped[slot] ?? null }));
  const anyEquipped = entries.some((e) => e.item !== null);
  return (
    <Panel className="!p-2 flex min-h-0 flex-1 flex-col">
      {!anyEquipped ? (
        <p className="text-sm text-d2-white/60 italic">{t('character:screen.noEquipment')}</p>
      ) : (
        <div className="flex min-h-0 flex-1" data-testid="char-equipment">
          <PagedList
            items={entries}
            renderItem={({ slot, item }) => (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => {
                    onSlotClick(slot);
                  }}
                  data-testid={`char-equip-slot-${slot}`}
                  aria-label={t(`inventory:slots.${slot}`)}
                  className="d2-slot w-full flex items-center justify-between gap-2 border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40 min-h-[44px] text-left hover:border-d2-gold/60 focus:outline-none focus:ring-2 focus:ring-d2-gold transition-colors"
                >
                  <span className="text-xs text-d2-white/60 shrink-0">
                    {t(`inventory:slots.${slot}`)}
                  </span>
                  {item ? (
                    <RarityText rarity={item.rarity} className="font-serif truncate text-right">
                      {tItemName(t, item)}
                    </RarityText>
                  ) : (
                    <span className="text-d2-white/40 italic">{t('inventory:empty')}</span>
                  )}
                </button>
              </li>
            )}
          />
        </div>
      )}
    </Panel>
  );
}

function KvRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="d2-plaque flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40">
      <span className="text-d2-white/80">{label}</span>
      <span className="font-serif text-d2-gold">
        {typeof value === 'number' ? Math.round(value) : value}
      </span>
    </div>
  );
}

function formatPercent(v: number): string {
  // Engine convention: dodge/crit chance are 0..1 floats.
  // If a value already looks like an integer percentage (>1), pass through.
  const pct = v <= 1 ? v * 100 : v;
  return `${String(Math.round(pct))}%`;
}

function resistClass(v: number): string {
  if (v < 0) return 'text-red-400';
  if (v >= 75) return 'text-d2-set';
  if (v >= 1) return 'text-d2-magic';
  return 'text-d2-white/70';
}
