/** Shared mercenary bare level growth; equipment stays outside the saved baseline. */
import type { Mercenary } from '../types/entities';
import { loadMercPool } from '../../data/loaders/mercs';
import { deriveStats } from './stats';

/** Per-level gain block applied on each merc level-up. */
export interface PerLevelGain {
  readonly life: number;
  readonly strength: number;
  readonly dexterity: number;
  readonly energy: number;
}

/**
 * Per-class per-level stat gains, keyed by `Mercenary.classId` (which mirrors
 * `MercDef.classRef`). Values picked to give each class a distinct identity:
 *  - rogue / thief   → dex-heavy archers / skirmishers
 *  - desert-merc     → str + life polearm tank
 *  - iron-wolf       → caster (low life, high energy)
 *  - barbarian       → highest life pool, str-heavy
 *  - paladin         → balanced front-line
 *  - militia         → unremarkable generalist
 *  - acolyte         → caster healer (energy-focused)
 *
 * Class IDs not present in this table fall through to {@link DEFAULT_PER_LEVEL_GAIN}.
 */
const PER_LEVEL_GAIN_BY_CLASS: Readonly<Record<string, PerLevelGain>> = Object.freeze({
  'rogue':        { life: 8,  strength: 1, dexterity: 3, energy: 1 },
  'desert-merc':  { life: 14, strength: 3, dexterity: 1, energy: 1 },
  'iron-wolf':    { life: 6,  strength: 1, dexterity: 1, energy: 4 },
  'barbarian':    { life: 16, strength: 3, dexterity: 2, energy: 0 },
  'paladin':      { life: 12, strength: 2, dexterity: 1, energy: 1 },
  'militia':      { life: 10, strength: 2, dexterity: 1, energy: 1 },
  'thief':        { life: 7,  strength: 1, dexterity: 3, energy: 1 },
  'acolyte':      { life: 6,  strength: 1, dexterity: 1, energy: 4 }
});

/** Fallback gains for unknown / legacy classes. */
const DEFAULT_PER_LEVEL_GAIN: PerLevelGain = Object.freeze({
  life: 10, strength: 2, dexterity: 1, energy: 1
});

/** Resolve gains for a merc class id (case-sensitive). */
export function getPerLevelGain(classId: string | undefined): PerLevelGain {
  if (!classId) return DEFAULT_PER_LEVEL_GAIN;
  return Object.prototype.hasOwnProperty.call(PER_LEVEL_GAIN_BY_CLASS, classId)
    ? PER_LEVEL_GAIN_BY_CLASS[classId] ?? DEFAULT_PER_LEVEL_GAIN : DEFAULT_PER_LEVEL_GAIN;
}

const DERIVED_GROWTH_KEYS = ['attack', 'defense', 'attackSpeed', 'manaMax', 'physDodge'] as const;

/**
 * Repair only catalog hires whose entire saved history identifies the old
 * HP/core-only growth path. Custom baselines and unrecognized histories retain
 * their exact contents. Equipment, current resources and explicit MR are not
 * part of this bare-stat cache repair.
 */
export function repairMercenaryGrowth(merc: Mercenary): Mercenary {
  const def = loadMercPool().pool.find(candidate => candidate.id === merc.id.split('#')[0]);
  if (!def) return merc;
  const hireLevel = Math.max(1, def.reqLevel);
  const levels = merc.level - hireLevel;
  if (!Number.isInteger(levels) || levels <= 0) return merc;
  const gain = getPerLevelGain(merc.classId);
  const hireCore = def.baseStats;
  if (merc.coreStats.strength !== hireCore.strength + gain.strength * levels ||
      merc.coreStats.dexterity !== hireCore.dexterity + gain.dexterity * levels ||
      merc.coreStats.energy !== hireCore.energy + gain.energy * levels ||
      merc.coreStats.vitality !== hireCore.vitality) return merc;
  const hireStats = deriveStats(hireCore, hireLevel);
  if (merc.derivedStats.lifeMax !== hireStats.lifeMax + gain.life * levels ||
      !DERIVED_GROWTH_KEYS.every(key => merc.derivedStats[key] === hireStats[key])) return merc;
  const bare = deriveStats(merc.coreStats, merc.level);
  const derivedStats = { ...merc.derivedStats };
  for (const key of DERIVED_GROWTH_KEYS) derivedStats[key] = bare[key];
  const result = { ...merc, derivedStats };
  assertFiniteMercGrowth(result);
  return result;
}

/** Advance earned levels while preserving saved offsets, class HP policy and current mana. */
export function growMercenary(merc: Mercenary, levels: number): Mercenary {
  if (!Number.isInteger(levels) || levels < 0) throw new Error('Invalid mercenary level gain');
  if (levels === 0) return merc;
  const gain = getPerLevelGain(merc.classId);
  const level = merc.level + levels;
  const coreStats = {
    ...merc.coreStats,
    strength: merc.coreStats.strength + gain.strength * levels,
    dexterity: merc.coreStats.dexterity + gain.dexterity * levels,
    energy: merc.coreStats.energy + gain.energy * levels
  };
  const before = deriveStats(merc.coreStats, merc.level);
  const after = deriveStats(coreStats, level);
  const saved = merc.derivedStats;
  const delta = (key: typeof DERIVED_GROWTH_KEYS[number]): number => {
    const change = after[key] - before[key];
    return change === 0 ? saved[key] : saved[key] + change;
  };
  const lifeBonus = gain.life * levels;
  const derivedStats = {
    ...saved,
    lifeMax: saved.lifeMax + lifeBonus,
    life: Math.min(saved.lifeMax + lifeBonus, saved.life + lifeBonus),
    attack: delta('attack'), defense: delta('defense'), attackSpeed: delta('attackSpeed'),
    manaMax: delta('manaMax'), physDodge: delta('physDodge')
  };
  const result = { ...merc, level, coreStats, derivedStats };
  assertFiniteMercGrowth(result);
  return result;
}

function assertFiniteMercGrowth(merc: Mercenary): void {
  const { resistances, ...scalars } = merc.derivedStats;
  if (!Number.isFinite(merc.level) ||
      !Object.values(merc.coreStats).every(Number.isFinite) ||
      !Object.values(scalars).every(Number.isFinite) ||
      !Object.values(resistances).every(Number.isFinite)) {
    throw new Error('Invalid mercenary growth: nonfinite statistics');
  }
}
