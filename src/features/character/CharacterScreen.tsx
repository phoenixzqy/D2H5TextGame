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
import { Panel, ScreenShell, StatBar, RarityText } from '@/ui';
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

  if (!player) {
    return (
      <ScreenShell testId="character-screen" title={t('character:screen.title', { defaultValue: '角色' })}>
        <p className="text-d2-white/60 italic p-4 text-center">
          {t('character:screen.noCharacter', { defaultValue: '尚未创建角色' })}
        </p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testId="character-screen" title={t('character:screen.title', { defaultValue: '角色' })}>
      <div className="max-w-3xl mx-auto space-y-3">
        <HeroStrip player={player} />
        <CoreAttributesPanel player={player} />
        <DerivedStatsPanel player={player} />
        <ResistancesPanel player={player} />
        <EquipmentSummaryPanel equipped={equipped} />
      </div>
    </ScreenShell>
  );
}

function HeroStrip({ player }: { player: Player }) {
  const { t } = useTranslation(['character', 'common']);
  const [errored, setErrored] = useState(false);
  const portrait = `/assets/d2/generated/class-portraits/classes.${player.class}.png`;
  const xpMax = Math.max(1, player.experienceToNextLevel);
  return (
    <Panel className="!p-3">
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded border border-d2-border bg-d2-bg/60 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          {!errored ? (
            <img
              src={portrait}
              alt=""
              className="w-full h-full object-cover"
              onError={() => { setErrored(true); }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="font-serif text-d2-gold text-2xl md:text-3xl select-none">
              {(player.class.charAt(0) || player.name.charAt(0) || '?').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-d2-gold text-lg md:text-xl truncate" data-testid="char-name">
            {player.name}
          </div>
          <div className="text-xs md:text-sm text-d2-white/70 mb-2">
            <span data-testid="char-class">
              {t(`character:classes.${player.class}`, { defaultValue: player.class })}
            </span>
            <span className="mx-2 text-d2-border">·</span>
            <span data-testid="char-level">
              {t('common:level', { defaultValue: 'Level' })} {player.level}
            </span>
          </div>
          <StatBar
            current={Math.min(player.experience, xpMax)}
            max={xpMax}
            color="xp"
            label={t('common:xp', { defaultValue: 'XP' })}
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
      title={t('common:stats.title', { defaultValue: '属性' })}
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
            {t('character:screen.statPoints', { defaultValue: '可用属性点' })}
            {': '}
            <span className="text-d2-gold font-bold" data-testid="char-stat-points">
              {player.statPoints}
            </span>
          </span>
          <span>
            {t('character:screen.skillPoints', { defaultValue: '可用技能点' })}
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
      title={t('character:screen.derived', { defaultValue: '派生属性' })}
      className="!p-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="char-derived-stats">
        <StatBar
          current={ds.life}
          max={Math.max(1, ds.lifeMax)}
          color="hp"
          label={t('common:life', { defaultValue: 'Life' })}
        />
        <StatBar
          current={ds.mana}
          max={Math.max(1, ds.manaMax)}
          color="mp"
          label={t('common:mana', { defaultValue: 'Mana' })}
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
      title={t('character:screen.resistances', { defaultValue: '抗性' })}
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
                {t(`damage-types:resist.${k}`, { defaultValue: k })}
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
}: {
  equipped: Record<string, Item | null>;
}) {
  const { t } = useTranslation(['character', 'inventory']);
  const entries = SLOT_ORDER.map((slot) => ({ slot, item: equipped[slot] ?? null }));
  const anyEquipped = entries.some((e) => e.item !== null);
  return (
    <Panel
      title={t('character:screen.equipment', { defaultValue: '装备' })}
      className="!p-3"
    >
      {!anyEquipped ? (
        <p className="text-sm text-d2-white/60 italic">
          {t('character:screen.noEquipment', { defaultValue: '尚未装备任何物品' })}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" data-testid="char-equipment">
          {entries.map(({ slot, item }) => (
            <li
              key={slot}
              className="flex items-center justify-between gap-2 border border-d2-border/60 rounded px-3 py-2 bg-d2-bg/40 min-h-[44px]"
            >
              <span className="text-xs text-d2-white/60 shrink-0">
                {t(`inventory:slots.${slot}`, { defaultValue: slot })}
              </span>
              {item ? (
                <RarityText rarity={item.rarity} className="font-serif truncate text-right">
                  {item.baseId}
                </RarityText>
              ) : (
                <span className="text-d2-white/40 italic">
                  {t('inventory:empty', { defaultValue: '空' })}
                </span>
              )}
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
