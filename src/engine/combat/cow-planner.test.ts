import { describe, expect, it } from 'vitest';
import act1Areas from '@/data/maps/sub-areas/act1.json';
import type { SubAreaDef } from '../types/maps';
import { COW } from '../map/cow-quest';
import { resolveCowEncounterPlan } from './cow-planner';
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Cow planner fixture'); return value; }
function area(): SubAreaDef {
  const host = act1Areas.find(row => row.id === COW.area); if (!host) throw new Error('Missing Cow constructed host');
  return { ...structuredClone(host), questEncounters: [{ id: COW.encounter, level: 13, lootTable: COW.lootTable,
    monsters: [{ archetypeId: COW.king, count: 1, boss: true }, { archetypeId: COW.bovine, count: 2 }] }] } as SubAreaDef;
}
describe('fixed Cow optional planner', () => {
  it.each([0, 7, 42])('keeps exact boss/bovine/bovine at seed%s and never scales from host data', seed => {
    const host = { ...area(), areaLevel: 90 }, before = structuredClone(host), plan = resolveCowEncounterPlan({ subArea: host, encounterId: COW.encounter, seed });
    expect(plan.waves).toHaveLength(1); expect(plan.waves[0]?.source).toEqual({ kind: 'questEncounter', encounterId: COW.encounter });
    expect(plan.waves[0]?.spawns).toEqual([{ archetypeId: COW.king, encounterId: COW.encounter, tier: 'boss', level: 13, index: 0 },
      { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: 13, index: 0 }, { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: 13, index: 1 }]);
    expect(plan.defaultLootTable).toBe(COW.lootTable); expect(host).toEqual(before);
  });
  it.each(['host', 'id', 'count', 'range', 'elite', 'level', 'loot', 'duplicate'] as const)('refuses %s without another encounter fallback', fault => {
    const host = area(), encounter = structuredClone(required(required(host.questEncounters)[0]));
    if (fault === 'host') Reflect.set(host, 'id', 'areas/act1-blood-moor');
    if (fault === 'id') Reflect.set(encounter, 'id', 'unknown');
    if (fault === 'count') Reflect.set(required(encounter.monsters[1]), 'count', 3);
    if (fault === 'range') Reflect.set(required(encounter.monsters[1]), 'countMin', 2);
    if (fault === 'elite') Reflect.set(required(encounter.monsters[1]), 'elite', true);
    if (fault === 'level') Reflect.set(encounter, 'level', 14);
    if (fault === 'loot') Reflect.set(encounter, 'lootTable', 'loot/act1-boss');
    Reflect.set(host, 'questEncounters', fault === 'duplicate' ? [encounter, encounter] : [encounter]);
    expect(() => resolveCowEncounterPlan({ subArea: host, encounterId: COW.encounter, seed: 7 })).toThrow();
  });
});
