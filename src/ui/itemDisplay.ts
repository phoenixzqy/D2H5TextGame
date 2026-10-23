import type { TFunction } from 'i18next';
import { loadItemBases, loadSetPieces, loadSets, loadUniques } from '@/data/loaders/loot';
import { resolveStatPackage, type ResolvedStatValue } from '@/engine/items/statRolls';
import { socketBonusPackages } from '@/engine/items/socket-contents';
import { resolveItemRunewordGrants } from '@/engine/items/runeword-grants';
import type { Item, SetDef, SetPieceDef, UniqueItemDef } from '@/engine/types/items';
import { tDataKey, tItemBaseName } from './i18nKey';

export interface DisplayStatLine {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly text: string;
}

export interface DisplaySetBonus {
  readonly threshold: number;
  readonly active: boolean;
  readonly lines: readonly DisplayStatLine[];
}

export interface ItemDisplayModel {
  readonly name: string;
  readonly unique?: UniqueItemDef;
  readonly set?: SetDef;
  readonly setPiece?: SetPieceDef;
  readonly definitionStatLines: readonly DisplayStatLine[];
  readonly setBonuses: readonly DisplaySetBonus[];
  readonly flavor?: string;
}

const CORE_LABELS: Readonly<Record<string, string>> = {
  strength: 'detail.stat.strength',
  dexterity: 'detail.stat.dexterity',
  vitality: 'detail.stat.vitality',
  energy: 'detail.stat.energy'
};

const STAT_MOD_LABELS: Readonly<Record<string, string>> = {
  life: 'detail.stat.life',
  mana: 'detail.stat.mana',
  attack: 'detail.stat.attack',
  defense: 'detail.stat.defense',
  magicResist: 'detail.stat.magicResist',
  attackSpeed: 'detail.stat.attackSpeed',
  critChance: 'detail.stat.critChance',
  critDamage: 'detail.stat.critDamage',
  physDodge: 'detail.stat.physDodge',
  magicDodge: 'detail.stat.magicDodge',
  magicFind: 'detail.stat.magicFind',
  goldFind: 'detail.stat.goldFind'
};

const RES_LABELS: Readonly<Record<string, string>> = {
  fire: 'detail.stat.fireRes',
  cold: 'detail.stat.coldRes',
  lightning: 'detail.stat.lightningRes',
  poison: 'detail.stat.poisonRes',
  arcane: 'detail.stat.arcaneRes',
  physical: 'detail.stat.physicalRes',
  all: 'detail.stat.allRes'
};

const DAMAGE_LABELS: Readonly<Record<string, string>> = {
  min: 'detail.stat.minDamage',
  max: 'detail.stat.maxDamage',
  value: 'detail.stat.damage'
};

function labelKeyForPath(path: string): string {
  const [, group, key] = /^([^.]+)\.([^.]+)(?:\.(.+))?$/.exec(path) ?? [];
  if (group === 'coreStats' && key) return CORE_LABELS[key] ?? path;
  if (group === 'statMods' && key) return STAT_MOD_LABELS[key] ?? path;
  if (group === 'resistances' && key) return RES_LABELS[key] ?? path;
  if (group === 'damageBonus' && key === 'breakdown') return DAMAGE_LABELS.value ?? path;
  if (group === 'damageBonus' && key) return DAMAGE_LABELS[key] ?? path;
  return path;
}

export function formatDisplayStat(stat: ResolvedStatValue, t: TFunction): DisplayStatLine {
  const label = t(`inventory:${labelKeyForPath(stat.path)}`);
  const value = stat.value;
  const isRatio = ['statMods.critChance', 'statMods.critDamage', 'statMods.physDodge', 'statMods.magicDodge'].includes(stat.path);
  const displayValue = isRatio ? `${String(Number((value * 100).toFixed(4)))}%` : String(value);
  return {
    key: stat.path,
    label,
    value,
    text: t('inventory:detail.statLine', { label, value: value > 0 ? `+${displayValue}` : displayValue })
  };
}

/** Display exactly the same plain insert and completed-word packages used by equipment resolution. */
export function resolveSocketDisplayLines(item: Item, t: TFunction): readonly DisplayStatLine[] {
  const base = loadItemBases().get(item.baseId);
  if (!base || !item.socketContents?.length) return [];
  const lines = socketBonusPackages(item, base).flatMap(stats => resolveStatPackage(stats, item.statRolls))
    .map(stat => formatDisplayStat(stat, t));
  for (const grant of resolveItemRunewordGrants(item)) {
    lines.push({ key: `grant.${grant.id}`, value: grant.defensePct,
      label: t('inventory:detail.stat.defense'),
      text: t('inventory:detail.grantedDefense', { percent: Number((grant.defensePct * 100).toFixed(4)) }) });
  }
  return lines;
}

export function resolveItemDisplay(
  item: Pick<Item, 'baseId' | 'uniqueId' | 'setId' | 'setPieceId' | 'statRolls' | 'generatedName' | 'rarity'>,
  t: TFunction,
  equippedItems: readonly Item[] = []
): ItemDisplayModel {
  const uniques = loadUniques();
  const setPieces = loadSetPieces();
  const sets = loadSets();
  const unique = item.uniqueId ? uniques.find((entry) => entry.id === item.uniqueId) : undefined;
  const setPiece = item.setPieceId ? setPieces.find((entry) => entry.id === item.setPieceId) : undefined;
  const set = (setPiece?.setId ?? item.setId)
    ? sets.find((entry) => entry.id === (setPiece?.setId ?? item.setId))
    : undefined;

  const baseName = tItemBaseName(t, item);
  const prefix = item.generatedName?.prefix?.trim();
  const suffix = item.generatedName?.suffix?.trim();
  const generatedName = [prefix, baseName, suffix].filter(Boolean).join(' ');
  const name = unique
    ? tDataKey(t, unique.name)
    : setPiece
      ? tDataKey(t, setPiece.name)
      : generatedName;
  const stats = unique?.stats ?? setPiece?.stats;
  const definitionStatLines = resolveStatPackage(stats, item.statRolls).map((stat) => formatDisplayStat(stat, t));
  const setPieceIds = new Set(
    equippedItems
      .filter((entry) => (set?.id ? entry.setId === set.id || setPieces.find((piece) => piece.id === entry.setPieceId)?.setId === set.id : false))
      .map((entry) => entry.setPieceId)
      .filter((id): id is string => typeof id === 'string')
  );
  if (item.setPieceId) setPieceIds.add(item.setPieceId);
  const pieceCount = setPieceIds.size;
  const setBonuses = set
    ? Object.entries(set.bonuses)
        .map(([threshold, bonus]) => ({
          threshold: Number(threshold),
          active: Number(threshold) <= pieceCount,
          lines: resolveStatPackage(bonus).map((stat) => formatDisplayStat(stat, t))
        }))
        .sort((a, b) => a.threshold - b.threshold)
    : [];
  const flavor = unique?.flavor ?? setPiece?.flavor;

  return {
    name,
    ...(unique ? { unique } : {}),
    ...(set ? { set } : {}),
    ...(setPiece ? { setPiece } : {}),
    definitionStatLines,
    setBonuses,
    ...(flavor ? { flavor: tDataKey(t, flavor) } : {})
  };
}
