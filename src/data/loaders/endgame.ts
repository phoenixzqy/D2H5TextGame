import Ajv2020 from 'ajv/dist/2020';
import document from '../endgame/worldstone-remnant.json';
import { compileAuthoredValidator } from '../authored-validators';
import { monsters } from '../index';
import { loadTreasureClasses } from './loot';
import { isMaterialLedger } from '../../engine/loot/materials';
import { getSkill } from '../../engine/skills/registry';
import type { EndgameDefinition } from '../../engine/endgame/types';

const validate = compileAuthoredValidator<EndgameDefinition>(new Ajv2020({ strict: true, allErrors: true }), 'endgame');
const monsterCatalog = new Map(monsters.map(monster => [monster.id, monster]));

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}

/** Validate closed authored content and its executable references, then return a private frozen copy. */
export function parseEndgameDefinition(value: unknown): EndgameDefinition {
  if (!validate(value)) throw new Error(`Invalid endgame definition: ${JSON.stringify(validate.errors)}`);
  if (!loadTreasureClasses().has(value.defaultLootTable)) throw new Error('Unknown endgame loot table');
  const unique = (ids: readonly string[]) => new Set(ids).size === ids.length;
  if (!unique(value.modifiers.map(row => row.id)) || !unique(value.modifiers.map(row => row.archetypeId)) ||
    !unique(value.waves.map(row => row.id)) || value.waves.some((wave, index) => wave.id !== `worldstone-remnant/w${String(index + 1)}`)) {
    throw new Error('Duplicate endgame identity');
  }
  for (const modifier of value.modifiers) {
    const monster = monsterCatalog.get(modifier.archetypeId);
    if (!monster?.skills.length || monster.skills.some(id => !getSkill(id)?.effects.length) ||
      !isMaterialLedger(modifier.completionMaterials)) throw new Error('Invalid endgame modifier reference');
  }
  if (!isMaterialLedger(value.achievement.reward.materials)) throw new Error('Invalid endgame achievement materials');
  for (const wave of value.waves) {
    if (wave.spawns.reduce((count, row) => count + row.count, 0) > 20) throw new Error('Endgame wave exceeds spawn bound');
    for (const spawn of wave.spawns) {
      if (spawn.kind === 'modifier') continue;
      const monster = monsterCatalog.get(spawn.archetypeId);
      if (!monster || (spawn.tier === 'boss' && !monster.canBeBoss)) throw new Error('Invalid endgame monster reference');
    }
  }
  return deepFreeze(structuredClone(value));
}

/** Immutable canonical dungeon, validated before any admission or projection. */
export const endgameDefinition = parseEndgameDefinition(document);
