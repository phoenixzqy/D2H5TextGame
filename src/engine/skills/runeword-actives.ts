import itemSkills from '../../data/skills/item.json';
import type { RunewordGrant } from '../types/items';
import { canonicalSkillIdFromData, PLAYABLE_CLASS_SKILL_DATA, type PlayableSkillClass } from './dataCatalog';

/** Only these four active skills have equipment-dependent ownership in D10. */
export type GovernedActiveId = 'sorceress.fire_bolt' | 'sorceress.blaze' |
  'sorceress.chain_lightning' | 'item.redemption';

/** Effective rank snapshot, including explicit zero for each unavailable source. */
export type GovernedActiveRanks = Readonly<Record<GovernedActiveId, number>>;

/** Separate learned ownership from a temporary equipped source for combo presentation. */
export interface GovernedActiveChoice {
  readonly id: GovernedActiveId;
  readonly nameKey: string;
  readonly icon?: string;
  readonly effectiveRank: number;
  readonly learnedRank: number;
  readonly grantedRank: number;
  readonly available: boolean;
}

/** Configured priorities survive source removal; combat sees only currently available actives. */
export interface GovernedActiveProjection {
  readonly configuredOrder: readonly string[];
  readonly combatOrder: readonly string[];
  readonly ranks: GovernedActiveRanks;
  readonly choices: readonly GovernedActiveChoice[];
}

/** Authoritative owner inputs; a mercenary never inherits hero allocations. */
export type GovernedActiveOwner = {
  readonly kind: 'hero'; readonly classId: string; readonly level: number;
  readonly learnedRanks: Readonly<Record<string, number>>;
} | { readonly kind: 'merc'; readonly level: number };

const ids: readonly GovernedActiveId[] = Object.freeze([
  'sorceress.fire_bolt', 'sorceress.blaze', 'sorceress.chain_lightning', 'item.redemption'
]);
const metadata = ids.map(id => {
  const source = id === 'item.redemption' ? itemSkills.find(row => row.id === 'item-redemption')
    : PLAYABLE_CLASS_SKILL_DATA.sorceress.find(row => canonicalSkillIdFromData(row.id) === id);
  if (!source) throw new Error(`Missing governed active metadata: ${id}`);
  return { id, source };
});

/** Normalize governed data aliases only; leave every unrelated priority entry unchanged. */
export function governedActiveId(id: string): GovernedActiveId | undefined {
  const canonical = id === 'item-redemption' ? 'item.redemption' : canonicalSkillIdFromData(id);
  return ids.find(candidate => candidate === canonical);
}

/** Shared authored name for an equipment-dependent active, including its data alias. */
export function governedActiveNameKey(id: string): string | undefined {
  return metadata.find(row => row.id === governedActiveId(id))?.source.name;
}

function legalLearnedRanks(owner: GovernedActiveOwner): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  if (owner.kind !== 'hero' || !Number.isInteger(owner.level) || owner.level < 1 ||
    !Object.hasOwn(PLAYABLE_CLASS_SKILL_DATA, owner.classId)) return result;
  const catalog = PLAYABLE_CLASS_SKILL_DATA[owner.classId as PlayableSkillClass];
  const sources = new Map(catalog.map(row => [canonicalSkillIdFromData(row.id), row]));
  const visiting = new Set<string>();
  const resolve = (id: string): number => {
    const known = result.get(id);
    if (known !== undefined) return known;
    const row = sources.get(id);
    if (!row || visiting.has(id)) return 0;
    const requiredLevel = row.requiredLevel ?? row.minLevel;
    if (!Number.isInteger(requiredLevel) || requiredLevel < 1 || owner.level < requiredLevel ||
      !Number.isInteger(row.maxLevel) || row.maxLevel < 1) return 0;
    const ranks = [owner.learnedRanks[row.id], owner.learnedRanks[id]];
    const rank = Math.max(0, ...ranks.filter((value): value is number => typeof value === 'number' &&
      Number.isInteger(value) && value >= 1 && value <= row.maxLevel));
    if (rank === 0) return 0;
    visiting.add(id);
    const legal = !row.prerequisites?.some(id => resolve(canonicalSkillIdFromData(id)) === 0);
    visiting.delete(id);
    result.set(id, legal ? rank : 0);
    return legal ? rank : 0;
  };
  for (const id of ids) resolve(id);
  return result;
}

/** Project canonical equipped grants into a frozen, nonpersistent priority/rank snapshot. */
export function projectGovernedActives(input: {
  readonly owner: GovernedActiveOwner;
  readonly grants: readonly RunewordGrant[];
  readonly storedOrder: readonly string[];
}): GovernedActiveProjection {
  const learned = legalLearnedRanks(input.owner);
  const grants = new Map<GovernedActiveId, number>();
  for (const grant of input.grants) {
    if (!('skillId' in grant) || !Number.isInteger(grant.rank) || grant.rank < 1) continue;
    const id = governedActiveId(grant.skillId);
    if (id) grants.set(id, Math.max(grants.get(id) ?? 0, grant.rank));
  }
  const choices = metadata.map(({ id, source }): GovernedActiveChoice => {
    const learnedRank = learned.get(id) ?? 0;
    const grantedRank = Math.min(source.maxLevel, grants.get(id) ?? 0);
    const effectiveRank = Math.min(source.maxLevel, Math.max(learnedRank, grantedRank));
    const minLevel = 'requiredLevel' in source ? source.requiredLevel ?? source.minLevel : source.minLevel;
    return Object.freeze({ id, nameKey: source.name,
      ...('icon' in source && source.icon ? { icon: source.icon } : {}),
      learnedRank, grantedRank, effectiveRank, available: effectiveRank > 0 &&
        Number.isInteger(input.owner.level) && input.owner.level >= minLevel });
  });
  const ranks: GovernedActiveRanks = Object.freeze({
    'sorceress.fire_bolt': choices[0]?.effectiveRank ?? 0,
    'sorceress.blaze': choices[1]?.effectiveRank ?? 0,
    'sorceress.chain_lightning': choices[2]?.effectiveRank ?? 0,
    'item.redemption': choices[3]?.effectiveRank ?? 0
  });
  const configured: string[] = [];
  const seen = new Set<GovernedActiveId>();
  for (const original of input.storedOrder) {
    const id = governedActiveId(original);
    if (!id) configured.push(original);
    else if (!seen.has(id)) { seen.add(id); configured.push(id); }
  }
  for (const id of grants.keys()) {
    if (!seen.has(id)) { seen.add(id); configured.push(id); }
  }
  const available = new Set(choices.filter(choice => choice.available).map(choice => choice.id));
  return Object.freeze({ ranks, choices: Object.freeze(choices),
    configuredOrder: Object.freeze(configured),
    combatOrder: Object.freeze(configured.filter(id => {
      const governed = governedActiveId(id);
      return governed === undefined || available.has(governed);
    })) });
}
