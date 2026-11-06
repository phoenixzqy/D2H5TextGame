import type { SubAreaDef } from '../types/maps';
import type { WavePlan } from './sub-area-run';
import { COW } from '../map/cow-quest';

/** One finite authored source; no random elite, area scaling or ordinary-plan fallback. */
export function resolveCowEncounterPlan(input: { readonly subArea: SubAreaDef; readonly encounterId: string; readonly seed: number }): WavePlan {
  const { subArea, encounterId, seed } = input;
  const encounters = subArea.questEncounters ?? [];
  if (subArea.id !== COW.area || subArea.actId !== COW.act || encounterId !== COW.encounter || !Array.isArray(subArea.questEncounters)) throw new RangeError('Unknown Cow quest encounter');
  const matches = encounters.filter(row => row.id === COW.encounter), encounter = matches[0];
  const monsters = encounter?.monsters ?? [];
  if (matches.length !== 1 || !encounter || encounter.level !== COW.level || encounter.lootTable !== COW.lootTable ||
    !Array.isArray(encounter.monsters) || monsters.length !== 2 || !monsters.every((monster, index) =>
      monster.archetypeId === (index === 0 ? COW.king : COW.bovine) && monster.count === (index === 0 ? 1 : 2) &&
      monster.countMin === undefined && monster.countMax === undefined && monster.elite !== true &&
      (index === 0 ? monster.boss === true : monster.boss !== true))) throw new RangeError('Invalid Cow quest encounter');
  return { subAreaId: subArea.id, mode: 'manual', seed, defaultLootTable: COW.lootTable,
    waves: [{ id: COW.encounter, source: { kind: 'questEncounter', encounterId: COW.encounter }, waveTier: 'boss', lootTable: COW.lootTable,
      spawns: [{ archetypeId: COW.king, encounterId: COW.encounter, tier: 'boss', level: COW.level, index: 0 },
        { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: COW.level, index: 0 },
        { archetypeId: COW.bovine, encounterId: COW.encounter, tier: 'trash', level: COW.level, index: 1 }] }] };
}
