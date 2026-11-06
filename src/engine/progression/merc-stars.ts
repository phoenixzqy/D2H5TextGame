import { loadMercPool } from '../../data/loaders/mercs';
import type { Mercenary } from '../types/entities';

const authored = loadMercPool().banner.shardConversion;
const rules = Object.freeze({ ...authored, starBonuses: Object.freeze({ ...authored.starBonuses }) });

/** Project earned stars over the natural baseline without persisting growth or filling resources. */
export function projectMercenaryStars(merc: Mercenary, stars = 0): Mercenary {
  if (!Number.isInteger(stars) || stars < 0 || stars > rules.maxStars) throw new RangeError('Invalid mercenary stars');
  if (stars === 0) return merc;
  const factor = 1 + stars * rules.starBonuses.statMultiplierPerStar;
  const core = merc.coreStats;
  const saved = merc.derivedStats;
  const { life, mana, resistances, ...scalars } = saved;
  const scaled = Object.fromEntries(Object.entries(scalars).map(([key, value]) => [key, value * factor])) as typeof scalars;
  const scaledResistances = {
    fire: resistances.fire * factor, cold: resistances.cold * factor,
    lightning: resistances.lightning * factor, poison: resistances.poison * factor,
    physical: resistances.physical * factor, arcane: resistances.arcane * factor
  };
  return { ...merc, coreStats: {
    strength: core.strength * factor, dexterity: core.dexterity * factor,
    vitality: core.vitality * factor, energy: core.energy * factor
  }, derivedStats: { ...scaled, life, mana, resistances: scaledResistances } };
}

/** Signature base rank is one; earned stars add the authored capped rank bonus. */
export function mercSignatureRank(stars: number): number {
  if (!Number.isInteger(stars) || stars < 0 || stars > rules.maxStars) throw new RangeError('Invalid mercenary stars');
  return 1 + Math.min(stars * rules.starBonuses.signatureSkillRankPerStar, rules.starBonuses.skillRankCapAboveBase);
}
