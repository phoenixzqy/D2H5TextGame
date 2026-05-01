/**
 * CharacterScreen — read-only character sheet.
 *
 * Layout (mobile, 360w, vertical scroll):
 *   [ Header strip: portrait · name · class · level · XP bar ]
 *   [ Panel: Core attributes (Str/Dex/Vit/Energy + points to spend) ]
 *   [ Panel: Derived stats (life/mana/atk/def/dodge/crit/AS) ]
 *   [ Panel: Resistances ]
 *   [ Panel: Equipped items ]
 *
 * Reads-only: pulls from `usePlayerStore` and `useInventoryStore`.
 * No allocation buttons here — that flow lives elsewhere.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EquippedItemModal, GameCard, Panel, ScreenShell, StatBar, RarityText, resolveClassPortrait, tItemName } from '@/ui';
import { useInventoryStore, usePlayerStore } from '@/stores';
import type { Player } from '@/engine/types/entities';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import type { DamageType } from '@/engine/types/attributes';

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
];

export function CharacterScreen() {
  const { t } = useTranslation(['character', 'common', 'inventory', 'damage-types']);
  const player = usePlayerStore((s) => s.player);
  const equipped = useInventoryStore((s) => s.equipped);
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

  return (
    <ScreenShell testId="character-screen" title={t('character:screen.title')}>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <div className="contents" data-testid="char-top-row">
          <div data-testid="hero-strip">
            <HeroStrip player={player} />
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

function HeroStrip({ player }: { player: Player }) {
  const { t } = useTranslation(['character', 'common']);
  const xpMax = Math.max(1, player.experienceToNextLevel);
  const ds = player.derivedStats;
  const cs = player.coreStats;
  const portrait = resolveClassPortrait(player.class);
  return (
    <Panel className="!p-3">
      <div className="flex items-start gap-3 flex-wrap">
        <GameCard
          variant="character"
          size="lg"
          name={player.name}
          subtitle={t(`character:classes.${player.class}`)}
          rarity="unique"
          image={portrait ?? undefined}
          stats={[
            { label: 'STR', value: cs.strength },
            { label: 'DEX', value: cs.dexterity },
            { label: 'VIT', value: cs.vitality },
            { label: 'ENG', value: cs.energy }
          ]}
          bars={[
            { kind: 'hp', current: ds.life, max: Math.max(1, ds.lifeMax) },
            { kind: 'mp', current: ds.mana, max: Math.max(1, ds.manaMax) }
          ]}
          testId="hero-card"
        />
        <div className="flex-1 min-w-[180px] space-y-2 mt-2">
          <div className="font-serif text-d2-gold text-lg md:text-xl truncate" data-testid="char-name">
            {player.name}
          </div>
          <div className="text-xs md:text-sm text-d2-white/70">
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

function CoreAttributesPanel({ player }: { player: Player }) {
  const { t } = useTranslation(['common', 'character']);
  const cs = player.coreStats;
  const rows: { key: string; label: string; value: number }[] = [
    { key: 'strength', label: t('common:stats.strength'), value: cs.strength },
    { key: 'dexterity', label: t('common:stats.dexterity'), value: cs.dexterity },
    { key: 'vitality', label: t('common:stats.vitality'), value: cs.vitality },
    { key: 'energy', label: t('common:stats.energy'), value: cs.energy },
  ];
  return (
    <Panel
      title={t('common:stats.title')}
      className="!p-3"
    >
      <div data-testid="char-core-stats">
        <ul className="grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40"
            >
              <span className="text-sm text-d2-white/80">{r.label}</span>
              <span className="text-sm font-serif text-d2-gold">{r.value}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-d2-white/70">
          <span>
            {t('character:screen.statPoints')}
            {': '}
            <span className="text-d2-gold font-bold" data-testid="char-stat-points">
              {player.statPoints}
            </span>
          </span>
          <span>
            {t('character:screen.skillPoints')}
            {': '}
            <span className="text-d2-gold font-bold" data-testid="char-skill-points">
              {player.skillPoints}
            </span>
          </span>
        </div>
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
        <KvRow label={t('common:stats.attackSpeed')} value={ds.attackSpeed} />
        <KvRow
          label={t('common:stats.critChance')}
          value={formatPercent(ds.critChance)}
        />
        <KvRow
          label={t('common:stats.critDamage')}
          value={`${String(Math.round(ds.critDamage))}%`}
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
              className="flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40"
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
                className="w-full flex items-center justify-between gap-2 border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40 min-h-[44px] text-left hover:border-d2-gold/60 focus:outline-none focus:ring-2 focus:ring-d2-gold transition-colors"
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
    <li className="flex items-center justify-between border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40">
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
