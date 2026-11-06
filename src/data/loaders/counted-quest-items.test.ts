import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../schema/counted-quest-item.schema.json';
import document from '../quests/counted-items.json';
import sideQuests from '../quests/side.json';
import { countedQuestSources, findCountedQuestById, loadCountedQuestItems,
  resolveCountedQuestSource, resolveCountedQuestTarget } from './counted-quest-items';
import { loadQuestItems, questItemSource } from './quest-items';

describe('finite counted quest metadata', () => {
  it('resolves five immutable item groups and all twenty-one distinct source/target identities', () => {
    const definitions = loadCountedQuestItems();
    expect(definitions.map(row => row.key)).toEqual(['alkor', 'jade', 'jamella', 'malah', 'gheed']);
    expect(definitions.map(row => row.sources.length)).toEqual([3, 3, 5, 5, 5]);
    expect(new Set(definitions.flatMap(row => row.sources)).size).toBe(21);
    for (const definition of definitions) {
      expect(findCountedQuestById(definition.quest)).toEqual(definition);
      expect(countedQuestSources(definition)).toEqual(definition.placements.map(row => row.source));
      for (const value of [definitions, definition, definition.sources, definition.placements, ...definition.placements]) {
        expect(Object.isFrozen(value)).toBe(true);
      }
      for (const placement of definition.placements) {
        expect(resolveCountedQuestSource(placement.source)).toEqual({ definition, placement });
        expect(resolveCountedQuestTarget(placement.targetId)).toEqual({ definition, placement });
      }
    }
    expect(resolveCountedQuestSource(`${definitions[0]?.sources[0] ?? ''}-extra`)).toBeUndefined();
    expect(resolveCountedQuestTarget('objects/alkor_venom_gland_4')).toBeUndefined();
    expect(findCountedQuestById('quests/act3-golden-bird')).toBeUndefined();
    expect(loadQuestItems().some(row => definitions.some(definition => definition.itemId === row.id))).toBe(false);
    expect(loadQuestItems().map(questItemSource).every(source => !definitions.some(row => row.sources.includes(source)))).toBe(true);
  });
  it.each(['extra-group', 'missing-group', 'duplicate-group', 'extra-source', 'wrong-source', 'wrong-target', 'wrong-item', 'unknown-field'])(
    'rejects malformed or widened %s schema input', fault => {
      const input = structuredClone(document), row = input.items[0]; if (!row) throw new Error('Missing row');
      if (fault === 'extra-group') input.items.push(structuredClone(row));
      if (fault === 'missing-group') input.items.pop();
      if (fault === 'duplicate-group') input.items[1] = structuredClone(row);
      if (fault === 'extra-source') row.placements.push({ source: `${row.quest}#objective:${row.objective}:source:gland-4`, targetId: 'objects/alkor_venom_gland_4' });
      if (fault === 'wrong-source') Reflect.set(row.placements[0] ?? {}, 'source', 'foreign');
      if (fault === 'wrong-target') Reflect.set(row.placements[0] ?? {}, 'targetId', 'foreign');
      if (fault === 'wrong-item') row.itemId = 'quest/foreign';
      if (fault === 'unknown-field') Reflect.set(row, 'count', 99);
      const check = new Ajv2020({ strict: true }).compile(schema);
      if (fault === 'duplicate-group') {
        const original = document.items[1];
        if (!original) throw new Error('Missing original');
        document.items[1] = structuredClone(row);
        try { expect(() => loadCountedQuestItems()).toThrow('duplicate'); }
        finally { document.items[1] = original; }
      } else expect(check(input)).toBe(false);
    });
  it.each(['description', 'objectives', 'rewards'])('rejects live quest %s accessors before schema reads', key => {
    const row = sideQuests.quests.find(quest => quest.id === 'quests/side-act5-malahs-elixir');
    if (!row) throw new Error('Missing quest');
    const descriptor = Object.getOwnPropertyDescriptor(row, key); if (!descriptor) throw new Error('Missing descriptor');
    let reads = 0;
    Object.defineProperty(row, key, { configurable: true, enumerable: true, get() { reads++; return descriptor.value as unknown; } });
    try { expect(() => loadCountedQuestItems()).toThrow('descriptors'); expect(reads).toBe(0); }
    finally { Object.defineProperty(row, key, descriptor); }
  });
});
