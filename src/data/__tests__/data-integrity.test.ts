/**
 * Cross-dataset integrity tests for game data.
 *
 * Loads the full game-data corpus via {@link loadGameData} and checks that
 * IDs referenced from one dataset resolve to definitions in another (skills
 * referenced from monsters, item bases referenced from drop tables, etc.).
 *
 * Goals:
 *   - Catch dangling references before they reach runtime.
 *   - Catch duplicate IDs within any single dataset.
 *   - Provide a single test surface for content reviewers to run before sign-off.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadGameData, type GameData } from '../loader';
import {
  monsters as rawMonsters,
  skills as rawSkills,
  itemBases as rawItemBases,
  affixes as rawAffixes,
  uniques as rawUniques,
  sets as rawSets,
  runes as rawRunes,
  runewords as rawRunewords,
  acts as rawActs,
  subAreas as rawSubAreas,
  dropTables as rawDropTables,
  mercenaries as rawMercenaries,
  mainQuests,
  sideQuests
} from '../index';

let data: GameData;

beforeAll(async () => {
  data = await loadGameData();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface QuestRewards {
  itemDrop?: string;
  lootTable?: string;
  mercenaryUnlock?: string;
}

interface QuestLike {
  id: string;
  rewards?: QuestRewards;
}

interface BossEncounter {
  monsters?: readonly { archetypeId?: string }[];
}

interface SubAreaLike {
  id: string;
  hasBoss?: boolean;
  bossEncounter?: BossEncounter;
}

interface MercLike {
  id: string;
  skills: readonly string[];
}

function findDuplicates<T extends { id: string }>(
  list: readonly T[]
): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const item of list) {
    if (seen.has(item.id)) {
      dups.add(item.id);
    } else {
      seen.add(item.id);
    }
  }
  return [...dups];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('data integrity', () => {
  describe('dataset loading', () => {
    it('loads every dataset with at least one entry', () => {
      expect(data.monsters.size).toBeGreaterThan(0);
      expect(data.skills.size).toBeGreaterThan(0);
      expect(data.itemBases.size).toBeGreaterThan(0);
      expect(data.affixes.size).toBeGreaterThan(0);
      expect(data.uniques.size).toBeGreaterThan(0);
      expect(data.sets.size).toBeGreaterThan(0);
      expect(data.runes.size).toBeGreaterThan(0);
      expect(data.runewords.size).toBeGreaterThan(0);
      expect(data.acts.size).toBeGreaterThan(0);
      expect(data.subAreas.size).toBeGreaterThan(0);
      expect(data.mercenaries.size).toBeGreaterThan(0);
      expect(data.dropTables.size).toBeGreaterThan(0);
      expect(data.quests.size).toBeGreaterThan(0);
      expect(data.mfCurve).toBeDefined();
      expect(data.bannerConfig).toBeDefined();
    });
  });

  describe('no duplicate ids', () => {
    it.each<[string, readonly { id: string }[]]>([
      ['monsters', rawMonsters],
      ['skills', rawSkills],
      ['itemBases', rawItemBases],
      ['affixes', rawAffixes],
      ['uniques', rawUniques],
      ['sets', rawSets],
      ['runes', rawRunes],
      ['runewords', rawRunewords],
      ['acts', rawActs],
      ['subAreas', rawSubAreas],
      ['dropTables', rawDropTables],
      ['mercenaries', rawMercenaries]
    ])('%s has no duplicate ids', (_name, list) => {
      expect(findDuplicates(list)).toEqual([]);
    });

    it('quests (main + side) have no duplicate ids', () => {
      const all = [...mainQuests.quests, ...sideQuests.quests];
      expect(findDuplicates(all)).toEqual([]);
    });
  });

  describe('skill references resolve', () => {
    it('every skill referenced by a monster exists in the skills dataset', () => {
      const missing: { monster: string; skill: string }[] = [];
      for (const monster of data.monsters.values()) {
        for (const skillId of monster.skills) {
          if (!data.skills.has(skillId)) {
            missing.push({ monster: monster.id, skill: skillId });
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('every skill referenced by a runeword exists', () => {
      // Runewords may reference skill grants via stats.skillBonuses or
      // top-level grantedSkills; collect any string field that looks like
      // a skill id and verify it resolves.
      const missing: { runeword: string; skill: string }[] = [];
      for (const rw of data.runewords.values()) {
        const refs = collectSkillRefs(rw);
        for (const skillId of refs) {
          if (!data.skills.has(skillId)) {
            missing.push({ runeword: rw.id, skill: skillId });
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('every skill referenced by a unique item exists', () => {
      const missing: { unique: string; skill: string }[] = [];
      for (const u of data.uniques.values()) {
        const refs = collectSkillRefs(u);
        for (const skillId of refs) {
          if (!data.skills.has(skillId)) {
            missing.push({ unique: (u as { id: string }).id, skill: skillId });
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('monster references resolve', () => {
    it('every monster id referenced by a treasure-class exists', () => {
      const missing: { tc: string; monster: string }[] = [];
      for (const tc of data.dropTables.values()) {
        const entries = (tc as { entries?: Record<string, unknown>[] })
          .entries ?? [];
        for (const entry of entries) {
          if (entry.type === 'monster') {
            const monsterId = entry.monsterId ?? entry.archetypeId;
            if (
              typeof monsterId === 'string' &&
              !data.monsters.has(monsterId)
            ) {
              missing.push({
                tc: (tc as { id: string }).id,
                monster: monsterId
              });
            }
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('every boss archetype id in sub-areas exists in monsters', () => {
      const missing: { subArea: string; monster: string }[] = [];
      for (const subArea of data.subAreas.values()) {
        const sa = subArea as SubAreaLike;
        const bossMonsters = sa.bossEncounter?.monsters ?? [];
        for (const m of bossMonsters) {
          if (typeof m.archetypeId === 'string' && !data.monsters.has(m.archetypeId)) {
            missing.push({ subArea: sa.id, monster: m.archetypeId });
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('mercenary signature skills', () => {
    it('every mercenary skill resolves to a defined skill', () => {
      const missing: { merc: string; skill: string }[] = [];
      for (const merc of data.mercenaries.values()) {
        const m = merc as MercLike;
        for (const skillId of m.skills) {
          if (!data.skills.has(skillId)) {
            missing.push({ merc: m.id, skill: skillId });
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('quest reward references', () => {
    /**
     * Quest rewards may reference items (`itemDrop`), drop tables
     * (`lootTable`), and mercenaries (`mercenaryUnlock`). We assert that
     * each non-placeholder reference resolves.
     *
     * Some `itemDrop` values are runtime placeholders for randomly-rolled
     * items (e.g. `items/magic_random_act1`, `items/grand_charm_random`).
     * Those identifiers are ignored here — they are resolved by the loot
     * system at runtime, not by the static item catalogue.
     */
    const PLACEHOLDER_ITEM = /(?:_random|_q|_act\d+_boss|book_of_skill|horadric_cube|khalims_will|soulstone_|scroll_of_)/i;

    function isItemPlaceholder(id: string): boolean {
      return PLACEHOLDER_ITEM.test(id);
    }

    function itemExists(data: GameData, id: string): boolean {
      return (
        data.itemBases.has(id) ||
        data.uniques.has(id) ||
        data.sets.has(id) ||
        data.runes.has(id) ||
        data.runewords.has(id)
      );
    }

    function allQuests(): QuestLike[] {
      return [
        ...(mainQuests.quests as QuestLike[]),
        ...(sideQuests.quests as QuestLike[])
      ];
    }

    it('every concrete quest reward itemDrop resolves to a real item', () => {
      const missing: { quest: string; item: string }[] = [];
      for (const q of allQuests()) {
        const drop = q.rewards?.itemDrop;
        if (typeof drop === 'string' && !isItemPlaceholder(drop)) {
          if (!itemExists(data, drop)) {
            missing.push({ quest: q.id, item: drop });
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('every quest reward lootTable resolves to a drop table', () => {
      const missing: { quest: string; lootTable: string }[] = [];
      for (const q of allQuests()) {
        const lt = q.rewards?.lootTable;
        if (typeof lt === 'string' && !data.dropTables.has(lt)) {
          missing.push({ quest: q.id, lootTable: lt });
        }
      }
      expect(missing).toEqual([]);
    });

    it('every quest reward mercenaryUnlock resolves to a mercenary', () => {
      const missing: { quest: string; merc: string }[] = [];
      for (const q of allQuests()) {
        const merc = q.rewards?.mercenaryUnlock;
        if (typeof merc === 'string' && !data.mercenaries.has(merc)) {
          missing.push({ quest: q.id, merc });
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('act / sub-area cross-references', () => {
    it('every sub-area listed by an act exists in the sub-area dataset', () => {
      const missing: { act: string; subArea: string }[] = [];
      for (const act of data.acts.values()) {
        const subAreaIds = (act as { subAreas?: readonly string[] }).subAreas ?? [];
        for (const id of subAreaIds) {
          if (!data.subAreas.has(id)) {
            missing.push({ act: act.id, subArea: id });
          }
        }
      }
      expect(missing).toEqual([]);
    });

    it('every sub-area lootTable resolves to a drop table', () => {
      const missing: { subArea: string; lootTable: string }[] = [];
      for (const subArea of data.subAreas.values()) {
        const lt = (subArea as { lootTable?: string }).lootTable;
        if (typeof lt === 'string' && !data.dropTables.has(lt)) {
          missing.push({ subArea: subArea.id, lootTable: lt });
        }
      }
      expect(missing).toEqual([]);
    });

    it('every sub-area challenge config stays within the 8-20 monsters-per-wave contract', () => {
      const invalid: { subArea: string; min?: number | undefined; max?: number | undefined }[] = [];
      for (const subArea of data.subAreas.values()) {
        const monsterCount = subArea.challenge?.monsterCount;
        if (!monsterCount || monsterCount.min < 8 || monsterCount.max > 20 || monsterCount.min > monsterCount.max) {
          invalid.push({ subArea: subArea.id, min: monsterCount?.min, max: monsterCount?.max });
        }
      }
      expect(invalid).toEqual([]);
    });

    it('each act final sub-area has the canonical chapter boss', () => {
      const expectedBosses = new Map<number, string>([
        [1, 'monsters/act1.andariel'],
        [2, 'monsters/act2.duriel'],
        [3, 'monsters/act3.mephisto'],
        [4, 'monsters/act4.diablo'],
        [5, 'monsters/act5.baal']
      ]);
      const invalid: { act: number; subArea?: string | undefined; boss?: string | undefined }[] = [];
      for (const act of data.acts.values()) {
        const finalSubAreaId = act.subAreas[act.subAreas.length - 1];
        const finalSubArea = finalSubAreaId ? data.subAreas.get(finalSubAreaId) : undefined;
        const expected = expectedBosses.get(act.act);
        if (!finalSubArea || finalSubArea.chapterBoss?.archetypeId !== expected) {
          invalid.push({
            act: act.act,
            subArea: finalSubAreaId,
            boss: finalSubArea?.chapterBoss?.archetypeId
          });
        }
      }
      expect(invalid).toEqual([]);
    });
  });

  describe('runeword recipe references', () => {
    it('every rune in a runeword recipe exists in the rune dataset', () => {
      const missing: { runeword: string; rune: string }[] = [];
      for (const rw of data.runewords.values()) {
        for (const r of rw.runes) {
          if (!data.runes.has(r)) {
            missing.push({ runeword: rw.id, rune: r });
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('unique base references', () => {
    it('every unique baseId resolves to an item base', () => {
      const missing: { unique: string; baseId: string }[] = [];
      for (const u of data.uniques.values()) {
        const baseId = (u as { baseId?: string }).baseId;
        if (typeof baseId === 'string' && !data.itemBases.has(baseId)) {
          missing.push({ unique: (u as { id: string }).id, baseId });
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe('set piece references', () => {
    it('every concrete set piece points to its parent set and item base', () => {
      const missing: { set: string; piece: string; ref: string }[] = [];
      for (const set of rawSets as readonly { id: string; items: readonly string[]; pieces?: readonly { id: string; setId: string; baseId: string }[] }[]) {
        for (const piece of set.pieces ?? []) {
          if (piece.setId !== set.id) {
            missing.push({ set: set.id, piece: piece.id, ref: piece.setId });
          }
          if (!data.itemBases.has(piece.baseId)) {
            missing.push({ set: set.id, piece: piece.id, ref: piece.baseId });
          }
          if (!set.items.includes(piece.id)) {
            missing.push({ set: set.id, piece: piece.id, ref: 'items[]' });
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });
});

/**
 * Walk an arbitrary JSON object and collect every string value that looks
 * like a skill ID (i.e. appears under a key like `skill`, `skills`,
 * `grantedSkills`, `skillBonuses`, `triggeredSkill`, etc.).
 */
function collectSkillRefs(node: unknown): string[] {
  const found: string[] = [];
  const SKILL_KEYS = new Set([
    'skill',
    'skills',
    'grantedSkill',
    'grantedSkills',
    'skillBonuses',
    'triggeredSkill',
    'castOnHit',
    'castOnStrike',
    'castWhenStruck',
    'onCastSkill'
  ]);

  function walk(value: unknown, parentKey: string | null): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      const isSkillContext = parentKey !== null && SKILL_KEYS.has(parentKey);
      for (const v of value) {
        if (isSkillContext && typeof v === 'string') {
          found.push(v);
        } else {
          walk(v, parentKey);
        }
      }
      return;
    }
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (SKILL_KEYS.has(k) && typeof v === 'string') {
          found.push(v);
        } else if (SKILL_KEYS.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
          // shape like { skillBonuses: { 'skill-id': 1 } }
          for (const subKey of Object.keys(v)) found.push(subKey);
        } else {
          walk(v, k);
        }
      }
    }
  }

  walk(node, null);
  return found;
}
