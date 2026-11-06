import Ajv2020 from 'ajv/dist/2020';
import type { ChapterBossUniquePolicy, ChapterBossUniqueRule } from '@/engine/loot/chapter-boss-uniques';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/chapter-boss-uniques.json';

interface PolicyRow extends ChapterBossUniqueRule {
  readonly treasureClassId: string;
}

/** Validate the closed schema and unique live-boss bindings before publication. */
export function validateChapterBossUniques(value: unknown): ChapterBossUniquePolicy {
  const validate = compileAuthoredValidator<readonly PolicyRow[]>(new Ajv2020({ strict: true, allErrors: true }), 'chapterBossUniques');
  if (!validate(value)) throw new Error('Invalid chapter-boss unique policy');
  if (new Set(value.map(row => row.treasureClassId)).size !== value.length ||
    new Set(value.map(row => row.act)).size !== value.length) throw new Error('Duplicate chapter-boss unique binding');
  return new Map(value.map(({ treasureClassId, ...rule }) => [treasureClassId, Object.freeze(rule)]));
}

/** Matching optional rewards; table references are checked at pool assembly. */
export const CHAPTER_BOSS_UNIQUES = validateChapterBossUniques(raw);
