import Ajv2020 from 'ajv/dist/2020';
import type { ChapterBossEquipmentPolicy, ChapterBossEquipmentRule } from '@/engine/loot/chapter-boss-equipment';
import { compileAuthoredValidator } from '../authored-validators';
import raw from '../loot/chapter-boss-equipment.json';

interface PolicyRow extends ChapterBossEquipmentRule {
  readonly treasureClassId: string;
}

/** Validate schema and unique boss bindings before publishing immutable rules. */
export function validateChapterBossEquipment(value: unknown): ChapterBossEquipmentPolicy {
  const validate = compileAuthoredValidator<readonly PolicyRow[]>(new Ajv2020({ strict: true, allErrors: true }), 'chapterBossEquipment');
  if (!validate(value)) throw new Error('Invalid chapter-boss equipment policy');
  if (new Set(value.map(row => row.treasureClassId)).size !== value.length ||
    new Set(value.map(row => row.act)).size !== value.length) throw new Error('Duplicate chapter-boss equipment binding');
  return new Map(value.map(row => [row.treasureClassId, Object.freeze({ act: row.act,
    groups: Object.freeze(row.groups.map(group => Object.freeze({ ...group }))) })]));
}

/** Validated live-boss ordinary groups; source references checked at pool assembly. */
export const CHAPTER_BOSS_EQUIPMENT = validateChapterBossEquipment(raw);
