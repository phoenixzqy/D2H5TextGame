import Ajv2020 from 'ajv/dist/2020';
import type { ChapterBossFirstKillPolicy, ChapterBossFirstKillRule, ChapterBossFirstKillPools } from '@/engine/loot/chapter-boss-first-kills';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/chapter-boss-first-kills.json';

interface PolicyData {
  readonly eliteBaseIds: readonly string[];
  readonly bosses: readonly (ChapterBossFirstKillRule & { readonly treasureClassId: string })[];
}

/** Validate closed reward rules and unique, internally matching live-boss bindings. */
export function validateChapterBossFirstKills(value: unknown): ChapterBossFirstKillPolicy {
  const validate = compileAuthoredValidator<PolicyData>(new Ajv2020({ strict: true, allErrors: true }), 'chapterBossFirstKills');
  if (!validate(value)) throw new Error('Invalid chapter-boss first-kill policy');
  const rows = value.bosses;
  if (new Set(rows.map(row => row.act)).size !== rows.length ||
    new Set(rows.map(row => row.treasureClassId)).size !== rows.length ||
    new Set(rows.map(row => row.areaId)).size !== rows.length ||
    new Set(rows.map(row => row.bossId)).size !== rows.length || rows.some(row =>
      row.treasureClassId !== `loot/act${String(row.act)}-boss` ||
      !row.areaId.startsWith(`areas/act${String(row.act)}-`) ||
      !row.bossId.startsWith(`monsters/act${String(row.act)}.`) ||
      row.hellRune && (row.act !== 5 || row.hellRune.minimum > row.hellRune.maximum))) {
    throw new Error('Inconsistent chapter-boss first-kill binding');
  }
  return { eliteBaseIds: new Set(value.eliteBaseIds),
    bosses: new Map(rows.map(({ treasureClassId, ...rule }) => [treasureClassId, Object.freeze(rule)])) };
}

/** Refuse unknown sources and ambiguous/missing exact templates at pool assembly. */
export function validateChapterBossFirstKillReferences(policy: ChapterBossFirstKillPolicy,
  pools: Pick<ChapterBossFirstKillPools, 'bases' | 'uniques' | 'treasureClasses'>): void {
  if ([...policy.eliteBaseIds].some(id => !pools.bases.has(id))) {
    throw new Error('Unknown first-kill Elite base');
  }
  for (const [tableId, rule] of policy.bosses) {
    if (!pools.treasureClasses.has(tableId)) throw new Error('Unknown first-kill boss table');
    if (rule.namedUnique) {
      const matches = pools.uniques?.filter(template => template.id === rule.namedUnique?.id) ?? [];
      if (matches.length !== 1 || !matches[0] || !pools.bases.has(matches[0].baseId)) {
        throw new Error('Missing or ambiguous first-kill named unique');
      }
    }
  }
}

/** Live first-kill policies; pool assembly checks referenced bases/templates/tables. */
export const CHAPTER_BOSS_FIRST_KILLS = validateChapterBossFirstKills(raw);
