/**
 * CharacterScreen — character sheet with cancellable attribute allocation.
 *
 * Layout (mobile, 360w, vertical scroll):
 *   [ Header strip: portrait · name · class · level · XP bar ]
 *   [ Panel: Core attributes (Str/Dex/Vit/Energy + points to spend) ]
 *   [ Panel: Derived stats (life/mana/atk/def/dodge/crit/AS) ]
 *   [ Panel: Resistances ]
 *   [ Panel: Equipped items ]
 *
 * Attribute previews stay local until the shared Apply controller commits them.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EquippedItemModal, GameCard, Panel, ScreenShell, StatBar, RarityText, resolveClassPortrait, tItemName } from '@/ui';
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import type { Player } from '@/engine/types/entities';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import type { CoreStats, DamageType } from '@/engine/types/attributes';
import { CORE_STAT_HARD_CAP } from '@/engine/progression/stats';
import { applyStatDraft, type ApplyStatDraftResult } from './applyStatDraft';
import { composeEquippedPlayerStats, type PlayerVitalityComposition } from '@/engine/progression/equipped-stats';

const RESIST_KEYS: readonly Exclude<DamageType, 'thorns'>[] = [
  'fire',
  'cold',
  'lightning',
  'poison',
  'arcane',
  'physical',
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
  'charm',
];

export function CharacterScreen() {
  const { t } = useTranslation(['character', 'common', 'inventory', 'damage-types']);
  const player = usePlayerStore((s) => s.player);
  const equipped = useInventoryStore((s) => s.equipped);
  const questItems = useInventoryStore(s => s.questItems);
  const questProgress = useMapStore(s => s.questProgress);
  const questReceipts = useMapStore(s => s.questReceipts);
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

  const vitality = composeEquippedPlayerStats(player, player.level, equipped, questProgress, questItems, questReceipts).vitality;
  return (
    <ScreenShell testId="character-screen" title={t('character:screen.title')}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <div className="contents" data-testid="char-top-row">
          <div data-testid="hero-strip">
            <HeroStrip player={player} vitality={vitality} />
          </div>
          <DerivedStatsPanel player={player} />
        </div>
        <div className="contents">
          <div data-testid="core-attributes-panel">
            <CoreAttributesPanel player={player} />
          </div>
          <ResistancesPanel player={player} />
        </div>
        <EquipmentSummaryPanel
          equipped={equipped}
          onSlotClick={(slot) => { setViewSlot(slot); }}
        />
      </div>
      <EquippedItemModal
        slot={viewSlot}
        item={viewSlot ? (equipped[viewSlot] ?? null) : null}
        derivedStats={player.derivedStats}
        onClose={() => { setViewSlot(null); }}
      />
    </ScreenShell>
  );
}

function HeroStrip({ player, vitality }: { player: Player; vitality: PlayerVitalityComposition }) {
  const { t } = useTranslation(['character', 'common']);
  const xpMax = Math.max(1, player.experienceToNextLevel);
  const ds = player.derivedStats;
  const cs = player.coreStats;
  const portrait = resolveClassPortrait(player.class);
  return (
    <Panel className="!p-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="h-[26rem] w-full max-w-64 shrink-0">
          <GameCard
            variant="character"
            size="lg"
            fluid
            className="min-w-0 [&>.border-b]:shrink-0 [&>.border-t]:shrink-0
                       [&_.truncate]:whitespace-normal [&_.truncate]:break-words
                       [&>.border-b_.uppercase]:text-sm [&>.border-b_.uppercase]:text-d2-white/80
                       [&>.border-b_.uppercase]:normal-case [&>.border-b_.uppercase]:tracking-normal
                       [&>.border-t>.grid]:grid-cols-1
                       [&>.border-t>.grid>div]:flex-row [&>.border-t>.grid>div]:justify-between
                       [&>.border-t>.grid>div]:gap-2
                       [&_.text-micro]:text-sm [&_.text-micro]:text-d2-white/80
                       [&_.text-micro]:normal-case [&_.text-micro]:tracking-normal
                       [&_.text-micro]:leading-5"
            name={player.name}
            subtitle={t(`character:classes.${player.class}`)}
            rarity="unique"
            image={portrait ?? undefined}
            stats={[
              { label: t('common:stats.strength'), value: cs.strength },
              { label: t('common:stats.dexterity'), value: cs.dexterity },
              { label: t('common:stats.vitality'), value: vitality.sheet },
              { label: t('common:stats.energy'), value: cs.energy }
            ]}
            bars={[
              { kind: 'hp', current: ds.life, max: Math.max(1, ds.lifeMax) },
              { kind: 'mp', current: ds.mana, max: Math.max(1, ds.manaMax) }
            ]}
            testId="hero-card"
          />
        </div>
        <div className="flex-1 min-w-[180px] space-y-2 mt-2">
          <div className="font-serif text-d2-gold text-lg md:text-xl truncate" data-testid="char-name">
            {player.name}
          </div>
          <div className="text-sm text-d2-white/80">
            <span data-testid="char-class">
              {t(`character:classes.${player.class}`)}
            </span>
            <span className="mx-2 text-d2-border">·</span>
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
      </div>
    </Panel>
  );
}

const EMPTY_STAT_DRAFT: CoreStats = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
const ATTRIBUTE_KEYS = ['strength', 'dexterity', 'vitality', 'energy'] as const;
type DraftFeedback = ApplyStatDraftResult | 'cancelled' | 'discarded';

function CoreAttributesPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['common', 'character']);
  const equipped = useInventoryStore(s => s.equipped);
  const questItems = useInventoryStore(s => s.questItems);
  const questProgress = useMapStore(s => s.questProgress);
  const questReceipts = useMapStore(s => s.questReceipts);
  const [draft, setDraft] = useState<{ basis: Player; deltas: CoreStats } | null>(null);
  const [feedback, setFeedback] = useState<DraftFeedback | null>(null);
  const stale = draft !== null && draft.basis !== player;
  // Render fencing precedes effect cleanup: interrupted edits are never rebased.
  const deltas = !stale && draft ? draft.deltas : EMPTY_STAT_DRAFT;
  const total = ATTRIBUTE_KEYS.reduce((sum, stat) => sum + deltas[stat], 0);
  const remaining = Math.max(0, Math.floor(player.statPoints)) - total;
  const message = stale ? 'discarded' : feedback;
  const current = composeEquippedPlayerStats(player, player.level, equipped, questProgress, questItems, questReceipts);
  const preview = composeEquippedPlayerStats({ ...player, coreStats: {
    strength: player.coreStats.strength + deltas.strength,
    dexterity: player.coreStats.dexterity + deltas.dexterity,
    vitality: player.coreStats.vitality + deltas.vitality,
    energy: player.coreStats.energy + deltas.energy
  } }, player.level, equipped, questProgress, questItems, questReceipts);
  useEffect(() => {
    if (stale) { setDraft(null); setFeedback('discarded'); }
  }, [stale]);

  const edit = (stat: keyof CoreStats, amount: 1 | -1) => {
    setDraft(current => {
      const pending = current?.basis === player ? current.deltas : EMPTY_STAT_DRAFT;
      const available = Math.max(0, Math.floor(player.statPoints))
        - ATTRIBUTE_KEYS.reduce((sum, key) => sum + pending[key], 0);
      if (amount < 0 && pending[stat] === 0) return current;
      if (amount > 0 && (available < 1
        || player.coreStats[stat] + pending[stat] + 1 > CORE_STAT_HARD_CAP)) return current;
      const next = { ...pending, [stat]: pending[stat] + amount };
      return ATTRIBUTE_KEYS.every(key => next[key] === 0) ? null : { basis: player, deltas: next };
    });
    setFeedback(null);
  };
  const commit = () => {
    if (!draft || stale) return;
    const result = applyStatDraft(draft.deltas, draft.basis);
    setFeedback(result);
    if (result === 'ok') setDraft(null);
  };
  const buttonClass = 'min-h-[44px] min-w-[44px] rounded border border-d2-border bg-d2-bg/60 text-d2-gold focus:outline-none focus:ring-2 focus:ring-d2-gold hover:border-d2-gold disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <Panel title={t('common:stats.title')} className="!p-3">
      <div data-testid="char-core-stats">
        <p className="mb-3 text-sm text-d2-white/80">{t('character:draft.instructions')}</p>
        <ul className="grid grid-cols-1 gap-2">
          {ATTRIBUTE_KEYS.map(stat => (
            <li key={stat} className="d2-plaque flex items-center gap-2 rounded border border-d2-border/60 px-3 py-2 bg-d2-bg/40">
              <div className="min-w-0 flex-1">
                <span className="block text-sm text-d2-white/80">{t(`common:stats.${stat}`)}</span>
                <span className="text-sm font-serif text-d2-gold" data-testid={`char-draft-${stat}`}>
                  {player.coreStats[stat]}{deltas[stat] > 0 && ` → ${String(player.coreStats[stat] + deltas[stat])}`}
                </span>
              </div>
              <button type="button" className={'d2-control ' + (buttonClass)} disabled={deltas[stat] === 0}
                aria-label={t('character:draft.decrease', { attribute: t(`common:stats.${stat}`) })}
                onClick={() => { edit(stat, -1); }}>−</button>
              <button type="button" className={'d2-control ' + (buttonClass)}
                disabled={remaining < 1 || player.coreStats[stat] + deltas[stat] + 1 > CORE_STAT_HARD_CAP}
                aria-label={t('character:draft.increase', { attribute: t(`common:stats.${stat}`) })}
                onClick={() => { edit(stat, 1); }}>+</button>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 break-words text-sm text-d2-white/90" data-testid="char-vitality-composition">
          <p>{t('character:vitality.effective', { ...current.vitality })}</p>
          <p>{t('character:vitality.breakdown', { ...current.vitality })}</p>
          <p>{t('character:vitality.allocation')}</p>
          {total > 0 && <p className="text-d2-gold" data-testid="char-vitality-preview">{t('character:vitality.preview', {
            sheet: preview.vitality.sheet, lifeMax: preview.derivedStats.lifeMax
          })}</p>}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-d2-white/80">
          <span>{t('character:screen.statPoints')}{': '}
            <span className="text-d2-gold font-bold" data-testid="char-stat-points">{player.statPoints}</span>
          </span>
          <span>{t('character:screen.skillPoints')}{': '}
            <span className="text-d2-gold font-bold" data-testid="char-skill-points">{player.skillPoints}</span>
          </span>
        </div>
        <p className="mt-3 text-sm text-d2-white/80">{t('character:draft.remaining')}{': '}
          <span className="font-bold text-d2-gold" data-testid="char-draft-remaining">{remaining}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`d2-control ${buttonClass} flex-1 px-3 text-sm`} disabled={total === 0}
            onClick={commit}>{t('character:draft.apply')}</button>
          <button type="button" className={`d2-control ${buttonClass} flex-1 px-3 text-sm`} disabled={total === 0}
            onClick={() => { setDraft(null); setFeedback('cancelled'); }}>{t('character:draft.cancel')}</button>
        </div>
        <p role="status" className="mt-2 min-h-5 text-sm text-d2-white/80">
          {message ? t(`character:draft.results.${message}`) : ''}
        </p>
      </div>
    </Panel>
  );
}

function DerivedStatsPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['common', 'character']);
  const ds = player.derivedStats;
  return (
    <Panel
      title={t('character:screen.derived')}
      className="!p-3"
    >
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
      <ul className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <KvRow label={t('common:stats.attackRating')} value={ds.attack} />
        <KvRow label={t('common:stats.defense')} value={ds.defense} />
        <KvRow label={t('character:derived.magicResist')} value={ds.magicResist} />
        <KvRow label={t('common:stats.attackSpeed')} value={ds.attackSpeed} />
        <KvRow
          label={t('common:stats.critChance')}
          value={formatPercent(ds.critChance)}
        />
        <KvRow
          label={t('common:stats.critDamage')}
          value={`${String(Math.round(ds.critDamage * 100))}%`}
        />
        <KvRow
          label={t('common:stats.physicalDodge')}
          value={formatPercent(ds.physDodge)}
        />
        <KvRow
          label={t('common:stats.magicalDodge')}
          value={formatPercent(ds.magicDodge)}
        />
        <KvRow
          label={t('common:stats.magicFind')}
          value={`${String(Math.round(ds.magicFind))}%`}
        />
        <KvRow
          label={t('common:stats.goldFind')}
          value={`${String(Math.round(ds.goldFind))}%`}
        />
      </ul>
    </Panel>
  );
}

function ResistancesPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['damage-types', 'character']);
  const res = player.derivedStats.resistances;
  return (
    <Panel
      title={t('character:screen.resistances')}
      className="!p-3"
    >
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm" data-testid="char-resistances">
        {RESIST_KEYS.map((k) => {
          const v = res[k];
          return (
            <li
              key={k}
              className="d2-plaque flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40"
            >
              <span className="text-d2-white/80">
                {t(`damage-types:resist.${k}`)}
              </span>
              <span className={resistClass(v)}>{String(v)}%</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function EquipmentSummaryPanel({
  equipped,
  onSlotClick,
}: {
  equipped: Record<string, Item | null>;
  onSlotClick: (slot: EquipmentSlot) => void;
}) {
  const { t } = useTranslation(['character', 'inventory']);
  const entries = SLOT_ORDER.map((slot) => ({ slot, item: equipped[slot] ?? null }));
  const anyEquipped = entries.some((e) => e.item !== null);
  return (
    <Panel
      title={t('character:screen.equipment')}
      className="!p-3"
    >
      {!anyEquipped ? (
        <p className="text-sm text-d2-white/60 italic">
          {t('character:screen.noEquipment')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" data-testid="char-equipment">
          {entries.map(({ slot, item }) => (
            <li key={slot}>
              <button
                type="button"
                onClick={() => { onSlotClick(slot); }}
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
                  <span className="text-d2-white/40 italic">
                    {t('inventory:empty')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function KvRow({ label, value }: { label: string; value: number | string }) {
  return (
    <li className="d2-plaque flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40">
      <span className="text-d2-white/80">{label}</span>
      <span className="font-serif text-d2-gold">{typeof value === 'number' ? Math.round(value) : value}</span>
    </li>
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
